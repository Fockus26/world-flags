# The kit's default stack

The default for every new project. The orchestrator confirms or adjusts it in the
interview; if it is adjusted, it is written in `context/PROJECT_CONTEXT.md` and **that file
overrides this one**.

---

## Base

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router) | Server Components, native metadata, API routes in the same repo |
| Language | Strict **TypeScript** | — |
| Components | **decided per project** | shadcn/ui · Hero UI · MUI — see `UI-LIBRARIES.md`. The orchestrator always asks. |
| Styling | **per the library** | Tailwind with shadcn/ui and Hero UI; `sx`/`styled` with MUI (and there Tailwind is **not** used) |
| Manager / runner | **bun** | Never npm, yarn or pnpm in the same project |
| Linter / format | **Biome** (`create-next-app --biome`) | One binary for lint and format; no ESLint + Prettier |
| Compiler | **React Compiler** (`--react-compiler`, `reactCompiler: true`) | Automatic memoization; no hand-written `useMemo`/`useCallback` |
| Icons | **lucide-react** | One set, one stroke width |
| Forms | **react-hook-form** + **zod** | The same schema validates client and server |
| Dates | **date-fns** | — |
| Animation | **CSS/Tailwind** first; **framer-motion** only if really needed |

### When to deviate

- **Astro** — a content site, almost all static, with no interactivity beyond a form. Less
  JavaScript shipped: `tech/astro.md`.
- **Vite + React** — an app behind a login, with no need for SEO or SSR.
- **Next.js anyway** — for everything else. When in doubt, Next.js.

## Backend

Three are covered, and QA runs against a local copy of each (`qa:local`):

| | Supabase | Firebase (Auth + Firestore) | Postgres on the VPS |
|---|---|---|---|
| Local backend | stack in **Docker** | **emulators** (**Java**, no Docker) | Postgres and Mailpit in **Docker** |
| Schema in git | `supabase/migrations/` | `firestore.rules`, `firebase.json` | `drizzle/` |
| Auth | Supabase Auth | Firebase Auth | Better Auth, in the app |
| Monthly cost | paid tier past the free one | paid tier past the free one | none beyond the VPS |
| Guide | `tech/supabase.md` | `tech/firebase.md` | `tech/vps-postgres.md` |

The choice goes in `PROJECT_CONTEXT.md`, in the QA line of `CLAUDE.md`, and in its `Tech refs`
line (`tech/README.md`).

---

## bun

```bash
bun install
bun add <package>
bun add -d <dev-package>
bun remove <package>
bun dev
bun run build
bun run start
bunx shadcn@latest add button card dialog
bunx tsc --noEmit
bunx playwright install chromium
```

Rules:

- **A single lockfile.** `bun.lock` goes in the repo; if a `package-lock.json` or a
  `pnpm-lock.yaml` shows up, delete it — two lockfiles produce different installs on
  different machines.
- `package.json` scripts run with `bun run <script>`.
- **CLIs:** the global ones César has installed (`vercel`, `supabase`, `gh`) are called by
  their name, never through `bunx`: it downloads a copy each time and may run a different
  version from the one that has the session. The project's own (`biome`, `tsc`,
  `playwright`) through `bun run` or `bunx`, which finds them in `node_modules`. `bunx`
  only for what is installed nowhere (`bunx shadcn@latest`). If a global CLI is missing
  (a cloud session), `bunx <cli>@latest`. `bunx` and `bun x` are the same command; the
  kit writes `bunx` (César, 2026-10-30, once `bunx` was on the PATH of pwsh and the slots'
  Git Bash). If a shell answers `bunx: command not found`, `bun x` works the same.
- If a tool does not work under bun (an occasional bundler or native binary), use `npx`
  **only for that tool**, and note it in the project's README with the reason. Do not switch
  the whole project's manager for one exception.
- On Windows with several workers: the full suite runs alone, in the background and to a
  file (`bun run test > .qa/test.log 2>&1`), never at the same time as the build — Bun hangs
  with piped output or PGlite runs out of memory.

---

## Context7 — always up-to-date documentation

**Before using any library's API, check its current documentation through Context7.**

```
1. resolve-library-id  → get the library's id
2. query-docs          → bring the documentation of the part you will use
```

Applies to: Next.js, React, Tailwind, shadcn/ui, Radix, react-hook-form, zod, Prisma or
Drizzle, the payments SDK, the auth provider, TanStack Query, framer-motion, and any new
dependency.

Why it is mandatory and not a recommendation: these libraries move fast. Next.js went from
Pages to App Router, Tailwind changed its configuration in v4, payment SDKs rename methods
between major versions. Writing against an API you remember from an earlier version
produces code that **compiles and fails at runtime** — the worst kind of error, because
neither the build nor the typecheck catches it.

Checking costs seconds. Debugging costs a session.

If Context7 does not have the library or is unavailable, say so explicitly and flag that
part of the code as written without checking current documentation, so it gets reviewed.

---

## Folder structure

```
app/
  (marketing)/              public routes group
    page.tsx
    precios/page.tsx
  (app)/                    authenticated routes group
    dashboard/page.tsx
  api/
    webhooks/<provider>/route.ts
  layout.tsx
  globals.css
  sitemap.ts
  robots.ts
  opengraph-image.tsx
components/
  ui/                       primitives (shadcn + custom)
  sections/                 page sections
  <domain>/                 grouped by domain as they grow
lib/
  utils.ts                  cn(), helpers
  validations/              zod schemas
  db/                       client and queries
hooks/
types/
context/                    the project's living documentation (from the kit)
design/                     Claude Design's BRIEF and HANDOFF
phases/                     the chosen track's phases
supabase/                   migrations, seed, auth templates (in git)
.qa/                        measuring scripts and logs (gitignored)
```

---

## Conventions

### Server vs. Client

- Server Components by default.
- `'use client'` only with state, effects, listeners or browser APIs.
- Put it **as low in the tree as possible**: in a layout it drags the whole subtree into the
  client bundle and the benefit of Server Components disappears.
- Data is fetched on the server; Client Components receive it through props.
- A `'use client'` module exports only components: a constant imported from it into a
  Server Component arrives as a client reference, not a value (`undefined`, 500). What is
  shared goes in `lib/`.

### Dev server (Turbopack)

- With several servers at once (pool workers), Turbopack may time out its subprocesses
  ("Node.js subprocess crashed … deadline has elapsed") and leave a 500 in the `.next/dev`
  cache. A restart is not enough: shut down, delete `.next/dev` and restart.

### TypeScript

- `strict: true`. Zero `any` — use `unknown` and validate.
- Explicitly typed props; no `React.FC`.
- Shared types in `types/`; local ones next to the component.

### Tailwind (if the project uses it)

- Every token lives in `tailwind.config` (or in CSS variables with `@theme` in v4).
- With MUI, this section does not apply: tokens live in `createTheme()`.

- Conditional classes with `cn()` (`clsx` + `tailwind-merge`).
- Mobile first: base classes are mobile, the `md:`/`lg:` prefixes widen.
- **Zero arbitrary values** (`w-[347px]`, `text-[#3a7bd5]`). If one is needed, either a token
  is missing or it is a decision to record.

### Environment variables

- `.env.example` in the repo, with every variable and **no real values**.
- `.env.local` in `.gitignore`.
- `NEXT_PUBLIC_` **only** for what is really public — that prefix puts the value in the
  browser bundle.
- Validate the variables at startup, with zod. A failure from a missing variable should
  happen on startup, not on the first user's request.

### Images

- `next/image` always.
- `width`/`height`, or `fill` + `sizes`. Without it, CLS is guaranteed.
- The hero image with `priority`; the rest lazy by default.
- Modern formats (AVIF/WebP) with a fallback.

### Fonts

- `next/font` — self-hosts, removes the external request and avoids the flash.
- `display: 'swap'`.

---

## Dependencies: judgment before installing

Before `bun add`, ask yourself:

1. Does the platform or something already installed solve it? (Many date and formatting
   utilities are already in `Intl`.)
2. How much does it weigh in the client bundle?
3. Is it maintained? Last commit, open issues.
4. Does it have documentation in Context7? If not, it will cost more to maintain.

One dependency less is one decision you do not have to revisit in a year.
