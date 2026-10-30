# VPS Postgres — César's central database server

**Not the default.** Projects start on Supabase or Firebase. When one is finished, César may
decide to move it to his own Postgres on his VPS, to stop depending on a paid tier. That
move is [`MIGRATE-TO-VPS.md`](./MIGRATE-TO-VPS.md); this file is the server it lands on:
how it is set up once, and how an agent works with it without ever handling a password.

Why one central Postgres (decided by César, 2026-10-29) and not Supabase self-hosted or one
container per project: one Postgres with one database and one role per project isolates
the projects (a role cannot even connect to another's database) at the cost of a single
server to maintain. Supabase self-hosted is ~10 containers per instance; a container per
project multiplies the RAM and the moving parts. Auth does not need a server: Better Auth
is a library that runs inside each app and keeps its tables in that app's database.

The VPS: 4 cores, 8 GB RAM, 100 GB disk, EU, no auto-backup add-on. Postgres + PgBouncer
for a dozen small projects use well under half of it.

---

## The shape

```
 Vercel (each project)                 VPS
 DATABASE_URL ──TLS──►  PgBouncer :6432  ──►  Postgres 17 (localhost only)
                        transaction pool       ├─ db melao       (role melao)
                                               ├─ db world_flags (role world_flags)
 César's PC / agent                            └─ …
 ssh kit-vps kit-db …  ── SSH key ──►  kit-db (root)  ·  daily pg_dump → disk + rclone
 migrations: ssh -L 5433 → Postgres directly (DIRECT_URL)
```

- **Postgres never listens on the internet.** The only public door is PgBouncer, with TLS
  required. Vercel has no fixed IPs on its normal plans, so an IP allowlist is impossible:
  the protection is TLS + a 48-hex-character password per project + fail2ban on SSH.
- **PgBouncer in transaction mode**, because every serverless invocation opens its own
  connection and a traffic peak would exhaust `max_connections`. Consequence for the code:
  no session state between queries (`SET`, advisory locks, `LISTEN`); prepared statements
  do work (`max_prepared_statements`).
- **Migrations go direct**, not through the pool: `drizzle-kit migrate` with `DIRECT_URL`
  through an SSH tunnel. A migration holds locks and DDL across statements; the transaction
  pool may hand each statement a different server connection.

## Credentials: nothing to type, nothing in the kit

César asked for the kit to "have the VPS's data" so this is not tedious. It does, but no
secret goes into the kit, a project, or a chat:

| What | Where it lives | Who uses it |
|---|---|---|
| Access to the VPS | César's SSH key (`~/.ssh/id_ed25519`) + the `kit-vps` alias in `~/.ssh/config` | The agent runs `ssh kit-vps …`; the key unlocks it without a password |
| The VPS address | Only in `~/.ssh/config` (`HostName`) | Nobody writes the IP anywhere else: the kit and the projects say `kit-vps` |
| Each project's DB password | On the VPS, `/etc/kit-vps/dbs/<project>.env` (root only) | `kit-db url <project>` prints it into a pipe, never on screen |
| Root password of the VPS | César's password manager. With `--harden-ssh`, SSH no longer accepts it (only the provider's VNC console) | César, only for the console |

**The agent never reads or types a password.** It pipes the URL to where it goes:

```bash
ssh kit-vps kit-db url melao | vercel env add DATABASE_URL production
ssh kit-vps kit-db url melao | vercel env add DATABASE_URL preview
```

and for `.env.local`, `bun run vps:env melao` (`reference/scripts/vps-env.ts`, copied with the
migration) writes `DATABASE_URL` and `DIRECT_URL` into the file without printing them.

## One-time setup (César, ~20 minutes)

1. **SSH key on the PC** (PowerShell), if `~/.ssh/id_ed25519.pub` does not exist yet:
   ```powershell
   ssh-keygen -t ed25519 -C "cesar@pc"
   ```
2. **The key on the VPS.** This is the only time you type the root password (in the
   prompt, not in the chat):
   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@<VPS-IP> "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```
3. **The alias**, in `~/.ssh/config` (create it if missing):
   ```
   Host kit-vps
     HostName <VPS-IP>
     User root
     IdentityFile ~/.ssh/id_ed25519
   ```
   Check it: `ssh kit-vps hostname` answers without asking for a password.
4. **A domain for the database (recommended):** an `A` record `db.<your-domain>` → the VPS
   IP, in the DNS of any domain you own. With it, the certificate is Let's Encrypt and the
   apps connect with `sslmode=verify-full` (they check they are talking to your server).
   Without it, the certificate is self-signed and the apps use `sslmode=no-verify`:
   encrypted, but a man in the middle could impersonate the server.
5. **Bootstrap** (from the kit's folder):
   ```powershell
   scp -r reference/vps kit-vps:/root/kit-vps
   ssh kit-vps "bash /root/kit-vps/bootstrap.sh --domain db.<your-domain> --harden-ssh"
   ```
   Re-running it is safe (it is how you apply a newer version of the script).
6. **Off-VPS backups** (strongly recommended: the plan has no auto-backup, and a dump on the
   same disk dies with the disk). On the VPS, `rclone config` with a free remote (Cloudflare
   R2 10 GB, Backblaze B2 10 GB, or Google Drive), then put its name in
   `/etc/kit-vps/backup.env` (`KIT_BACKUP_REMOTE=r2:kit-backups`). Test it:
   `ssh kit-vps kit-db backup --all`.

## Operations

All from the PC, through the alias:

| Need | Command |
|---|---|
| Database for a project | `ssh kit-vps kit-db create <project>` (lowercase, digits, `_`) |
| Its URLs | `ssh kit-vps kit-db url <project>` · `--direct` for migrations |
| Tunnel for migrations / `drizzle-kit studio` | `ssh -N -L 5433:127.0.0.1:5432 kit-vps` (leave it open) |
| What is there and how big | `ssh kit-vps kit-db list` |
| Leaked password | `ssh kit-vps kit-db rotate <project>`, then the two `vercel env add` above and redeploy |
| Backup now | `ssh kit-vps kit-db backup <project>` (daily one is automatic at 03:30) |
| Restore | `ssh kit-vps kit-db restore <project> /var/backups/kit-pg/<file>.dump` |
| Retire a project | `ssh kit-vps kit-db drop <project> --yes` (final backup first) |
| PgBouncer pools | `ssh kit-vps "psql -h /var/run/postgresql -p 6432 -U postgres pgbouncer -c 'SHOW POOLS'"` |

**Restoring is tested, not assumed:** once a quarter (or after setting up rclone), restore
the latest dump of one project into a scratch database
(`kit-db create scratch && kit-db restore scratch <file>`) and drop it. A backup nobody has
restored is a hope.

**Updates:** unattended-upgrades applies the security ones. A Postgres major (17 → 18) is
a planned operation with `pg_upgradecluster`, never automatic.

## Local QA without the VPS

`wave-qa` and the QA scripts never touch the VPS, the same as they never touch the real
Supabase: a local Postgres in Docker (`docker run -d --name <project>-pg -e
POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:17`), `drizzle-kit migrate` and the seed
against it. `qa-local.ts` does not support this stack yet (it starts Supabase or the
Firebase emulators). **world-flags is the first project to migrate** (César, 2026-10-30): its
migration adds a third backend to its `scripts/qa-local.ts` and sends it through
`/kit-feedback` so it enters the kit. What it needs, so the migration does not improvise it:

- Detection: `drizzle.config.*` and neither `supabase/config.toml` nor Firebase emulators.
- A Postgres 17 container per project (`qa-<package name>-pg`, reused if running, a free
  port), a database dropped and recreated on each run unless `--no-reset`, then the project's
  migrate script (`db:migrate`) and seed with `DATABASE_URL`/`DIRECT_URL` pointing at it.
- Safety: abort if any `.env*` URL points at the VPS host (`KIT_VPS_HOST`, or `:6432`) and is
  not overridden — the same rule as `*.supabase.co`.
- Accounts: after `QA ready`, Better Auth's sign-up endpoint for each `.env.test.local` pair,
  then `email_verified = true` and the role by SQL in the container (`docker exec … psql`);
  the role logic in `scripts/qa-roles.ts` like the other backends.
- Emails to Mailpit (a second container), with the app's SMTP variables pointing at it.
