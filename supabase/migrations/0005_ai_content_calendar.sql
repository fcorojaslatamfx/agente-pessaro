-- AI Content Agent — simple editorial calendar entries per output/platform.

create table if not exists ai_content_calendar (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references ai_content_outputs(id) on delete cascade,
  scheduled_date date not null,
  timezone text not null default 'America/Santiago',
  platform text not null,
  status text not null default 'planned' check (status in ('planned', 'published', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table ai_content_calendar enable row level security;

drop policy if exists "ai_content_calendar_via_output" on ai_content_calendar;
create policy "ai_content_calendar_via_output"
  on ai_content_calendar for all
  using (
    exists (
      select 1 from ai_content_outputs o
      where o.id = ai_content_calendar.output_id
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
      where o.id = ai_content_calendar.output_id
        and (o.owner_user_id = auth.uid() or ai_content_is_super_admin(auth.uid()))
    )
  );
