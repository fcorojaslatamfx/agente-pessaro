-- AI Content Agent — Fase 2.B: mapeo de conexiones a Postiz Cloud.
--
-- Decisión (meta_prompt_fase2b_postiz_ux.md): Postiz Cloud custodia los
-- tokens OAuth de Meta/LinkedIn. agente-pessaro ya no los guarda — solo
-- referencia el `integration.id` que Postiz genera cuando el asesor conecta
-- su cuenta en el panel de Postiz. Los campos de la migración 0006
-- (access_token_secret_id / refresh_token_secret_id / token_expires_at)
-- quedan DEPRECADOS para conexiones vía Postiz: nunca se vuelven a escribir.
-- No se eliminan (regla de solo-aditivo de este proyecto).

alter table ai_content_social_connections
  add column if not exists postiz_integration_id text;

comment on column ai_content_social_connections.postiz_integration_id is
  'ID de la integración/canal en Postiz Cloud (GET /public/v1/integrations). Reemplaza el flujo OAuth propio: Postiz custodia el token real.';

comment on column ai_content_social_connections.access_token_secret_id is
  'DEPRECADO desde Fase 2.B — Postiz Cloud custodia el token real. No escribir en conexiones nuevas.';

comment on column ai_content_social_connections.refresh_token_secret_id is
  'DEPRECADO desde Fase 2.B — ver access_token_secret_id.';
