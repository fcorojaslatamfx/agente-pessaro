import type { ContentAgentOutput } from "./types";

const DEFAULT_DIMENSIONS = { width: 1200, height: 627 };

function parseDimensions(formatStr: string | undefined): { width: number; height: number } | null {
  if (!formatStr) return null;
  const match = formatStr.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

/** `formato_principal` is model-generated free text — match leniently against known keys. */
export function resolvePrimaryDimensions(
  designBrief: ContentAgentOutput["design_brief"] | null | undefined,
): { width: number; height: number } {
  if (!designBrief?.formatos) return DEFAULT_DIMENSIONS;

  const formatos = designBrief.formatos;
  const key = Object.keys(formatos).find(
    (k) => k === designBrief.formato_principal || formatos[k as keyof typeof formatos] === designBrief.formato_principal,
  ) as keyof typeof formatos | undefined;

  return (
    parseDimensions(key ? formatos[key] : undefined) ??
    parseDimensions(formatos.linkedin_feed) ??
    DEFAULT_DIMENSIONS
  );
}
