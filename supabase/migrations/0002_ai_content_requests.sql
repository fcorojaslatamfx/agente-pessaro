-- AI Content Agent — generation requests (one row per form submission or
-- cron-triggered generation).

create table if not exists ai_content_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  team_id uuid references crm_teams(id),
  topic text not null,
  objective text,
  audience text,
  tone text,
  content_type text,
  platform_primary text,
  platforms_secondary text[] not null default '{}',
  visibility_scope text not null default 'own'
    check (visibility_scope in ('own', 'team', 'company')),
  needs_image boolean not null default false,
  image_source text,
  compliance_required boolean not null default true,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  source text not null default 'manual' check (source in ('manual', 'cron')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_content_requests enable row level security;

drop policy if exists "ai_content_requests_owner_all" on ai_content_requests;
create policy "ai_content_requests_owner_all"
  on ai_content_requests for all
  using (requested_by = auth.uid())
  with check (requested_by = auth.uid());

drop policy if exists "ai_content_requests_team_view" on ai_content_requests;
create policy "ai_content_requests_team_view"
  on ai_content_requests for select
  using (
    team_id in (select team_id from crm_staff_profiles where user_id = auth.uid())
    and exists (
      select 1 from ai_content_permissions p
      where p.user_id = auth.uid() and p.can_view_team_content
    )
  );

drop policy if exists "ai_content_requests_super_admin_all" on ai_content_requests;
create policy "ai_content_requests_super_admin_all"
  on ai_content_requests for all
  using (ai_content_is_super_admin(auth.uid()))
  with check (ai_content_is_super_admin(auth.uid()));
