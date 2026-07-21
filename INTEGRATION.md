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

## Fase 2 — Pendientes de Francisco

El primer pase de Fase 2 (design_brief ampliado, rediseño UX, esquema de
conexiones sociales, generación de imágenes con Leonardo.ai) ya está
implementado. Estos pasos requieren datos reales que solo Francisco puede
proveer — nadie los inventó ni se dejaron placeholders que puedan
confundirse con credenciales reales:

- **Leonardo.ai** (desbloquea el botón "Generar con IA (Leonardo)" en
  `/review/[id]`, ya construido): crear cuenta en leonardo.ai, generar una
  API key, y confirmar en el dashboard el `modelId` vigente de mejor calidad
  para diseño gráfico/ilustración (ej. Phoenix — no se hardcodeó a ciegas
  porque los modelos cambian). Agregar `LEONARDO_API_KEY` y
  `LEONARDO_MODEL_ID` en Vercel (Production y Preview) y en `.env.local`
  para desarrollo. Sin esto, el Route Handler responde con un estado claro
  de "no configurado" en vez de fallar oscuro.
- **Canva Connect API** (diseñado, no implementado todavía): registrar una
  Canva Integration en el Developer Portal de Canva y obtener Client
  ID/Secret. Confirmar si existe una Brand Template de Pessaro ya definida
  en Canva (determina si el flujo usa `create-design-from-brand-template` o
  `generate-design`). El "conector ya disponible" de las sesiones de Claude
  Code es una integración MCP personal — no es invocable por la app en
  producción, por eso este paso sigue pendiente.
- **App de Meta + App Review**: registrar una app en developers.facebook.com
  y pasar App Review para los permisos `pages_manage_posts`,
  `instagram_basic`, `instagram_content_publish`. Proceso humano, puede
  tardar días a semanas y requiere evidencia de uso (screencast, política de
  privacidad pública, términos de uso). Desbloquea: conexión de la Página de
  Facebook corporativa y publicación en Instagram.
- **LinkedIn Marketing Developer Platform**: solicitar acceso con el scope
  `w_member_social`, también sujeto a aprobación de LinkedIn. Desbloquea:
  conexión OAuth de LinkedIn por asesor y el botón "Publicar ahora" contra
  la UGC Post API.

Las tablas `ai_content_social_connections`/`ai_content_publications` y sus
políticas RLS ya existen en producción (migraciones `0006`/`0007`), listas
para cuando lleguen estas credenciales.

- ~~**App de Meta + App Review**~~ / ~~**LinkedIn Marketing Developer
  Platform**~~: **superados por la decisión de Fase 2.B (ver abajo)**.
  Postiz Cloud ya tiene sus propias apps de Meta/LinkedIn aprobadas —
  agente-pessaro ya no necesita registrar las suyas ni pasar App Review.

## Fase 2.B — Publicación vía Postiz Cloud

Implementado (ver `meta_prompt_fase2b_postiz_ux.md` para el detalle de
diseño): `lib/postiz/*` (cliente, integraciones, publicación, verificación
de estado), `lib/content/social-actions.ts` y `lib/content/publish-actions.ts`,
la página `/settings/connections`, y el bloque "Publicar en RRSS" en
`/review/[id]` cuando el contenido está `ready_to_publish`/`published`.
Migración `0008` (aditiva) ya aplicada en producción: agrega
`postiz_integration_id` a `ai_content_social_connections` y marca como
deprecados los campos de token crudo de la migración 0006 (Postiz custodia
el token real, no nosotros).

**Pendientes de Francisco para activar el flujo real:**

1. **Cuenta de Postiz Cloud**: crear cuenta en postiz.com (u organización
   existente), revisar sus términos comerciales (aplican al usar su nube en
   vez de self-host).
2. **API key**: generarla desde el panel de Postiz Cloud y agregar
   `POSTIZ_API_KEY` en Vercel (Production y Preview) y en `.env.local` para
   desarrollo. Sin esto, `/settings/connections` y "Publicar ahora" responden
   con un error claro de configuración en vez de fallar oscuro
   (`PostizNotConfiguredError`, ver `lib/postiz/client.ts`).
3. **Conectar las cuentas sociales en Postiz** (no en agente-pessaro): cada
   asesor conecta su LinkedIn personal desde el panel de Postiz Cloud;
   Francisco (o quien administre la cuenta corporativa) conecta la Página de
   Facebook e Instagram Business. El OAuth ocurre 100% del lado de Postiz.
4. **Vincular el canal al usuario del agente**: una vez conectado en Postiz,
   cada asesor entra a `/settings/connections` en agente-pessaro y hace clic
   en "Vincular a mi cuenta" sobre su canal — eso guarda el
   `postiz_integration_id`. La Página de Facebook la vincula un
   `super_admin` como conexión corporativa (`user_id` null).
5. **Verificar el primer post real**: usar `GET /api/postiz/test-connection`
   (super_admin) para confirmar que la API key lista los canales, y luego
   probar "Publicar ahora" con un borrador de prueba antes de anunciarlo al
   equipo.

**Nota de diseño no trivial**: la respuesta de `POST /public/v1/posts` en
Postiz solo entrega su `postId` interno — la publicación real corre async
vía su orquestador (Temporal), así que `ai_content_publications.status`
queda en `'pending'` justo después del clic, no `'published'`. El estado
real (URL final, error de la plataforma) se resuelve con
`lib/postiz/status.ts::checkPostizPostStatus()`; todavía no hay una UI que
lo llame automáticamente — es el primer candidato de mejora de esta fase si
se necesita confirmación visible sin ir al panel de Postiz.
