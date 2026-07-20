"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitionContent } from "@/lib/content/actions";
import type { ContentStatus } from "@/lib/content/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

const LABELS: Record<ContentStatus, string> = {
  draft: "Guardar como borrador",
  pending_review: "Enviar a revisión",
  team_review: "Enviar a revisión de equipo",
  super_admin_review: "Escalar a super admin",
  changes_requested: "Pedir cambios",
  approved: "Aprobar",
  rejected: "Rechazar",
  ready_to_publish: "Marcar listo para publicar",
  published: "Marcar como publicado",
  archived: "Archivar",
};

export default function ReviewActions({
  outputId,
  transitions,
}: {
  outputId: string;
  transitions: ContentStatus[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ContentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  async function handleTransition(to: ContentStatus) {
    setPending(to);
    setError(null);
    const result = await transitionContent(outputId, to, notes || undefined);
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (transitions.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay acciones disponibles para tu rol en este estado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas de revisión (opcional)"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        {transitions.map((to) => (
          <Button key={to} onClick={() => handleTransition(to)} disabled={pending !== null}>
            {pending === to ? "Procesando…" : LABELS[to]}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
