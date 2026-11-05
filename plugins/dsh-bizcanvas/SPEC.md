# dsh-bizcanvas — frozen interface contract & product spec

Owned by the Lead. Writers must not edit this file. Every identifier below is frozen:
the bundle half, the client half, and the verifier all build against exactly these values.

Product: a **Business Model Canvas** studio in the Harness Web sidebar — the nine
Osterwalder blocks, sticky-note style entries per block, drag & drop between blocks,
multiple named canvases, and Markdown / JSON export.

## 1. Identity (frozen)

| Item | Value |
| --- | --- |
| Workspace directory | `dsh-bizcanvas/` |
| Package name | `@local/dsh-bizcanvas` |
| Loader row id (patch `insert`) | `bizcanvas` |
| Client module loader id | `@local/dsh-bizcanvas` |
| Sidebar slot / cell id | `sidebar.panellist` / id `bizcanvas`, `order: 35` |
| Label | `() => t('panel.title')` (thunk, so the active locale is re-read) |
| Main panel slot | `main` keyed by exactly `bizcanvas` |
| Client locale namespace | `bizcanvas` |
| Storage key | `dsh.bizcanvas.doc.v1` |
| CSS class prefix | `dsh-bc-` |
| Icon | `icon.svg` (original artwork, package root) |
| Download filename prefix | `bizcanvas-` |

`sidebar.panellist` registration fields are `id`, `order`, `label`; the owner renders the
cell component with props `{ size: number, active: boolean }`. `main` is keyed: register
`{ name: 'main', key: 'bizcanvas' }`. Both are confirmed live via `Slots.listSubTree`.

Existing bundle orders in this profile: note-wall 20, mindmap 25, kanban 30,
prd-studio 30, competitive-analysis 30. `35` is unique and places the entry last.

## 2. Manifest (frozen shape)

```json
{
  "name": "@local/dsh-bizcanvas",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "...",
  "exports": {
    ".": "./index.js",
    "./client": "./client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg"
  },
  "files": ["index.js", "client.js", "cordis.patch.yml", "locale/*.json", "icon.svg"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": [
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-sidebar"
      ]
    }
  }
}
```

`cordis.patch.yml` (exact):

```yaml
- insert:
    - id: bizcanvas
      name: '@local/dsh-bizcanvas'
```

`index.js` (exact intent): a Host half that registers nothing — the canvas document is
entirely browser-owned. It must export `export function apply() {}` with a short comment.

`locale/en.json` and `locale/zh.json` carry **only** `meta.title` and `meta.description`
(Plugin Manager / bundle-details display metadata). Runtime UI strings do **not** live here;
they live in the `DICT` inside `client.js` (same split as the shipped-working
`../dsh-note-wall` bundle).

## 3. Blocks (frozen — ids, order, grid placement)

Nine fixed block ids, in this exact array order. The array order is the reading order used
by "previous / next block" item moves and by Markdown export.

| # | id | zh title | en title |
| --- | --- | --- | --- |
| 0 | `keyPartners` | 重要合作 | Key Partners |
| 1 | `keyActivities` | 关键业务 | Key Activities |
| 2 | `keyResources` | 核心资源 | Key Resources |
| 3 | `valuePropositions` | 价值主张 | Value Propositions |
| 4 | `customerRelationships` | 客户关系 | Customer Relationships |
| 5 | `channels` | 渠道通路 | Channels |
| 6 | `customerSegments` | 客户细分 | Customer Segments |
| 7 | `costStructure` | 成本结构 | Cost Structure |
| 8 | `revenueStreams` | 收入来源 | Revenue Streams |

Guiding question per block (shown under the title, localized, keys `question.*`):

| id | zh question | en question |
| --- | --- | --- |
| `keyPartners` | 谁是我们最重要的合作伙伴与供应商？ | Who are our key partners and suppliers? |
| `keyActivities` | 价值主张需要哪些关键业务活动？ | Which key activities does our value proposition need? |
| `keyResources` | 价值主张需要哪些核心资源？ | Which key resources does our value proposition need? |
| `valuePropositions` | 我们为客户解决什么问题、创造什么价值？ | What problem do we solve, and what value do we create? |
| `customerRelationships` | 我们与每类客户建立什么样的关系？ | What relationship does each customer segment expect? |
| `channels` | 我们通过哪些渠道触达客户？ | Through which channels do we reach customers? |
| `customerSegments` | 我们为谁创造价值？谁是最重要的客户？ | For whom do we create value? Who are our most important customers? |
| `costStructure` | 商业模式中最重要的成本是什么？ | What are the most important costs in our model? |
| `revenueStreams` | 客户愿意为什么付费？如何付费？ | For what value are customers willing to pay, and how? |

**Grid placement** — the canvas is a CSS grid of **11 columns × 3 rows** (tenths + gutters
are NOT used; use literal `1 / 3` style integer line numbers on an 11-unit grid):

| block | grid-column | grid-row |
| --- | --- | --- |
| `keyPartners` | `1 / 3` | `1 / 3` |
| `keyActivities` | `3 / 5` | `1 / 2` |
| `keyResources` | `3 / 5` | `2 / 3` |
| `valuePropositions` | `5 / 7` | `1 / 3` |
| `customerRelationships` | `7 / 9` | `1 / 2` |
| `channels` | `7 / 9` | `2 / 3` |
| `customerSegments` | `9 / 11` | `1 / 3` |
| `costStructure` | `1 / 6` | `3 / 4` |
| `revenueStreams` | `6 / 11` | `3 / 4` |

Grid rows: `grid-template-rows: minmax(176px, 1fr) minmax(176px, 1fr) minmax(132px, 0.8fr)`
with `grid-template-columns: repeat(11, minmax(0, 1fr))`, `gap: 10px`. The grid has
`min-width: 940px`; the scrolling container provides horizontal scroll on narrow panels.

Below `@media (max-width: 900px)` the canvas **must** degrade to a single column
(`grid-template-columns: 1fr`, every block `grid-column: 1 / -1`, `grid-row: auto`,
`min-width: 0`) in the frozen block array order, with `min-height` per block so it stays usable.

## 4. Data model (frozen)

```js
{
  version: 1,
  activeId: string,          // id of the canvas shown; repaired to canvases[0].id if unknown
  canvases: [Canvas, ...]    // at least one canvas after bootstrap
}

// Canvas
{
  id: string,                // 'c' + Date.now().toString(36) + 5 random base36 chars
  name: string,              // may be '' while being typed; rendered as canvas.untitled
  blocks: {                  // all nine frozen block ids always present, each an array
    keyPartners: [Item, ...],
    keyActivities: [Item, ...],
    keyResources: [Item, ...],
    valuePropositions: [Item, ...],
    customerRelationships: [Item, ...],
    channels: [Item, ...],
    customerSegments: [Item, ...],
    costStructure: [Item, ...],
    revenueStreams: [Item, ...]
  },
  createdAt: number,
  updatedAt: number
}

// Item
{
  id: string,                // 'i' + Date.now().toString(36) + 5 random base36 chars
  text: string,              // may be '' only while being created
  color: null | 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange',
  createdAt: number,
  updatedAt: number
}
```

Array index inside a block **is** the item order.

`sanitizeDoc(raw)` must accept any hand-edited/stale localStorage payload and return a
well-formed document without ever throwing into render:

- non-object payload, `null`, string, array → `null` (caller then bootstraps a fresh doc)
- `canvases` missing/not an array → `null`
- each canvas: non-object dropped; missing/typo'd `id` repaired; duplicate canvas ids across
  the document repaired (second occurrence gets a fresh id); `blocks` missing/not an object
  → every block set to `[]`; unknown block keys dropped; unknown item colors coerced to
  `null`; non-object items dropped; item `id` repaired when missing or duplicated **within a
  canvas**; `text` coerced with `typeof === 'string' ? text : ''`; timestamps repaired to a
  number.
- `activeId` unknown or missing → first canvas id.
- An empty `canvases` array is **valid** (the user deleted every canvas): represent it as
  `{ version: 1, activeId: '', canvases: [] }` and let the panel render the panel-level empty
  state.

`loadDoc()` / `saveDoc(doc)` wrap `window.localStorage` in try/catch. Storage being
unavailable or throwing (private mode, quota) must never break the canvas — it keeps working
in memory for the page session.

## 5. Behaviour requirements

The canvas is the `main` panel under the `bizcanvas` sidebar entry. Required:

1. **Bootstrap** — with no stored document, create one canvas (localized default name via
   `canvas.untitled` is NOT baked into the model; `name: ''` renders `canvas.untitled`) with
   all nine blocks empty. With a stored document, restore it exactly.
2. **Nine blocks** — always all nine rendered, each showing its localized title, its
   localized guiding question, its item count, an add control, and its items. Empty blocks
   show the localized `block.empty` placeholder.
3. **Add item** — the add control in a block header appends a new item (`text: ''`,
   `color: null`, priority ordering: appended at the end of that block) and opens the editor
   overlay with the text field focused. Also keyboard-operable (it is a real `<button>`).
4. **Item editor overlay** — clicking an item (a real `<button>`) opens a dialog with:
   text textarea, block selector (all nine blocks), color selector (default + six tints),
   Delete, Cancel, Save. `Esc` closes without saving (must call `preventDefault`-free
   `stopPropagation` so the host does not also react, and must not save). An item whose text
   is empty on save is kept with `text: ''` and rendered with the localized `item.untitled`
   placeholder, never as a broken layout. Saving unchanged content is allowed.
5. **Delete item** — from the editor, plus a hover/focus delete control on the item itself.
6. **Drag & drop between and within blocks** — HTML5 drag events. Dragging an item over a
   block shows a 2px drop indicator at the computed insertion index (compare the pointer
   against item midpoints); dropping moves the item into that block at that index. Dropping
   an item back onto its own position must be a no-op byte-for-byte (no timestamp churn is
   acceptable but the item must not move). Because `dataTransfer.getData` is not readable
   during `dragover`, the drag source lives in React state, not in `dataTransfer`.
7. **Keyboard-accessible move** — every item exposes "move to previous block" / "move to next
   block" controls reachable and operable by keyboard, sharing the same `moveItem` operation
   as drag & drop. At the first block only "next" is offered; at the last block only
   "previous". These must not be drag-only paths.
8. **Multiple canvases** — a tab strip lists every canvas by name (active tab marked
   `aria-selected="true"`), a `+` creates a new canvas (appended, made active, name `''`),
   tabs switch the active canvas, and the header exposes deleting the active canvas behind
   `window.confirm(t('confirm.deleteCanvas'))`. Deleting the last canvas leaves the document
   with zero canvases and the panel shows its empty state with a recovery action.
9. **Rename** — a text input in the header edits the active canvas name directly
   (`onChange`), committed to state immediately. An empty name renders as `canvas.untitled`
   on the tab and in exports.
10. **Export** — three header actions in one menu:
    - **Markdown**: builds a document for the active canvas —
      `# <name>` then, for each block **that has items**, `## <block title>` followed by
      `- <item text>` lines. Items with empty text render as `item.untitled` text. If the
      canvas has no items at all, output `# <name>` + blank line + `export.empty`. Downloads
      as `bizcanvas-<slug>.md`.
    - **JSON**: downloads `{ version, exportedAt, canvases }` as
      `bizcanvas-<yyyymmdd>.json`.
    - **Copy Markdown**: same Markdown to `navigator.clipboard.writeText`, with `toast.copied`
      on success and `toast.copyFailed` on rejection/absence of the API.
    - Menu closes on selection, on `Escape`, and on an outside pointer press. Download uses a
      Blob object URL + a synthetic anchor click; the object URL must be revoked.
11. **Persistence** — every document change is written to `localStorage[STORAGE_KEY]`;
    a fresh page load restores it.
12. **Empty states** — a block with no items shows `block.empty`; a document with no canvases
    shows a panel-level empty state (`empty.title` / `empty.hint`) plus a button that creates
    a canvas.
13. **Localization** — all visible text goes through `ctx.locale`; dictionary registered
    under namespace `bizcanvas` with both `zh` and `en` dictionaries (both are shipped
    locales and registration requires the balanced pair). The panel must re-render on a
    locale change without re-registering: subscribe with `ctx.locale.subscribe` in a
    `React.useEffect` (see `../dsh-mindmap/client.js`), and mount the `_` on unsubscribe.
    `meta` titles/descriptions in `locale/*.json` must describe a business model canvas.
14. **No forbidden surface** — no network calls, no iframe, no `document.body` mutation, no
    import of any `@deepseek-ai/*` client package inside `client.js`, no JSX/TypeScript.

## 6. Visual & theming rules

- Follow `../dsh-note-wall/client.js` and `../dsh-kanban/client.js` for structure:
  `window.__ModuleLoader__.load({ id, factory(require) { ... return { inject: ['slots','locale'], apply(ctx) {...} } } })`,
  a `CSS` string injected as a `<style>` element rendered by the component, and
  `ctx.effect(...)` for the dictionary registration. `require` is only ever called with
  `'react'`.
- Chrome (backgrounds, borders, labels, buttons, focus ring, empty states, drop indicator)
  must use host theme tokens, not literals. Known-good tokens:
  `--dsw-alias-bg-base`, `--dsw-alias-bg-layer-1`, `--dsw-alias-bg-layer-2`,
  `--dsw-alias-border-l1`, `--dsw-alias-border-l2`, `--dsw-alias-label-primary`,
  `--dsw-alias-label-secondary`, `--dsw-alias-brand-primary`.
  Use `var(--dsh-frame-top-clearance,0px)` as top padding, as the working references do.
- The nine block accents and the six sticky-note tints are **artwork** and may use literal
  colors. Frozen accents (one per block, used as the block's title bar / left rule):
  `keyPartners #4a6fa5`, `keyActivities #3f7d6a`, `keyResources #2f8f8f`,
  `valuePropositions #c9772f`, `customerRelationships #8a5fb0`, `channels #3d7bb8`,
  `customerSegments #b3543f`, `costStructure #6b6f7d`, `revenueStreams #2f8a52`.
  Frozen item tints (light sticky-note surfaces stay light in either theme, with a dark fixed
  ink `#23262b`): `yellow #ffe9a8`, `pink #ffd9e2`, `green #cdeecb`, `blue #cfe4ff`,
  `purple #e2d9ff`, `orange #ffddc4`. `color: null` items use theme tokens, not tints.
- Respect `@media (prefers-reduced-motion: reduce)` for any transition.
- Light/dark: do not hardcode a dark-only or light-only surface for chrome.

## 7. i18n dictionary keys (frozen — use exactly these, both locales, no extras)

`panel.title`, `panel.subtitle`, `panel.newCanvas`, `panel.unit`, `panel.rename`,
`panel.export`, `panel.deleteCanvas`, `panel.canvasList`,
`panel.exportMarkdown`, `panel.exportJson`, `panel.copyMarkdown`,

`block.keyPartners`, `block.keyActivities`, `block.keyResources`, `block.valuePropositions`,
`block.customerRelationships`, `block.channels`, `block.customerSegments`,
`block.costStructure`, `block.revenueStreams`,
`block.addItem`, `block.empty`, `block.unit`,

`question.keyPartners`, `question.keyActivities`, `question.keyResources`,
`question.valuePropositions`, `question.customerRelationships`, `question.channels`,
`question.customerSegments`, `question.costStructure`, `question.revenueStreams`,

`item.untitled`, `item.edit`, `item.delete`, `item.movePrev`, `item.moveNext`, `item.color`,
`color.default`, `color.yellow`, `color.pink`, `color.green`, `color.blue`, `color.purple`,
`color.orange`,

`editor.title`, `editor.newTitle`, `editor.fieldText`, `editor.fieldBlock`, `editor.fieldColor`,
`editor.textPlaceholder`, `editor.save`, `editor.cancel`, `editor.delete`,

`empty.title`, `empty.hint`, `empty.create`,

`canvas.untitled`, `confirm.deleteCanvas`, `export.empty`,

`toast.copied`, `toast.copyFailed`, `toast.exported`,

`aria.canvas`, `aria.block`, `aria.dragging`, `aria.item`, `aria.tabs`

Chinese (`zh`) is the primary language for this user; English (`en`) must be a complete,
natural translation of the same key set. No missing keys, no extra keys, in either dictionary.

## 8. Write scopes (advisory, disjoint)

| Owner | Files |
| --- | --- |
| Lead | `SPEC.md`, installation, `DELIVERY.md`, final acceptance, last-resort integration fixes in `client.js` |
| `bundle-shell` | `package.json`, `cordis.patch.yml`, `index.js`, `locale/en.json`, `locale/zh.json`, `icon.svg` |
| `canvas-ui` | `client.js` |
| `verifier` | `.verify-bizcanvas/harness.mjs`, `.verify-bizcanvas/report.md` (report only; never edits shipped files) |

## 9. Acceptance criteria

- `node --check` passes on `index.js` and `client.js`; all JSON parses; the YAML patch is
  valid and its row id is `bizcanvas`.
- Every declared export path resolves to a real file; `files` covers every runtime file
  plus the patch, locales and icon.
- The icon is a valid SVG under 256 KiB whose bytes render, with an original composition.
- Loading `client.js` through a fake `__ModuleLoader__` with a stubbed `require` (only
  `'react'`) and applying it against fake `slots`/`locale` services registers exactly:
  one `sidebar.panellist` entry `{id:'bizcanvas', order:35, label thunk}`,
  one `main` entry keyed `bizcanvas`, and one locale dictionary pair under `bizcanvas`.
- Rendering the panel freshly produces no `__MISSING__` i18n key in either locale, renders
  all nine blocks, and persists on every mutation.
- Corrupt / hostile localStorage payloads (non-JSON, null, array, wrong-typed blocks,
  duplicate ids, unknown colors, missing activeId) all degrade to a working panel with no
  thrown error.
- Installation reports the bundle applied, and live inspection shows the `bizcanvas` occupant
  in `sidebar.panellist` with order 35 and in `main` under the matching key. No existing
  occupancy is displaced or replaced.
