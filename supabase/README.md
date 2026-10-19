# Supabase

World Flags uses [Supabase](https://supabase.com) for authentication, cloud-synced
progress, the public leaderboard and push-notification reminders.

Everything here is in git (D199) except what the CLI keeps locally: `.temp/`, `.branches/`
and `.env*`. Never commit secrets: the service role key, the VAPID private key and
`CRON_SECRET` go in `supabase secrets set`.

| Path | What it is |
|---|---|
| `config.toml` | Local stack config (`supabase start`): auth URLs for the QA ports, email confirmation like production |
| `migrations/` | The schema, pulled from the real project. The local database is built from it |
| `seed.sql` | Minimal data for the local database (`app_config.min_version`). Test accounts are not here |
| `*.sql` (root) | Scripts already applied by hand in the real project's SQL editor (history) |
| `functions/` | Edge functions (push reminders), deployed with the Supabase CLI |
| `templates/` | Email templates. `confirmar-registro.html` is also used by the local stack |

## Client variables

The client only needs the public variables listed in [`.env.example`](../.env.example)
(`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, optional `PUBLIC_VAPID_PUBLIC_KEY`).
`.env.local` comes from Vercel (`bunx vercel env pull .env.local --yes`).

## QA against a local database

Needs Docker Desktop running and the Supabase CLI.

```bash
bun run qa:local -- --port 4301
```

It runs `supabase start` and `supabase db reset` (migrations + `seed.sql`), creates the
accounts from `.env.test.local` (`EMAIL_TEST` / `PASSWORD_TEST`) and starts the dev server
pointed at the local stack. Emails (sign-up, recovery) go to Mailpit, whose URL is printed at
startup. Never run QA against the real database.

Not covered locally: edge functions and the daily cron (push reminders), Google sign-in.

## Schema changes

Write a new migration (`supabase migration new <name>`), test it with `supabase db reset`,
and apply it to the real project before merging the code that needs it.
