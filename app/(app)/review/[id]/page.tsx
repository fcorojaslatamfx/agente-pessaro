import { notFound } from "next/navigation";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { availableTransitions, type OutputRow } from "@/lib/content/transitions";
import { personalizeCopy } from "@/lib/content/personalize";
import type { ContentAgentOutput } from "@/lib/content/types";
import { Card, SectionTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import CopyButton from "./CopyButton";
import ReviewActions from "./ReviewActions";
import ImageGenerator from "./ImageGenerator";

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

  const [{ data: ownerProfile }, { data: assets }] = await Promise.all([
    supabase
      .from("crm_staff_profiles")
      .select("display_name")
      .eq("user_id", output.owner_user_id)
      .maybeSingle(),
    supabase
      .from("ai_content_assets")
      .select("id, image_url")
      .eq("output_id", output.id)
      .order("created_at", { ascending: false }),
  ]);

  const payload = output.crm_payload as ContentAgentOutput;
  const designBrief = payload.design_brief;
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

  const heroAsset = assets?.[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{payload.blog?.h1 ?? "Sin título"}</h1>
          <p className="text-sm text-muted-foreground">
            Autor: {ownerProfile?.display_name ?? output.owner_user_id}
          </p>
        </div>
        <StatusBadge status={output.status} />
      </div>

      {output.reviewer_notes && (
        <div className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold-light">
          {output.reviewer_notes}
        </div>
      )}

      <Card>
        <SectionTitle className="mb-3">Acciones</SectionTitle>
        <ReviewActions outputId={output.id} transitions={transitions} />
      </Card>

      <Card className="flex flex-col gap-2">
        <SectionTitle>Blog (SEO)</SectionTitle>
        <p className="text-sm text-muted-foreground">{payload.blog?.meta_description}</p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{payload.blog?.articulo}</pre>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>LinkedIn</SectionTitle>
          <CopyButton text={payload.linkedin?.copy ?? ""} label="LinkedIn" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {heroAsset && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroAsset.image_url}
              alt="Preview LinkedIn"
              className="aspect-[1200/627] w-full max-w-[240px] shrink-0 rounded-md border border-border object-cover"
            />
          )}
          <div className="flex flex-col gap-1">
            <p className="whitespace-pre-wrap text-sm text-foreground">{payload.linkedin?.copy}</p>
            <p className="text-xs text-muted-foreground">{payload.linkedin?.hashtags?.join(" ")}</p>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Instagram</SectionTitle>
          <CopyButton text={payload.instagram?.copy ?? ""} label="Instagram" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {heroAsset && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroAsset.image_url}
              alt="Preview Instagram"
              className="aspect-square w-full max-w-[180px] shrink-0 rounded-md border border-border object-cover"
            />
          )}
          <div className="flex flex-col gap-2">
            <p className="whitespace-pre-wrap text-sm text-foreground">{payload.instagram?.copy}</p>
            {payload.instagram?.carrusel && (
              <ol className="list-decimal pl-5 text-sm text-muted-foreground">
                {payload.instagram.carrusel.map((slide, i) => (
                  <li key={i}>{slide}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Facebook</SectionTitle>
          <CopyButton text={payload.facebook?.copy ?? ""} label="Facebook" />
        </div>
        <p className="whitespace-pre-wrap text-sm text-foreground">{payload.facebook?.copy}</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Versión marca personal</SectionTitle>
          <CopyButton text={personalCopy} label="marca personal" />
        </div>
        <p className="text-xs text-muted-foreground">{payload.version_marca_personal?.instrucciones}</p>
        <p className="whitespace-pre-wrap text-sm text-foreground">{personalCopy}</p>
      </Card>

      {designBrief && (
        <Card className="flex flex-col gap-4">
          <SectionTitle>Brief visual</SectionTitle>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{designBrief.concepto_creativo}</p>
            <p className="text-sm text-muted-foreground">{designBrief.estilo_visual}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Composición</dt>
              <dd className="text-foreground">{designBrief.composicion}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Tipografía</dt>
              <dd className="text-foreground">{designBrief.tipografia}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Elementos gráficos</dt>
              <dd className="text-foreground">{designBrief.elementos_graficos}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Qué evitar</dt>
              <dd className="text-foreground">{designBrief.que_evitar}</dd>
            </div>
          </dl>

          {designBrief.paleta && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Paleta</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {[designBrief.paleta.primario, designBrief.paleta.acento].map(
                  (color, i) =>
                    color && (
                      <span key={i} className="flex items-center gap-1.5">
                        <span
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: color.match(/#[0-9a-f]{3,6}/i)?.[0] }}
                        />
                        {color}
                      </span>
                    ),
                )}
                <span>{designBrief.paleta.complementarios}</span>
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Texto en gráfica</p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{designBrief.texto_grafica}</p>
          </div>

          {designBrief.prompt_leonardo && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-muted-foreground">Prompt Leonardo</p>
                <CopyButton text={designBrief.prompt_leonardo} label="prompt" />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-secondary/40 p-3 font-mono text-xs text-foreground">
                {designBrief.prompt_leonardo}
              </pre>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Formato principal: {designBrief.formato_principal}
            </p>
          </div>

          {session.profile.permissions.can_generate_images || session.profile.isSuperAdmin ? (
            <ImageGenerator
              outputId={output.id}
              prompt={designBrief.prompt_leonardo ?? ""}
              savedAssets={assets ?? []}
            />
          ) : null}
        </Card>
      )}

      {payload.disclaimer && (
        <p className="text-xs italic text-muted-foreground">{payload.disclaimer}</p>
      )}
    </div>
  );
}
