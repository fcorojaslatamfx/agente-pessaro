"use client";

import { useState } from "react";
import { upsertPermissions } from "@/lib/content/admin-actions";
import type { AiContentPermissions } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/Button";

const FLAGS: { key: keyof AiContentPermissions; label: string }[] = [
  { key: "can_access_agent", label: "Acceso al módulo" },
  { key: "can_generate_content", label: "Generar contenido" },
  { key: "can_generate_images", label: "Generar imágenes" },
  { key: "can_use_public_image_bank", label: "Banco de imágenes públicas" },
  { key: "can_save_drafts", label: "Guardar borradores" },
  { key: "can_submit_for_review", label: "Enviar a revisión" },
  { key: "can_approve_content", label: "Aprobar contenido" },
  { key: "can_approve_team_content", label: "Aprobar contenido del equipo" },
  { key: "can_publish_own_social", label: "Publicar en redes propias" },
  { key: "can_publish_company_social", label: "Publicar en redes corporativas" },
  { key: "can_view_team_content", label: "Ver contenido del equipo" },
  { key: "can_view_company_content", label: "Ver contenido de toda la compañía" },
];

export default function PermissionRow({
  userId,
  teamId,
  name,
  role,
  initial,
}: {
  userId: string;
  teamId: string | null;
  name: string;
  role: string;
  initial: AiContentPermissions;
}) {
  const [flags, setFlags] = useState(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof AiContentPermissions) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function handleSave() {
    setPending(true);
    await upsertPermissions(userId, teamId, flags);
    setPending(false);
    setSaved(true);
  }

  return (
    <details className="rounded-lg border border-border">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
        {name} <span className="text-xs text-muted-foreground">({role})</span>
      </summary>
      <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        {FLAGS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={flags[key]}
              onChange={() => toggle(key)}
              className="accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 pb-4">
        <Button onClick={handleSave} disabled={pending} className="px-4 py-1.5">
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        {saved && <span className="text-sm text-success">Guardado ✓</span>}
      </div>
    </details>
  );
}
