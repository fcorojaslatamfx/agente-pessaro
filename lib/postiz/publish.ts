import "server-only";
import { postizFetch } from "./client";

export type PostizUploadedMedia = { id: string; path: string };

// POST /public/v1/upload-from-url — Postiz descarga la imagen desde nuestra
// URL (Leonardo.ai o Supabase Storage) y la sirve desde su propio storage,
// como exigen las APIs de Meta/LinkedIn para adjuntar medios.
export async function uploadImageFromUrlToPostiz(url: string): Promise<PostizUploadedMedia> {
  return postizFetch<PostizUploadedMedia>("/public/v1/upload-from-url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

/**
 * `settings.__type` debe calzar con el identifier real del provider en
 * Postiz (linkedin, linkedin-page, instagram, instagram-standalone,
 * facebook, ...). Solo Instagram exige post_type; el resto no tiene campos
 * obligatorios (verificado contra los DTOs de postiz-app, no asumido).
 */
function buildProviderSettings(providerIdentifier: string): Record<string, unknown> {
  if (providerIdentifier.startsWith("instagram")) {
    return { __type: providerIdentifier, post_type: "post" };
  }
  return { __type: providerIdentifier };
}

export type PublishNowParams = {
  postizIntegrationId: string;
  postizProviderIdentifier: string;
  content: string;
  imageUrl?: string | null;
};

export type PostizCreatePostResult = { postId: string; integration: string };

/**
 * Crea el post en Postiz con type "now". OJO: la respuesta solo trae el
 * postId INTERNO de Postiz — la publicación real en la plataforma corre
 * async vía su orquestador (Temporal), así que esto no confirma que ya
 * salió publicado. Usar checkPostizPostStatus() (lib/postiz/status.ts)
 * para conocer el estado real / la URL final.
 */
export async function publishNowToPostiz(params: PublishNowParams): Promise<PostizCreatePostResult> {
  const image = params.imageUrl ? [await uploadImageFromUrlToPostiz(params.imageUrl)] : [];

  const result = await postizFetch<PostizCreatePostResult[]>("/public/v1/posts", {
    method: "POST",
    body: JSON.stringify({
      type: "now",
      shortLink: false,
      date: new Date().toISOString(),
      tags: [],
      posts: [
        {
          integration: { id: params.postizIntegrationId },
          value: [{ content: params.content, image }],
          settings: buildProviderSettings(params.postizProviderIdentifier),
        },
      ],
    }),
  });

  const [post] = result;
  if (!post) {
    throw new Error("Postiz no devolvió el post creado.");
  }
  return post;
}
