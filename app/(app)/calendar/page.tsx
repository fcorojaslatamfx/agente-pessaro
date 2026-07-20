import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CalendarPage() {
  await requireAgentAccess();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("ai_content_calendar")
    .select("id, scheduled_date, platform, status, ai_content_outputs(blog_seo_meta)")
    .order("scheduled_date", { ascending: true })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Calendario editorial</h1>
      {(entries ?? []).length === 0 ? (
        <EmptyState
          title="No hay entradas de calendario todavía"
          description="Se agregan al aprobar contenido para publicación."
        />
      ) : (
        <Card className="flex flex-col divide-y divide-border p-0">
          {(entries ?? []).map((entry) => {
            const output = entry.ai_content_outputs as unknown as {
              blog_seo_meta: { h1?: string } | null;
            } | null;
            return (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{output?.blog_seo_meta?.h1 ?? "Sin título"}</p>
                  <p className="text-xs text-muted-foreground">{entry.platform}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-foreground">{new Date(entry.scheduled_date).toLocaleDateString("es-CL")}</p>
                  <StatusBadge status={entry.status} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
