# Postgres on César's VPS

A project's database on the central server, instead of Supabase or Firebase: from the first
unit, or migrated later ([from Supabase](./migrate-supabase-vps.md), [from Firebase](./migrate-firebase-vps.md)). You develop against it as
you would against a Supabase project. The server itself and its operations are
[`VPS-POSTGRES.md`](../VPS-POSTGRES.md): it is set up once, and a project only asks it for a
database. Stack: **Drizzle** with `pg`, **Better Auth**, emails through **Brevo's SMTP**. Check
Context7 for each before writing their code.

What it does not bring, compared with Supabase: a dashboard (`drizzle-kit studio` through the
tunnel), RLS through a client (authorization is a check in each server function, with a test),
Storage (a decision: Cloudflare R2 or a route over the VPS disk), Realtime, and the `vector` and
`pg_cron` extensions (`pgcrypto`, `pg_trgm` and `citext` do work). If the project depends on one
of these, say so at kickoff.

## Environments

| Where | Database | How it gets there |
|---|---|---|
| Your machine, while no real user exists | `<project>` | `bun run vps:env <project>` → `.env.development.local` |
| Your machine, once there are real users | `<project>_dev` | The same with the new name. From here on nobody develops over real data |
| QA (`qa:local`, `wave-qa`, tests) | Postgres in Docker | Automatic. It aborts if a variable it does not override points at the VPS |
| Vercel Preview | `<project>_preview` | `ssh kit-vps kit-db url <project>_preview \| vercel env add DATABASE_URL preview` |
| Vercel Production | `<project>` | `ssh kit-vps kit-db url <project> \| vercel env add DATABASE_URL production` |

Why previews have their own database: with one URL for both, a PR's preview writes real data
and may run with a schema that is not merged yet (world-flags). Why `.env.development.local`:
`vercel env pull` overwrites `.env.local`.

Project names on the VPS: lowercase, digits and `_` (`world_flags`, not `world-flags`).

## Setting it up

1. `ssh kit-vps kit-db create <project>` and the same for `<project>_preview`.
2. Copy the kit's `reference/scripts/vps-env.ts` to `scripts/`, with `"vps:env": "bun
   scripts/vps-env.ts"`, `"db:generate": "drizzle-kit generate"` and `"db:migrate": "drizzle-kit
   migrate"` in `package.json`. Then `bun run vps:env <project>`.
3. `drizzle.config.ts` reads `DIRECT_URL` and only falls back to the file when it is not set, so
   the URL `qa:local` passes wins:

   ```ts
   import { existsSync } from 'node:fs'
   import { defineConfig } from 'drizzle-kit'

   // bun run does not hand the .env files to drizzle-kit.
   if (!process.env.DIRECT_URL && existsSync('.env.development.local')) {
     process.loadEnvFile('.env.development.local')
   }

   // No throw when it is missing: db:generate needs no database, and it must work in a clean clone.
   export default defineConfig({
     dialect: 'postgresql',
     schema: './lib/db/schema.ts',
     out: './drizzle',
     dbCredentials: { url: process.env.DIRECT_URL ?? '' },
   })
   ```
4. Better Auth with `drizzleAdapter(db, { provider: 'pg' })`, its tables with `bunx auth@latest
   generate`, and a migration. `qa-local.ts` expects its `user` table with an `email_verified`
   column and the sign-up route at `/api/auth/sign-up/email`. Emails:
   `EMAIL-TEMPLATES.md` § Better Auth. Also the kit's auth rules (`backend-build` §2).
5. `vercel.json` with `"regions": ["fra1"]`: the VPS is in the EU, and Vercel's default region
   puts an ocean between each query and the database (world-flags).
6. `drizzle/seed.sql` with the minimum to walk through the flows, no personal data. It only runs
   in QA.

**Actions for César** (not the agent): Brevo sender and SMTP key, Google OAuth client if there is
social login, and the variables' values in Vercel (`SMTP_*`, `GOOGLE_*`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`).

## Migrations

Every schema change is a migration in `drizzle/`, in git. A change made by hand in the database
does not exist for QA or for production.

Each one needs the tunnel open (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`), because migrations go
direct, not through the pool:

1. `bun run db:generate`, then `bun run db:migrate`: your development database.
2. QA applies it to its own container by itself.
3. A PR with a migration: apply it to the preview database too, or its preview fails.
4. **Production: before merging, with César's yes.** The merge deploys, and code ahead of its
   schema gives a 500: migrate first, with changes that the running version tolerates (add now,
   remove in a later PR).

```bash
DIRECT_URL="$(ssh kit-vps kit-db url <database> --direct)" bun run db:migrate
```

The URL does not reach the screen that way; do not print it. In a cloud session there is no SSH to
the VPS: migrations and `vps:env` wait for César's machine, and QA uses `--offline`.

## In the code

- **Transaction pooling:** no session state between queries (`SET`, advisory locks, `LISTEN`).
- **`pool.on('error', …)`** on the `pg.Pool`: without it, a dropped idle connection kills the
  process (world-flags' migration QA).
- **Scheduled jobs:** a `systemd` timer on the VPS calling a route protected with `CRON_SECRET`,
  not Vercel Cron, whose frequency depends on the plan (world-flags). Any third-party call in
  that route with a timeout.

## Backups

Automatic from the moment the database exists: `kit-db backup --all` runs nightly over every
database and uploads to the bucket the VPS has configured. **A project never needs the bucket's
keys**, and they never go in its `.env*`. If the project stores its own files, that is another
bucket and another key.
