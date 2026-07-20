# Pessaro AI Content Agent

Fase 1 (MVP): generación de borradores de contenido financiero/geopolítico
(blog SEO + LinkedIn + Instagram + Facebook + brief visual) vía Claude, con
flujo de aprobación editorial por roles. Ver
`meta_prompt_claude_code_ai_content_agentv1.1.md` para la especificación
completa del producto.

## Stack

- Next.js 16 (App Router) + TypeScript
- Supabase (Postgres + RLS + Auth) — **comparte el proyecto de producción del
  CRM de Pessaro** (`ldlflxujrjihiybrcree`)
- Anthropic API (Claude) para generación de contenido
- Supabase Cron (`pg_cron` + `pg_net`) para la generación semanal automática
- Deploy: Vercel

## ⚠️ Reglas de seguridad sobre la base de datos

Este proyecto Supabase es **producción viva** (~90 tablas con datos reales
del CRM, WhatsApp, campañas, educación). Todo lo que vive en `supabase/migrations/`
sigue estas reglas sin excepción:

- Solo migraciones **aditivas**: `create table if not exists`, `create
  policy`, `create function`. Nunca `alter`, `drop`, `truncate` ni `update`
  sobre tablas existentes del CRM.
- Todas las tablas nuevas usan el prefijo `ai_content_` y tienen RLS
  habilitado desde su primera migración.
- `user_profiles`, `crm_teams`, `crm_staff_profiles` y `auth.users` son
  **solo lectura** desde este proyecto — nunca se les agregan columnas ni se
  escriben roles nuevos ahí. Toda capacidad del agente vive en la tabla
  nueva `ai_content_permissions` (ver sección 4 del meta-prompt para el
  mapeo de roles reales de producción).
- Antes de aplicar una migración nueva a producción, pruébala primero en una
  rama de desarrollo de Supabase (`supabase branches create` o el MCP
  `create_branch`).

## Setup local

1. `npm install`
2. Copia `.env.local.example` a `.env.local` y completa las claves:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: del
     proyecto `ldlflxujrjihiybrcree` ("Website 2026").
   - `SUPABASE_SERVICE_ROLE_KEY`: solo servidor, usada por el cron. Nunca la
     prefijes con `NEXT_PUBLIC_`.
   - `ANTHROPIC_API_KEY`: clave de la API de Anthropic.
   - `CRON_SECRET`: string aleatorio (`openssl rand -base64 32`), compartido
     con el job de `pg_cron`.
3. `npm run dev` y abre `http://localhost:3000`.

Necesitas iniciar sesión con un usuario real que ya exista en
`auth.users` del CRM (no hay registro propio — la autenticación se reutiliza
100%). Para que un usuario vea el módulo, un `super_admin` debe activarle
`can_access_agent` en **Permisos** (`/admin/permissions`).

## Estructura relevante

- `lib/supabase/{server,client,admin}.ts` — clientes Supabase (SSR, browser,
  service-role).
- `lib/auth/{dal,permissions}.ts` — verificación de sesión y resolución de
  permisos sobre el vocabulario real de roles de producción.
- `lib/anthropic/` — cliente Claude, system prompt (constante, sección 7 del
  meta-prompt) y parseo de la respuesta JSON con reintento.
- `lib/compliance/validate.ts` — validación de compliance del lado del
  servidor (sección 12) — nunca confía solo en el `compliance` autoreportado
  por el modelo.
- `lib/content/` — tipos, máquina de estados de aprobación
  (`transitions.ts`), Server Actions (`actions.ts`, `admin-actions.ts`) y el
  flujo de generación compartido entre el formulario manual y el cron
  (`generate-flow.ts`).
- `proxy.ts` — refresco de sesión Supabase (Next.js 16 renombró
  `middleware.ts` a `proxy.ts`; ver
  `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
- `supabase/migrations/` — las 5 migraciones aditivas de `ai_content_*`.

## Cron semanal (pg_cron)

El Route Handler `app/api/cron/generate-weekly-drafts/route.ts` genera un
borrador por cada asesor con `ai_content_permissions.can_generate_content =
true`. Está protegido por comparación timing-safe del header `Authorization:
Bearer <CRON_SECRET>`.

**Después de desplegar** (se necesita una URL real, no se puede programar
antes), habilita el job en `pg_cron` desde el SQL editor de Supabase o vía
MCP:

```sql
select cron.schedule(
  'weekly-ai-content-drafts',
  '30 11 * * 1', -- 08:30 America/Santiago ≈ 11:30 UTC — verificar el offset vigente (Chile tiene horario de verano)
  $$
  select net.http_post(
    url := 'https://agente.pessaro.cl/api/cron/generate-weekly-drafts',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET'))
  );
  $$
);
```

Guarda `CRON_SECRET` en Supabase Vault con ese mismo nombre, y en las
variables de entorno de Vercel.

**Caveat de duración**: con ~7 asesores generando secuencialmente, el job
puede acercarse al límite de 60s de Vercel Hobby. La ruta ya declara
`export const maxDuration = 300`, pero eso solo tiene efecto en planes que lo
permiten (Pro o superior). Si el número de asesores crece, considera batchear
o mover a un plan que soporte funciones más largas.

**Monitoreo**: como Supabase Cron no tiene reintentos ni alertas nativas, el
panel (`/dashboard`) muestra una alerta a los `super_admin` si no se detectó
ningún borrador `source='cron'` para la semana en curso pasada la ventana de
revisión (09:30 hrs).

## Flujo de aprobación

Ver `lib/content/transitions.ts` para la máquina de estados completa
(sección 5 del meta-prompt). RLS controla *quién* puede tocar cada fila;
la legalidad de cada transición de estado se valida en la Server Action
antes de emitir el `UPDATE` (doble validación exigida en la sección 4).
