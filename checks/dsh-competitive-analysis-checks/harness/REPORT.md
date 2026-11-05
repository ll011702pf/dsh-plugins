# Verification report — @local/dsh-competitive-analysis

Artifact: `plugins/dsh-competitive-analysis/` (workspace bundle, linked into a local DSH profile)
Harness: DSH Web GUI, local profile
Node: DSH-bundled Node runtime (v26.7.0)

> Both scripts resolve the plugin directory relative to their own location
> (`../../../plugins/dsh-competitive-analysis`), so the suite runs from any checkout:
> `node verify.mjs` / `node regress-date.mjs` inside this directory.

## Install

`plugin_manager` `install_bundle` → `application: applied`, `warnings: []`,
package added as `@local/dsh-competitive-analysis@1.0.0` via `link:`.

## Live registration (cordis_inspect_query)

| Probe | Observed |
|---|---|
| `Slots.listSubTree(root='sidebar.panellist')` | occupant `competitive-analysis`, order `30`, `active: true` |
| `Slots.listSubTree(root='main')` | key `competitive-analysis`, `active: true` |
| `Config.listConfigs(name=...)` | entry `include:competitive-analysis`, patchId `competitive-analysis`, status `absent` (no `Config` export → expected) |

## Automated checks

`harness/verify.mjs` — **30 passed, 0 failed**
`harness/regress-date.mjs` — **11 passed, 0 failed**
`node --check client.js` / `index.js` — OK

Covered: manifest + exports/files coverage, icon bounds/external refs, locale `meta`
localization, loader entry id, factory purity (no localStorage/document/global writes),
`inject` list, `apply` wiring (exactly the two slot registrations + locale), effect
disposers, zh/en dictionary parity (107 keys each, no empties), all 95 `t()` literals
resolvable, `__pure` units (sanitize on 10 malformed payloads, rating pruning, weight
clamping, weighted-average arithmetic hand-verified, dense ranking, Markdown table
escaping, empty-doc report, zero-dimension report, extreme timestamps, filename safety).

## Defects found and fixed

| # | Severity | Location | Defect | Fix |
|---|---|---|---|---|
| 1 | major | `client.js` `toMarkdown` | `sanitize` admits `updatedAt` values (`1e21`, `8.64e15+1`, `Infinity`) that make `new Date().toISOString()` throw `Invalid time value`, crashing the whole panel on render | added `isoDate()` guard with `isFinite`/`isNaN`/try-catch fallback; regression test covers 8 hostile values |
| 2 | minor | `client.js` `reportFileName` | subject `../../etc/passwd` produced a leading-dot (hidden) filename `..-..-etc-passwd-…md` | edge stripping now `^[-.]+|[-.]+$`; separators/edge dots removed by test |
| 3 | minor | `client.js` tab markup | hidden tabs pointed `aria-controls` at a tabpanel id that does not exist while unmounted | `aria-controls` emitted only for the selected tab |
| 4 | minor | `client.js` `resetAll` | duplicated `setArmed(false); setArmed(true);` left by editing; confirm state never auto-cleared | replaced with a single `setArmed(true)` + 4 s `setTimer` that clears it |

## Static conformance

- Only `--dsw-alias-*` theme tokens plus `--dsh-frame-top-clearance`; **zero** literal
  hex/rgb/hsl colors in CSS (53 token references).
- No `require('@deepseek-ai/...')`; only `require('react')`.
- No `document.body` writes; single `document.createElement('a')` inside the download handler.
- All three registrations live inside `apply`; `<style>` renders as a React element.
- localStorage key exactly `dsh.competitive-analysis.doc.v1`.

## Verification limits

- The endpoint answers `401` to unauthenticated fetch and no `dev:web` watcher is running,
  so the updated `client.js` was **not** re-fetched into the browser. The sidebar and main
  panel registrations are confirmed live from the **pre-fix** module generation; defects 1–4
  are pure-function/markup fixes proven by the offline suite, but the rendered result of the
  updated module is unverified until the page is reloaded.
- Rendered appearance in light/dark theme was not observed (no browser control available);
  theme conformance is established statically via token usage only.
