import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { CONTENT_AGENT_SYSTEM_PROMPT } from "@/lib/anthropic/systemPrompt";
import type { ContentAgentOutput, GenerationInput } from "@/lib/content/types";

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 8000;

function buildUserMessage(input: GenerationInput): string {
  const lines = [
    `Tema: ${input.topic}`,
    input.objective && `Objetivo: ${input.objective}`,
    input.audience && `Audiencia: ${input.audience}`,
    input.tone && `Tono solicitado: ${input.tone}`,
    input.contentType && `Tipo de contenido: ${input.contentType}`,
    input.platformPrimary && `Plataforma principal: ${input.platformPrimary}`,
    input.platformsSecondary?.length &&
      `Plataformas secundarias: ${input.platformsSecondary.join(", ")}`,
    `Alcance de visibilidad: ${input.visibilityScope}`,
    input.needsImage && `Requiere imagen (fuente: ${input.imageSource ?? "no especificada"})`,
    `Compliance financiero requerido: ${input.complianceRequired ? "sí" : "no"}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function callClaude(userMessage: string, repairNotice?: string) {
  const anthropic = getAnthropicClient();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];
  if (repairNotice) {
    messages.push({ role: "assistant", content: repairNotice });
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: CONTENT_AGENT_SYSTEM_PROMPT,
    messages,
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude no devolvió contenido de texto.");
  }
  return block.text;
}

/**
 * Calls the content agent and parses its JSON output. Strips markdown
 * fences defensively, and retries once with a repair request if the first
 * response isn't valid JSON (section 7.B of the meta-prompt).
 */
export async function generateContent(
  input: GenerationInput,
): Promise<ContentAgentOutput> {
  const userMessage = buildUserMessage(input);

  const first = await callClaude(userMessage);
  try {
    return JSON.parse(stripJsonFences(first)) as ContentAgentOutput;
  } catch {
    // Retry once: ask the model to fix its own malformed JSON.
    const repair = await callClaude(
      `${userMessage}\n\nTu respuesta anterior no era JSON válido. Responde ÚNICAMENTE con el objeto JSON corregido, sin texto adicional ni backticks.`,
    );
    try {
      return JSON.parse(stripJsonFences(repair)) as ContentAgentOutput;
    } catch (retryError) {
      throw new Error(
        `El agente no devolvió JSON válido tras un reintento: ${(retryError as Error).message}`,
      );
    }
  }
}
