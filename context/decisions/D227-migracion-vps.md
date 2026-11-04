# D227 · Infraestructura · De Supabase a Postgres en el VPS, con Drizzle y Better Auth · Implementado (corte pendiente)

**Resumen:** decidido por el dueño para no depender de un plan de pago (kit `reference/MIGRATE-TO-VPS.md`). La app deja de hablar con Supabase: rutas `src/pages/api/*` en funciones de Vercel (`fra1`, junto al VPS), Drizzle sobre Postgres 17 por PgBouncer, Better Auth con cookie httpOnly y correo propio por SMTP.

**Decisión:**
- **Autorización:** cada política de RLS es una comprobación en la ruta; `user_id` sale de la sesión, nunca del cuerpo. Una prueba por política en `tests/api/`.
- **Sin red:** la cookie no se lee desde el navegador, así que se guarda quién es el jugador (`src/utils/auth-session-state.ts`).
- **Versión de la fila (D210):** viaja como texto, sin pasar por `Date`, para conservar los microsegundos.
- **Recordatorios:** temporizador `systemd` en el VPS llamando a `/api/cron/send-daily-reminders`, no Vercel Cron: vale con cualquier plan. En Supabase el trabajo de `pg_cron` no existía (`cron.job` vacío, 2026-11-03).
- **Importación:** `scripts/import-from-supabase.ts`. Conserva los ids de `auth.users` y las contraseñas en bcrypt, que pasan al formato nuevo al cambiarlas.

- **Service worker anterior:** los previos cachean todo GET del mismo origen, también `/api/*`. El primero que no lo hace llama a `skipWaiting()` sin esperar a "Actualizar" y purga esas respuestas, una sola vez por navegador (marca en caché). Excepción puntual a D047: las pestañas abiertas recargan una vez.
- **Cuenta por pestaña:** la cookie es común a todas. Todo cambio de sesión detectado se anuncia, también al cargar (popup de Google, enlace del correo); cada petición dice qué cuenta cree ser y si no coincide es sesión rechazada; y los datos locales con base de otra cuenta se apartan en vez de pasar a la nueva.
- **Enlace de confirmar:** vuelve con `?confirmado=1`, porque Better Auth redirige sin error ni sesión si ya se usó (o lo abrió un antivirus): sin la marca no se distingue de una carga de invitado.
- **Altas de push:** solo hosts de servicios push reales (el cron les hace POST), con límite por IP en la tabla `rate_limit`, porque no hay sesión que las frene.

**Alternativas descartadas:** Supabase autoalojado (unos 10 contenedores por instancia) y un contenedor de Postgres por proyecto (decisión del dueño, 2026-10-29, en el kit).

**Rollback:** devolver la escritura en Supabase y revertir el merge. Lo escrito en el VPS desde el corte se perdería salvo copia inversa. `supabase/` sigue en el repo y el proyecto se conserva 30 días tras el corte; borrarlo es acción del dueño.

**Rama:** `feat/migrate-vps`
