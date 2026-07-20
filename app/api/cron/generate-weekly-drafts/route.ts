import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { runGeneration } from "@/lib/content/generate-flow";
import type { GenerationInput } from "@/lib/content/types";

// Vercel Hobby caps function duration at 60s; Pro allows up to 800s.
// With ~7 asesores generating sequentially, this can exceed the Hobby cap —
// see README.md for the recommendation to upgrade if the advisor count grows.
export const maxDuration = 300;

const WEEKLY_INPUT: Omit<GenerationInput, "topic"> & { topic: string } = {
  topic: "Actualidad financiera y geopolítica relevante de la semana",
  objective:
    "Generar un borrador semanal de educación financiera basado en la actualidad de mercados y geopolítica, siguiendo estrictamente las fuentes y reglas de compliance del system prompt.",
  visibilityScope: "own",
  needsImage: true,
  complianceRequired: true,
};

function isAuthorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  const headerBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);
  if (headerBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(headerBuf, expectedBuf);
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || !isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: permittedRows, error: permError } = await supabase
    .from("ai_content_permissions")
    .select("user_id")
    .eq("can_generate_content", true);

  if (permError) {
    return NextResponse.json({ error: permError.message }, { status: 500 });
  }

  const permittedUserIds = new Set((permittedRows ?? []).map((r) => r.user_id as string));
  if (permittedUserIds.size === 0) {
    return NextResponse.json({ generated: 0, failed: 0, results: [] });
  }

  const { data: advisors, error: advisorError } = await supabase
    .from("crm_staff_profiles")
    .select("user_id, team_id")
    .eq("role", "asesor")
    .in("user_id", Array.from(permittedUserIds));

  if (advisorError) {
    return NextResponse.json({ error: advisorError.message }, { status: 500 });
  }

  const results: { userId: string; ok: boolean; error?: string }[] = [];

  for (const advisor of advisors ?? []) {
    try {
      await runGeneration({
        supabase,
        userId: advisor.user_id as string,
        teamId: (advisor.team_id as string | null) ?? null,
        input: WEEKLY_INPUT,
        source: "cron",
      });
      results.push({ userId: advisor.user_id as string, ok: true });
    } catch (error) {
      results.push({ userId: advisor.user_id as string, ok: false, error: (error as Error).message });
    }
  }

  return NextResponse.json({
    generated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
