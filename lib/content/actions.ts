"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import { runGeneration } from "@/lib/content/generate-flow";
import { canTransition, type OutputRow } from "@/lib/content/transitions";
import type { ContentStatus, GenerationInput } from "@/lib/content/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitGenerationRequest(input: GenerationInput): Promise<
  ActionResult & { requestId?: string }
> {
  const session = await requireAgentAccess();
  if (!session.profile.permissions.can_generate_content && !session.profile.isSuperAdmin) {
    return { ok: false, error: "No tienes permiso para generar contenido." };
  }

  const supabase = await createClient();
  try {
    const { requestId } = await runGeneration({
      supabase,
      userId: session.userId,
      teamId: session.profile.teamId,
      input,
      source: "manual",
    });
    revalidatePath("/review");
    revalidatePath("/history");
    return { ok: true, requestId };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function transitionContent(
  outputId: string,
  to: ContentStatus,
  notes?: string,
): Promise<ActionResult> {
  const session = await requireAgentAccess();
  const supabase = await createClient();

  const { data: output, error } = await supabase
    .from("ai_content_outputs")
    .select("owner_user_id, team_id, status")
    .eq("id", outputId)
    .single();

  if (error || !output) {
    return { ok: false, error: "Contenido no encontrado o sin acceso." };
  }

  const row = output as OutputRow;
  if (!canTransition(session.profile, row, to)) {
    return { ok: false, error: `Transición de "${row.status}" a "${to}" no permitida para tu rol.` };
  }

  const { error: updateError } = await supabase
    .from("ai_content_outputs")
    .update({
      status: to,
      reviewer_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outputId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/review");
  revalidatePath(`/review/${outputId}`);
  revalidatePath("/history");
  return { ok: true };
}
