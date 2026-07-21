"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import { listPostizIntegrations, mapPostizIdentifierToPlatform, type PostizIntegration } from "@/lib/postiz/integrations";
import { PostizNotConfiguredError } from "@/lib/postiz/client";
import type { ActionResult } from "./actions";

export type MappablePostizIntegration = PostizIntegration & {
  platform: "linkedin" | "instagram" | "facebook_page" | null;
};

// Lista las integraciones ya conectadas en el panel de Postiz Cloud
// (el OAuth ocurre allá, no en agente-pessaro — ver INTEGRATION.md) para
// que el asesor elija cuál mapear a su usuario.
export async function getPostizIntegrationsForMapping(): Promise<
  { ok: true; integrations: MappablePostizIntegration[] } | { ok: false; error: string }
> {
  await requireAgentAccess();
  try {
    const integrations = await listPostizIntegrations();
    return {
      ok: true,
      integrations: integrations
        .filter((i) => !i.disabled)
        .map((i) => ({ ...i, platform: mapPostizIdentifierToPlatform(i.identifier) })),
    };
  } catch (err) {
    if (err instanceof PostizNotConfiguredError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: (err as Error).message };
  }
}

export type MyConnection = {
  id: string;
  platform: string;
  postiz_integration_id: string | null;
  platform_account_id: string | null;
  status: string;
  user_id: string | null;
};

// Trae las conexiones propias del asesor + la fila corporativa de Facebook
// (user_id null), visible para todos pero solo editable por super_admin.
export async function getVisibleSocialConnections(): Promise<MyConnection[]> {
  const session = await requireAgentAccess();
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_content_social_connections")
    .select("id, platform, postiz_integration_id, platform_account_id, status, user_id")
    .or(`user_id.eq.${session.userId},user_id.is.null`);
  return data ?? [];
}

export async function mapPostizIntegration(
  platform: "linkedin" | "instagram" | "facebook_page",
  postizIntegrationId: string,
  postizIntegrationName: string,
): Promise<ActionResult> {
  const session = await requireAgentAccess();
  const isCorporate = platform === "facebook_page";

  // La Página de Facebook es una única conexión corporativa (user_id null,
  // migración 0006) — solo super_admin la gestiona. LinkedIn/Instagram son
  // siempre personales, por asesor.
  if (isCorporate && !session.profile.isSuperAdmin) {
    return { ok: false, error: "Solo super_admin puede mapear la Página de Facebook corporativa." };
  }

  const supabase = await createClient();
  const existingQuery = supabase.from("ai_content_social_connections").select("id").eq("platform", platform);
  const { data: existing } = isCorporate
    ? await existingQuery.is("user_id", null).maybeSingle()
    : await existingQuery.eq("user_id", session.userId).maybeSingle();

  const row = {
    platform,
    postiz_integration_id: postizIntegrationId,
    // Reusa platform_account_id (migración 0006) como etiqueta legible del
    // canal — Postiz ya no nos entrega el token, solo un nombre de canal.
    platform_account_id: postizIntegrationName,
    status: "active" as const,
    connected_by: session.userId,
    connected_at: new Date().toISOString(),
    user_id: isCorporate ? null : session.userId,
  };

  const { error } = existing
    ? await supabase.from("ai_content_social_connections").update(row).eq("id", existing.id)
    : await supabase.from("ai_content_social_connections").insert(row);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/connections");
  return { ok: true };
}
