import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

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
      <h1 className="text-2xl font-semibold">Calendario editorial</h1>
      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {(entries ?? []).map((entry) => {
          const output = entry.ai_content_outputs as unknown as {
            blog_seo_meta: { h1?: string } | null;
          } | null;
          return (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{output?.blog_seo_meta?.h1 ?? "Sin título"}</p>
                <p className="text-xs text-zinc-500">{entry.platform}</p>
              </div>
              <div className="text-right">
                <p>{new Date(entry.scheduled_date).toLocaleDateString("es-CL")}</p>
                <p className="text-xs text-zinc-500">{entry.status}</p>
              </div>
            </div>
          );
        })}
        {(entries ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            No hay entradas de calendario todavía. Se agregan al aprobar contenido para publicación.
          </p>
        )}
      </div>
    </div>
  );
}
