# dsh-market-analysis — frozen interface contract (v1)

A market-analysis workbench in the Harness Web UI. Sidebar entry opens a central
panel where a user models a market: 概览 / 细分市场 / 竞争格局 / 趋势 / 报告.

Everything is browser-owned state in `localStorage`; the Host half registers nothing.

## Identity

| item | value |
| --- | --- |
| package name | `@local/dsh-market-analysis` |
| patch row id | `market-analysis` |
| sidebar slot | `sidebar.panellist`, `id: 'market-analysis'`, `order: 40`, `label: () => t('panel.title')` |
| main slot | `main`, `key: 'market-analysis'` |
| locale namespace | `marketAnalysis` |
| storage key | `dsh.market-analysis.doc.v1` |
| doc version | `1` |
| localStorage value | the whole doc JSON, written on every change |

Client module: `window.__ModuleLoader__.load({ id: '@local/dsh-market-analysis', factory(require) })`,
`require` only ever called with `'react'`. `inject: ['slots', 'locale']`.

## Document model (plain JSON)

```ts
type Doc = {
  version: 1
  activeId: string          // '' when the list is empty
  markets: Market[]
}

type Market = {
  id: string                // 'm' + counter
  name: string
  asOf: string              // free text, e.g. '2025'
  overview: {
    size: number            // 百万美元 (million USD)
    sizeYear: number        // e.g. 2025
    cagr: number            // fraction, e.g. 0.24
    cagrWindow: string      // '2025-2030'
    forecastSize: number    // million USD
    forecastYear: number
    drivers: string[]
    risks: string[]
  }
  history: { year: number, size: number }[]      // ascending by year
  segments: {
    id: string
    name: string
    size: number            // million USD
    yoy: number             // fraction, may be negative
    margin: number          // fraction 0..1
    players: number         // count
  }[]
  players: {
    id: string
    name: string
    hq: string
    share: number           // fraction 0..1, NOT percent
    revenue: number         // million USD
    year: number
    note: string
  }[]
  trends: {
    id: string
    name: string
    impact: number          // integer 1..5
    horizon: string         // '1-3 年'
    evidence: string
  }[]
  sources: { id: string, title: string, url: string, asOf: string }[]
  createdAt: number
  updatedAt: number
}
```

Clamping rules on every write (sanitizer runs on load and on every input):

- `size`, `forecastSize`, `revenue` ≥ 0, finite, else 0
- `share`, `yoy`, `margin`, `cagr` finite; `share` clamped to `0..1`, `margin` `0..1`, `yoy` to `-1..5`
- `impact` integer clamped `1..5`; `players` integer ≥ 0
- `year` 1900..2200 else dropped row
- strings trimmed and capped: name 120, note/evidence 400, url 300, hq 60
- every `id` unique inside its own array; duplicates get a fresh id
- `history` sorted ascending by year, duplicates collapsed (last wins)

## Pure metrics (exported shape used by the harness)

All are pure `market -> value`, no React, no DOM.

| function | contract |
| --- | --- |
| `segmentTotal(m)` | Σ `segments[].size` |
| `weightedYoy(m)` | Σ(size·yoy)/Σsize, `0` when Σsize is 0 |
| `segmentShares(m)` | `[{ id, share }]`, `share` = size/Σsize or 0 |
| `cr(m, n)` | Σ of the top n `players[].share` values, descending |
| `hhi(m)` | Σ(share·100)², i.e. 0..10000, over all players |
| `concentrationKey(m)` | `'low'` <1500, `'mid'` 1500..2500, `'high'` >2500 |
| `historyDelta(m)` | `[{ from, to, growth }]` between consecutive history points |
| `rankPlayers(m)` | players sorted by share desc, ties by name |
| `marketMarkdown(m, t)` | the report string (see below) |

`formatMoney(v, t)` — million USD to a short localized label. The large unit is
language-specific: zh 亿 = 10^8 (`÷100` → `560 亿美元`), en B = 10^9 (`÷1000` →
`$56B`); small values keep the million unit (`850 百万美元`, `$850M`). The divisor
is carried by the locale key `unit.largeDivisor`. `formatPercent(v, digits)` keeps
exactly `digits` decimals (`24.0%`).

## Panel sections (5 tabs, order fixed)

1. **overview** — 4 KPI cards (市场规模, 年复合增速, 预测规模, 加权同比) + a
   horizontal-bar `history` strip + two editable bullet lists (驱动因素 / 风险).
2. **segments** — table rows: 名称 / 规模 / 占比 / 同比 / 毛利率 / 玩家数; each row has
   edit + delete; footer shows 合计 + weighted yoy; sorted by size desc; a `+` adds a row.
3. **competition** — 3 metric cards (CR3, CR5, HHI + 集中度 label), then ranked
   player rows with a share bar, share %, revenue, HQ, note; add/edit/delete.
4. **trends** — cards with a 1–5 impact dot strip, horizon chip, evidence text; add/edit/delete.
5. **report** — generated Markdown in a readonly `<textarea>`; 复制 Markdown, 下载 .md,
   导出 JSON; below it the source list.

Empty state (no markets): title + hint + `新建市场` / `载入示例数据`.

Header (always visible): panel glyph + 标题 + 副标题, market tabs, `+` new market,
rename input, `载入示例数据`, `导出` menu (Markdown / JSON), delete-market icon.

## Report Markdown (exact section order)

```
# <market name>
> 数据截止 <asOf> · 规模单位：百万美元

## 市场概览
- 市场规模：<fmt>（<sizeYear>）
- 年复合增速：<pct>（<cagrWindow>）
- 预测规模：<fmt>（<forecastYear>）
- 加权同比：<pct>
- 玩家数量：<n>

### 驱动因素
- ...

### 风险
- ...

## 细分市场
| 名称 | 规模 | 占比 | 同比 | 毛利率 | 玩家数 |
| --- | ---: | ---: | ---: | ---: | ---: |
| ... |
| **合计** | <sum> | 100% | <weightedYoy> | — | — |

## 竞争格局
- CR3：<pct>　CR5：<pct>　HHI：<n>（<label>）
| 玩家 | 份额 | 营收 | 总部 | 备注 |
| --- | ---: | ---: | --- | --- |

## 趋势
### <name>
- 影响：<n>/5
- 窗口：<horizon>
- 依据：<evidence>

## 数据来源
- <title>（<asOf>）<url>
```

Punctuation is localized through `report.colon`, `report.labelGap`, `report.parenOpen`,
`report.parenClose`, `report.parenGap` and `report.metricSep`: zh emits full-width
`：（）` and ideographic spaces with no ASCII padding; en emits `: ()` and ` · `.
The segments total row prints `—` for its share when `segmentTotal` is 0.

Missing/empty arrays render `（暂无）` (localized key `report.none`). Deterministic output:
no timestamps, no locale-dependent number grouping beyond the helpers above.

## Interaction contract the harness drives

- `addMarket()` appends a blank market (name `''`, defaults zeroed) and activates it.
- `loadSample()` replaces the doc with the built-in sample (one market) and activates it.
- `addSegment()`, `addPlayer()`, `addTrend()` append a blank row/entry in that section.
- Edit dialog: fields per entity, `保存` commits, `取消`/`Escape` discards.
- Delete: `删除` in the dialog; market delete asks `window.confirm`.
- Every mutation sets the market's `updatedAt` and persists the whole doc.
- `toast.copied` after a successful clipboard write, `toast.copyFailed` on failure.

## Locale

`ctx.locale.register('marketAnalysis', { zh: {...}, en: {...} })`; identical key sets,
no key missing in either language. Visible text only through `t()`.
Panel labels re-read through a locale subscription tick.
