"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveGeneratedAsset } from "@/lib/content/image-actions";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Asset = { id: string; image_url: string };
type Candidate = { url: string; width: number; height: number };

export default function ImageGenerator({
  outputId,
  prompt,
  savedAssets,
}: {
  outputId: string;
  prompt: string;
  savedAssets: Asset[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  async function handleGenerate() {
    setPending(true);
    setError(null);
    setCandidates([]);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar la imagen.");
        return;
      }
      setCandidates(data.candidates ?? []);
    } catch {
      setError("Error de red al generar la imagen.");
    } finally {
      setPending(false);
    }
  }

  async function handleSelect(candidate: Candidate) {
    setSaving(candidate.url);
    const result = await saveGeneratedAsset(outputId, {
      imageUrl: candidate.url,
      width: candidate.width,
      height: candidate.height,
      prompt,
    });
    setSaving(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCandidates([]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {savedAssets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {savedAssets.map((asset) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={asset.id}
              src={asset.image_url}
              alt="Imagen generada"
              className="aspect-square w-full rounded-md border border-border object-cover"
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={handleGenerate}
        disabled={pending}
        className="self-start"
      >
        {pending ? "Generando…" : "Generar con IA (Leonardo)"}
      </Button>

      {pending && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Elige una candidata para guardarla en este contenido:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {candidates.map((c) => (
              <button
                key={c.url}
                type="button"
                onClick={() => handleSelect(c)}
                disabled={saving !== null}
                className="group relative aspect-square overflow-hidden rounded-md border border-border disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.url}
                  alt="Candidata generada"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {saving === c.url ? "Guardando…" : "Usar esta imagen"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
