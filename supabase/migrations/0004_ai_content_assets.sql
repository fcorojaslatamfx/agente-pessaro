-- AI Content Agent — visual assets / design briefs attached to an output.

create table if not exists ai_content_assets (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references ai_content_outputs(id) on delete cascade,
  asset_type text not null,
  source text,
  image_url text,
  storage_path text,
  prompt text,
  width integer,
  height integer,
  license_note text,
  attribution text,
  created_at timestamptz not null default now()
);

alter table ai_content_assets enable row level security;

drop policy if exists "ai_content_assets_via_output" on ai_content_assets;
create policy "ai_content_assets_via_output"
  on ai_content_assets for all
  using (
    exists (
      select 1 from ai_content_outputs o
      where o.id = ai_content_assets.output_id
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
      where o.id = ai_content_assets.output_id
        and (o.owner_user_id = auth.uid() or ai_content_is_super_admin(auth.uid()))
    )
  );
