# Migrate a finished project to the VPS Postgres

**Only when César asks for it**, and only for a finished project (version QA passed, in
production). Projects are built on Supabase or Firebase, as always: the migration is a
separate, later decision per project, not a stack chosen at kickoff. Why: Supabase/Firebase
give auth, emails and a local QA stack for free while the project changes every day; once
it is stable, moving it off the paid tier is a one-time job (César, 2026-10-29). The first
one is **world-flags** (2026-10-30): it also builds `qa:local`'s Postgres backend
([`VPS-POSTGRES.md`](./VPS-POSTGRES.md) › Local QA) and reports it with `/kit-feedback`.

The server is [`VPS-POSTGRES.md`](./VPS-POSTGRES.md) (set up once). The result in the
project: **Drizzle** on Postgres, **Better Auth** for auth (a library inside the app, its
tables in the same database), **emails from the app** through Brevo's SMTP. Check Context7
for Drizzle, Better Auth and the storage SDK before writing any of it: these steps fix the
order and the traps, not the exact API.

It is done like any big unit: a plan in `context/plans/migrate-vps.md`, a `feat/migrate-vps`
branch, a PR, and César merges. The cutover is a step of its own, after the merge.

---

## 1. Inventory: what the project really uses

Before estimating, list each service the project touches (grep the code, the dashboard,
`supabase/`). Each one has a replacement, and some cost more than others:

| Supabase / Firebase | On the VPS | Effort |
|---|---|---|
| Postgres tables (Supabase) | Same tables, same SQL. `drizzle-kit pull` generates the schema from the current database | Low |
| Firestore (Firebase) | **A relational model designed from the documents**: collections → tables, subcollections → tables with FK, embedded maps → columns or `jsonb`. It is a redesign, with its own decision | **High** |
| RLS policies | Authorization in server code: one check function per policy, called by every query of that table, with a test per policy (owner sees, stranger gets 404) | Medium. Every policy is a rule that must not be lost: list them all (`select * from pg_policies`) |
| Supabase Auth / Firebase Auth | Better Auth + user import (§3) | Medium |
| Auth emails | The app's own, through Better Auth (`EMAIL-TEMPLATES.md` § Better Auth) | Low: the React Email templates already exist |
| Storage | Cloudflare R2 (10 GB free, S3 API) or the VPS disk behind a route handler. Decide in a decision | Medium |
| Edge Functions / Cloud Functions | Next route handlers or server actions | Low–medium per function |
| Realtime / `onSnapshot` | Polling with SWR/React Query, or SSE from a route handler | Medium; often polling is enough |
| `pg_cron` / scheduled functions | Vercel Cron calling a route protected with `CRON_SECRET` | Low |
| RPC (`supabase.rpc`) | The same SQL function (it moves with the schema) called through Drizzle `sql`, or rewritten as a query | Low |

If the inventory shows Firestore with deep subcollections or heavy Realtime, **say so to
César before starting**, with the estimate: maybe that project should stay.

## 2. Database and connection

1. `ssh kit-vps kit-db create <project>` and `bun run vps:env <project>` (copy
   `reference/scripts/vps-env.ts` to `scripts/`, script `"vps:env"` in `package.json`).
2. Drizzle with `pg` (node-postgres): `DATABASE_URL` for the app (PgBouncer), `DIRECT_URL`
   for `drizzle-kit` (`drizzle.config.ts` reads `DIRECT_URL`), with the tunnel open.
3. **Supabase:** the schema comes from the repo's migrations (`supabase/migrations/`), not
   from a dump of the dashboard: drop what only exists in Supabase (`auth.uid()` in
   defaults and policies, grants to `anon`/`authenticated`, `storage.*`). FKs to
   `auth.users(id)` point to Better Auth's `user` table. Then `drizzle-kit pull` against the
   new database, so the Drizzle schema matches what is really there.
   **Firebase:** the new schema from the redesign, as Drizzle migrations.
4. Local QA: Postgres in Docker (`VPS-POSTGRES.md` § Local QA) with the same migrations and
   the seed. The tests that ran against Supabase local run against it.

## 3. Auth: users keep their password

- Better Auth with `drizzleAdapter(db, { provider: 'pg' })` and
  `advanced.database.generateId: 'uuid'`, so the imported ids (Supabase's are UUIDs) stay
  the same and every FK keeps pointing at the same person. Its tables:
  `bunx @better-auth/cli generate` into the Drizzle schema, then a migration.
- **Supabase users:** `auth.users` + `auth.identities` → `user` + `account`
  (`providerId: 'credential'`, `password` = `encrypted_password`). Supabase hashes with
  bcrypt and Better Auth with scrypt by default, so `emailAndPassword.password.verify` checks
  bcrypt hashes (`$2a$`/`$2b$` prefix) with `bcrypt.compare` and the rest with Better Auth's
  default; `hash` stays the default, so each user moves to scrypt the next time they change
  their password. Better Auth's docs have a "Supabase to Better Auth" migration script: start
  from it.
- **Firebase users:** `firebase auth:export users.json --format=json` gives the hashes in
  Firebase's modified scrypt, with the project's hash parameters (console → Authentication →
  ⋮ → Password hash parameters, an action for César). `verify` checks them with a library for
  that format (`firebase-scrypt`), the same way.
- OAuth users (Google…): an `account` with the provider and its `sub`; the app's OAuth
  client is created again for the new callback URL (an action for César).
- **Every session is lost**: users log in again once. It goes in the cutover message if the
  client wants to warn them.
- Roles: whatever lived in `app_metadata` / custom claims / a `profiles` table becomes a
  column or Better Auth's admin plugin, decided in the plan.
- The kit's auth rules still apply (`backend-build` §2): httpOnly cookies, rate limiting
  (Better Auth has it: turn it on), messages that do not reveal whether the email exists.

## 4. The rest of the code

Replace each `supabase.from(…)` / Firestore call through a single data layer
(`lib/data/<entity>.ts`), each function with its authorization check from §1. Grep must end
at zero: `@supabase/` or `firebase` imports left in `app/` or `lib/` are the migration not
finished. `functional-qa` runs over every flow before the merge (it is the version QA of a
new backend).

## 5. Cutover (after the merge, with César)

1. A low-traffic window agreed with César. Writes frozen (maintenance banner, or the app in
   read-only).
2. Final data copy. Supabase: `pg_dump --data-only --schema=public` from the direct
   connection, `pg_restore`/`psql` into the new database through the tunnel, then the auth
   import script. Firebase: the export script of the redesign.
3. Check: row counts per table equal at both ends; log in with a test account of each
   role; one flow of each kind (create, edit, pay if there are payments).
4. `ssh kit-vps kit-db url <project> | vercel env add DATABASE_URL production` (and the
   SMTP / `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` variables), redeploy, unfreeze.
5. **The old project stays paused 30 days, not deleted**: it is the rollback. Deleting it
   is César's action after that.
6. `context/decisions/D0NN-migracion-vps.md` with the date, what moved where, and the
   rollback path; `PROJECT_CONTEXT.md` § Stack updated.
