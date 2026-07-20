import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { checkWeeklyCronHealth } from "@/lib/content/cron-health";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

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
      <h1 className="text-2xl font-semibold text-foreground">
        Hola, {session.profile.displayName ?? session.email}
      </h1>

      {cronHealth?.isLate && (
        <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-gold-light">
          No se detectaron borradores generados por el cron semanal para esta semana
          (desde {new Date(cronHealth.weekStart).toLocaleDateString("es-CL")}). Verifica el job de
          pg_cron.
        </div>
      )}

      {Object.keys(counts).length === 0 ? (
        <EmptyState
          title="Aún no has generado contenido"
          description='Ve a "Generar" para crear tu primer borrador.'
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(counts).map(([status, count]) => (
            <Card key={status} className="flex flex-col gap-2">
              <p className="text-2xl font-semibold text-foreground">{count}</p>
              <StatusBadge status={status} className="self-start" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
