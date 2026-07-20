import Link from "next/link";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HistoryPage() {
  await requireAgentAccess();
  const supabase = await createClient();

  const { data: outputs } = await supabase
    .from("ai_content_outputs")
    .select("id, status, blog_seo_meta, content_score, compliance_score, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Historial</h1>
      {(outputs ?? []).length === 0 ? (
        <EmptyState title="Sin historial todavía" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Título</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Compliance</th>
                <th className="px-4 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(outputs ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2">
                    <Link href={`/review/${row.id}`} className="text-foreground hover:underline">
                      {(row.blog_seo_meta as { h1?: string } | null)?.h1 ?? "Sin título"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-2 text-foreground">{row.content_score ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground">{row.compliance_score ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
