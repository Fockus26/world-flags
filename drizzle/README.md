# Base de datos en el VPS

Las migraciones salen de `src/server/db/schema.ts` (`bun run db:generate`) y van directas a
Postgres, no por PgBouncer. Con el túnel abierto (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`) y
`DIRECT_URL` puesto (`ssh kit-vps kit-db url world_flags --direct`): `bun run db:migrate`.

Una migración se aplica **antes** de desplegar el código que la usa.

## Recordatorio diario

`POST /api/cron/send-daily-reminders` se llama cada hora en punto desde el VPS: sirve con
cualquier plan de Vercel. **Ya instalado y activo en el VPS.** El secreto (`CRON_SECRET`, el mismo que en
Vercel) va en un archivo solo legible por root, para que no se vea en la lista de procesos.

`/etc/world-flags/cron.header` (permisos 600):

```
Authorization: Bearer <CRON_SECRET>
```

`/etc/systemd/system/world-flags-reminders.service`:

```ini
[Unit]
Description=World Flags: recordatorio diario

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -fsS --max-time 60 -X POST -H @/etc/world-flags/cron.header https://world-flags-hazel.vercel.app/api/cron/send-daily-reminders
```

`/etc/systemd/system/world-flags-reminders.timer`:

```ini
[Unit]
Description=World Flags: recordatorio diario, cada hora

[Timer]
OnCalendar=hourly

[Install]
WantedBy=timers.target
```

```bash
systemctl daemon-reload && systemctl enable --now world-flags-reminders.timer
```
