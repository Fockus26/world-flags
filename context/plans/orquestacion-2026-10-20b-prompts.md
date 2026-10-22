# Tanda 2026-10-20b — arreglos del functional-qa + anchos · prompts

Base: `origin/main` @ 1a6a27b (#106–#108 mergeados). Carpeta principal: `C:\Users\Cesar\Documents\Work\world-flags`.
Informes: `context/plans/qa-funcional-2026-10-20.md` (hallazgos con pasos de reproducción) y `qa-design-2026-10-20.md`.

Reglas comunes (igual que la tanda 2026-10-20, ver `orquestacion-2026-10-20-prompts.md` › Reglas comunes), más:
- En esta máquina usa `bun x` (no `bunx`). Para verificar en navegador, `bun run build` + `bun x astro preview --port <tu puerto>` (astro dev da 504 en los slots).
- **Docker/Supabase local es único y compartido:** solo W5 (ranking) lo levanta y resetea (`bun run qa:local -- --port 4302`). Los demás verificáis con tests unitarios y en navegador interceptando respuestas; lo logueado de punta a punta lo hará la wave-qa de cierre.
- Nunca contra la base real. Nunca apliques migraciones a producción.
- No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`. Informe final con: PR, changeset, decisiones, verificado / no verificado, acciones del dueño, bugs de paso, kit feedback.

## W4 — sync: concurrencia y sesión inválida · `fix/sync-concurrencia-sesion` · D210 · patch · wt1 · 4301

Hallazgos del functional-qa: **[Alto] 1** (subida retrasada de otro dispositivo pisa un cambio más reciente; UPDATE sin control de concurrencia en `src/utils/cloud-storage.ts:197-203`; afecta configuración, perfil, notas por continente; D055 fecha por campo), **[Medio] 7** (token alterado → "No se pudo sincronizar" en bucle y la sesión sigue "iniciada") y **[Medio] 8** (logout en otra pestaña: la primera sigue jugando y lo jugado no llega).
- Lee D049, D051, D055, D173 (`grep -rhi "^# D0\(49\|51\|55\)\|^# D173" context/decisions/`).
- Enfoque: que la escritura no pise un campo con fecha posterior (merge por `field_updated_at` en el servidor —función/RPC o UPDATE condicional— o relectura+merge+UPDATE condicional por versión con reintento). Si necesita migración, escríbela en `supabase/migrations/` (aditiva) y déjala como acción del dueño; no la apliques en remoto. Tests unitarios de la capa pura del merge (orden de llegada invertido).
- Token inválido/401 persistente → cerrar sesión local con aviso, sin perder la cola local. Logout en otra pestaña → `onAuthStateChange`/evento `storage` y que la pestaña refleje el cierre.
- No toques el mapeo de errores de `useAuth.ts` (es de W6); si necesitas tocar ese archivo, solo en la parte de sesión y dilo en el PR.

## W5 — ranking: trigger que valide todo · `fix/ranking-trigger-validacion` · D211 · patch o none · wt2 · 4302

Hallazgo **[Alto] 2**: el trigger del ranking termina el CASE en `else null` y deja pasar scopes desconocidos (`flags:world`, `countries:world@2`, `flags:hacked` con `best_time_ms=1`); `display_name` acepta 10 000 caracteres; `updated_at` acepta 2999.
- Migración nueva en `supabase/migrations/`: rechazar scopes fuera de la lista válida (sácala del código: claves versionadas, ej. `world@197`, continentes, juegos), mínimo de tiempo por scope, `display_name` ≤ 24 (el límite que use la UI; compruébalo), `updated_at` no futuro (normalizar a `now()`).
- Verifica con `qa:local` (tú eres el único que lo usa): los ataques del informe fallan y una marca legítima desde la UI sube.
- **No la apliques en producción.** Deja en el PR y en tu informe el SQL de revisión y de limpieza para el dueño (`select scope, count(*) …`, borrado de scopes inválidos y nombres > 24) — la limpieza va ANTES de aplicar la migración si el trigger/constraint fallaría con filas existentes.
- Al terminar: para el servidor y `supabase stop`.

## W6 — auth: errores, contraseña, aviso al invitado, foco · `fix/auth-errores-invitado` · D212 · patch · wt3 · 4303

Hallazgos **[Medio] 3** (errores en inglés crudo: "Invalid login credentials", "User already registered", "Password cannot be longer than 72 characters"; la rama en español de `useAuth.ts` no se alcanza), **[Medio] 5** (contraseña de 6 espacios aceptada), **[Medio] 6** (D056: `discardedLocal` no llega a la UI; el invitado pierde su progreso sin aviso), **[Bajo] 9** (tras login el foco cae a `body` y el primer Escape no cierra el modal).
- Mapeo por `error.code` de Supabase (no por texto) a mensajes en español; copy provisional marcado + fila nueva en el informe (el orquestador la pasa a CONTENT_CHECKLIST). Para registro con correo existente: mensaje neutro (en producción "Confirm email" está activo y Supabase no revela el correo).
- Contraseña: rechaza solo-espacios (trim para validar, no para guardar) y valida ≤72 bytes con mensaje propio.
- Aviso al invitado: el dueño aprobó un aviso con texto provisional. Toast/snackbar accesible cuando `planSync` descarta lo local (lee D056).
- `supabase/config.toml`: `enable_confirmations = true` en auth.email para que la QA local se parezca a producción; comprueba que `scripts/qa-local.ts` siga creando las cuentas de prueba confirmadas (si no, ajústalo).
- Foco tras login: a un destino lógico (el que abrió el modal o el h1), y que Escape funcione a la primera.

## W7 — anchos: texto 200 % a 320 y tokens de modales · `fix/anchos-texto-200` · D213 · patch · wt4 · 4304

- **[WCAG 1.4.4/1.4.10]** `src/styles/global.css:150` `body { min-width: 20rem }` provoca scroll horizontal con el texto al 200 % a 320 px; la sesión también (el input mide 558 px). Arregla sin romper el diseño a 320 normal.
- **[Tokens]** anchos mágicos `w-[min(Xrem,92vw)]` en los modales ReleaseNotes, RequiredUpdate, Configuration, CountryPicker, Leaderboard y Achievements, toasts (`22rem`) y sesiones de países (`58rem`). Pásalos a tokens (sigue el patrón de `--container-card*` de D208 en `src/styles/theme.css` y la sección "Anchos de tarjeta" de `context/DESIGN_TOKENS.md`), conservando cada ancho actual.
- Verifica 320–3840 sin scroll horizontal, texto al 200 % a 320 y 1280, zoom 400 %, claro/oscuro, axe; antes/después de cada modal.
