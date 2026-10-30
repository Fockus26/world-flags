# QA prevention — defects QA keeps finding, built out from the start

The QA agents find the same **classes** of defect again and again, in every project. Each
one is cheap to prevent when the piece is written and expensive to find later: a QA round,
a fix unit, a class sweep. This list is what the builders (`frontend-build`,
`backend-build`, the `feature-worker`s) check **while writing**, not what QA checks after.

**How to use it:** before closing a unit, go through the sections that apply to what you
touched (a form → §1 and §2; a list or a long name → §4). Do not read the rest.

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
| Leading/trailing spaces saved (`" ana@x.com"` duplicates an account) | `.trim()` on every text field; emails also `.toLowerCase()` before the uniqueness check | functional-qa §1 |
| Two-digit year saved as 1926 | Dates are never parsed from free text with `new Date(str)`: a date picker, or a 4-digit year enforced in the schema (`z.number().int().min(1900).max(<current + N>)`) | inversiones-js (High, data loss) |
| Numbers: negative, `0`, `1e10`, decimals where they make no sense | `z.coerce.number().int().positive().max(<real max>)` per field; `inputMode="numeric"` is UX, not validation | functional-qa §1 |
| Unlimited length breaks the UI or the database | `.max()` on every string, the same as the column; the UI handles the max (§4) | functional-qa §1 |
| Client-only validation | The same schema runs on the server (`backend-build` › Validation) | backend-build |

## 2. Submit and state

| Defect | Prevention | Seen in |
|---|---|---|
| Double click or repeated Enter creates two records or charges twice | Button `disabled` + `aria-busy` while the request is in flight **and** an idempotent server (unique key per operation, or idempotency key on payments) | functional-qa §2 (the most common and most expensive) |
| An edit dialog overwrites a change made meanwhile (another tab, another user) | Save with a version or `updated_at` check (`WHERE id = $1 AND updated_at = $2`); on conflict, say so and reload, never overwrite silently | inversiones-js (High, data loss) |
| Back after submitting resubmits | Redirect after a successful POST (PRG); the form resets or the page shows the done state | functional-qa §2 |
| Session expired mid-form loses what was typed | The 401 is handled: the draft is kept (state or `sessionStorage`) and the user returns to it after login | functional-qa §4 |
| A cached old client keeps re-uploading data the server deleted | Version the stored keys; the new client invalidates the old data (`backend-build` › General) | world-flags |

## 3. Network and errors

| Defect | Prevention | Seen in |
|---|---|---|
| A failed request leaves the spinner forever | Every request has its error state and a retry; a timeout, not an infinite wait | functional-qa §3 |
| The error says nothing ("Algo salió mal") | Expected errors are results with a message the user can act on (`backend-build` › Conventions) | functional-qa §7 |

## 4. Layout under real content (200 % text, 320 px)

| Defect | Prevention | Seen in |
|---|---|---|
| A row of buttons or chips overflows | `flex-wrap`, and the button allows its text to wrap | world-flags ×4 rounds |
| A long name is clipped with no way to read it | Never `truncate` alone: tooltip or a second line; headings with `wrap-anywhere`/`break-words` | world-flags |
| A `fixed` toast/banner/sheet covers the screen at 200 % | `max-height` in `dvh` + its own scroll | world-flags |
| A table or strip with horizontal scroll still scrolls the page at 320 px | The scroll container is `relative overflow-x-auto`: without `position`, it does not clip its `absolute` descendants (a `caption.sr-only`) and they stretch the page | melao |
| A grid column overflows at 320 px | `grid-cols-1` as the base (not only `md:grid-cols-2`), and `min-w-0` on items holding buttons or a `fieldset` (their `min-content` widens the track) | melao |

(The detail is in `frontend-build` › Conventions; if the project has a versioned reflow
script, it runs on the new piece.)

## 5. Interaction and motion

| Defect | Prevention | Seen in |
|---|---|---|
| Accordions, tabs, selects open and close with a jump; anchor links teleport | Animated with the motion tokens and turned off under `prefers-reduced-motion` (`frontend-build` › Motion in interactive widgets) | César, 2026-10-23 |
| An anchor link lands with the target under the sticky header | `scroll-margin-top` on the targets equal to the header's height token | César, 2026-10-23 |
