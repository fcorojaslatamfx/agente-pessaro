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
