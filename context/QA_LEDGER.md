# Registro de QA — qué ya está verificado (local)

Regla del dueño (2026-10-22): **solo se hace QA de lo que nunca se verificó, o de lo verificado cuyos archivos cambiaron después.** Nada de rondas QA → arreglo → QA de la resolución → nuevos hallazgos → … Un arreglo lo cierra el propio worker reproduciendo el caso del hallazgo (con el script que dejó la QA); no se lanza otra QA para comprobarlo.

Cómo decidir si algo necesita QA: `git diff --name-only <commit de la fila>..origin/main` contra los "Archivos clave" de la fila. Sin intersección → no se repite.

| Flujo / condición | Verificado en | Commit | Archivos clave | Notas |
|---|---|---|---|---|
| Registro, "Revisa tu correo" (sondeo, backoff, 503/abort, tope, "Ya confirmé") | QA 2026-10-21 + 2026-10-22 | aa56e9d | `EmailConfirmationPending.tsx`, `confirmation-poll.ts` | Base local |
| Enlace de correo caducado / error en URL, popup de Google con error | QA 2026-10-22 | aa56e9d | `auth-link-error.ts`, `AuthLinkErrorSnackbar.tsx`, `AuthSection.tsx` | #127 cambia el reparto: lo verificó su worker |
| Login fallido: mensajes, foco (clic, Enter, doble clic) | QA 2026-10-21 + 2026-10-22 | aa56e9d | `AuthSection.tsx`, `focus.ts`, `auth-errors.ts` | |
| Cierre involuntario / voluntario, dos pestañas, fusión vs. descarte (D214, D219) | QA 2026-10-21 + 2026-10-22 | aa56e9d | `session-end.ts`, `GameEffects.tsx`, `AuthEffects.tsx`, `learning-storage.ts` | #127 cambia la marca: cubierto con tests unitarios de la carrera |
| Ranking: validación de nombre (espacios, invisibles BMP y suplementarios) | QA 2026-10-22 + worker H | aa56e9d / #126 | `supabase/migrations/*leaderboard*`, `leaderboard-validation.ts` | Postgres local |
| Error boundary y 404 (foco, 320–3840, 200 %, 400 %) | QA 2026-10-21 | 1b7d766 | `ErrorBoundary.tsx`, `404.astro` | |
| axe claro/oscuro en todas las pantallas con sesión | QA 2026-10-21 + 2026-10-22 | aa56e9d | — | Repetir solo en pantallas cuyos archivos cambien |
| Texto 200 % a 320 en todas las pantallas (barrido completo con sesión) | QA 2026-10-22 + workers E/F (#128, #129) | aa56e9d + PRs | todo `src/components/` | Ya no se repite como barrido: lo cubre el chequeo automático propuesto (KIT_FEEDBACK 37) o el worker que toque la pantalla |
| Migración al VPS: sesión, enlaces, sin red, SW, tampering, concurrencia, límite de intentos, base caída | QA 2026-11-03 + repros tras arreglos | 8675213 | `src/pages/api/`, `src/server/`, `auth-session.ts`, `public/sw.js`, `GameEffects.tsx` | Base local, solo Chromium. Sin Google, push ni Vercel reales: se prueban en el corte |
| Migración, regresión en Docker: `.qa/auth-flows.mjs` 20/20, `.qa/data-flows.mjs` 17/17, `tests/api` 34/34 | 2026-11-04 | 070ee96 | `src/pages/api/`, `src/server/`, `auth-session.ts`, `AuthSection.tsx` | Base local, cuentas de prueba |
| Producción sin sesión: API 200, ranking con datos, `learning-data` 401, redirección a Google con `client_id` y `redirect_uri` correctos, cron con secreto 200 | 2026-11-04 | 070ee96 | `src/pages/api/`, variables de Vercel | No completa el login de Google |
| Editar `target` no vacía una variable `sensitive` (preview redesplegado: cron sin secreto 401, con secreto pasa y falla en la base) | 2026-11-04 | — | Vercel | Probado con `CRON_SECRET` |
| Copia externa: volcado de las 21:25 CET en `b2:kit-backup` con 2 cuentas, 2 accesos, 2 progresos, 5 marcas, 2 push | 2026-11-04 | — | VPS | Volcado manual. **La copia automática de las 03:30 CET aún no ha corrido con destino externo** |
| Supabase vs VPS: 4 tablas con mismas filas, fechas y huella; cuentas e identidades con las mismas fechas | 2026-11-04 20:46 UTC | — | — | Repetir justo antes de borrar Supabase |

| Producción con cuentas reales del dueño: registro nuevo con correo confirmado (Brevo) y login; Google completo con progreso intacto frente a la copia (197 países, 25 sesiones; solo cambian `last_configuration`, `field_updated_at`, `updated_at`); subida de datos | 2026-11-04 21:06 UTC | 070ee96 | `src/server/`, `src/pages/api/`, variables de Vercel | Deducido de red y base, no se creó ningún dato |
| Temporizador horario: ejecución automática de las 22:00 CET correcta (`sent:0`) | 2026-11-04 | — | VPS | Sin push real todavía |

**Sin verificar en producción:** login con contraseña importada (la cuenta `adm***` tiene 0 sesiones y 0 progreso; hubo 4 intentos 401 sin saber con qué correo); sincronización entre dos dispositivos; subir marca al ranking; push real (próximos: 14:00 y 15:00 CET del 05-11, suscripciones de 2026-10-22); copia automática de las 03:30 CET.

Pendiente sin verificar (no lanzar QA solo por esto; se revisa cuando se toque esa zona): aviso de hidratación de React visto una vez en dev (sin ubicar); flujo real de sesión cerrada + D212 + recordatorio con los avisos nuevos de #128 (cubierto con copias de tarjeta); Google real.
