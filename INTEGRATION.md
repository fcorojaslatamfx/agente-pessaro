# Integración futura con el CRM de Pessaro

Este documento describe cómo embeber el AI Content Agent dentro del CRM
(`pessaro.cl`, repo `fcorojaslatamfxs/pessaro_CL`) en la Fase 2, según la
sección 10 del meta-prompt. **No se implementa ahora** — es la guía para
cuando se decida unificar.

## Por qué es simple

La base de datos y el auth ya son compartidos desde el día uno
(`ldlflxujrjihiybrcree`, mismo `auth.users`). No hay migración de datos ni
remapeo de UUIDs pendiente: integrar es un cambio de **capa de aplicación**,
no de datos.

## Pasos

1. **Copiar el módulo**: mover `app/(app)/*`, `lib/auth/`, `lib/content/`,
   `lib/anthropic/`, `lib/compliance/`, `lib/supabase/` al repo del CRM,
   como una carpeta autocontenida (por ejemplo `src/modules/ai-content-agent/`
   si el CRM usa una estructura distinta a la de este scaffold).
2. **Montar la ruta protegida**: usar el patrón `ProtectedRoute` que ya
   existe en el CRM para envolver las páginas del módulo, en vez del guard
   propio de este repo (`app/(app)/layout.tsx` → `requireAgentAccess()`).
   La lógica de permisos (`lib/auth/permissions.ts`) es portable tal cual —
   no depende de nada específico de este scaffold, solo de `auth.uid()` y
   las tablas reales (`user_profiles`, `crm_staff_profiles`,
   `ai_content_permissions`).
3. **Variables de entorno**: el CRM necesita agregar `ANTHROPIC_API_KEY` y
   `CRON_SECRET` a sus propias variables de entorno de Vercel. Las de
   Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) probablemente ya existen si el CRM corre
   contra el mismo proyecto — reusar, no duplicar.
4. **Las tablas `ai_content_*`, las Edge Functions/Route Handlers y el cron
   no se tocan** — ya viven en el Supabase compartido. Si el deploy se
   unifica, el Route Handler del cron (`app/api/cron/generate-weekly-drafts`)
   se porta al proyecto del CRM y se actualiza la URL en el job de
   `pg_cron` (`cron.schedule` con el nuevo dominio).
5. **Navegación**: agregar el módulo al menú/sidebar del CRM, condicionado a
   `profile.canAccessAgent` (mismo criterio que usa este scaffold en
   `app/(app)/layout.tsx`).
6. **Convivencia temporal**: `agente.pessaro.cl` puede seguir activo como
   acceso directo mientras ambos conviven, sin conflicto — comparten datos,
   no código ni deploy.

## Qué NO cambia

- Esquema de base de datos y políticas RLS.
- Vocabulario de roles (sigue siendo `asesor`/`interno`/`super_admin` +
  flags de `ai_content_permissions`, sin roles nuevos).
- El system prompt de generación (`lib/anthropic/systemPrompt.ts`).
- La máquina de estados de aprobación (`lib/content/transitions.ts`).
