import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { checkWeeklyCronHealth } from "@/lib/content/cron-health";

export default async function DashboardPage() {
  const session = await requireAgentAccess();
  const supabase = await createClient();

  const { data: outputs } = await supabase
    .from("ai_content_outputs")
    .select("status")
    .eq("owner_user_id", session.userId);

  const counts = (outputs ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const cronHealth = session.profile.isSuperAdmin
    ? await checkWeeklyCronHealth(supabase)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Hola, {session.profile.displayName ?? session.email}</h1>

      {cronHealth?.isLate && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          No se detectaron borradores generados por el cron semanal para esta semana
          (desde {new Date(cronHealth.weekStart).toLocaleDateString("es-CL")}). Verifica el job de
          pg_cron.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-2xl font-semibold">{count}</p>
            <p className="text-sm text-zinc-500">{status}</p>
          </div>
        ))}
        {Object.keys(counts).length === 0 && (
          <p className="col-span-full text-sm text-zinc-500">
            Aún no has generado contenido. Ve a &quot;Generar&quot; para crear tu primer borrador.
          </p>
        )}
      </div>
    </div>
  );
}
