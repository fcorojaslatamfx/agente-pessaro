-- AI Content Agent — Fase 2: conexiones OAuth por asesor (LinkedIn, Instagram)
-- y la conexión corporativa única de la Página de Facebook.
--
-- Los tokens NUNCA se guardan en texto plano: solo se almacena el uuid del
-- secreto en Supabase Vault (extensión `supabase_vault`, ya instalada en
-- este proyecto — ver `list_extensions`). El valor real solo se resuelve
-- server-side uniendo contra `vault.decrypted_secrets`, vista que Supabase
-- no expone a `anon`/`authenticated` vía la API REST pública por defecto.

create table if not exists ai_content_social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'instagram', 'facebook_page')),
  platform_account_id text,
  access_token_secret_id uuid references vault.secrets(id),
  refresh_token_secret_id uuid references vault.secrets(id),
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  connected_by uuid references auth.users(id),
  status text not null default 'pending_review' check (status in ('active', 'expired', 'revoked', 'pending_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_content_social_connections enable row level security;

-- Cada asesor ve/gestiona solo su propia conexión (user_id no nulo).
drop policy if exists "ai_content_social_connections_owner" on ai_content_social_connections;
create policy "ai_content_social_connections_owner"
  on ai_content_social_connections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- La fila corporativa (user_id null — ej. Página de Facebook) y el resto de
-- filas ajenas solo las gestiona super_admin.
drop policy if exists "ai_content_social_connections_super_admin" on ai_content_social_connections;
create policy "ai_content_social_connections_super_admin"
  on ai_content_social_connections for all
  using (ai_content_is_super_admin(auth.uid()))
  with check (ai_content_is_super_admin(auth.uid()));
