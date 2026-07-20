"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitionContent } from "@/lib/content/actions";
import type { ContentStatus } from "@/lib/content/types";

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
    return <p className="text-sm text-zinc-500">No hay acciones disponibles para tu rol en este estado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas de revisión (opcional)"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        {transitions.map((to) => (
          <button
            key={to}
            onClick={() => handleTransition(to)}
            disabled={pending !== null}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {pending === to ? "Procesando…" : LABELS[to]}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
