import { NextResponse } from "next/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { generateLeonardoImages } from "@/lib/leonardo/generate";
import { LeonardoNotConfiguredError } from "@/lib/leonardo/client";
import { resolvePrimaryDimensions } from "@/lib/content/design-brief";
import type { ContentAgentOutput } from "@/lib/content/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await requireAgentAccess();
  if (!session.profile.permissions.can_generate_images && !session.profile.isSuperAdmin) {
    return NextResponse.json({ error: "No tienes permiso para generar imágenes." }, { status: 403 });
  }

  const { outputId } = (await request.json()) as { outputId?: string };
  if (!outputId) {
    return NextResponse.json({ error: "Falta 'outputId'." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: output, error } = await supabase
    .from("ai_content_outputs")
    .select("design_brief")
    .eq("id", outputId)
    .single();

  if (error || !output) {
    return NextResponse.json({ error: "Contenido no encontrado o sin acceso." }, { status: 404 });
  }

  const designBrief = output.design_brief as ContentAgentOutput["design_brief"] | null;
  if (!designBrief?.prompt_leonardo) {
    return NextResponse.json(
      { error: "Este borrador no tiene un prompt_leonardo en su brief visual." },
      { status: 400 },
    );
  }

  const { width, height } = resolvePrimaryDimensions(designBrief);

  try {
    const candidates = await generateLeonardoImages({
      prompt: designBrief.prompt_leonardo,
      negativePrompt: designBrief.que_evitar,
      width,
      height,
    });
    return NextResponse.json({ candidates });
  } catch (err) {
    if (err instanceof LeonardoNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
