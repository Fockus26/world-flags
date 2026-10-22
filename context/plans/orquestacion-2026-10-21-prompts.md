# Tanda 2026-10-21 — arreglos de la QA de cierre (dos pasadas) · prompts

Base: `origin/main` @ 8ae7fda. Carpeta principal: `C:\Users\Cesar\Documents\Work\world-flags`.
Informe: `context/plans/qa-tanda-2026-10-20.md` (primera pasada sin base + "## Segunda pasada con base local (2026-10-21)"). Lee solo los hallazgos de tu unidad.

Reglas comunes: las de `orquestacion-2026-10-20b-prompts.md` › arriba (bun x, build + `astro preview`, a11y skill, puertas verdes, changeset de jugador, Conventional Commits, PR, nunca merge, no editar CURRENT_PHASE/CONTENT_CHECKLIST, informe final con PR/changeset/decisiones/verificado/no verificado/acciones/bugs de paso/kit feedback). Además:
- **Docker/Supabase local es único:** solo W11 lo levanta (`bun run qa:local -- --port 4304`). W8 puede usarlo **después** de que W11 lo pare; si no, verifica interceptando Supabase (recuerda `access-control-expose-headers: x-supabase-api-version` en los mocks). W9/W10 no lo necesitan.
- Para "texto al 200 %" usa CDP `Page.setFontSizes` (32/32 px), no CSS inyectado.
- Copy nuevo: provisional, marcado, y listado en tu informe.

## W8 — sesión y auth: errores reales, progreso de invitado, consola, foco, "Revisa tu correo" · `fix/auth-sesion-bordes` · D214 · patch · wt1 · 4301

Hallazgos:
1. **[Medio]** Un 5xx de Auth (503 con el contenedor de Auth parado) sale como "Sin conexión" con la red bien: auth-js trata 500–504/520–530 como fallo de red. `src/hooks/useAuth.ts:19,24`, `src/utils/auth-errors.ts:53`. Solo es "sin conexión" si `navigator.onLine === false` o `status === 0`; un 5xx da un mensaje de "el servicio no responde, prueba en un momento" (copy provisional).
2. **[Medio]** Tras "Se cerró tu sesión" el jugador sigue como invitado, juega (`jp`, `kr`) y al volver a entrar se repone lo pendiente de la cuenta encima y lo jugado como invitado se pierde sin aviso. `src/components/app/GameEffects.tsx:315` y `:379` (D210 `savePendingAccountData`/`restorePendingAccountData`, D056 `planSync`). Decide de forma conservadora: o fusionar lo jugado como invitado con lo pendiente de la misma cuenta (es el mismo jugador en el mismo dispositivo tras un cierre involuntario — **recomendado**), o como mínimo avisar con el snackbar de D212. Explica la elección y la alternativa en el PR. Test unitario que lo cubra.
3. **[Bajo]** `console.error` cuando el token rechazado se recupera solo: `GameEffects.tsx:579` y `src/utils/cloud-storage.ts:499` (`syncLeaderboardProfile`). Solo loguear si el reintento final falla.
4. **[Bajo]** Foco en `<body>` tras un login fallido (intermitente, 1 de 3). Formulario de `AuthSection.tsx`: el foco debe quedar en el campo marcado como inválido o en el botón; usa `focusIfLost` de `src/utils/focus.ts`. Repite 10 veces para dar por buena la corrección.
5. **[Medio]** Registro repetido con correo sin confirmar y otra contraseña: la cuenta se queda con la primera; "Revisa tu correo" sondea con la segunda para siempre y luego "Correo o contraseña incorrectos". `src/components/game/configuration/configurationModal/EmailConfirmationPending.tsx:26`. Que la pantalla no prometa entrar sola con esa contraseña: tras N fallos `invalid_credentials`, deja de sondear y muestra que confirme con el enlace del correo (que sí inicia sesión) o inicie sesión con su contraseña original — sin revelar si el correo ya existía.
6. **[Bajo]** Ese sondeo cada 8 s no tiene límite (39 peticiones en 5 min, por encima de 30/5 min de producción). `EmailConfirmationPending.tsx:12`: backoff y tope (p. ej. 8 s → ×1,5 hasta 60 s, y parar a los 10 min con botón "Ya confirmé"), pausado con la pestaña oculta.

## W9 — pantalla de error y 404 · `fix/error-reintentar-404` · D215 · patch · wt2 · 4302

1. **[Bajo]** "Reintentar" deja el foco en `<body>` tanto si el fallo sigue como si la app vuelve. `src/components/app/ErrorBoundary.tsx:82`. Si sigue el error → foco al h1 de error otra vez; si la app vuelve → a un destino lógico (el `h1` de la pantalla principal, `#configuration-title`, o el que use la app tras navegar). Provoca el error con un componente temporal no commiteado.
2. **[Bajo]** 404 a 320 px con el texto al 200 %: la tarjeta va de 32 a 353 px. `src/pages/404.astro:19` (tokens `max-w-card` de D208). Que quepa sin desborde.
Verifica 320–3840, texto 200 % a 320 y 1280, zoom 400 %, forced-colors, claro/oscuro, axe.

## W10 — diálogos con texto al 200 % a 320 px (opción a del dueño) · `fix/dialogos-texto-200` · D216 · patch · wt3 · 4303

**[Medio]** A 320 px con el texto al 200 % queda fuera de pantalla e inalcanzable: Configuración (título, pestaña "Juego", Cerrar), Novedades, Ranking y Lotes (Cerrar), Logros (parte de un texto) y el aviso de Novedades ("Ver novedades"). El dueño eligió la **opción (a)**: las cabeceras bajan de línea cuando no caben y el botón de cerrar queda siempre visible y alcanzable; nada debe cambiar a tamaño normal (compara antes/después a 320 y 1280 con letra normal: mismas medidas). Hazlo en la pieza común de cabecera de diálogo si existe (busca en `src/components/ui/`), no diálogo por diálogo; las pestañas pueden pasar a varias líneas o hacer scroll interno con foco visible. Tokens de D213 (`--container-dialog*`, `--container-toast`) en `src/styles/theme.css`.
Verifica cada diálogo citado a 320 con texto al 200 % (todo alcanzable con Tab y visible), 320–3840 normal, zoom 400 %, claro/oscuro, axe.

## W11 — ranking: nombre solo de espacios · `fix/ranking-nombre-espacios` · D217 · none · wt4 · 4304

**[Bajo]** `POST /rest/v1/leaderboard_entries` con `display_name: "   "` devuelve 201. La migración `20261020120000_leaderboard_validar_todo.sql` ya está aplicada en producción: **no la edites**; crea una migración nueva en `supabase/migrations/` que redefina la función y rechace `btrim(display_name) = ''` con `PT422` (mismo estilo que D211). En el cliente, `toLeaderboardDisplayName` (`src/utils/leaderboard-validation.ts`) debe recortar y caer al nombre por defecto si queda vacío; el campo de nombre de `AccountTab` también lo rechaza. Tests unitarios. Verifica con `qa:local` (eres el único) los casos de D211 + espacios, y deja en el PR el SQL de revisión de filas con nombre en blanco en producción y la orden de aplicar (`supabase db push`), para el dueño. Al terminar: para el servidor y `bun x supabase stop`, y avisa en tu informe de que Docker quedó libre.
