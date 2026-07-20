import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateContent } from "@/lib/anthropic/generate";
import { validateCompliance } from "@/lib/compliance/validate";
import type { GenerationInput } from "@/lib/content/types";

type RunGenerationParams = {
  supabase: SupabaseClient;
  userId: string;
  teamId: string | null;
  input: GenerationInput;
  source: "manual" | "cron";
};

/**
 * Shared by the manual generation flow (Server Action / app/api/generate)
 * and the weekly cron job. Inserts the request row, calls Claude, runs
 * backend compliance validation (section 12 — never trust the model's own
 * compliance self-report alone), and stores the output.
 */
export async function runGeneration({
  supabase,
  userId,
  teamId,
  input,
  source,
}: RunGenerationParams) {
  const { data: request, error: insertError } = await supabase
    .from("ai_content_requests")
    .insert({
      requested_by: userId,
      team_id: teamId,
      topic: input.topic,
      objective: input.objective,
      audience: input.audience,
      tone: input.tone,
      content_type: input.contentType,
      platform_primary: input.platformPrimary,
      platforms_secondary: input.platformsSecondary ?? [],
      visibility_scope: input.visibilityScope,
      needs_image: input.needsImage,
      image_source: input.imageSource,
      compliance_required: input.complianceRequired,
      status: "processing",
      source,
    })
    .select("id")
    .single();

  if (insertError || !request) {
    throw new Error(`No se pudo crear la solicitud: ${insertError?.message}`);
  }

  try {
    const output = await generateContent(input);
    const compliance = validateCompliance(output);

    const { error: outputError } = await supabase.from("ai_content_outputs").insert({
      request_id: request.id,
      owner_user_id: userId,
      team_id: teamId,
      blog_article: output.blog?.articulo,
      blog_seo_meta: { h1: output.blog?.h1, meta_description: output.blog?.meta_description, keywords: output.blog?.keywords },
      post_text: output.linkedin?.copy,
      hook: output.instagram?.reel_script?.gancho,
      cta: output.instagram?.reel_script?.cta,
      hashtags: {
        linkedin: output.linkedin?.hashtags,
        instagram: output.instagram?.hashtags,
        facebook: output.facebook?.hashtags,
      },
      reel_script: output.instagram?.reel_script,
      carousel_structure: output.instagram?.carrusel,
      design_brief: output.design_brief,
      personal_brand_version: output.version_marca_personal,
      crm_payload: output,
      disclaimer: output.disclaimer,
      compliance_score: compliance.passed ? 100 : 0,
      content_score: output.meta?.score,
      sources_cited: output.meta?.fuentes_sugeridas,
      status: compliance.passed ? "pending_review" : "changes_requested",
      reviewer_notes: compliance.passed
        ? null
        : `Bloqueado automáticamente por compliance: ${compliance.observaciones}`,
    });

    if (outputError) {
      throw new Error(`No se pudo guardar el contenido generado: ${outputError.message}`);
    }

    await supabase
      .from("ai_content_requests")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", request.id);

    return { requestId: request.id as string, compliance };
  } catch (error) {
    await supabase
      .from("ai_content_requests")
      .update({
        status: "failed",
        error_message: (error as Error).message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);
    throw error;
  }
}
