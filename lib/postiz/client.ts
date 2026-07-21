import "server-only";

export class PostizNotConfiguredError extends Error {
  constructor() {
    super("Postiz no está configurado (falta POSTIZ_API_KEY).");
    this.name = "PostizNotConfiguredError";
  }
}

// Default apunta a Postiz Cloud (mismo default que el SDK oficial @postiz/node).
// Si se autohospeda Postiz, setear POSTIZ_API_URL a la URL del backend propio
// (ej. https://postiz.pessaro.cl/api) — ver INTEGRATION.md para la decisión de hosting.
const DEFAULT_API_URL = "https://api.postiz.com";

function getApiKey(): string {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new PostizNotConfiguredError();
  return key;
}

function getApiUrl(): string {
  return process.env.POSTIZ_API_URL || DEFAULT_API_URL;
}

export async function postizFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: getApiKey(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Postiz respondió ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
