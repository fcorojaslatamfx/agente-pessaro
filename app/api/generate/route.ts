import { NextResponse } from "next/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { runGeneration } from "@/lib/content/generate-flow";
import type { GenerationInput } from "@/lib/content/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await requireAgentAccess();
  if (!session.profile.permissions.can_generate_content && !session.profile.isSuperAdmin) {
    return NextResponse.json({ error: "No tienes permiso para generar contenido." }, { status: 403 });
  }

  const input = (await request.json()) as GenerationInput;
  if (!input?.topic) {
    return NextResponse.json({ error: "El campo 'topic' es obligatorio." }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const result = await runGeneration({
      supabase,
      userId: session.userId,
      teamId: session.profile.teamId,
      input,
      source: "manual",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
