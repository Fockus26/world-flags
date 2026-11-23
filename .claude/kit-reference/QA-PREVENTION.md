# QA prevention — defects QA keeps finding, built out from the start

The QA agents find the same **classes** of defect again and again, in every project. Each
one is cheap to prevent when the piece is written and expensive to find later: a QA round,
a fix unit, a class sweep. This list is what the builders (`frontend-build`,
`backend-build`, the `feature-worker`s) check **while writing**, not what QA checks after.

**How to use it:** before closing a unit, go through the sections that apply to what you
touched (a form → §1 and §2; a list or a long name → §4; a timer, client dates or state
shared between tabs → §6; a new color or surface → §7; data shown to other users → §8).
Do not read the rest.

**How it grows:** when a QA (`wave-qa`, `functional-qa`, `design-qa`) reports a finding that
is a class and is not here, its report proposes it in "Feedback para el kit" and it goes to
`context/KIT_FEEDBACK.md` as `Prevención`; `/kit-feedback` brings it to the kit, and the
kit adds the row here. Why this file exists: César saw the same QA findings (forms that
accept only spaces, among others) coming back in every project, because QA detected them
but nothing told the builder beforehand (2026-10-23).

Each row: the defect, the rule that prevents it, and where it came from.

---

## 1. Form inputs

| Defect | Prevention | Seen in |
|---|---|---|
| A required field accepts only spaces (`"   "`) | Every text field in the shared Zod schema with `.trim()` before `.min(1)`: `z.string().trim().min(1, '…')`. The trimmed value is the one saved | César, every project |
| A field joined from others passes with one of them empty (first name `""` + last name), or a password of only spaces | Each field is validated trimmed and **on its own**, before joining them; a password is not trimmed, but one of only whitespace is rejected | KREA |
| Leading/trailing spaces saved (`" ana@x.com"` duplicates an account) | `.trim()` on every text field; emails also `.toLowerCase()` before the uniqueness check | functional-qa §1 |
| Two-digit year saved as 1926 | Dates are never parsed from free text with `new Date(str)`: a date picker, or a 4-digit year enforced in the schema (`z.number().int().min(1900).max(<current + N>)`) | inversiones-js (High, data loss) |
| Numbers: negative, `0`, `1e10`, decimals where they make no sense | `z.coerce.number().int().positive().max(<real max>)` per field; `inputMode="numeric"` is UX, not validation | functional-qa §1 |
| Unlimited length breaks the UI or the database | `.max()` on every string, the same as the column; the UI handles the max (§4) | functional-qa §1 |
| Client-only validation | The same schema runs on the server (`backend-build` › Validation) | backend-build |
| The client accepts what the server rejects, and the generic error points at another field or another step | The client validates **each field** with the server's Zod schema (not a looser copy), the date picker carries the schema's limits, and an `invalid_input` from the server names the field it is about | iglesia-maranatha |
| A 0-byte file passes as "no file" (or as a valid upload) | A `File` with `size === 0` is rejected with its own message, on the client and on the server | iglesia-maranatha |
| A custom control backed by a hidden input ignores `required`, and after the server's "Falta…" the focus lands on `<body>` | A hidden input has no native validation: the client blocks the submit and focuses the control. After any server rejection, the focus goes to the first field with an error | kit-deploy |
| Placeholder text at 3.25:1, and axe passes | The base `Input` and `Textarea` set the placeholder color to a token that gives ≥ 4.5:1 (`placeholder:text-text-2`); the default is the text color at 50 % | workout |

## 2. Submit and state

| Defect | Prevention | Seen in |
|---|---|---|
| Double click or repeated Enter creates two records or charges twice | Button `disabled` + `aria-busy` while the request is in flight **and** an idempotent server (unique key per operation, or idempotency key on payments) | functional-qa §2 (the most common and most expensive) |
| An edit dialog overwrites a change made meanwhile (another tab, another user, **a background process**: a chatbot, a cron) | Save with a version or `updated_at` check (`WHERE id = $1 AND updated_at = $2`); on conflict, say so and reload, never overwrite silently | inversiones-js ×3 (High, data loss; the third time the other writer was a chatbot) |
| A field a background process writes (a reminder the chatbot marks) is overwritten by the edit form with the value it read on opening | The fields another process owns do not travel in the form: the server keeps them. Test: change it by SQL with the editor open, then save | inversiones-js |
| A toggle sends the whole list it read last: the second toggle undoes the first (typical when moving from realtime to polling) | One operation per item on the server (`jsonb_set` by index, a row per item), and the full-record edit merges what is stored | inversiones-js |
| Merging a list of states (paid / unpaid) between form and database with an "or": an installment unmarked in another tab comes back as paid | For what the form did not touch, the database wins; if the plan did not change, the list is not sent. Test: unmark in tab A with the editor open in B, save B | inversiones-js |
| A retry after a lost response hits the unique key and shows as an error: the user may pay again | An identical duplicate of a `pending` record answers `ok` with that record. Test: `route.fetch()` then `route.abort()` and resend | iglesia-maranatha |
| A `CHECK` over nullable columns lets a row through when the expression gives `NULL` | `is null` / `is not null` written out in the check, and a test with `NULL` in one column only | inversiones-js |
| Back after submitting resubmits | Redirect after a successful POST (PRG); the form resets or the page shows the done state | functional-qa §2 |
| A form sent before hydration goes as a native GET: the password ends up in the URL | `method="post"` on every form (or a Server Action as its `action`), and the submit disabled until the page is hydrated | KREA |
| Session expired mid-form loses what was typed | The 401 is handled: the draft is kept (state or `sessionStorage`) and the user returns to it after login | functional-qa §4 |
| A cached old client keeps re-uploading data the server deleted | Version the stored keys; the new client invalidates the old data (`backend-build` › General) | world-flags |
| A limit that reads the counter and adds afterwards lets parallel attempts through (30 of 30 passed; 18 of 30) | Reserve the attempt first with one atomic upsert (`insert … on conflict do update set n = n + 1 returning n`), then check; give it back if it did not count. A limit per IP besides the one per account. Test: 30 attempts in one `Promise.all` | workout, krea, inversiones-js |
| A login limit that reads the email only from a JSON body: a form-urlencoded request skips it | Read the identifier in every content type the auth accepts, or limit in a hook of the auth itself (`tech/vps-postgres.md` › Rate limit by account) | krea |
| Resetting the password does not lift the lock the 429 message promises it will | The reset clears that account's counter (Better Auth: `emailAndPassword.onPasswordReset`) | inversiones-js |
| Saving a whole array with one upsert overwrites what another client added, under "Todo guardado" | Merge by item id or index on the server inside the transaction, or reject with the conflict and say so | workout |

## 3. Network and errors

| Defect | Prevention | Seen in |
|---|---|---|
| A failed request leaves the spinner forever | Every request has its error state and a retry; a timeout, not an infinite wait | functional-qa §3 |
| The error says nothing ("Algo salió mal") | Expected errors are results with a message the user can act on (`backend-build` › Conventions) | functional-qa §7 |
| A storage or API failure shown as "check your connection" | The error type separates "no network" (`navigator.onLine` false, `fetch` rejected) from "the service failed" (a response with 5xx, a provider error); each has its message | KREA (B2) |
| A cron or job hangs on a third party and the next run piles on | Every outbound call in a cron, webhook or job has a timeout (`AbortSignal.timeout(ms)`) and its failure is logged, not awaited forever | world-flags |
| A date the client accepts fails in the database (or the reverse) | The server parses dates with the same strictness as the column: a strict format in the schema (`z.iso.datetime()`, `z.iso.date()`), never `Date.parse`, which accepts what Postgres rejects | world-flags |
| A form action right after login fails as a "network error" with the session open | The proxy/middleware that redirects by session only redirects `GET`/`HEAD`; a `POST` (a Server Action, a form, an API call) without the expected session gets a 401/403 the client handles, never a 307 it cannot follow | KREA |
| A new service worker route is intercepted by the old one | A service worker never caches `/api/*` or other dynamic same-origin routes, and the change ships a new SW version (`tech/astro.md` › A static site that gains an API) | world-flags |
| A form sent with the network cut lands on the error boundary and loses what was typed | Every action is tested with the form open and the network off: it comes back as a result, the fields keep their values. What the client destroys (the offline copy on sign-out) goes after the server answers, not before | workout |
| A rejected write is retried forever, under a text that promises a retry | Every retry queue has an exit for a permanent rejection (4xx): drop the item and tell the user | workout |
| A `useActionState` action without `try/catch` sends a network failure to the error boundary | The action catches and returns an error result; only a bug reaches the boundary | kit-deploy |
| Auth errors translated by HTTP status: the 403 of a bad origin and the 400 of a too-long password showed as "wrong password" / "link expired" | Translate by the provider's error `code`; only the invalid-credentials code counts as a failed attempt | inversiones-js |
| "Cerrar sesión" swallows the error: offline or on a 5xx it stays on "Saliendo…" forever with the session alive | The failure comes back to the button: a message, the button active again. Test: `route.abort()` on the sign-out request | inversiones-js |
| A polling hook keeps its first error: after a failed first load, the good data that follows is dropped | The next good read clears the error and publishes | inversiones-js |
| An expired external credential (a 401/403 from GitHub) shows the same notice as an outage, and nothing records it | Its own text ("la conexión con X caducó, vuelve a conectarla"); its state recorded once, never the credential's value | kit-deploy |

## 4. Layout under real content (200 % text, 320 px)

| Defect | Prevention | Seen in |
|---|---|---|
| A row of buttons or chips overflows | `flex-wrap`, and the button allows its text to wrap (`inline-flex shrink-0` chips get `max-w-full` too) | world-flags ×4 rounds, krea |
| Page action buttons in fixed columns (`grid-cols-2`, `whitespace-nowrap`) burst their box at 200 % text | `flex flex-wrap` with `flex-auto` children (a long word does not fit a grid column), and `whitespace-normal min-h-11 h-auto` on the button | inversiones-js |
| A child with its own horizontal scroll (subnav, chip strip with `-mx-4`) inside a grid or flex widens the page at 200 % text | `min-w-0` on the direct grid/flex child that holds the `overflow-x-auto` | inversiones-js |
| Table cells with `overflow-wrap: anywhere` split status words and SHAs letter by letter on mobile; a `min-w-48` in a flex row overflows at 200 % | `whitespace-nowrap` on cells of short tokens and the table `min-w-max` inside its scroller; `anywhere` only on free text; `min-w-0` on flex rows. `design-qa.ts` reports `word-break@…` | kit-deploy |
| `scrollbar-gutter: stable` on `<html>` plus a modal's scroll lock leaves an empty strip (≈ 12 px) next to drawers, backdrops and full-bleed bands | Cancel the lock's compensation (`body[data-scroll-locked] { margin-right: 0 }` with Radix) or drop the gutter while a modal is open; test with visible scrollbars (Playwright `ignoreDefaultArgs: ['--hide-scrollbars']`) | iglesia-maranatha ×2 |
| A long name is clipped with no way to read it | Never `truncate` alone: tooltip or a second line; headings with `wrap-anywhere`/`break-words` | world-flags |
| A `fixed` toast/banner/sheet covers the screen at 200 % | `max-height` in `dvh` + its own scroll | world-flags |
| A table or strip with horizontal scroll still scrolls the page at 320 px | The scroll container is `relative overflow-x-auto`: without `position`, it does not clip its `absolute` descendants (a `caption.sr-only`) and they stretch the page | melao |
| A grid column overflows at 320 px | `grid-cols-1` as the base (not only `md:grid-cols-2`), and `min-w-0` on items holding buttons or a `fieldset` (their `min-content` widens the track) | melao |
| 200 % text at 390 px scrolls every route sideways | Widths in `rem` (`w-*`, `min-w-*`) only on rows that wrap; fixed bars with `max-w-full`. Measured with the browser's font size (CDP `Page.setFontSizes`, as `design-qa.ts` does), not by injecting a `font-size` | KREA |
| With the browser font at 150 % (`html { font-size: 150% }`) a screen leaves the viewport, and zoom does not show it | Test each screen that way too; grid tracks `minmax(0, 1fr)` instead of `1fr` | workout |

(The detail is in `frontend-build` › Conventions; if the project has a versioned reflow
script, it runs on the new piece.)

## 5. Interaction and motion

| Defect | Prevention | Seen in |
|---|---|---|
| Accordions, tabs, selects open and close with a jump; anchor links teleport | Animated with the motion tokens and turned off under `prefers-reduced-motion` (`frontend-build` › Motion in interactive widgets) | César, 2026-10-23 |
| An anchor link lands with the target under the sticky header | `scroll-margin-top` on the targets equal to the header's height token | César, 2026-10-23 |
| With a fixed bottom (or top) bar, the element focused with Tab stays under it | `scroll-padding-bottom` / `scroll-padding-top` on `html` equal to the bars' height tokens | KREA |
| In high contrast (`forced-colors`) the selected option of a segmented control or tab is not marked, and a logo drawn with a mask + `background-color` disappears | The selected state carries a `forced-colors:` variant (`outline` in `Highlight`); a masked drawing gets a `@media (forced-colors: active)` rule that paints it in `CanvasText`, or is an `<svg>` with `currentColor` | KREA |
| In high contrast a filled primary button without a border disappears (its background is dropped) | Filled variants carry `border border-transparent`: forced colors paint the border | kit-deploy |
| A global notice about the last operation survives the next one and covers its controls | Cleared when the next operation starts, or rendered only inside its own view. Test: trigger it and start another without closing it | world-flags |
| A count in a label ("Práctica diaria (3)") and the action it runs disagree | The label and the action call the same function on the same data (not one recomputed and one stored) | world-flags |
| A button removes its own card and the second tap lands on the card below | After an action that removes or reorders the pressed item, ignore the next tap for an instant (≈ 300 ms) or move focus to a neutral element | workout |
| A notice with an action fired from a modal cannot be pressed | The modal makes the rest of the page inert (`pointer-events`, `inert`): notices with an action are rendered inside the modal's layer, or the modal closes first | workout |
| A toast fired while a dialog or drawer is open is not announced: the modal puts its sibling Toaster under `aria-hidden` | While the modal is open, the action's result goes in a live region (`role="status"` / `alert`) inside it; a toast only after it closes | iglesia-maranatha, krea |
| Focus falls to `<body>` when a dialog closes: the confirmed action removed the button that opened it, or the dialog has no `DialogTrigger` | The dialog gives focus an explicit target on close (Radix `onCloseAutoFocus` with `event.preventDefault()` and `.focus()` on the control that opened it, or on the list after a delete) | iglesia-maranatha, krea |
| A Popover + Command combobox traps Tab in its search field (FocusScope `loop` with one focusable) | Tab from the search closes the popover and moves the focus to the next field | kit-deploy |
| A loading bar that opens on `popstate` stays stuck (Chrome fires it on `#anchor`; on back/forward the router already changed the pathname before the listener) | It closes against the URL committed when it opened (pathname + search), never "the pathname changed afterwards"; and it opens for `router.push` too (navigate with `<Link>` or wrap the router), not only for `<a>` clicks | iglesia-maranatha ×2 |
| A notice opened from a sheet shows its veil under the sheet | One scrim level per layer (sheet, dialog, notice), never a shared `z-scrim`; "notice from a sheet" is in the test list | workout |

## 6. Clocks, dates and tabs

Why this section: in world-flags `functional-qa` found seven defects of these classes in one
wave, none of which a builder had looked at (2026-11-06).

| Defect | Prevention | Seen in |
|---|---|---|
| A clock change or the computer sleeping takes time off a timer | One clock per measurement: a duration from `Date.now()` is never subtracted from a `performance.now()` mark. Pauses are stamped with the timer's clock, with the start as the floor. Test: `page.clock.setSystemTime` mid-timer | world-flags |
| A metric over a timer with pauses counts wall time (idleness counted while a modal was open) | Measure only the stretches in which the timer really ran. Test: leave the pausing modal open for the threshold's time | world-flags |
| A client clock set ahead blocks a feature for months ("less than X ago", "the last N" by date) | Dates later than `now + tolerance` are ignored or clamped when reading, recording and merging (also when merging progress from another device) | world-flags |
| Another tab merges a half-written state, or another account's data | Every `setItem` of a synced key writes a complete state (never a provisional one and then the corrected one), and the key that says whose data it is is written before the data | world-flags |
| A notice ("just happened") shows in every open tab | Effects that announce tell a change made here from one adopted from another tab (`storage` event, `BroadcastChannel`) and announce only the first | world-flags |
| Logging in or out in one tab leaves the others on the old session | A session change is announced to the other tabs (`BroadcastChannel`, or a `storage` key) and they reload their state; an httpOnly cookie changes nothing they can see by themselves | world-flags |

## 7. Color on the real backgrounds

Why this section: three projects shipped text that passed on paper and failed where it was
painted — a dark surface with light-mode tokens, a token that changed meaning between
themes, white text over the light end of a scale (iglesia-maranatha, krea ×3).

| Defect | Prevention | Seen in |
|---|---|---|
| A fixed dark surface (a modal, a band) inherits `--secondary`/`--primary` from light mode: text at 3.70:1 | Every fixed dark surface carries a `data-surface="…"` and that block redefines the tokens its text uses | iglesia-maranatha |
| A token changed for one theme breaks pairs elsewhere | When a token changes, go through every `bg-<token>` with its text in both themes and every accent, not only the screen of the request | krea |
| White text with a shadow over a continuous scale passes at the dark end and fails at the light one | Measure with axe over the whole range of the data (lowest and highest value), not the sample on screen | krea |
| A decorative layer (gradient, pattern, glow) lowers the contrast of the text over it | Contrast is measured on the composed background, with the layer, in every accent | krea |

## 8. Data other users see

| Defect | Prevention | Seen in |
|---|---|---|
| A personal identifier (ID number, email) is the key of data other users see (a ranking), or seeds what they see (an avatar) | Opaque ids in every payload visible to others; a field derived from a personal datum is personal too | krea ×2 |
