import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  pending_review: "bg-gold/15 text-gold-light",
  team_review: "bg-gold/15 text-gold-light",
  super_admin_review: "bg-gold/15 text-gold-light",
  changes_requested: "bg-destructive/15 text-destructive",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  ready_to_publish: "bg-primary/15 text-primary",
  published: "bg-success/15 text-success",
  archived: "bg-secondary text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_review: "Pendiente de revisión",
  team_review: "Revisión de equipo",
  super_admin_review: "Revisión super admin",
  changes_requested: "Cambios solicitados",
  approved: "Aprobado",
  rejected: "Rechazado",
  ready_to_publish: "Listo para publicar",
  published: "Publicado",
  archived: "Archivado",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
