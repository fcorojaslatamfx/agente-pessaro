import Link from "next/link";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

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
      <h1 className="text-2xl font-semibold">Historial</h1>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Compliance</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {(outputs ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <Link href={`/review/${row.id}`} className="hover:underline">
                    {(row.blog_seo_meta as { h1?: string } | null)?.h1 ?? "Sin título"}
                  </Link>
                </td>
                <td className="px-4 py-2">{row.status}</td>
                <td className="px-4 py-2">{row.content_score ?? "—"}</td>
                <td className="px-4 py-2">{row.compliance_score ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">
                  {new Date(row.created_at).toLocaleDateString("es-CL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(outputs ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">Sin historial todavía.</p>
        )}
      </div>
    </div>
  );
}
