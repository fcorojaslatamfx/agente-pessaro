import "server-only";
import { postizFetch } from "./client";

// GET /public/v1/posts no busca por id — solo filtra por rango de fechas
// (GetPostsDto). Buscamos en una ventana amplia alrededor de "ahora" y
// filtramos por id nosotros mismos.
type PostizPost = {
  id: string;
  state: "QUEUE" | "PUBLISHED" | "ERROR" | string;
  releaseURL?: string | null;
  error?: string | null;
};

export type PostizPostStatus = {
  state: string;
  releaseUrl: string | null;
  errorMessage: string | null;
};

export async function checkPostizPostStatus(postizPostId: string): Promise<PostizPostStatus | null> {
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const response = await postizFetch<{ posts: PostizPost[] }>(
    `/public/v1/posts?${new URLSearchParams({ startDate, endDate })}`,
  );

  const post = response.posts?.find((p) => p.id === postizPostId);
  if (!post) return null;

  return {
    state: post.state,
    releaseUrl: post.releaseURL ?? null,
    errorMessage: post.error ?? null,
  };
}
