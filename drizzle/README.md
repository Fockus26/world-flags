# Base de datos en el VPS

Las migraciones salen de `src/server/db/schema.ts` (`bun run db:generate`) y van directas a
Postgres, no por PgBouncer. Con el túnel abierto (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`) y
`DIRECT_URL` puesto (`ssh kit-vps kit-db url world_flags --direct`): `bun run db:migrate`.

Para desarrollar: `bun run vps:env world_flags_dev` escribe `.env.development.local` sin mostrar
la URL; `world_flags` es la base real y nadie desarrolla contra ella.

Una migración se aplica **antes** de desplegar el código que la usa.

## Recordatorio diario

`/api/cron/send-daily-reminders` se llama cada hora en punto con `Authorization: Bearer <CRON_SECRET>`.
Desde D243 lo llama el cron de kit-deploy (un `GET`; el secreto lo pone kit-deploy con la
variable `CRON_SECRET` de producción):

```bash
ssh kit-vps kit-deploy cron add world_flags /api/cron/send-daily-reminders "0 * * * *"
ssh kit-vps kit-deploy cron runs world_flags
```

La ruta acepta también `POST` para el temporizador `systemd` de antes
(`world-flags-reminders.timer`, contra `world-flags-hazel.vercel.app`), que se retira al
pasar producción al VPS: `systemctl disable --now world-flags-reminders.timer`, y luego
borrar el `.service`, el `.timer` y `/etc/world-flags/cron.header`.
