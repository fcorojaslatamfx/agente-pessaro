-- AI Content Agent — Fase 2: registro de publicaciones reales por plataforma.

create table if not exists ai_content_publications (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references ai_content_outputs(id) on delete cascade,
  social_connection_id uuid references ai_content_social_connections(id),
  platform text not null,
  published_at timestamptz,
  platform_post_id text,
  platform_post_url text,
  status text not null default 'pending' check (status in ('pending', 'published', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table ai_content_publications enable row level security;

drop policy if exists "ai_content_publications_via_output" on ai_content_publications;
create policy "ai_content_publications_via_output"
  on ai_content_publications for all
  using (
    exists (
      select 1 from ai_content_outputs o
      where o.id = ai_content_publications.output_id
        and (
          o.owner_user_id = auth.uid()
          or ai_content_is_super_admin(auth.uid())
          or (
            o.team_id in (select team_id from crm_staff_profiles where user_id = auth.uid())
            and exists (
              select 1 from ai_content_permissions p
              where p.user_id = auth.uid() and p.can_view_team_content
            )
          )
        )
    )
  )
  with check (
    exists (
      select 1 from ai_content_outputs o
      where o.id = ai_content_publications.output_id
        and (o.owner_user_id = auth.uid() or ai_content_is_super_admin(auth.uid()))
    )
  );
