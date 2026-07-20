-- AI Content Agent — generated content, one row per request. crm_payload
-- holds the full structured JSON from the system prompt (section 7); the
-- flat columns exist for querying/filtering without unpacking JSON.

create table if not exists ai_content_outputs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references ai_content_requests(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references crm_teams(id),
  blog_article text,
  blog_seo_meta jsonb,
  post_text text,
  hook text,
  cta text,
  hashtags jsonb,
  reel_script jsonb,
  carousel_structure jsonb,
  design_brief jsonb,
  personal_brand_version jsonb,
  crm_payload jsonb not null,
  disclaimer text,
  compliance_score integer,
  content_score integer,
  sources_cited jsonb,
  status text not null default 'pending_review' check (
    status in (
      'draft', 'pending_review', 'team_review', 'super_admin_review',
      'changes_requested', 'approved', 'rejected', 'ready_to_publish',
      'published', 'archived'
    )
  ),
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_content_outputs enable row level security;

drop policy if exists "ai_content_outputs_owner_all" on ai_content_outputs;
create policy "ai_content_outputs_owner_all"
  on ai_content_outputs for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "ai_content_outputs_team_view" on ai_content_outputs;
create policy "ai_content_outputs_team_view"
  on ai_content_outputs for select
  using (
    team_id in (select team_id from crm_staff_profiles where user_id = auth.uid())
    and exists (
      select 1 from ai_content_permissions p
      where p.user_id = auth.uid() and p.can_view_team_content
    )
  );

drop policy if exists "ai_content_outputs_team_review_update" on ai_content_outputs;
create policy "ai_content_outputs_team_review_update"
  on ai_content_outputs for update
  using (
    team_id in (select team_id from crm_staff_profiles where user_id = auth.uid())
    and exists (
      select 1 from ai_content_permissions p
      where p.user_id = auth.uid() and p.can_approve_team_content
    )
  )
  with check (
    team_id in (select team_id from crm_staff_profiles where user_id = auth.uid())
    and exists (
      select 1 from ai_content_permissions p
      where p.user_id = auth.uid() and p.can_approve_team_content
    )
  );

drop policy if exists "ai_content_outputs_super_admin_all" on ai_content_outputs;
create policy "ai_content_outputs_super_admin_all"
  on ai_content_outputs for all
  using (ai_content_is_super_admin(auth.uid()))
  with check (ai_content_is_super_admin(auth.uid()));
