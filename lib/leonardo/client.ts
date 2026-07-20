import "server-only";

export class LeonardoNotConfiguredError extends Error {
  constructor() {
    super("Leonardo.ai no está configurado (falta LEONARDO_API_KEY o LEONARDO_MODEL_ID).");
    this.name = "LeonardoNotConfiguredError";
  }
}

const API_BASE = "https://cloud.leonardo.ai/api/rest/v1";

function getApiKey(): string {
  const key = process.env.LEONARDO_API_KEY;
  if (!key) throw new LeonardoNotConfiguredError();
  return key;
}

/**
 * No hardcodeamos un modelId de Leonardo (ej. Phoenix) porque cambian con el
 * tiempo — Francisco debe confirmar el modelo vigente de mejor calidad para
 * diseño gráfico/ilustración desde su dashboard de Leonardo.ai.
 */
export function getLeonardoModelId(): string {
  const modelId = process.env.LEONARDO_MODEL_ID;
  if (!modelId) throw new LeonardoNotConfiguredError();
  return modelId;
}

export async function leonardoFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Leonardo.ai respondió ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
