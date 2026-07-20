# META PROMPT PARA CLAUDE CODE — Fase 2: Publicación directa en RRSS + imágenes reales

## Contexto

Continúa sobre el proyecto `agente-pessaro` (Next.js 16 App Router, Supabase `ldlflxujrjihiybrcree`, ya en producción en `agente.pessaro.cl`). La Fase 1 (generación, revisión, aprobación, copiado manual) ya funciona en producción. Esta Fase 2 agrega:

1. **Upgrade del `design_brief` a nivel de director de arte profesional** — el brief actual es demasiado pobre y produce resultados genéricos (ya probado con Canva: composiciones repetitivas, poca dirección). Ver sección 0.
2. **Generación de imágenes reales** a partir del `design_brief` usando el conector de **Canva** ya disponible, y **Leonardo.ai** como motor alternativo de generación.
3. **Rediseño de la UX** del agente para alinearla con la identidad visual del sitio `pessaro.cl` — hoy se ve inacabada. Ver sección 6.
4. **Publicación directa** en LinkedIn (perfil personal por asesor) e Instagram (cuenta Business/Creator por asesor), y en la **Página de Facebook corporativa** de Pessaro — nunca en perfiles personales de Facebook, ver restricción abajo.

**No implementar publicación automática sin aprobación humana previa.** Solo contenido en estado `approved` o `ready_to_publish` puede mostrar el botón "Publicar ahora"; sigue habiendo un clic explícito del usuario, no publicación silenciosa por cron.

## 0. Upgrade del `design_brief` — de nota genérica a brief de director de arte

El bloque `design_brief` del system prompt de Fase 1 debe reemplazarse. El agente debe actuar como **Director de Arte senior de una firma financiera premium**, escribiendo briefs que un diseñador humano, Canva o un modelo generativo (Leonardo.ai) puedan ejecutar sin ambigüedad. Reemplaza el objeto `design_brief` del JSON de salida por esta estructura ampliada:

```json
"design_brief": {
  "concepto_creativo": "La idea central en una frase — qué emoción/mensaje debe transmitir la pieza, no solo qué mostrar",
  "composicion": "Descripción precisa del layout: jerarquía visual, regla de tercios, dónde va el titular, dónde el elemento gráfico, dónde el logo, espacios negativos, punto focal",
  "estilo_visual": "Referencia de estilo concreta (ej: 'editorial financiero tipo The Economist', 'flat illustration minimalista', 'fotografía corporativa con overlay de color', 'data-viz elegante'). Evitar 'moderno y profesional' — eso no dirige nada",
  "tipografia": "Jerarquía tipográfica: titular (peso, tamaño relativo, color), subtítulo, texto de apoyo. Serif elegante para titulares financieros, sans-serif limpia para apoyo",
  "paleta": {
    "primario": "#0d2350 (navy Pessaro)",
    "acento": "#2563EB (azul corporativo)",
    "complementarios": "blanco, gris claro #F5F5F5",
    "proporcion": "regla 60-30-10: dominante/secundario/acento"
  },
  "texto_grafica": "Texto EXACTO que va en la pieza, con saltos de línea indicados",
  "elementos_graficos": "Íconos, gráficos de datos, ilustraciones o texturas específicas a incluir, con su tratamiento (ej: 'gráfico de línea ascendente estilizado, trazo 3px, con gradiente navy→azul')",
  "que_evitar": "Negative prompt explícito: sin fotos de stock genéricas, sin rostros reales de figuras públicas, sin logos de terceros (Fed, bancos), sin clip-art, sin gradientes arcoíris, sin exceso de elementos",
  "prompt_leonardo": "Prompt en inglés listo para pegar en Leonardo.ai/modelo generativo, redactado con la técnica de prompting de imagen (sujeto + estilo + composición + iluminación + calidad), incluyendo '--no' o negative prompt según el motor",
  "formatos": {
    "linkedin_feed": "1200x627 px (exportar 2x: 2400x1254)",
    "linkedin_carrusel": "1080x1350 px (exportar 2x: 2160x2700)",
    "instagram_feed": "1080x1350 px vertical o 1080x1080 px cuadrado (exportar 2x: 2160x2700 / 2160x2160)",
    "instagram_stories_reels": "1080x1920 px (exportar 2x: 2160x3840 — UHD vertical)",
    "facebook_feed": "1200x630 px (exportar 2x: 2400x1260)",
    "blog_hero": "1920x1080 px (exportar UHD: 3840x2160)"
  },
  "formato_principal": "cuál de los formatos anteriores es el prioritario para esta pieza según la plataforma principal"
}
```

Reglas adicionales para el system prompt:
- Los briefs deben ser lo suficientemente específicos como para que dos ejecuciones distintas del mismo brief produzcan piezas reconociblemente similares. Si el brief admite interpretaciones muy distintas, está mal escrito.
- **Exportación siempre a 2x del tamaño nominal** (las plataformas comprimen; partir de alta resolución preserva nitidez). Para blog y cualquier uso donde se pida UHD, exportar 3840x2160.
- El `prompt_leonardo` debe generarse SIEMPRE, aunque el usuario use Canva — es el fallback y permite comparar resultados entre motores.
- Mantener las restricciones de compliance visuales: nunca rostros reales de figuras públicas sin licencia, nunca logos de instituciones (Federal Reserve, bancos, reguladores) — usar representaciones estilizadas/abstractas.

## Restricción NO NEGOCIABLE — Facebook

Meta prohíbe por política publicar en perfiles personales de Facebook vía API desde 2018, sin excepción ni proceso de aprobación que lo habilite. **No intentes implementar esto ni busques workarounds.** El alcance real:
- Facebook: **solo la Página corporativa de Pessaro** (una sola conexión, gestionada por super_admin, no por asesor).
- El Facebook personal de cada asesor sigue siendo copiar-y-pegar manual (ya construido en Fase 1) — no cambia.

## Prerrequisito de plataforma — App Review de Meta

Antes de que cualquier publicación funcione en Instagram o en la Página de Facebook, Pessaro necesita:
1. Una app registrada en developers.facebook.com.
2. Pasar **App Review** de Meta para los permisos `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`. Esto lo hace un humano (Francisco), no Claude Code — puede tardar días a semanas y requiere evidencia de uso (screencast, política de privacidad pública, términos de uso).
3. Para LinkedIn: acceso al **Marketing Developer Platform** con el scope `w_member_social`, también sujeto a aprobación de LinkedIn.

**Instrucción para Claude Code:** construye toda la infraestructura (OAuth flow, almacenamiento de tokens, botones de publicar) de modo que funcione en cuanto Francisco obtenga las aprobaciones — pero el flujo debe degradar con gracia (mostrar "Conexión pendiente de aprobación de la plataforma") si las apps de Meta/LinkedIn aún no están aprobadas. No bloquees el resto del desarrollo esperando esas aprobaciones.

## 1. Generación de imágenes — Canva + Leonardo.ai

**Canva (conector ya disponible):**
- Nuevo flujo: cuando se aprueba un contenido, botón "Generar imagen en Canva" que toma el `design_brief` completo (concepto, composición, estilo, tipografía, paleta, texto exacto) y crea el diseño vía el conector.
- Si Pessaro tiene una **Brand Template** en Canva con la identidad de marca ya definida, usa `create-design-from-brand-template` — pregúntale a Francisco si existe; si no, usa `generate-design` con el brief completo.
- Usa `resize-design` para generar las variantes por plataforma desde un mismo diseño (feed, stories, blog hero) en vez de generar cada tamaño desde cero.
- Exporta con `export-design` en PNG a la resolución 2x indicada en `formatos`; guarda cada variante en `ai_content_assets` (una fila por formato: `asset_type`, `width`, `height`, `image_url`/`storage_path`).

**Leonardo.ai (motor generativo alternativo):**
- Integra la API de Leonardo.ai (https://docs.leonardo.ai) como segunda opción: botón "Generar con IA (Leonardo)" que envía el campo `prompt_leonardo` del brief.
- La API key de Leonardo va en variable de entorno server-only (`LEONARDO_API_KEY`), el llamado ocurre en un Route Handler — misma disciplina de seguridad que con Anthropic.
- Modelo sugerido: Phoenix o el vigente de mejor calidad para diseño gráfico/ilustración; solicita las dimensiones del `formato_principal` (o la más cercana soportada, con crop posterior).
- Muestra las imágenes candidatas generadas (Leonardo devuelve varias) y deja al usuario elegir cuál guardar en `ai_content_assets`.
- Francisco debe crear la cuenta y proveer la API key — pídesela cuando llegues a este paso, no la inventes.

**Común a ambos motores:**
- Preview visible antes de aprobar la publicación, con opción de regenerar.
- Cada asset guarda su origen (`source: 'canva' | 'leonardo'`) y el prompt/brief usado, para trazabilidad y aprendizaje de qué motor funciona mejor por tipo de pieza.

## 2. Esquema de datos — nuevas tablas (aditivas, prefijo `ai_content_`)

```
ai_content_social_connections
  - id, user_id (→ auth.users, nullable si es la conexión corporativa)
  - platform ('linkedin' | 'instagram' | 'facebook_page')
  - platform_account_id (ID de la cuenta/página en la plataforma)
  - access_token (ENCRIPTADO — ver sección de seguridad)
  - refresh_token (ENCRIPTADO, si la plataforma lo usa)
  - token_expires_at
  - connected_at, connected_by
  - status ('active' | 'expired' | 'revoked' | 'pending_review')

ai_content_publications
  - id, output_id (→ ai_content_outputs)
  - social_connection_id (→ ai_content_social_connections)
  - platform
  - published_at, platform_post_id, platform_post_url
  - status ('pending' | 'published' | 'failed')
  - error_message (si falló)
```

RLS: cada usuario solo ve/gestiona sus propias conexiones (`user_id = auth.uid()`); la conexión de la Página de Facebook corporativa (`user_id null`) solo la gestiona `super_admin`.

## 3. Seguridad — tokens OAuth (CRÍTICO, dado el incidente de hoy)

Después de lo que pasó hoy con la secret key expuesta, sé extremadamente cuidadoso aquí:

- **Nunca** almacenes `access_token`/`refresh_token` en texto plano en una columna normal accesible por el cliente.
- Usa **Supabase Vault** para encriptar estos valores, o al menos una columna con `pgsodium`/encriptación a nivel de aplicación, nunca expuesta vía la API REST pública (RLS estricto + estos campos JAMÁS se seleccionan en queries desde el cliente; solo se leen server-side en el Route Handler que hace el POST a la plataforma).
- El intercambio OAuth (code → token) debe ocurrir **enteramente server-side** (Route Handler), nunca en el navegador.
- Verifica con `grep` antes de cada commit que ningún token de prueba quede hardcodeado.

## 4. Flujo de conexión OAuth (por asesor, LinkedIn e Instagram)

1. Asesor va a una nueva página `/settings/connections`.
2. Botón "Conectar LinkedIn" / "Conectar Instagram" → redirige al flujo OAuth de la plataforma.
3. Callback en `/api/oauth/[platform]/callback` — server-side, intercambia el código por tokens, los guarda encriptados en `ai_content_social_connections`.
4. Si la app de Pessaro aún no tiene App Review aprobado, la plataforma limitará quién puede autorizar (generalmente solo "testers" agregados manualmente en el panel de developers) — documenta esto para que Francisco sepa que debe agregar testers mientras la app está en revisión.

## 5. Botón "Publicar ahora"

- Solo visible cuando el `ai_content_output` está en estado `approved` o `ready_to_publish` Y el usuario tiene una `ai_content_social_connections` activa para esa plataforma.
- Al hacer clic: Route Handler server-side hace el POST a la API de la plataforma correspondiente (LinkedIn UGC Post API / Instagram Content Publishing API / Facebook Page Post API), adjuntando la imagen generada en Canva si existe.
- Guarda el resultado en `ai_content_publications`, actualiza el estado del output a `published`.
- Maneja errores de la plataforma con gracia (token expirado → pedir reconexión; rate limit → reintentar más tarde; contenido rechazado por la plataforma → mostrar el motivo).

## 6. Rediseño UX — alinear con la identidad de pessaro.cl

La UI actual del agente se ve inacabada (formularios y tarjetas genéricas sin identidad). Debe sentirse parte del ecosistema Pessaro:

1. **Antes de escribir CSS, inspecciona el sitio real:** haz fetch de `https://pessaro.cl` (y `https://pessarocapital.com` si aporta) y extrae su lenguaje visual: paleta exacta, tipografías (familia, pesos), estilo de botones (radios, sombras, estados hover), espaciados, estilo de tarjetas y navegación, modo claro/oscuro.
2. **Crea un sistema de diseño mínimo** en el proyecto (tokens en Tailwind config o CSS variables): colores de marca, tipografía, radios, sombras, espaciado — y refactoriza TODAS las vistas existentes (login, panel, generar, revisión, historial, calendario, permisos) para usarlo consistentemente.
3. Estándar de calidad concreto: un usuario que llegue desde `pessaro.cl` a `agente.pessaro.cl` no debe notar un salto de calidad ni de identidad — misma sensación de producto premium financiero.
4. Detalles que hoy faltan y deben incluirse: estados de carga (skeletons durante la generación, que toma varios segundos), estados vacíos con ilustración/guía, feedback visual al copiar ("Copiado ✓"), jerarquía tipográfica clara en la vista de revisión (hoy todo pesa igual), y responsive correcto en móvil (los asesores revisarán desde el teléfono).
5. La vista de revisión debe mostrar el preview de la imagen generada junto al copy de cada plataforma, simulando aproximadamente cómo se verá el post (mini-mockup por plataforma).

## Orden de implementación sugerido

1. **Upgrade del system prompt** con el nuevo `design_brief` (sección 0) — es solo actualizar la constante y el parseo; impacto inmediato en calidad.
2. **Rediseño UX** (sección 6) — inspeccionar pessaro.cl, sistema de diseño, refactor de vistas.
3. Esquema de datos de Fase 2 (tablas + RLS) — aditivo, probado en local primero.
4. Integración Canva mejorada + Leonardo.ai para generación de imágenes (no depende de aprobaciones externas).
5. Flujo OAuth y almacenamiento seguro de tokens para LinkedIn e Instagram.
6. Conexión de la Página de Facebook corporativa (una sola, gestionada por super_admin).
7. Botón "Publicar ahora" con manejo de errores por plataforma.
8. Documentar en `INTEGRATION.md` qué necesita Francisco hacer manualmente (apps en developers.facebook.com y LinkedIn, App Review, testers, cuenta y API key de Leonardo.ai).

## Reglas

- Sigue las reglas de producción compartida del meta prompt original (migraciones solo aditivas, RLS obligatorio, no tocar tablas del CRM).
- No implementes NINGÚN mecanismo que publique sin que un humano haga clic explícito en "Publicar ahora" para esa pieza específica.
- Reporta antes de cada paso que dependa de credenciales externas (Meta App ID/Secret, LinkedIn Client ID/Secret) — esas las provee Francisco, no las inventes ni uses placeholders que puedan confundirse con reales.
