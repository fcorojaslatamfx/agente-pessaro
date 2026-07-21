# META PROMPT PARA CLAUDE CODE — Fase 2.B: Publicación vía Postiz Cloud + UX del repo pessaro_CL

## Contexto y decisión tomada

Continúa sobre `agente-pessaro` (Next.js 16, Supabase `ldlflxujrjihiybrcree`, producción en `agente.pessaro.cl`). Ya exploraste la integración con Postiz y tu veredicto fue usar su **API pública REST** (no MCP, no webhooks). Francisco decidió: **Postiz Cloud** (no self-host). Los archivos base ya existen y compilan limpio:

- `lib/postiz/client.ts` — wrapper fetch con `POSTIZ_API_KEY`/`POSTIZ_API_URL`
- `lib/postiz/integrations.ts` — `listPostizIntegrations()`
- `app/api/postiz/test-connection/route.ts` — endpoint de prueba (solo lectura, super_admin)

Esta fase completa esa integración de punta a punta y aplica el ajuste de UX pendiente.

## Arquitectura de publicación con Postiz Cloud

**Principio central (tu propio hallazgo, confirmado):** Postiz custodia los tokens OAuth de Meta/LinkedIn; `agente-pessaro` solo guarda el `integration.id` por asesor/plataforma. Esto elimina la necesidad de custodiar tokens crudos en Supabase Vault y de construir el manejo de OAuth/refresh.

1. **Simplifica `ai_content_social_connections`** (migración aditiva): agrega columna `postiz_integration_id`; los campos `access_token`/`refresh_token`/`token_expires_at` quedan sin uso para conexiones vía Postiz (no los elimines — regla de solo-aditivo — pero documenta que quedan deprecados y jamás se escriben).
2. **Flujo de conexión del asesor:** las cuentas sociales se conectan en el panel de Postiz Cloud (OAuth ocurre allá). En `agente-pessaro`, la página `/settings/connections` lista las integraciones disponibles vía `listPostizIntegrations()` y permite al asesor (o super_admin) **mapear** cada integración de Postiz a su usuario del agente (guardando `postiz_integration_id` + `platform` + `user_id`). Documenta en `INTEGRATION.md` el paso manual: cada asesor conecta sus cuentas en Postiz primero.
3. **"Publicar ahora":** al hacer clic sobre contenido `approved`/`ready_to_publish`, un Route Handler server-side llama a la API de Postiz para crear el post **inmediato** (no programado) en la integración mapeada, adjuntando la imagen del asset si existe (súbela a Postiz vía su endpoint de upload primero si su API lo requiere). Registra resultado en `ai_content_publications` (guarda el id del post en Postiz y la URL si la devuelve; `status`, `error_message` en fallos).
4. **Publicación programada (opcional, si la API lo permite trivialmente):** ofrecer también "Programar" con fecha/hora, delegando el scheduling a Postiz. Si agrega complejidad, déjalo para después — publicar-ahora es el MVP.
5. **Restricciones de plataforma NO cambian con Postiz:** Facebook personal sigue prohibido por Meta (Postiz no lo evade — solo Páginas); Instagram requiere Business/Creator. No intentes workarounds.
6. **Secretos:** `POSTIZ_API_KEY` solo server-side (nunca `NEXT_PUBLIC_`), en Vercel y `.env.local`. Francisco provee la key desde su cuenta de Postiz Cloud — pídesela, no uses placeholders confundibles con reales.
7. **Manejo de errores:** integración de Postiz desconectada/expirada → mensaje claro "Reconecta tu cuenta en Postiz" con link; rate limit → informar y permitir reintento; respuesta de error de la plataforma → mostrar el motivo tal cual lo entregue Postiz.

## UX — fuente de verdad: el repositorio pessaro_CL

Ajuste sobre lo hecho antes: los tokens de diseño deben extraerse del **código fuente real** del sitio, no de scraping del sitio desplegado. Repo: `https://github.com/fcorojaslatamfx/pessaro_CL` (Francisco te dará acceso si es privado; si es público, clónalo directo).

1. Clona/lee el repo y extrae de su código: `tailwind.config.*` / `globals.css` / tokens de tema (paleta exacta con nombres de variables), tipografías (familias, pesos, imports), y **los efectos**: transiciones, hovers, sombras, gradientes, animaciones (busca `transition`, `animate`, `keyframes`, `hover:`, `backdrop-`, `shadow-` en sus componentes).
2. Compara con los tokens que ya aplicaste en `app/globals.css` (extraídos del sitio vivo): donde difieran, **gana el repo** — es la fuente canónica de la marca. Corrige paleta, tipografía y radios en el design system del agente para que coincidan variable por variable.
3. Replica los efectos característicos del sitio (hovers de botones y cards, transiciones de navegación, gradientes de fondo si los usa) en los componentes `components/ui/` del agente. El estándar: pasar de `pessaro.cl` a `agente.pessaro.cl` no debe sentirse como cambiar de producto.
4. Verifica el resultado visual en el navegador en `/login` y, hasta donde puedas sin credenciales, en las vistas públicas; deja capturas o descripción de lo verificado para que Francisco revise las vistas autenticadas.

## Disciplina de entrega (OBLIGATORIA — corrige la falla de la fase anterior)

En la fase anterior reportaste "implementation complete" sin haber hecho commit ni push: el deploy de producción quedó en el commit viejo mientras las migraciones ya estaban en producción. Eso no puede repetirse. En esta fase:

1. Al terminar cada bloque de trabajo: `git add` + `git commit` con mensaje descriptivo.
2. Al terminar la fase: `git push` a `main` y **verifica en Vercel** (vía MCP o CLI) que el deploy nuevo quedó en estado READY apuntando al commit recién pusheado, y que `agente.pessaro.cl` sirve el build nuevo.
3. También haz commit/push AHORA de todo el trabajo de la fase anterior que quedó sin subir (design system, design_brief, Leonardo, archivos de Postiz) — verifica `git status`/`git log` primero para confirmar que nada se perdió.
4. "Completado" significa: código en GitHub + deploy READY verificado + sin drift entre BD y app. No antes.

## Orden sugerido

1. Commit/push/deploy de TODO lo pendiente de la fase anterior (punto 3 de disciplina). Verificar que producción sirve el design system nuevo.
2. Migración aditiva `postiz_integration_id` + RLS.
3. `/settings/connections` con listado y mapeo de integraciones de Postiz.
4. "Publicar ahora" end-to-end (con upload de imagen si aplica).
5. UX desde el repo pessaro_CL (tokens + efectos), refactor donde difiera.
6. Actualizar `INTEGRATION.md`: pasos manuales de Francisco (cuenta Postiz Cloud, conectar cuentas sociales de cada asesor en Postiz, obtener API key; términos comerciales de Postiz Cloud aplican).
7. Commit, push, deploy verificado.

## Reglas permanentes

- Producción compartida: migraciones solo aditivas, RLS en todo lo nuevo, no tocar tablas del CRM.
- Nada se publica sin clic humano explícito en esa pieza.
- Ningún secreto en código, en `NEXT_PUBLIC_*`, ni en commits (el repo es público — verifica con grep antes de cada commit).
- Reporta hallazgos con evidencia; si algo del plan no calza con la API real de Postiz (endpoints/nombres pueden diferir), consulta su documentación oficial y adapta, informando el cambio.
