import "server-only";
import { leonardoFetch, getLeonardoModelId } from "./client";

// Stay within Vercel Hobby's 60s function limit (same constraint noted for
// the weekly cron route) — if a plan upgrade lifts maxDuration, raise this too.
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 45_000;

export type LeonardoCandidate = { url: string; width: number; height: number };

type GenerationCreateResponse = {
  sdGenerationJob?: { generationId?: string };
};

type GenerationStatusResponse = {
  generations_by_pk?: {
    status?: "PENDING" | "COMPLETE" | "FAILED";
    generated_images?: { url: string }[];
  };
};

function nearestSupportedDimensions(width: number, height: number) {
  const round8 = (n: number) => Math.max(512, Math.round(n / 8) * 8);
  return { width: round8(width), height: round8(height) };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateLeonardoImages(params: {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  numImages?: number;
}): Promise<LeonardoCandidate[]> {
  const { width, height } = nearestSupportedDimensions(params.width, params.height);
  const modelId = getLeonardoModelId();

  const created = await leonardoFetch<GenerationCreateResponse>("/generations", {
    method: "POST",
    body: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      modelId,
      width,
      height,
      num_images: params.numImages ?? 4,
    }),
  });

  const generationId = created.sdGenerationJob?.generationId;
  if (!generationId) {
    throw new Error("Leonardo.ai no devolvió un generationId.");
  }

  const deadline = Date.now() + MAX_POLL_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const status = await leonardoFetch<GenerationStatusResponse>(`/generations/${generationId}`);
    const generation = status.generations_by_pk;

    if (generation?.status === "COMPLETE") {
      return (generation.generated_images ?? []).map((img) => ({ url: img.url, width, height }));
    }
    if (generation?.status === "FAILED") {
      throw new Error("La generación en Leonardo.ai falló.");
    }
  }

  throw new Error("Leonardo.ai no terminó la generación a tiempo — intenta de nuevo.");
}
