"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitGenerationRequest } from "@/lib/content/actions";
import type { GenerationInput } from "@/lib/content/types";

const PLATFORMS = ["LinkedIn", "Instagram", "Facebook"];

export default function GenerateForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const secondary = formData.getAll("platforms_secondary") as string[];

    const input: GenerationInput = {
      topic: String(formData.get("topic") ?? ""),
      objective: String(formData.get("objective") ?? "") || undefined,
      audience: String(formData.get("audience") ?? "") || undefined,
      tone: String(formData.get("tone") ?? "") || undefined,
      contentType: String(formData.get("content_type") ?? "") || undefined,
      platformPrimary: String(formData.get("platform_primary") ?? "") || undefined,
      platformsSecondary: secondary,
      visibilityScope: (formData.get("visibility_scope") as GenerationInput["visibilityScope"]) ?? "own",
      needsImage: formData.get("needs_image") === "on",
      imageSource: String(formData.get("image_source") ?? "") || undefined,
      complianceRequired: formData.get("compliance_required") !== "off",
    };

    const result = await submitGenerationRequest(input);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.push("/review");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="topic">
          Tema *
        </label>
        <input
          id="topic"
          name="topic"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Ej: Impacto de la política de tasas de la Fed en carteras diversificadas"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="objective">
          Objetivo
        </label>
        <input
          id="objective"
          name="objective"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="audience">
            Audiencia
          </label>
          <input
            id="audience"
            name="audience"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="tone">
            Tono
          </label>
          <input
            id="tone"
            name="tone"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="content_type">
            Tipo de contenido
          </label>
          <input
            id="content_type"
            name="content_type"
            placeholder="post educativo, análisis, carrusel…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="platform_primary">
            Plataforma principal
          </label>
          <select
            id="platform_primary"
            name="platform_primary"
            defaultValue="LinkedIn"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Plataformas secundarias</legend>
        <div className="flex gap-4">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="platforms_secondary" value={p} />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="visibility_scope">
          Alcance de visibilidad
        </label>
        <select
          id="visibility_scope"
          name="visibility_scope"
          defaultValue="own"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="own">Solo yo</option>
          <option value="team">Mi equipo</option>
          <option value="company">Compañía</option>
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="needs_image" />
          Necesita imagen / brief visual
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="compliance_required" defaultChecked />
          Requiere validación de compliance financiero
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Borrador generado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Generando…" : "Generar borrador"}
      </button>
    </form>
  );
}
