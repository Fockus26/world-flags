# Stack — WordPress

For projects whose site **is** a WordPress: the client already has one, or needs to edit
content in the WordPress admin, or WooCommerce is the shop. The kit's default stack is still
Next.js (`STACK-NEXTJS.md`); WordPress is chosen at kickoff (question 13, `project-kickoff`)
and recorded in `PROJECT_CONTEXT.md` § Stack and a decision.

Why this file: César writes WordPress code with WPCodeBox 2 (snippets stored in the
database, edited in the admin). That works by hand, but an agent cannot review, version,
test or roll back what lives in a production database. The flow below moves the code into
files in git and runs a local copy of the site, so Claude Code edits, tests with Playwright
and ships it like any other project (César, 2026-10-29).

---

## The shape

```
 production ──(clone once, then pull the DB when needed)──► local copy (wp-env, Docker)
                                                              │  the repo is mounted into it
 repo (git): wp-content/plugins/<client>-site/  ◄── Claude Code edits, WP-CLI, Playwright
             wp-content/themes/<client>-child/
             .wp-env.json · bin/ · tests/
                 │
                 └──► PR → merge → deploy to staging → César checks → production
```

**Only code goes into git**: the site plugin, the child theme, the environment config and
the scripts. Never WordPress core, third-party plugins (they are listed and installed), the
uploads or a database dump (it carries customers' personal data: orders, users, form
entries).

## 1. Where the code lives

- **`<client>-site` plugin**: everything that is functionality (custom post types, shortcodes,
  hooks, WooCommerce tweaks, integrations, REST endpoints). One file per feature in
  `includes/`, loaded from the main file. A plugin and not `functions.php` because it
  survives a theme change.
- **Child theme** (`<client>-child`): only presentation, if the site uses a classic or block
  theme. In a block theme, the design tokens go to `theme.json` (colors, type scale with
  fluid sizes, spacing), which is this stack's `DESIGN_TOKENS`.
- **WPCodeBox**: stays for César's quick one-offs. Anything an agent writes goes to the
  plugin. Existing snippets that matter are moved there once (copy each snippet's code into
  an `includes/` file, deactivate the snippet, test), so there is one source of truth.
- A page builder (Elementor, Bricks…) stays the content and layout tool if the site uses
  one; the agent does not generate builder JSON, it adds widgets, styles and logic through
  the plugin.

## 2. Local copy with wp-env

`@wordpress/env` (Docker, which the kit already requires): scriptable, the same on every
machine, and with a separate tests instance. LocalWP is the GUI alternative if César
prefers it, but an agent cannot drive it.

```json
// .wp-env.json
{
  "core": null,
  "phpVersion": "8.2",
  "plugins": ["./wp-content/plugins/<client>-site", "woocommerce"],
  "themes": ["./wp-content/themes/<client>-child"],
  "port": 8888,
  "config": { "WP_DEBUG": true, "WP_DEBUG_LOG": true, "SCRIPT_DEBUG": true }
}
```

- `bunx @wordpress/env start` → `http://localhost:8888` (user `admin` / `password`, local
  only). `--update` after changing the config. WP-CLI:
  `bunx @wordpress/env run cli wp <command>`.
- `core` and `phpVersion` match production (`wp core version` and the host's PHP): a local
  copy on another version hides the bugs that matter.
- The third-party plugins production uses, at the same versions, in `plugins` (slug from
  wordpress.org, or a zip URL for premium ones César provides).

## 3. Bringing production's data

Once at the start, and again only when a task needs recent content:

1. Export: WP-CLI over SSH if the host allows it (`wp db export`), otherwise a migration
   plugin (WP Migrate, All-in-One WP Migration, Duplicator) — an action for César.
2. Import into the local copy: `wp db import <file>` through `run cli`, then
   `wp search-replace 'https://<domain>' 'http://localhost:8888' --all-tables`.
3. Uploads: only if the task needs them (they weigh gigabytes). Otherwise images 404
   locally, and that is acceptable.
4. **Personal data**: the dump stays outside the repo (`.gitignore`: `*.sql`, `*.wpress`)
   and is deleted when the task ends. For QA, anonymize users and orders
   (`wp user update`, or a `bin/anonymize.sh`) before an agent walks the flows.

Content changes the code needs (a page, an option, a menu) are **WP-CLI scripts in
`bin/`**, not clicks in the local admin: the database is not in git, so a click is lost and
cannot be repeated on staging or production.

## 4. How the kit's rules translate

| Kit piece | In WordPress |
|---|---|
| `backend-build` §2 security | Nonce on every form and AJAX/REST call (`wp_nonce_field` / `check_admin_referer`, `permission_callback` on REST routes); capability check (`current_user_can`) before every action; **sanitize on input** (`sanitize_text_field`, `absint`…) and **escape on output** (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`); `$wpdb->prepare` for every query with a variable |
| `QA-PREVENTION.md` | Same classes: `trim` → `sanitize_text_field` + an empty check after it; double submit → the button disabled + a nonce that is single-use or a server-side duplicate check |
| `PATTERNS.md` | The behaviours (validation modes, list states, auth criteria) apply; the registry's TS code does not, unless the plugin ships a JS build |
| `a11y` | Applies as is: axe-core and Playwright work on any HTML. The theme and every builder widget are checked |
| `seo` | Through the SEO plugin the site uses (Yoast, Rank Math): titles, OG, schema and sitemap are its settings; the skill's checks still apply to the output |
| QA agents | `functional-qa` and `design-qa` run against `http://localhost:8888` (or staging), with Playwright, as for Next |
| Lint | `php -l` on every changed file (always); PHPCS with WordPress Coding Standards if the project installs it (`composer`) |

## 5. Shipping

- **Never edit production directly** (neither files nor snippets): what is not in git
  cannot be rolled back.
- Staging first: the host's staging or a `staging.<domain>` copy. Deploy of the plugin and
  child theme folders by a GitHub Action (rsync over SSH or SFTP, with the host's
  credentials as repository secrets — an action for César) on merge to `main`, or WP Pusher
  if the host gives no SSH.
- Then the `bin/` scripts the change needs, on staging, then production after César checks
  staging. The PR lists which scripts run where.
- Before production: a backup from the host's panel (an action for César) — WordPress
  updates and deploys are the usual way a site breaks.
