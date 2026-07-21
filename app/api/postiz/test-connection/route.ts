import { NextResponse } from "next/server";
import { requireAgentAccess } from "@/lib/auth/dal";
import { listPostizIntegrations } from "@/lib/postiz/integrations";
import { PostizNotConfiguredError } from "@/lib/postiz/client";

// PoC de conexión: solo lista los canales ya conectados en Postiz (read-only,
// no publica nada). Confirma que POSTIZ_API_KEY es válida antes de construir
// el flujo real de publicación (ver INTEGRATION.md, sección "Plan de
// implementación", fase 4).
export async function GET() {
  const session = await requireAgentAccess();
  if (!session.profile.isSuperAdmin) {
    return NextResponse.json({ error: "Solo super_admin puede probar la conexión con Postiz." }, { status: 403 });
  }

  try {
    const integrations = await listPostizIntegrations();
    return NextResponse.json({ connected: true, integrations });
  } catch (err) {
    if (err instanceof PostizNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
