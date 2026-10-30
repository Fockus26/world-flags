# GitHub repo and Vercel deployment

Decided at kickoff (`project-kickoff`, Block B) and run by the agent **only if César said
yes in the interview**: creating a repo, changing GitHub settings and connecting Vercel are
outward-facing actions. The interview's answer is the authorization; if it was not asked,
ask before running anything.

Questions (one round, with options):

1. **Do I create the GitHub repo?** No / yes, private / yes, public — on your account or in
   an organization (which)? If the repo already exists: its URL. Recommend **private** for a
   client's site: the local `context/` backup (branch `context-state`) only runs on private
   repos, because the checklist may hold client data.
2. **Do I deploy on Vercel?** No / yes, on your account / yes, on the client's account (they
   create it or invite you). Vercel's Hobby plan is for personal non-commercial use: a
   client's site goes on Pro or on the client's account. If there is a domain: which, and
   who manages its DNS.
3. If not Vercel (VPS, the client's hosting): where, and it stays as a phase 09 unit.

---

## 1. GitHub

Requirements: `gh auth status` green. If not, César is asked to run `gh auth login` (the
agent never types credentials).

```bash
git add -A && git commit -m "chore: inicializa proyecto con web-agent-kit"   # if there are no commits
gh repo create <owner>/<repo> --private --source . --push                    # or --public
```

Repo settings (they used to be "manual actions for César"; with his yes, the agent does them):

```bash
# Delete the remote branch when the PR is merged
gh api -X PATCH repos/<owner>/<repo> -F delete_branch_on_merge=true

# Let the Changesets Action open the version PR
gh api -X PUT repos/<owner>/<repo>/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true

# Protect main (pr mode). On private repos of the free plan it answers 403: see GUIDE §3
gh api -X PUT repos/<owner>/<repo>/branches/main/protection --input - <<'EOF'
{"required_status_checks":{"strict":false,"contexts":["ci"]},"enforce_admins":false,
 "required_pull_request_reviews":{"required_approving_review_count":0},
 "restrictions":null,"allow_force_pushes":false,"allow_deletions":false}
EOF
```

Check each one by reading it back (`gh api repos/<owner>/<repo> -q .delete_branch_on_merge`,
etc.) and leave `context/GIT_STATE.md` in `pr` mode. If protection gives 403, say so and
carry on: the rules in `CLAUDE.md` still forbid pushing to `main`.

Then the first `bun run context:backup` (private repo): from here on the local `context/`
survives losing the folder.

## 2. Vercel

Requirements: CLI (`vercel --version`) with a session (`vercel whoami`). Without a
session, César runs `vercel login`. If the Vercel MCP is connected, it can be used to
check deployments and logs; creating and linking the project goes through the CLI.

```bash
vercel link --yes --scope <team>       # creates/links the project; adds .vercel to .gitignore
vercel git connect                     # deploys on every push: preview per PR, production on merge to main
vercel env add NEXT_PUBLIC_SITE_URL production    # César gives the value (final domain)
vercel env add NEXT_PUBLIC_SITE_URL preview
```

- Framework: Next.js, detected automatically; **bun** is detected through `bun.lock`.
- `NEXT_PUBLIC_SITE_URL` without a domain yet: the production `*.vercel.app` URL, and a row
  stays in `CONTENT_CHECKLIST.md` to change it when the domain is connected.
- Every `.env.example` variable the build needs, in the right environments, and the first
  `vercel env pull` (§2c). **César sets the secret values** (or gives them to you through
  the channel he chooses); they are never written in the repo or the chat.
- Domain: `vercel domains add <domain>` and the DNS records it prints go to "Actions
  for César" (whoever manages the DNS changes them).
- PR previews get linked in the PR automatically (Vercel bot): they are the fastest way for
  César to review without running anything. If the project is private and has Deployment
  Protection, the preview asks for a Vercel session: normal.
- The orphan branches `pr-shots` and `context-state` carry a `vercel.json` with
  `"git": { "deploymentEnabled": false }`: pushing them does not trigger a (failing) deploy.

### 2b. Adopt a Vercel project that already exists

When the deployment was already done by hand (it happened: the project lived on Vercel and
the repo did not know). Do not create another one: link the existing one and check it does
what the kit expects.

1. **Find it** without linking anything yet: `vercel project ls --scope <team>` (or the
   Vercel MCP, `list_projects`). César confirms which one if in doubt.
2. **Link** that one, not a new one: `vercel link --yes --project <name> --scope <team>`
   → writes `.vercel/project.json`. Check the result with
   `vercel project inspect --non-interactive` (right owner and project).
3. **Git connection**: connected to the project's GitHub repo, with `main` as the production
   branch (`vercel git connect` if it is not). Without it there are no PR previews.
4. **Variables**: `vercel env ls` against `.env.example`; what is missing, as in §2
   (secret values, César). If `.env.local` was written by hand, the first pull follows §2c
   ("First pull"): the pull overwrites it.
5. Open a test PR and confirm the Vercel bot leaves the preview link.

### 2c. Environment variables: Vercel is the source

The real values live in Vercel, one set per environment; the local `.env.local` is a copy
pulled from there. Why: the `.env*` files are gitignored and not in the `context-state`
backup, so losing the folder lost the keys, and each machine had its own hand-made copy.
GitHub Secrets does not replace it: its values can be written but never read back (neither
the API nor `gh` returns them), so it can receive a `.env` but never rebuild one.

| File | Comes from | Edited by hand |
|---|---|---|
| `.env.example` | the repo: every variable's name, empty, with what it is for | yes, by the unit that adds the variable |
| `.env.local` | `vercel env pull .env.local --yes` (Vercel's **Development** environment) | no: the next pull overwrites it |
| `.env.development.local` | local only: this machine's overrides (a local URL, a port). In `next dev` it wins over `.env.local` | yes |
| `.env.test.local` | local only: the made-up QA accounts (`backend-build` §2) | yes, César |

**Get** (after cloning, on another machine, or when a variable changed):

```bash
vercel env pull .env.local --yes
```

The pool slots pick it up on their next `wt take` (it refreshes the `.env*` files).

**Send** (a unit adds a variable):

1. The name in `.env.example`, empty, with a comment: what it is for, public or secret.
2. The value in Vercel, per environment — an **action for César**: `vercel env add
   <NAME> <environment>` (it asks for the value) or the dashboard. **Development** takes the
   development value (test keys, the dev project); **Production** and **Preview** the real
   ones, secrets with `--sensitive`: they cannot be read again, not even by `pull`, and
   nobody needs them locally. Development cannot be sensitive (Vercel rejects it), so a
   production key never goes there.
3. `vercel env pull .env.local --yes`.

**Check:** the names of `.env.example` against `vercel env ls` for each environment;
what is missing goes to "Actions for César". The agent runs `pull` and `ls`, but **never
prints a value** (`cat`, `echo`, a log): names only, `grep -oE '^[A-Z0-9_]+=' .env.local`.
And it never types a secret value: César does.

**First pull** in a project whose `.env.local` was written by hand:

1. Compare names: `.env.local` against `vercel env ls development`.
2. The ones only local: this machine's values go to `.env.development.local`; the rest, César
   uploads them to Development (dashboard › Settings › Environment Variables: pasting the
   file's content into the form splits it into variables).
3. Only once César confirms: the pull. Before that it would erase them.

**GitHub Secrets** only when a workflow needs a value (today none does: `ci.yml` builds
without real secrets). Then that variable alone, never the whole `.env.local`: `gh secret
set <NAME>` (César pastes it) or `gh secret set -f <file>` with only those lines. As it
cannot be read, when the value changes in Vercel it is set again here too: list which
secrets are duplicated in GitHub in `PROJECT_CONTEXT.md` › Repo and deployment.

### 2d. Variables in a cloud session (claude.ai/code)

The cloud container has no `.env.local` and no logged-in Vercel CLI. Pasting the file into
the chat leaves the keys in the transcript (they then have to be rotated). Instead, once per
project, César sets up the **cloud environment** (session title bar › environment › Edit):

1. **Secret** `VERCEL_TOKEN`: a token from vercel.com/account/tokens, scoped to the project's
   team, with an expiry. Under Network secrets (or as an environment variable if that
   section is not offered).
2. **Variables** `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (not secret: in
   `.vercel/project.json` after `vercel link`, or Vercel › Project › Settings). If the Next
   app is not at the repo root (e.g. `web/`): `VERCEL_ENV_FILE=web/.env.local`.
3. **Network access**: `api.vercel.com` in Allowed domains (leave package managers ticked).

`scripts/cloud-setup.sh` then runs `vercel env pull <file> --yes --environment=development`
at the start of each session (only if the file does not exist) and prints only how many
variables it wrote. It is the Development environment, the same one `.env.local` gets on the
machine: no production secret reaches the container.

## 3. After the first deployment

- [ ] Production answers 200 on `/`, 404 on an invented route (with the site's screen), and
      `robots.txt` / `sitemap.xml` with the right domain.
- [ ] OG card checked on the deployed URL (`reference/BRAND-ASSETS.md`).
- [ ] Maintenance variables (`MAINTENANCE_MODE`, `MAINTENANCE_UNTIL`) defined as off or
      absent (`reference/STATUS-SCREENS.md`).
- [ ] `PROJECT_CONTEXT.md` › Repo and deployment with: Vercel project, production URL,
      domain and who manages the DNS.
