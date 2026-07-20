-- AI Content Agent — permissions table.
-- Additive only: new table, new policies, new function. Never touches
-- user_profiles / crm_staff_profiles / crm_teams / auth.users.

create table if not exists ai_content_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references crm_teams(id),
  can_access_agent boolean not null default false,
  can_generate_content boolean not null default false,
  can_generate_images boolean not null default false,
  can_use_public_image_bank boolean not null default false,
  can_save_drafts boolean not null default true,
  can_submit_for_review boolean not null default true,
  can_approve_content boolean not null default false,
  can_approve_team_content boolean not null default false,
  can_publish_own_social boolean not null default true,
  can_publish_company_social boolean not null default false,
  can_view_team_content boolean not null default false,
  can_view_company_content boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table ai_content_permissions enable row level security;

-- Real production role vocabulary: super_admin can live on either
-- user_profiles.role or crm_staff_profiles.role (there is no team_admin
-- role — see section 4 of the meta-prompt).
create or replace function ai_content_is_super_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_profiles where user_id = uid and role = 'super_admin'
  ) or exists (
    select 1 from crm_staff_profiles where user_id = uid and role = 'super_admin'
  );
$$;

drop policy if exists "ai_content_permissions_self_read" on ai_content_permissions;
create policy "ai_content_permissions_self_read"
  on ai_content_permissions for select
  using (user_id = auth.uid() or ai_content_is_super_admin(auth.uid()));

drop policy if exists "ai_content_permissions_super_admin_all" on ai_content_permissions;
create policy "ai_content_permissions_super_admin_all"
  on ai_content_permissions for all
  using (ai_content_is_super_admin(auth.uid()))
  with check (ai_content_is_super_admin(auth.uid()));
