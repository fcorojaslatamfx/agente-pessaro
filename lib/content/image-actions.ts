"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import type { ActionResult } from "./actions";

export async function saveGeneratedAsset(
  outputId: string,
  params: { imageUrl: string; width: number; height: number; prompt: string },
): Promise<ActionResult> {
  await requireAgentAccess();
  const supabase = await createClient();

  const { data: output, error: fetchError } = await supabase
    .from("ai_content_outputs")
    .select("id")
    .eq("id", outputId)
    .single();

  if (fetchError || !output) {
    return { ok: false, error: "Contenido no encontrado o sin acceso." };
  }

  const { error } = await supabase.from("ai_content_assets").insert({
    output_id: outputId,
    asset_type: "generated",
    source: "leonardo",
    image_url: params.imageUrl,
    width: params.width,
    height: params.height,
    prompt: params.prompt,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/review/${outputId}`);
  return { ok: true };
}
