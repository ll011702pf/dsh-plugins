# dsh-kanban — frozen interface contract & product spec

Owned by the Lead. Writers must not edit this file. Every identifier below is frozen:
the bundle half, the client half, and the verifier all build against exactly these values.

## 1. Identity (frozen)

| Item | Value |
| --- | --- |
| Package name | `@local/dsh-kanban` |
| Loader row id (patch `insert`) | `kanban` |
| Client module loader id | `@local/dsh-kanban` |
| Sidebar slot / cell id | `sidebar.panellist` / id `kanban`, `order: 30` |
| Label | `() => t('panel.title')` (thunk, so the active locale is re-read) |
| Main panel slot | `main` keyed by exactly `kanban` |
| Client locale namespace | `kanban` |
| Storage key | `dsh.kanban.board.v1` |
| CSS class prefix | `dsh-kb-` |
| Icon | `icon.svg` (original artwork, package root) |

`sidebar.panellist` registration fields are `id`, `order`, `label`; the owner renders the
cell component with props `{ size: number, active: boolean }`. `main` is keyed: register
`{ name: 'main', key: 'kanban' }`. Both are confirmed live via `Slots.listSubTree`.

## 2. Manifest (frozen shape)

```json
{
  "name": "@local/dsh-kanban",
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
    - id: kanban
      name: '@local/dsh-kanban'
```

`index.js` (exact intent): a Host half that registers nothing — the board is entirely
browser-owned. It must export `export function apply() {}` with a short comment.

`locale/en.json` and `locale/zh.json` carry **only** `meta.title` and `meta.description`
(the Plugin Manager / bundle-details display metadata). Runtime UI strings do **not** live
here; they live in the `DICT` inside `client.js` (same split as the shipped-working
`../dsh-note-wall` bundle).

## 3. Data model (frozen)

```js
{
  version: 1,
  columns: {
    backlog:  [Card, ...],
    progress: [Card, ...],
    review:   [Card, ...],
    done:     [Card, ...],
  }
}
```

`Card`:

```js
{
  id: string,            // 'c' + Date.now().toString(36) + random
  title: string,         // may be '' only while being created
  detail: string,        // free text, may be ''
  priority: 'low' | 'medium' | 'high' | 'urgent',
  createdAt: number,     // epoch ms
  updatedAt: number,     // epoch ms
}
```

Column ids and their WIP limits (frozen):

| id | meaning | WIP limit |
| --- | --- | --- |
| `backlog` | 待办 / Backlog | none |
| `progress` | 进行中 / In Progress | 3 |
| `review` | 评审中 / Review | 2 |
| `done` | 已完成 / Done | none |

Array index inside a column **is** the card order. All mutations are per-column.

`sanitize()` must accept any hand-edited/stale localStorage payload and return a
well-formed model: unknown columns dropped, unknown priorities coerced to `medium`,
non-object cards dropped, missing ids/timestamps repaired. A malformed payload must
never throw into render.

## 4. Behaviour requirements

The board is the `main` panel under the `kanban` sidebar entry. Required:

1. **Four columns** rendered side by side in a horizontally scrollable board; each
   column shows its localized title, its card count, and (for WIP-limited columns) a
   `count/limit` badge that turns to the warning treatment when exceeded.
2. **Add card** — a `+` control in each column header creates an empty card at that
   column's top (using priority `medium`) and opens its editor focused in the title field.
3. **Edit card** — clicking a card opens an editor overlay (dialog) with: title input,
   detail textarea, priority selector (4 options), column selector (4 options), Delete,
   Cancel, Save. `Esc` closes without saving. Saving an unchanged card is allowed.
   A card whose title is empty on save is kept as `''` and rendered with a localized
   placeholder title, never as a broken layout.
4. **Delete card** — from the editor, plus a hover/focus delete control on the card
   itself.
5. **Drag & drop between and within columns** — HTML5 drag events. Dragging a card over
   a column shows a drop indicator at the computed insertion index (compare the pointer
   against card midpoints); dropping moves the card to that column and index. Dropping a
   card back onto its own position must be a no-op. Because `dataTransfer.getData` is not
   readable during `dragover`, the drag source lives in React state, not in `dataTransfer`.
6. **Keyboard-accessible move** — every card exposes "move to previous/next column"
   controls that are reachable and operable by keyboard, and they must be the
   non-drag path to the same `moveCard` operation. Do not rely on drag alone.
7. **Persistence** — every state change is written to `localStorage[STORAGE_KEY]`;
   a fresh page load restores the board. Storage being unavailable (throws) must not
   break the board; it keeps working in memory.
8. **Empty state** — a board with no cards at all shows a localized empty state with a
   hint; an individual empty column shows its own localized placeholder.
9. **Localization** — all visible text goes through `ctx.locale`; dictionary registered
   under namespace `kanban` with both `zh` and `en` dictionaries (both are shipped
   locales and registration requires the balanced pair). The `meta` titles/descriptions
   in `locale/*.json` must describe an agile kanban board.

## 5. Visual & theming rules

- Follow `../dsh-note-wall/client.js` for structure: `window.__ModuleLoader__.load({ id,
  factory(require) { ... return { inject: ['slots','locale'], apply(ctx) {...} } } })`,
  a `CSS` string injected as a `<style>` element rendered by the component, and
  `ctx.effect(...)` for the dictionary registration.
- Chrome (backgrounds, borders, labels, buttons, focus ring, empty states) must use the
  host theme tokens, not literals. Known-good tokens in use today:
  `--dsw-alias-bg-base`, `--dsw-alias-bg-layer-1`, `--dsw-alias-bg-layer-2`,
  `--dsw-alias-border-l2`, `--dsw-alias-label-primary`, `--dsw-alias-label-secondary`,
  `--dsw-alias-brand-primary`. Use `var(--dsh-frame-top-clearance,0px)` as top padding,
  as the working reference does.
- Priority accents and the icon are artwork and may use their own literal colors
  (`low #8a94a6`, `medium #4a86e8`, `high #e8890c`, `urgent #d93b3b`).
- Respect `@media (prefers-reduced-motion: reduce)` for any transition.
- Light/dark: do not hardcode a dark-only or light-only surface for chrome.

## 6. i18n dictionary keys (frozen — use exactly these, both locales)

`panel.title`, `panel.subtitle`, `panel.newCard`, `panel.unit`, `panel.wip`,
`panel.wipExceeded`, `column.backlog`, `column.progress`, `column.review`, `column.done`,
`column.addCard`, `column.empty`, `card.untitled`, `card.priority`,
`priority.low`, `priority.medium`, `priority.high`, `priority.urgent`,
`card.movePrev`, `card.moveNext`, `card.delete`, `card.edit`, `card.updated`,
`editor.title`, `editor.newTitle`, `editor.fieldTitle`, `editor.fieldDetail`,
`editor.fieldPriority`, `editor.fieldColumn`, `editor.detailPlaceholder`,
`editor.save`, `editor.cancel`, `editor.delete`,
`empty.title`, `empty.hint`,
`aria.board`, `aria.column`, `aria.dragging`.

Chinese (`zh`) is the primary language for this user; English (`en`) must be a complete,
natural translation of the same key set. No missing keys in either dictionary.

## 7. Write scopes (advisory, disjoint)

| Owner | Files |
| --- | --- |
| Lead | `SPEC.md`, installation, final acceptance |
| `bundle-shell` | `package.json`, `cordis.patch.yml`, `index.js`, `locale/en.json`, `locale/zh.json`, `icon.svg` |
| `kanban-ui` | `client.js` |
| `verifier` | `verify-report.md` (report only; never edits shipped files) |

## 8. Acceptance criteria

- `node --check` passes on `index.js` and `client.js`; all JSON parses; the YAML patch is
  valid and its row id is `kanban`.
- Every declared export path resolves to a real file; `files` covers every runtime file
  plus the patch, locales and icon.
- The icon is a valid SVG under 256 KiB whose bytes render.
- Installation reports `application: applied`, and live inspection then shows the
  `kanban` occupant in `sidebar.panellist` with the requested order and in `main` under
  the matching key.
- No `note-wall` / shipped occupancy is displaced or replaced.