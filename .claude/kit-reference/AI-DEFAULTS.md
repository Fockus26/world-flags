# AI defaults — what makes a design look generic, and how to catch it

Why this exists: designs that came out of Claude Design looked like every other
AI-generated site — the same fonts, the purple gradient, the rounded icon tile above each
heading (César, 2026-11-20). Claude Design does not load skills, so the defence has two
points the kit controls: **the brief** (the rules go inside it, since Claude Design sees
nothing else) and **a measurement** of the result with a deterministic detector.

The list of defaults is distilled from Anthropic's `frontend-design` skill and Paul Bakaus'
Impeccable (Apache-2.0). In a side-by-side test of eight design skills, the most generic
page came from the one that relies on a catalog of styles, and the most distinctive from
the one that grounds the design in the product itself (Paralect, 2026): that is why the
brief asks for an anchor in the business, not a style label.

---

## 1. In the brief

`prompts/CLAUDE-DESIGN-BRIEF.template.md` § 2 carries the block "AI defaults this design
must avoid" and the anchor. It is copied as is: it is not summarized and nothing is cited,
because the brief is self-contained. A default that the brief itself closes on purpose (the
client's mandatory font is Inter) is not a default: delete that line of the block.

## 2. The detector — `impeccable detect`

A CLI with 62 rules and no LLM or API key: 31 `slop` rules (the AI tells) and 31 `quality`
rules (contrast, heading order, tiny text, line length, overflow). Tested with 4.8.0 on
Windows, on a folder of HTML and on a local URL (it renders with the installed Chrome or
Edge).

```bash
export IMPECCABLE_NO_TELEMETRY=1          # the CLI has an anonymous usage channel; off
npx -y impeccable@4.8.0 detect --json <folder-or-url> > .qa/ai-defaults-<name>.json
npx -y impeccable@4.8.0 detect --json --viewport 390x844 <url> > .qa/ai-defaults-<name>-390.json
```

- **Pinned version.** A new release can add rules and change the result between two runs
  of the same site; upgrade it in the kit, on purpose, after trying it.
- **Exit codes:** `0` nothing found · `2` findings (not an error: read the JSON) · `1` a
  target could not be scanned (goes to "Not verified").
- **On source (`.tsx`) it only applies pattern rules**; contrast and size need the
  rendered page. Run it on the URL of the running site, not on `components/`.
- Every finding carries `antipattern` (the rule id), `category`, `snippet` and `selector`.
  `npx -y impeccable@4.8.0 detect --list-rules` prints the catalog.

## 3. How to read what it returns

- **`slop` findings** are a design decision, not a bug: they go to César as
  "decisión de diseño", never fixed silently by `frontend-build`. One that the handoff
  chose on purpose (it is in its "Decisions and traps", or the brief closed it) is not a
  finding: it is listed as accepted.
- **`quality` findings** repeat what axe and `design-qa` already measure. They count only
  when they add something axe missed (contrast of text over a gradient is the common one),
  and then as a normal finding with its evidence.
- `marketing-buzzword`, `aphoristic-cadence`, `theater-slop-phrase` and `em-dash-overuse`
  read the copy: with placeholder copy they say nothing about the final site.
