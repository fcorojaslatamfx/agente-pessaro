"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import { canPublishSocial, type OutputRow } from "./transitions";
import { publishNowToPostiz } from "@/lib/postiz/publish";
import { listPostizIntegrations } from "@/lib/postiz/integrations";
import { PostizNotConfiguredError } from "@/lib/postiz/client";
import type { ContentAgentOutput } from "./types";
import type { ActionResult } from "./actions";

export type PublishablePlatform = "linkedin" | "instagram" | "facebook_page";

const CONTENT_BY_PLATFORM: Record<PublishablePlatform, (payload: ContentAgentOutput) => string> = {
  linkedin: (p) => [p.linkedin?.copy, p.linkedin?.hashtags?.join(" ")].filter(Boolean).join("\n\n"),
  instagram: (p) => [p.instagram?.copy, p.instagram?.hashtags?.join(" ")].filter(Boolean).join("\n\n"),
  facebook_page: (p) => [p.facebook?.copy, p.facebook?.hashtags?.join(" ")].filter(Boolean).join("\n\n"),
};

/**
 * Publica AHORA en una plataforma vía Postiz. Requiere clic humano explícito
 * por plataforma (nunca automático) y que el output ya esté en
 * ready_to_publish o published — una vez enviada la primera plataforma el
 * output pasa a "published", pero el usuario debe poder seguir enviando el
 * resto de plataformas mapeadas sin que el estado se lo bloquee.
 */
export async function publishToPlatform(outputId: string, platform: PublishablePlatform): Promise<ActionResult> {
  const session = await requireAgentAccess();
  const supabase = await createClient();

  const { data: output, error: outputError } = await supabase
    .from("ai_content_outputs")
    .select("owner_user_id, team_id, status, crm_payload")
    .eq("id", outputId)
    .single();

  if (outputError || !output) {
    return { ok: false, error: "Contenido no encontrado o sin acceso." };
  }

  const row: OutputRow = { owner_user_id: output.owner_user_id, team_id: output.team_id, status: output.status };
  if (!["ready_to_publish", "published"].includes(row.status) || !canPublishSocial(session.profile, row)) {
    return { ok: false, error: "No tienes permiso para publicar este contenido en su estado actual." };
  }

  const isCorporate = platform === "facebook_page";
  const connectionQuery = supabase
    .from("ai_content_social_connections")
    .select("id, postiz_integration_id, status")
    .eq("platform", platform);
  const { data: connection } = isCorporate
    ? await connectionQuery.is("user_id", null).maybeSingle()
    : await connectionQuery.eq("user_id", session.userId).maybeSingle();

  if (!connection?.postiz_integration_id || connection.status !== "active") {
    return {
      ok: false,
      error: "No tienes esta plataforma conectada en Postiz. Ve a Conexiones de RRSS y vincúlala.",
    };
  }

  const payload = output.crm_payload as ContentAgentOutput;
  const content = CONTENT_BY_PLATFORM[platform](payload).trim();
  if (!content) {
    return { ok: false, error: "El contenido generado para esta plataforma está vacío." };
  }

  try {
    const integrations = await listPostizIntegrations();
    const integration = integrations.find((i) => i.id === connection.postiz_integration_id);
    if (!integration || integration.disabled) {
      return {
        ok: false,
        error: "La conexión está desconectada en Postiz. Reconéctala en Conexiones de RRSS.",
      };
    }

    const { data: heroAsset } = await supabase
      .from("ai_content_assets")
      .select("image_url")
      .eq("output_id", outputId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const result = await publishNowToPostiz({
      postizIntegrationId: integration.id,
      postizProviderIdentifier: integration.identifier,
      content,
      imageUrl: heroAsset?.image_url ?? null,
    });

    await supabase.from("ai_content_publications").insert({
      output_id: outputId,
      social_connection_id: connection.id,
      platform,
      status: "pending",
      platform_post_id: result.postId,
    });

    if (row.status !== "published") {
      await supabase
        .from("ai_content_outputs")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", outputId);
    }

    revalidatePath(`/review/${outputId}`);
    revalidatePath("/review");
    revalidatePath("/history");
    return { ok: true };
  } catch (err) {
    const message = err instanceof PostizNotConfiguredError ? err.message : (err as Error).message;
    await supabase.from("ai_content_publications").insert({
      output_id: outputId,
      social_connection_id: connection.id,
      platform,
      status: "failed",
      error_message: message,
    });
    revalidatePath(`/review/${outputId}`);
    return { ok: false, error: message };
  }
}
