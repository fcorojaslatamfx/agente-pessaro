import Link from "next/link";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

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
      <h1 className="text-2xl font-semibold">Bandeja de revisión</h1>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {(outputs ?? []).map((row) => (
          <Link
            key={row.id}
            href={`/review/${row.id}`}
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="font-medium">
              {(row.blog_seo_meta as { h1?: string } | null)?.h1 ?? "Sin título"}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {row.status}
            </span>
          </Link>
        ))}
        {(outputs ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">No hay contenido para revisar todavía.</p>
        )}
      </div>
    </div>
  );
}
