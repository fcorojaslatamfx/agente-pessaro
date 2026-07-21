import "server-only";
import { postizFetch } from "./client";

// Mapea la respuesta real de GET /public/v1/integrations
// (public.integrations.controller.ts#listIntegration en postiz-app).
export type PostizIntegration = {
  id: string;
  name: string;
  identifier: string;
  picture: string | null;
  disabled: boolean;
  customer?: { id: string; name: string };
};

export async function listPostizIntegrations(): Promise<PostizIntegration[]> {
  return postizFetch<PostizIntegration[]>("/public/v1/integrations");
}

// Mapea el identifier real de proveedor en Postiz (ver
// integration.manager.ts / *.provider.ts en postiz-app) al vocabulario de
// plataforma que ya usa este proyecto desde la migración 0006
// (ai_content_social_connections.platform, check constraint).
export function mapPostizIdentifierToPlatform(
  identifier: string,
): "linkedin" | "instagram" | "facebook_page" | null {
  if (identifier.startsWith("linkedin")) return "linkedin";
  if (identifier.startsWith("instagram")) return "instagram";
  if (identifier === "facebook") return "facebook_page";
  return null;
}
