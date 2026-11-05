# Migración de Supabase al VPS — plan

> Guía del kit: `.claude/kit-reference/MIGRATE-TO-VPS.md` y `VPS-POSTGRES.md`.
> Rama `feat/migrate-vps`, un PR, lo mergea el dueño. Iniciada el 2026-11-03.
> Modelo recomendado: `opus · high` (auth y datos reales de jugadores).

Resultado: Postgres propio en el VPS + **Drizzle** + **Better Auth** + correos de la app por
**Brevo**. Supabase queda como rollback hasta que el dueño lo borre.

## 1. Estado de partida (2026-11-03)

| Pieza | Estado |
|---|---|
| VPS (`ssh kit-vps`) | Responde sin contraseña. Postgres 17 y PgBouncer activos, 6,8 GB libres de RAM, 88 GB de disco |
| Base `world_flags` | **Creada y vacía** (`kit-db create`) |
| TLS de la base | `sslmode=no-verify`: el VPS se preparó **sin dominio** (certificado autofirmado) |
| Copias fuera del VPS | **No configuradas** (`KIT_BACKUP_REMOTE` vacío, ningún dump aún) |
| Supabase real (`sgbeepfcrlylvcsmbnyv`) | **El conector MCP no tiene permiso sobre este proyecto** (solo ve `melao` y `maranatha`). Sin conteos reales de usuarios ni filas todavía |

## 2. Inventario

| Supabase hoy | Dónde | Sustituto | Coste |
|---|---|---|---|
| 4 tablas (`user_learning_data`, `leaderboard_entries`, `push_subscriptions`, `app_config`) | `supabase/migrations/` | Las mismas tablas | Bajo |
| Trigger `leaderboard_entries_validate_time` y los de nombre (migraciones 20261020–23) | migraciones | Se mueven tal cual; `PT422` sigue siendo válido en Postgres | Bajo |
| 7 políticas RLS + `push_subscriptions` cerrada (abajo) | migraciones | Comprobación en servidor + test por política | Medio |
| Auth: correo/contraseña, Google, confirmación por correo | `useAuth.ts`, `AuthEffects.tsx`, `GameEffects.tsx`, `auth-errors.ts`, `auth-link-error.ts`, `confirmation-poll.ts`, `EmailConfirmationPending.tsx`, `session-end.ts` | Better Auth | **Alto** (§3) |
| Correo de confirmación | `supabase/templates/` | Better Auth + Brevo | Bajo (necesita remitente) |
| Edge Functions `subscribe-push`, `send-daily-reminders` | `supabase/functions/` | Rutas `/api/*` | Bajo |
| `pg_cron` + `pg_net` cada hora | `cron-daily-reminders.sql` | Temporizador en el VPS (§3.6) | Bajo |
| Datos desde el navegador | `cloud-storage.ts`, `app-config.ts`, `push-notifications.ts` | Rutas `/api/*` | **Medio-alto**: hoy no hay servidor |

No se usa Storage, Realtime ni RPC.

**Políticas que no se pueden perder:**

1. `app_config`: lectura pública; sin escritura desde la app.
2. `leaderboard_entries`: lectura pública.
3. `leaderboard_entries`: insertar solo la propia fila.
4. `leaderboard_entries`: actualizar solo la propia fila.
5. `user_learning_data`: leer solo la propia.
6. `user_learning_data`: insertar solo la propia.
7. `user_learning_data`: actualizar solo la propia.
8. `push_subscriptions`: RLS sin políticas, nada desde el cliente. `subscribe-push` comprueba que `userId` coincide con la sesión.

En el servidor, `user_id` sale **siempre de la sesión**, nunca del cuerpo de la petición.
Confirmar contra `pg_policies` real antes del corte: el esquema es un `db pull` del 2026-10-19.

## 3. Trampas de este proyecto (la guía no las cubre)

1. **No hay servidor.** La app es Astro estático; la guía habla de Next. Hace falta
   `@astrojs/vercel` y rutas con `prerender = false`, manteniendo `/` estática.
2. **El SW interceptará `/api/*`.** `public/sw.js:133` solo deja pasar lo de otro origen; Supabase
   era de otro origen y `/api` no lo será. Sin excluirlo, un GET sin red recibe la página offline
   o una respuesta cacheada. Sin tocar `APP_VERSION` (D135).
3. **Sin red no se sabrá quién es el jugador.** Hoy la sesión está en `localStorage` y se lee sin
   conexión; con cookie httpOnly, `getSession` necesita red. Sin una copia local de la identidad
   (por `learning-storage.ts`), una cuenta sin conexión parecería invitado (D050, D052, D056).
4. **La versión de la fila es texto exacto (D210).** `updated_at` se compara por igualdad y
   `node-postgres` lo convierte a `Date` y pierde los microsegundos. Las filas con `now()` nunca
   coincidirían y toda subida daría conflicto. La API lo devuelve como texto (`updated_at::text`
   o `to_jsonb`), con test.
5. **Clientes viejos tras el corte.** El SW sirve bundle viejo, que seguirá llamando a Supabase.
   Y `fetchMinVersion` trata el error como "no bloquear", así que **pausar Supabase no los
   avisa**. Orden: subir `min_version` en el Supabase viejo y dejarlo activo sin escritura hasta
   que no queden clientes; pausar después (la guía dice pausar enseguida).
6. **Cron cada hora.** La guía dice Vercel Cron; que yo recuerde, en Hobby solo va una vez al día
   (no lo confirmé en la documentación). Se usa un temporizador `systemd` en el VPS que llama a
   `/api/cron/send-daily-reminders` con `CRON_SECRET`: sirve con cualquier plan.
7. **Región.** Las funciones de Vercel van por defecto en `iad1` (EE. UU.) y el VPS está en la UE:
   cada consulta cruzaría el Atlántico. `regions: ["fra1"]` en `vercel.json` (Hobby admite una).
8. **El merge despliega.** La guía pone el corte después del merge, pero el merge a `main` publica
   producción. El dueño mergea **dentro de la ventana de corte**, con las variables ya en Vercel y
   los datos copiados.
9. **Los triggers al copiar datos.** La validación del ranking puede rechazar filas viejas. La
   carga corre con `session_replication_role = replica` como `postgres`, no como el rol del proyecto.
10. **`.env.local` no se edita a mano** (CLAUDE.md), pero `vps:env` del kit escribe ahí. Aquí escribe
    en `.env.development.local`.
11. **Bcrypt nativo.** Usar `bcryptjs`: `bcrypt` compila nativo y da problemas con Bun en Windows
    y en Vercel. `verify` por prefijo `$2a$`/`$2b$` (como dice la guía) y `hash` por defecto.
12. **Comportamientos de auth que hay que conservar:**
    - `error.code` que usan `auth-errors.ts` y `confirmation-poll.ts`.
    - Registro con correo existente responde igual que uno nuevo (D212).
    - Popup de Google: `AuthEffects` cierra la ventana y la pestaña que la abrió debe enterarse
      (con cookie no hay evento de `localStorage`: comprobar).
    - Límite de intentos con almacenamiento en base: en memoria no sirve en serverless.
    - `x-forwarded-for` en la ruta de Astro.
13. **Sesiones perdidas y progreso pendiente.** Al corte se cierran todas las sesiones. Hay que
    probar que `sessionEndedUnexpectedly` (D210) y la regla de invitado (D056) **no descartan** el
    progreso pendiente de quien vuelve a entrar. Es el riesgo principal de pérdida de datos.
14. **Previews.** La guía usa la misma URL en `preview` y producción, y un preview escribiría en
    datos reales. Propuesta: base aparte `world_flags_preview`. Google no funcionará en previews
    (URL de callback variable).

## 4. Fases (todo en `feat/migrate-vps`, commits por fase)

| # | Fase | Hecha cuando |
|---|---|---|
| 1 | Adaptador Vercel, región, Drizzle + `pg`, esquema desde migraciones sin lo propio de Supabase, `drizzle-kit pull`, tablas de Better Auth con ids UUID | Migraciones aplican limpias en Docker |
| 2 | Tercer backend de `qa-local` (Postgres + Mailpit), según `VPS-POSTGRES.md` § Local QA | `QA ready` con cuentas creadas |
| 3 | Better Auth: rutas, cliente, `useAuth`, `AuthEffects`, errores, correo, identidad offline (§3.3) | Tests de auth + registro, confirmación, login y Google en local |
| 4 | Capa de datos `/api/*`, autorización con test por política, `cloud-storage.ts` y `app-config.ts`, exclusión en SW | Sync, conflicto D210 y ranking en local; test "extraño recibe 404" |
| 5 | Push y temporizador del cron | Recordatorio de prueba enviado en local |
| 6 | Script de importación de usuarios y datos, ensayado con una copia | Conteos iguales y login con contraseña antigua |
| 7 | `grep` de `@supabase/` en `src/` a cero, changeset, `functional-qa` sobre todos los flujos, PR | Puertas en verde, PR abierto |
| 8 | Corte con el dueño (§6) | Producción en el VPS |

**Fase 1 hecha (2026-11-03).** Dos cambios respecto a lo previsto: el esquema TS de Drizzle es la
fuente (`src/server/db/schema.ts` → `drizzle/`), así que `drizzle-kit pull` no hace falta; y las
migraciones se probaron en una base temporal del VPS (ya borrada), no en Docker, que no estaba abierto.
Las tablas de Better Auth se escribieron a mano: al configurar auth en la fase 3 hay que contrastarlas
con su CLI. Sin probar: conexión por PgBouncer (`src/server/db/client.ts` aún no lo usa nadie) y el
despliegue en Vercel.

**Fase 2 hecha (2026-11-03), salvo las cuentas de prueba.** `qa-local --postgres` levanta Postgres 17 y
Mailpit en Docker, con una base por puerto y un rol sin superusuario; `--db-only` para sin servidor.
Probado: migraciones y seed, reutilización de contenedores, `--no-reset`, trigger y aborto si una
variable apunta al VPS. **Sin probar:** arranque del servidor y creación de cuentas (no hay ruta de
sign-up hasta la fase 3; si da 404 avisa y sigue). `--postgres` se puede quitar al retirar
`@supabase/supabase-js`: la detección automática lo elige entonces. Falta enviarlo al kit con `/kit-feedback`.

**Fase 3 hecha (2026-11-03), salvo Google.** Better Auth con correo y Google, plantilla en `emails/`,
sesión en `src/lib/auth-session.ts` (cookie httpOnly, identidad guardada para jugar sin red, canal
entre pestañas) y `/api/*` fuera del SW. `.qa/auth-flows.mjs` pasa 20/20 en navegador contra Docker.
**Sin probar:**
- Google (faltan credenciales en local; se prueba tras el corte o en un entorno con callback).
- Reabrir la app sin red con sesión: solo tests de `nextSessionState`.
- Progreso pendiente al volver a entrar (§3.13): necesita la capa de datos, va en la fase 4.
- El límite de intentos con base: en dev está apagado, solo actúa en producción.
En la fase 3 los datos siguen yendo a Supabase, muerta en QA, así que la app queda en "sin conexión"
y no sincroniza: se resuelve en la fase 4. **Esta rama no puede desplegarse hasta terminar la fase 4.**
Visto de paso: `resetSync` no devuelve `connectivity` a `online`, así que tras un fallo de red el
formulario de login sigue desactivado hasta recargar o un evento `online`. Se revisa en la fase 4.

**Fases 4 y 5 hechas (2026-11-03), salvo el envío real de push.** Rutas `/api/learning-data`,
`/api/leaderboard` (+ `/profile`), `/api/min-version`, `/api/push/subscribe` y
`/api/cron/send-daily-reminders`; `@supabase/supabase-js` fuera de la app. Temporizador del VPS
descrito en `drizzle/README.md`, **sin instalar** (va en el corte). Probado:
- `bun run test:api`: 24 tests, una por política de RLS + versión D210 + push + cron sin secreto.
- `.qa/data-flows.mjs` 17/17: sync, dos dispositivos, progreso pendiente con sesión muerta (§3.13), quien
  viene de Supabase con progreso sin subir, D056, ranking y versión mínima. `.qa/auth-flows.mjs` 20/20.
- Las consultas de la app por PgBouncer + TLS, en una base temporal del VPS (ya borrada).
**Sin probar:** un push real y una llamada al cron con secreto; reabrir sin red con sesión (solo unit).

**Para decidir (no es de la migración):** `planSync` (`learning-storage.ts:1528`) trata una cuenta sin
progreso de juego como vacía aunque el dispositivo tenga base: un dispositivo viejo pisa nombre y avatar de
otro. Reproducido en QA. No se pierde progreso. Se reporta, no se arregla aquí.

**Fase 6 hecha (2026-11-03).** `scripts/import-from-supabase.ts`, ensayado con los datos reales en una base
temporal del VPS (ya borrada, sin dump): 4 tablas con contenido idéntico, se niega a importar encima.
Login de cuenta importada (bcrypt) probado con cuentas simuladas, no con las reales.

**La base real, leída el 2026-11-03 (solo lectura):**
- **2 cuentas** (1 correo, 1 Google), 2 filas de progreso, 5 de ranking, 2 suscripciones push. Con esto, §3.5
  (clientes viejos) y la ventana de corte pesan mucho menos: el corte son minutos, y se puede avisar en persona.
- Políticas y columnas iguales a lo previsto.
- **`cron.job` está vacío: los recordatorios diarios no se están programando en producción.** El temporizador
  del VPS los pondría en marcha por primera vez, con 2 suscripciones reales: decisión del dueño.
- **Solo está aplicada la migración base (20261019154452).** D211, D217, D221 y D225 nunca llegaron a la base
  real: el trigger de producción es el antiguo. Al cortar entran las reglas nuevas. Las 5 marcas reales las pasan.
- El 5432 del pooler no responde desde esta red: el script usa el 6543. La variable real es `SUPABASE_DB_PASSWORD`.

`supabase/` no se borra en este PR (es el rollback y hay reglas sobre archivos sin uso): se señala.

## 5. Lo que necesita el dueño

**Decisiones o acciones que bloquean el corte (no el desarrollo):**

- [ ] **Copias fuera del VPS.** `rclone config` en el VPS y `KIT_BACKUP_REMOTE`. El plan no tiene
      copia automática: sin esto, perder el disco es perder las cuentas. **Requisito antes de copiar
      datos reales.**
- [ ] **Dominio para la base** (registro `A` `db.<dominio>` y reejecutar `bootstrap.sh --domain`).
      Sin él la conexión va cifrada, pero sin comprobar el servidor (`no-verify`).
- [ ] **Correo.** Cuenta de Brevo, clave SMTP en Vercel y remitente. Sin dominio propio solo cabe un
      remitente verificado suelto, con peor entrega: los registros por correo dependen de esto.
- [ ] **Google OAuth.** Añadir el callback `https://world-flags-hazel.vercel.app/api/auth/callback/google`.
- [ ] **Acceso de lectura a Supabase** para conteos y `pg_policies`: conectar el proyecto al MCP o
      autorizar usar `SUPABASE_PASSWORD` para consultas de solo lectura.
- [ ] **Ventana de corte** de poco tráfico y aviso a jugadores ("tendrás que volver a entrar").

**Propuestas por defecto (avisar si no):** temporizador en el VPS (§3.6), `fra1` (§3.7), base aparte
para previews (§3.14).

## 6. Corte (resumen; se detalla en la fase 6)

1. Variables en Vercel (producción y preview) sin desplegar.
2. Congelar: quitar escritura en las tablas de Supabase. Los clientes siguen jugando en local y
   encolan (D051).
3. Copia: auth primero (por las FK), luego `public`. Conteos por tabla iguales en ambos lados.
4. El dueño mergea → despliega. Login con cuenta de prueba, un flujo de cada tipo.
5. Subir `min_version` en el Supabase viejo (§3.5). Sigue activo, sin escritura.
6. Tras dejar de recibir clientes: pausar. A los 30 días, borrarlo es acción del dueño.
7. Decisión `D<siguiente>-migracion-vps.md`, `PROJECT_CONTEXT` § Stack y `CLAUDE.md`.

**Rollback:** devolver escritura en Supabase y revertir el merge. Lo escrito en el VPS desde el corte
se perdería salvo copia inversa; por eso se vigila de cerca las primeras horas.

## Pasos reales (lo que hizo falta, para la próxima vez)

**Antes de tocar nada, el dueño decide y prepara:**
1. Backblaze: bucket privado, clave limitada a ese bucket, regla de ciclo de vida.
2. En su terminal: `ssh -t kit-vps rclone config` (las claves nunca en el chat).
3. Brevo: remitente verificado, login y clave SMTP. `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` en Vercel.
4. Google: proyecto y cliente OAuth con la URI `/api/auth/callback/google`; hace falta URL de privacidad para publicar. `GOOGLE_*` en Vercel.
5. Autorizar lectura de la base vieja, y secretos y despliegue en Vercel (los permisos automáticos los bloquean sin autorización expresa).

**El agente desarrolla (rama + PR en borrador hasta el corte):**
6. Inspeccionar la base real solo con lectura: políticas, columnas, trabajos de cron, migraciones aplicadas.
7. Adaptador de servidor y rutas `/api/*` en la misma región que el VPS; excluir `/api/` del SW.
8. Esquema Drizzle, Better Auth (bcrypt para contraseñas importadas), correo por SMTP.
9. Una prueba de acceso por cada política de RLS.
10. Identidad sin red (la cookie httpOnly no se lee), y cambio de sesión avisado entre pestañas.
11. Script de importación todo o nada, que compara contenido; ensayarlo en una base temporal.
12. QA funcional sobre el build real, no solo en dev; también con el SW anterior instalado.
13. Temporizador en el VPS con `Content-Type` (sin él, Astro responde 403). Copias: `KIT_BACKUP_REMOTE`, y probar una restauración.

**Corte, en este orden:**
14. Variables de producción en Vercel (`vercel link` toca `.gitignore`: revisar `git status`).
15. `db:migrate` por túnel, importar y comprobar conteos.
16. Pasar el PR a listo y mergear: despliega.
17. Comprobar API, cron con secreto y errores en Vercel. El dueño prueba login, Google, correo y push.
18. Comparar la base vieja con la nueva antes de borrarla. Borrarla es acción del dueño.

**Lo que salió mal aquí:** el PR se mergeó antes del paso 14 y la API dio 500 unos 40 min. Sin red de datos perdidos, pero evitable con un PR en borrador.
