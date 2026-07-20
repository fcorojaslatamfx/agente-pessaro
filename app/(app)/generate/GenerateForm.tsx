"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitGenerationRequest } from "@/lib/content/actions";
import type { GenerationInput } from "@/lib/content/types";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

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

  if (pending) {
    return (
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Generando borrador — investigando fuentes y redactando blog, LinkedIn, Instagram, Facebook
          y brief visual. Esto puede tardar unos segundos…
        </p>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-5/6" />
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="topic">Tema *</Label>
        <Input
          id="topic"
          name="topic"
          required
          placeholder="Ej: Impacto de la política de tasas de la Fed en carteras diversificadas"
        />
      </div>

      <div>
        <Label htmlFor="objective">Objetivo</Label>
        <Input id="objective" name="objective" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="audience">Audiencia</Label>
          <Input id="audience" name="audience" />
        </div>
        <div>
          <Label htmlFor="tone">Tono</Label>
          <Input id="tone" name="tone" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="content_type">Tipo de contenido</Label>
          <Input id="content_type" name="content_type" placeholder="post educativo, análisis, carrusel…" />
        </div>
        <div>
          <Label htmlFor="platform_primary">Plataforma principal</Label>
          <Select id="platform_primary" name="platform_primary" defaultValue="LinkedIn">
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Plataformas secundarias</legend>
        <div className="flex flex-wrap gap-4">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="platforms_secondary" value={p} className="accent-primary" />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="visibility_scope">Alcance de visibilidad</Label>
        <Select id="visibility_scope" name="visibility_scope" defaultValue="own">
          <option value="own">Solo yo</option>
          <option value="team">Mi equipo</option>
          <option value="company">Compañía</option>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="needs_image" className="accent-primary" />
          Necesita imagen / brief visual
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="compliance_required" defaultChecked className="accent-primary" />
          Requiere validación de compliance financiero
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">Borrador generado.</p>}

      <Button type="submit" disabled={pending} className="self-start px-5">
        {pending ? "Generando…" : "Generar borrador"}
      </Button>
    </form>
  );
}
