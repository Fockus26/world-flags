# Tanda 2026-10-22 — ola 4: arreglos de la QA de cierre 2026-10-21 · prompts

Base: `origin/main` @ 1b7d766. Carpeta principal: `C:\Users\Cesar\Documents\Work\world-flags`.
Plan: `context/plans/tanda-2026-10-22-ola4.md`. Informe: `context/plans/qa-tanda-2026-10-21.md` (lee solo los hallazgos de tu unidad: pasos, evidencia y path:line).

Reglas comunes (las de `orquestacion-2026-10-21-prompts.md`, resumidas):
- `bun x` (no bunx). Verificación en navegador: `bun run build` + `bun x astro preview --port <tu puerto>`; al acabar `astro preview stop` o matar el PID que escucha en tu puerto. Playwright con `node`. Tu propia pestaña del navegador.
- Skill `a11y` si tocas UI. Puertas verdes: `bun x astro check`, `bun x biome check ./src` (sin errores nuevos), `bun run test`, `bun run build`.
- Changeset de jugador (`.changeset/<desc>.md`, texto plano) si quien juega lo nota; bump indicado. Conventional Commits, push a tu rama, `gh pr create` con plantilla. Nunca merge ni push a main.
- No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: el copy nuevo (provisional, ya aprobado por el dueño) va listado en tu informe; el orquestador lo anota (filas 59+).
- Texto al 200 %: CDP `Page.setFontSizes` 32/32. Mide también recortes **dentro** de contenedores `overflow:hidden` (`scrollWidth > clientWidth`), no solo fuera del viewport.
- **Docker/Supabase local único:** A lo usa primero (`bun run qa:local -- --port 4301`; si el primer arranque falla, `bun x supabase start` y reintenta). Al acabar: parar servidor + `bun x supabase stop` y decirlo en el informe. D lo usa solo si `docker ps` no muestra contenedores supabase corriendo; si no, verifica con tests unitarios y deja la verificación con base local a la wave-qa.
- Decisión nueva → `context/decisions/D<tu ID>-<slug>.md` en tu rama.
- Informe final: PR, changeset, decisiones, verificado / no verificado, copy nuevo, acciones del dueño, bugs de paso (zona ajena: solo reportar), feedback para el kit.

## A — confirmación de correo robusta · `fix/confirmacion-correo-robusta` · D218 · patch · wt1 · 4301 · Docker sí (primero)

Hallazgos 1, 7 y 8 del informe:
1. **[Medio]** "Revisa tu correo" deja de sondear tras un 5xx/fallo de red. `EmailConfirmationPending.tsx` › `check()`: `if (finished || errorCode === null) return;` toma `AuthRetryableFetchError` (sin `code`) como éxito. Decide por `error`, y si es fallo de transporte reprograma con el backoff existente (no cuenta como `invalid_credentials`). Tests unitarios en `confirmation-poll.ts` (o donde viva la lógica pura).
7. **[Medio]** Enlace caducado (`#error=access_denied&error_code=otp_expired&error_description=…`) carga como invitado sin mensaje. Lee `error_code` del hash al cargar (donde se procesa la vuelta de Auth / `useAuth`), muestra un aviso accesible ("Este enlace ya no vale; usa el más reciente o pide otro", copy provisional, mecanismo de avisos de D212) y limpia el hash. Test de la parte pura.
8. **[Bajo]** Doble clic en "Iniciar sesión" con credenciales malas deja el foco en la `SECTION` del diálogo. `AuthSection.keepFocusAfterError` / `src/utils/focus.ts`: trata "foco en el propio contenedor del diálogo" como perdido. Repite 10 veces.
Ojo: C toca `AuthSection.tsx` en otra zona (fila de botones de cerrar sesión, `<strong>` del correo); no toques esa zona.
Verifica con `qa:local` (Mailpit para el enlace caducado: registro repetido, abrir el primer correo; 503/abort simulados en el sondeo).

## B — cierre voluntario avisa a otras pestañas · `fix/cierre-voluntario-pestanas` · D219 · patch · wt2 · 4302 · Docker no

Hallazgo 2. Decisión del dueño: el cierre de sesión **voluntario** se comunica a las demás pestañas (BroadcastChannel y/o marca vía `src/utils/learning-storage.ts`, nunca `localStorage` directo) para que, al ver el `SIGNED_OUT`, aparten con `guestFollows: false` (lo jugado después como invitado se descarta con el aviso de D212). Solo el cierre involuntario fusiona (D214). Código: `src/utils/session-end.ts` (marca de módulo, por pestaña) y `src/components/app/GameEffects.tsx:217-236`. Cuida el orden (la otra pestaña puede ver el evento antes que la marca): la marca debe escribirse antes del `signOut`, y caducar (p. ej. con timestamp) para no contaminar un cierre involuntario posterior. Tests unitarios de la parte pura (incluida la carrera y la caducidad). Verifica en navegador con dos pestañas interceptando Supabase (recuerda `access-control-expose-headers: x-supabase-api-version` en los mocks).

## C — texto al 200 %: filas y nombres · `fix/texto-200-filas-y-nombres` · D220 · patch · wt3 · 4303 · Docker no

Hallazgos 3, 4, 5, 6 y 10:
3. Confirmación "Cerrar sesión igualmente": `AuthSection.tsx:275` `flex gap-2` → que baje de línea (también a 320–390 con letra normal).
4. Configuración con sesión: `<strong>` del correo en `AuthSection.tsx` (`break-all`/`overflow-wrap:anywhere`); fila Notificaciones `GameTab.tsx:227-233` (`min-w-0` en el Fieldset o `flex-wrap` en la leyenda con `HelpHint`).
5. Nombre del continente a 0 px: `CountryPickerModal.tsx:313` (`truncate`) y `RegionOption.tsx:186-190`: el nombre debe leerse (puede ir en dos líneas); a 320 con letra normal tampoco debe quedar "Nort…".
6. Filas de botones sin `flex-wrap`: `Tutorial.tsx:290` (y "Paso 1 de 6" en columna de 2 letras), `DailyReminderSnackbar.tsx:140,158`, `UpdateAvailableSnackbar.tsx:40`, `TutorialSettings.tsx:138`, `GameTab.tsx:150`. Busca más con el mismo patrón en filas de botones y arréglalas igual.
10. Título "Perfil y configuración" partido a media palabra: `src/components/ui/ModalHeader.tsx` (D216): `hyphens: auto` con `lang="es"` o equivalente.
A no toca la zona de botones ni el correo de `AuthSection.tsx`; si al rebasar hay conflicto, resuélvelo conservando lo de A. Nada debe cambiar a tamaño normal salvo lo que ya se cortaba (compara 320 y 1280 antes/después). Para estados con sesión intercepta Supabase. Verifica 320 con 200 %, 320–3840 normal, zoom 400 %, claro/oscuro, forced-colors, axe.

## D — ranking: nombres invisibles · `fix/ranking-nombres-invisibles` · D221 · none · wt4 · 4304 · Docker solo si A lo dejó libre

Hallazgo 9. Decisión del dueño: rechazar nombres que solo contengan invisibles (U+200B–U+200D, U+2060, U+FEFF, U+3164, U+FFA0, U+115F, U+1160, U+2800, U+180E y afines, además de los espacios que ya se rechazan) en **servidor** (migración nueva en `supabase/migrations/`, no edites `20261021120000_leaderboard_nombre_en_blanco.sql` ni otras aplicadas; mismo `PT422 display_name en blanco`) **y cliente** (`toLeaderboardDisplayName` en `src/utils/leaderboard-validation.ts` los quita y cae a "Explorador"; el campo de nombre también). Tests unitarios. Si usas Docker (`docker ps` vacío de supabase): `bun run qa:local -- --port 4304` y prueba POST/PATCH/upsert con cada carácter + los casos de D217; al acabar para todo y `bun x supabase stop`. Deja en el PR el SQL de revisión de filas afectadas en producción y la orden `supabase db push` para el dueño.

# Ola 4b — arreglos de la QA de cierre de la ola 4 (`context/plans/qa-tanda-2026-10-22.md`)
Base `origin/main` @ aa56e9d. Mismas reglas comunes de arriba. Lee en el informe solo los hallazgos de tu unidad. Además: mide también **texto que se sale de su propio botón** y **botones por debajo del alto de pantalla en elementos `fixed`** (no solo recortes por `overflow:hidden`). Reutiliza `WRAPPING_BUTTON` (`src/components/ui/Button.tsx`, D220). Mocks de Supabase: `C:\Users\Cesar\Documents\Work\world-flags-wt\wt1\.qa\` tiene `lib.mjs`/scripts de QA de referencia (build con `PUBLIC_SUPABASE_URL=http://127.0.0.1:9` para interceptar).

## E — avisos del sistema al 200 % · `fix/avisos-texto-200` · D222 · patch · wt1 · 4301 · Docker no
Medio 1 (`SystemSnackbars.tsx:27`: el contenedor `fixed` no hace scroll; botones de "Sí, avísame", "Reintentar" de notificaciones bloqueadas, "Entendido" de "Se cerró tu sesión" y D212 quedan fuera de pantalla; "notificaciones" cortada) y bajo "aviso de Novedades" ("Novedades" sobresale, "Ver novedades" desborda su botón). Que todo aviso quepa o haga scroll interno (max-height con token y overflow-y auto, con foco visible y alcanzable) a 320×640 con el 200 %, sin cambios a tamaño normal. Revisa todos los snackbars de `src/components/app/`.

## F — diálogos y pantalla principal al 200 % · `fix/dialogos-inicio-texto-200` · D223 · patch · wt2 · 4302 · Docker no
Medios 2 (`LearningPathModal.tsx:129,152`), 3 (`ConfirmationModal.tsx:53`), 4 (`CountryPickerModal.tsx:76,366,388`), 5 (`UserSummary.tsx:108`) y bajos: "Empezar la partida" (`Tutorial.tsx:395`), "Otra vez", Logros, continentes partidos en trozos ("Nor / tea / mér / ica": que el nombre parta por palabra o baje entero de línea antes que trocearse). Investiga también el aviso de hidratación de React en dev (localízalo; si es tuyo o trivial, arréglalo; si no, repórtalo con causa). Nada cambia a tamaño normal salvo lo que ya se cortaba.

## G — error de Google dentro del diálogo y marca de cierre robusta · `fix/auth-popup-error-y-marca` · D224 · patch · wt3 · 4303 · Docker sí (primero)
Medio 6: el error del popup de Google sale detrás del diálogo modal de Configuración (`AuthLinkErrorSnackbar.tsx:46-55`): si el diálogo de Configuración está abierto, muestra el error dentro de `AuthSection` (región `role=alert`/status, foco razonable); si no, el aviso actual. Bajo de #122: la marca de cierre voluntario caduca a 60 s y una pestaña congelada en segundo plano más tiempo vuelve a fusionar. Hazla robusta sin TTL frágil (p. ej. la marca vale hasta el siguiente `SIGNED_IN` de esa cuenta o hasta que la otra pestaña la consuma; un cierre involuntario posterior no debe heredarla: compara con el instante de la sesión/`detach`). Tests unitarios de la carrera. `qa:local -- --port 4303`; al acabar servidor parado y `bun x supabase stop`.

## H — ranking: invisibles fuera del plano básico · `fix/ranking-invisibles-suplementarios` · D225 · none · wt4 · 4304 · Docker solo si `docker ps` vacío y G ya terminó; si no, tests
Bajo de #121: la API acepta U+E0020–E007F (tags), U+E0100–E01EF (selectores de variante), U+1D173–1D17A y afines. Migración nueva (no edites 20261022120000), misma lista en `leaderboard-validation.ts` y el test que compara cliente/SQL. Cuidado: `translate` con caracteres fuera del BMP funciona en UTF-8, compruébalo en test si no hay Docker. PR con SQL de revisión de producción y `supabase db push` para el dueño.
