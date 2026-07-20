import Link from "next/link";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ReviewInboxPage() {
  await requireAgentAccess();
  const supabase = await createClient();

  const { data: outputs, error } = await supabase
    .from("ai_content_outputs")
    .select("id, status, blog_seo_meta, created_at, owner_user_id")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Bandeja de revisión</h1>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {(outputs ?? []).length === 0 ? (
        <EmptyState
          title="No hay contenido para revisar todavía"
          description="Los borradores generados aparecerán aquí."
        />
      ) : (
        <Card className="flex flex-col divide-y divide-border p-0">
          {(outputs ?? []).map((row) => (
            <Link
              key={row.id}
              href={`/review/${row.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/40"
            >
              <span className="truncate font-medium text-foreground">
                {(row.blog_seo_meta as { h1?: string } | null)?.h1 ?? "Sin título"}
              </span>
              <StatusBadge status={row.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
