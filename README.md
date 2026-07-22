# Pessaro AI Content Agent

Aplicación web que genera borradores de contenido financiero/geopolítico para
Pessaro Capital (blog SEO + LinkedIn + Instagram + Facebook, con brief visual
y generación de imágenes por IA) a través de Claude, con un flujo de
aprobación editorial por roles antes de publicar. Nació como un proyecto
Next.js independiente (deploy propio en `agente.pessaro.cl`) pero comparte
desde el día uno la base de datos y el sistema de autenticación de
producción del CRM de Pessaro (`pessaro_CL`, proyecto Supabase
`ldlflxujrjihiybrcree`) — no hay usuarios ni esquema propios que migrar.

El proyecto avanzó por fases: la Fase 1 (MVP) cubre generación, revisión y
aprobación manual; la Fase 2 sumó un `design_brief` de nivel director de
arte, generación de imágenes con Leonardo.ai y un rediseño de UX alineado a
la identidad visual de `pessaro.cl`; la Fase 2.B (la más reciente) conecta
la publicación real en redes sociales a través de **Postiz Cloud**. El
detalle funcional completo de cada fase vive en los `meta_prompt_*.md` de
este repo.

## Stack tecnológico

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + RLS + Auth) — proyecto de producción compartido
  con el CRM de Pessaro, no uno propio
- **Anthropic API (Claude)** — generación de contenido (`@anthropic-ai/sdk`)
- **Leonardo.ai** — generación de imágenes a partir del `design_brief`
- **Postiz Cloud** — publicación en LinkedIn/Instagram/Facebook (ver más abajo)
- **Supabase Cron** (`pg_cron` + `pg_net`) — generación semanal automática de borradores
- Deploy: **Vercel**

## Estructura de carpetas clave

```
app/
  (app)/            páginas protegidas: dashboard, generate, review/[id],
                     history, calendar, settings/connections, admin/permissions
  api/
    generate/            genera un borrador de contenido (Claude)
    generate-image/      genera la imagen del brief (Leonardo.ai)
    cron/generate-weekly-drafts/   job semanal protegido por CRON_SECRET
    postiz/test-connection/        healthcheck de la integración con Postiz
  login/
components/ui/       Button, Card, Input, StatusBadge, Skeleton, EmptyState
lib/
  supabase/{server,client,admin}.ts   clientes Supabase (SSR/browser/service-role)
  auth/{dal,permissions}.ts           sesión y permisos sobre roles reales del CRM
  anthropic/                          cliente Claude + system prompt + parseo de salida
  leonardo/                           cliente y generación de imágenes
  postiz/                             cliente, integraciones, publicación, verificación de estado
  content/                            tipos, máquina de estados de aprobación, Server Actions
  compliance/validate.ts              validación de compliance server-side
proxy.ts             refresco de sesión Supabase (reemplaza a middleware.ts en Next 16)
supabase/migrations/ 8 migraciones aditivas `ai_content_*` (permisos, requests,
                     outputs, assets, calendar, conexiones sociales, publicaciones,
                     mapeo a Postiz)
```

## Cómo correr en desarrollo

```bash
npm install
cp .env.local.example .env.local   # completar variables, ver sección de abajo
npm run dev                        # http://localhost:3000
```

Otros scripts disponibles: `npm run build`, `npm run start`, `npm run lint`.

No hay registro propio: hace falta iniciar sesión con un usuario real que ya
exista en `auth.users` del CRM, y un `super_admin` debe activarle
`can_access_agent` desde **Permisos** (`/admin/permissions`) para que el
módulo sea visible.

### ⚠️ Regla no negociable sobre la base de datos

El proyecto Supabase (`ldlflxujrjihiybrcree`) es **producción viva** del CRM
(~90 tablas con datos reales de clientes, WhatsApp, campañas). Toda migración
en `supabase/migrations/` debe ser **aditiva únicamente**
(`create table if not exists`, `create policy`, `create function`) — nunca
`alter`/`drop`/`truncate`/`update` sobre tablas existentes del CRM. Las
tablas nuevas usan siempre el prefijo `ai_content_` con RLS habilitado desde
su primera migración, y `user_profiles`/`crm_teams`/`crm_staff_profiles`/
`auth.users` son de solo lectura desde este repo.

## Integraciones externas

- **Anthropic (Claude)** — motor de generación de texto del borrador
  (blog/LinkedIn/Instagram/Facebook + brief visual). Cliente en
  `lib/anthropic/`.
- **Leonardo.ai** — genera la imagen real a partir del `design_brief`, vía el
  botón "Generar con IA" en `/review/[id]`. Requiere `LEONARDO_API_KEY` y
  `LEONARDO_MODEL_ID`.
- **Postiz Cloud** — publica el contenido aprobado en LinkedIn, Instagram y
  Facebook sin que este proyecto custodie tokens OAuth (Postiz los guarda;
  aquí solo se persiste el `integration.id` por asesor/plataforma). Flujo:
  conectar cuentas en el panel de Postiz → vincularlas en
  `/settings/connections` → "Publicar ahora" en `/review/[id]`. El detalle de
  arquitectura, endpoints usados y los pasos pendientes para activarlo en
  producción están en **`INTEGRATION.md`** (no se duplican aquí).
- **CRM de Pessaro (`pessaro_CL`)** — no es una integración por API sino de
  base de datos: mismo proyecto Supabase y mismo `auth.users`. `INTEGRATION.md`
  también documenta cómo se embebería este módulo dentro del CRM más adelante.

## Estado actual / en desarrollo

Según el historial reciente, la Fase 2.B (publicación en RRSS vía Postiz)
está implementada de punta a punta:

- Publicación end-to-end funcionando contra Postiz Cloud (cliente,
  integraciones, Server Actions de publicación, verificación de estado).
- Migración `0008` aplicada: mapeo de conexiones sociales al
  `integration.id` de Postiz.
- Tokens y efectos de marca (colores, tipografía, animaciones hover) portados
  desde `pessaro_CL` a los componentes UI compartidos (`Card`, `Button`, nav).
- `INTEGRATION.md` actualizado para reflejar que Postiz Cloud ya trae sus
  propias apps de Meta/LinkedIn aprobadas, eliminando la necesidad de que
  este proyecto pase su propio App Review.

**Pendiente (bloqueado en pasos manuales de Francisco, no de código):** crear
la cuenta de Postiz Cloud, generar su API key, conectar ahí las cuentas
sociales reales y vincularlas en `/settings/connections`. Ver el detalle paso
a paso en `INTEGRATION.md`.

## Variables de entorno

Definidas en `.env.local.example`:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Proyecto Supabase compartido con el CRM (`ldlflxujrjihiybrcree`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor, usada por el cron. Nunca prefijar con `NEXT_PUBLIC_` |
| `ANTHROPIC_API_KEY` | Generación de contenido con Claude |
| `CRON_SECRET` | Protege el endpoint del cron semanal (`Authorization: Bearer ...`) |
| `LEONARDO_API_KEY` / `LEONARDO_MODEL_ID` | Generación de imágenes (Fase 2) |
| `POSTIZ_API_KEY` / `POSTIZ_API_URL` | Publicación en RRSS (Fase 2.B). `POSTIZ_API_URL` solo hace falta si se autohospeda Postiz; vacío = Postiz Cloud |

## Más documentación

- `INTEGRATION.md` — arquitectura de la integración con Postiz (endpoints,
  manejo de estado async, pasos pendientes) y plan de embebido futuro de este
  módulo en el CRM `pessaro_CL`.
- `meta_prompt_*.md` — especificación funcional completa de cada fase (Fase
  1, Fase 2, Fase 2.B), tal como se le entregó a Claude Code para
  construirlas.
- `AGENTS.md` / `CLAUDE.md` — instrucciones para agentes de IA que trabajen
  en este repo (hoy señalan que Next.js 16 tiene cambios respecto al
  conocimiento de entrenamiento; conviene revisar `node_modules/next/dist/docs/`
  antes de tocar rutas o convenciones nuevas).
