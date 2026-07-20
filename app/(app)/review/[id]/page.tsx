import { notFound } from "next/navigation";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { availableTransitions, type OutputRow } from "@/lib/content/transitions";
import { personalizeCopy } from "@/lib/content/personalize";
import type { ContentAgentOutput } from "@/lib/content/types";
import CopyButton from "./CopyButton";
import ReviewActions from "./ReviewActions";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAgentAccess();
  const supabase = await createClient();

  const { data: output } = await supabase
    .from("ai_content_outputs")
    .select("id, status, owner_user_id, team_id, crm_payload, reviewer_notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!output) notFound();

  const { data: ownerProfile } = await supabase
    .from("crm_staff_profiles")
    .select("display_name")
    .eq("user_id", output.owner_user_id)
    .maybeSingle();

  const payload = output.crm_payload as ContentAgentOutput;
  const row: OutputRow = {
    owner_user_id: output.owner_user_id,
    team_id: output.team_id,
    status: output.status,
  };
  const transitions = availableTransitions(session.profile, row);

  const personalCopy = personalizeCopy(
    payload.version_marca_personal?.copy_personalizable ?? "",
    ownerProfile?.display_name ?? null,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{payload.blog?.h1 ?? "Sin título"}</h1>
          <p className="text-sm text-zinc-500">
            Estado: <span className="font-medium">{output.status}</span> · Autor:{" "}
            {ownerProfile?.display_name ?? output.owner_user_id}
          </p>
        </div>
      </div>

      {output.reviewer_notes && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {output.reviewer_notes}
        </div>
      )}

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Acciones</h2>
        <ReviewActions outputId={output.id} transitions={transitions} />
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">Blog (SEO)</h2>
        </div>
        <p className="text-sm text-zinc-500">{payload.blog?.meta_description}</p>
        <pre className="whitespace-pre-wrap text-sm">{payload.blog?.articulo}</pre>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">LinkedIn</h2>
          <CopyButton text={payload.linkedin?.copy ?? ""} label="LinkedIn" />
        </div>
        <p className="whitespace-pre-wrap text-sm">{payload.linkedin?.copy}</p>
        <p className="text-xs text-zinc-500">{payload.linkedin?.hashtags?.join(" ")}</p>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">Instagram</h2>
          <CopyButton text={payload.instagram?.copy ?? ""} label="Instagram" />
        </div>
        <p className="whitespace-pre-wrap text-sm">{payload.instagram?.copy}</p>
        {payload.instagram?.carrusel && (
          <ol className="list-decimal pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {payload.instagram.carrusel.map((slide, i) => (
              <li key={i}>{slide}</li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">Facebook</h2>
          <CopyButton text={payload.facebook?.copy ?? ""} label="Facebook" />
        </div>
        <p className="whitespace-pre-wrap text-sm">{payload.facebook?.copy}</p>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Versión marca personal
          </h2>
          <CopyButton text={personalCopy} label="marca personal" />
        </div>
        <p className="text-xs text-zinc-500">{payload.version_marca_personal?.instrucciones}</p>
        <p className="whitespace-pre-wrap text-sm">{personalCopy}</p>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase text-zinc-500">Brief visual</h2>
        <p className="text-sm">{payload.design_brief?.idea_visual}</p>
        <p className="text-xs text-zinc-500">Paleta: {payload.design_brief?.paleta}</p>
        <p className="text-xs text-zinc-500">Texto en gráfica: {payload.design_brief?.texto_grafica}</p>
      </section>

      {payload.disclaimer && (
        <p className="text-xs italic text-zinc-500">{payload.disclaimer}</p>
      )}
    </div>
  );
}
