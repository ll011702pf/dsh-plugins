# dsh-industry-analysis — 冻结接口契约 (v1)

这份 SPEC 是**唯一契约**。实现方（Lead）与验证方（smoke harness 作者）都以此为准，
验证方**必须独立实现**参考算法，不得从 `client.js` 反向抄逻辑。

包名：`@local/dsh-industry-analysis`　面板 id：`industry-analysis`
侧栏槽位：`sidebar.panellist`（`order: 45`）　主面板槽位：`main`（key = `industry-analysis`）
存储键：`localStorage["dsh.industry-analysis.doc.v1"]`　locale 命名空间：`industryAnalysis`

---

## 1. 文档模型 (doc)

```jsonc
{
  "version": 1,
  "activeId": "ind-xxx",
  "industries": [ Industry ]
}
```

`Industry`：

```jsonc
{
  "id": "ind-xxx",
  "name": "全球工业机器人产业",
  "updatedAt": 1700000000000,

  "overview": {
    "size": 165,            // 当期为行业规模，单位=亿美元（数值可为小数）
    "yoy": 0.048,           // 当期同比，fraction（0.048 = 4.8%）
    "cagr": 0.089,          // 预测期 CAGR，fraction
    "forecastSize": 253,    // 预测规模，亿美元
    "penetration": 0.31,    // 渗透率，fraction，0..1
    "asOf": "2025",
    "history": [ { "year": 2021, "size": 138 } ],   // 按年份升序，size 单位亿美元
    "drivers": [ "人工成本上升推动机器换人" ],
    "risks":   [ "下游资本开支周期波动" ]
  },

  "chain": [                // 价值链环节
    {
      "id": "ch-xxx",
      "stage": "upstream",  // "upstream" | "mid" | "downstream"
      "name": "减速器",
      "share": 22,          // 增加值占比，百分数点 0..100
      "margin": 35,         // 毛利率，百分数点 0..100
      "moat": "高",         // 字符串，可空
      "players": "纳博特斯克、哈默纳科"   // 字符串，可空
    }
  ],

  "forces": [               // 波特五力，固定 5 项
    {
      "id": "fo-xxx",
      "key": "rivalry",     // "rivalry" | "entrant" | "substitute" | "supplier" | "buyer"
      "score": 3,           // 1..5 的整数；分越高=威胁越大
      "evidence": "四大家族合计份额约 45%"
    }
  ],

  "players": [
    {
      "id": "pl-xxx",
      "name": "发那科 FANUC",
      "share": 12.5,        // 市场份额，百分数点
      "revenue": 55,        // 收入，亿美元
      "moat": "控制系统与本体垂直一体化",
      "positioning": "高端六轴本体",   // 字符串，可空
      "note": ""            // 字符串，可空（口径备注）
    }
  ],

  "sources": [ { "id": "sc-xxx", "title": "IFR World Robotics 2025", "url": "https://…", "asOf": "2025" } ]
}
```

约束：`chain[].stage` 只允许三值；`forces` 恰好 5 条且 `key` 不重复；
`history` 按 `year` 升序；所有数值字段 sanitize 时回落到默认值而不是 `NaN`。

---

## 1.1 阶段与力量的稳定标识（渲染与导出依赖）

```js
STAGES = ['upstream', 'mid', 'downstream']                  // 顺序固定
FIVE   = ['rivalry', 'entrant', 'substitute', 'supplier', 'buyer']  // 顺序固定
```

- 价值链表格与报告按 `STAGES` 顺序分组，组内保持 `chain` 数组原顺序。
- 五力表格与报告按 `FIVE` 顺序输出，**无论 `forces` 数组本身是什么顺序**。
- 生命周期键：`'emerging' | 'growth' | 'mature' | 'declining'`；
  集中度键：`'competitive' | 'moderate' | 'concentrated'`；
  压力等级键：`'low' | 'moderate' | 'high' | 'extreme'`。
  这三组键在两套字典里都必须有对应中文/英文文案（harness 按 key 查字典断言）。

---

## 2. 纯函数契约

以下函数挂在 `client.js` 返回对象的**顶层**，并**同名**出现在 `__pure` 下（顶层与 `__pure` 两者都要有）。
输入一律按「脏数据也要能跑」对待。

| 函数 | 签名 | 语义 |
| --- | --- | --- |
| `chainShareTotal(chain)` | `chain → number` | `Σ share`，百分数点。忽略非有限值，结果四舍五入到 2 位小数 |
| `weightedMargin(chain)` | `chain → number` | `Σ(share*margin) / Σ(share)`，百分数点，2 位小数；`Σshare <= 0` 时返回 `0` |
| `playerShareSum(players)` | `players → number` | `Σ share`，2 位小数 |
| `cr(players, n)` | `→ number` | 按 share 降序取前 n 名份额之和，2 位小数；`n <= 0` 返回 0 |
| `hhi(players)` | `players → number` | `Σ share²`（用百分数点），2 位小数 |
| `concentrationKey(hhi)` | `number → string` | `< 1500 → 'competitive'`；`1500 ≤ hhi ≤ 2500 → 'moderate'`；`> 2500 → 'concentrated'` |
| `historyDelta(history)` | `history → Array<{year,size,growth}>` | 升序；首条 `growth = null`；其余 `growth = (cur-prev)/prev`（fraction，4 位小数）；`prev <= 0` 时 `growth = null` |
| `historyCagr(history)` | `history → number\|null` | `(last/first)^(1/(n-1)) - 1`，4 位小数；`n < 2` 或首尾非正 返回 `null` |
| `lifecycleStage(overview)` | `overview → 'emerging'\|'growth'\|'mature'\|'declining'` | 见 §3 |
| `forcesAggregate(forces)` | `forces → {avg, level}` | 见 §2.1；`level`：`avg < 2 → 'low'`，`< 3 → 'moderate'`，`< 4 → 'high'`，否则 `'extreme'` |
| `forcesAttractiveness(forces)` | `forces → number` | `round((5 - avg) / 4 * 100)`，整数，clamp 到 0..100 |
| `rankPlayers(players)` | `players → players[]` | 按 share 降序，同 share 按 name 升序（`localeCompare` 不用，用 `<`/`>` 比较保证确定性） |
| `industryMarkdown(doc, industryId)` | `→ string` | 见 §4 |
| `formatMoney(value)` | `→ string` | 千分位整数/小数，最多 1 位小数，去尾零；非有限值 → `'0'`；不产生 `-0` |
| `formatPercent(fraction, digits?)` | `→ string` | fraction×100，定点 `digits ?? 1`，去尾零，尾缀 `%`；非有限 → `'0%'` |
| `trimNum(value, digits)` | `→ string` | 定点去尾零，`-0` → `'0'` |
| `parseNum(text)` | `→ number\|null` | 允许 `,`／全角逗号／空格分隔；空串/非法 → `null` |
| `slugOf(name)` | `→ string` | 文件名安全，允许 `\w` 与中文；空 → `'industry'`；≤48 字符 |
| `sanitizeDoc(json)` | `→ doc` | 任意脏输入 → 合法 doc；`version` 强制为 1；非法 industry 丢弃；`activeId` 不存在时回落到第一条（无条目时 `''`） |

`sanitizeDoc` 的规范化细则（验证方按此断言）：

- 入参非对象 / `industries` 不是数组 → 返回 `defaultDoc()`。
- `industries` 中**不是对象**的条目（`null`、数字、字符串、数组）**丢弃**；是对象的条目**一律保留**：
  原有合法字符串 `id` 原样保留，`id` 缺失或与前面重复时**新生成**一个（保证全局唯一）。
- 每条 industry 的 `chain` / `players` / `sources` / `history` / `drivers` / `risks` 若不是数组 → `[]`；
  `forces` 若不是数组 → 补齐为 §2.1 `FIVE` 顺序的 5 条 `score:1` 条目。
- 数值字段一律 `num(v, 0)`（`penetration` 额外 clamp 到 `0..1`，`share`/`margin` clamp 到 `0..100`，
  五力 `score` clamp 到 `1..5` 并取整）；字符串字段一律 `str(v, 限长)`，非字符串 → `''`。
- `id` 去重后必须全局唯一；`activeId` 若不在保留的 id 集合中 → 取第一条的 id。
- `sanitizeDoc` **幂等**：`sanitizeDoc(sanitizeDoc(x))` 与 `sanitizeDoc(x)` 深度相等（id 除外，见下）。
- 为保证可断言：`sanitizeDoc` 对**已经合法的 doc**（含合法 id）必须原样保留 id 与数值，不做重排。
| `defaultDoc()` | `→ doc` | **空文档**：`{ version: 1, activeId: '', industries: [] }`。空态即 `industries.length === 0` |
| `sampleDoc()` | `→ doc` | `industries.length === 1`，`activeId` 指向该条，内置真实示例行业 |

### 四舍五入

统一用 `Math.round(v * 10^d) / 10^d`，`d` 为该函数规定的位数；`-0` 一律归一为 `0`。

### 2.1 `forcesAggregate` 的缺项规则（精确）

```js
FIVE  = ['rivalry', 'entrant', 'substitute', 'supplier', 'buyer']   // 固定顺序

对每个 key：
  找到 forces 中第一条 key 匹配的条目；若无 → score = 1   // 缺项按最低强度 1 计入
  否则 score = clamp(round(该条 score), 1, 5)              // 非有限值 → 1
avg   = round(sum(score) / 5, 2)                           // 永远除以 5，不是除以条目数
```

即：分母恒为 5；缺项按 1；重复 key 只取第一条；`score` 先 `Math.round` 再 clamp 到 `1..5`。

`forcesAttractiveness(forces)` 用**同一个** `avg`，不重新计算。

### 2.2 共享的输入强制转换（所有 §2 函数一致）

所有「读一个数值字段」的地方都走同一个 `num(value, fallback)`：

```js
num(v, fallback):
  typeof v === 'number' 且 isFinite(v)        → v
  typeof v === 'string' 且 trim 后非空
     且 Number(trim) 是有限数                 → Number(trim)     // 接受 "12.5"、"-3"
  其余（null / undefined / NaN / Infinity /
        '' / 'abc' / 对象 / 数组 / 布尔）      → fallback
```

补充规则：

- `chain` / `players` / `history` / `forces` 传入**非数组**时，按空数组处理，返回 `0` / `[]` / `null`（按各函数语义）。
- 数组成员不是对象（`null`、数字、字符串）时，该成员按「所有字段缺失」处理。
- `cr(players, n)`：`n` 先 `Math.floor`；`n <= 0` 或非有限 → `0`；`n` 超过成员数时取全部。
- `rankPlayers` 是**纯排序、不改数据**：返回新数组，元素是原对象引用（不深拷贝）。
- `historyDelta` 先把成员按 `year`（`num` 后的值）升序排；`year` 缺失的成员排在最后并保留其相对顺序；
  输出数组元素形如 `{ year, size, growth }`，`year`/`size` 为 `num` 后的数值（缺失时 `year` 用 `0`、`size` 用 `0`）。
- `historyCagr` 用**已排序**的首尾两项。
- `lifecycleStage` 与 `forcesAggregate` 接受 `null`/`undefined` 入参，按「全字段缺失」处理，不得抛错。

---

## 3. `lifecycleStage` 判定（严格按此顺序）

```
g = overview.yoy（fraction，非有限按 0）
p = overview.penetration（fraction，非有限按 0，clamp 到 0..1）

if g <  0      → 'declining'
if g <  0.05   → 'mature'
if g >= 0.20   → base = 'emerging'  else base = 'growth'
if base === 'growth'   && p >= 0.60 → 'mature'
if base === 'emerging' && p >= 0.40 → 'growth'
否则 base
```

边界全部取「含」：`g == 0` → `'mature'`；`g == 0.05` → 进入下一档；`g == 0.20` → `'emerging'`。

---

## 4. `industryMarkdown(doc, industryId)` 结构

找不到 industry → 返回 `''`。否则返回 Markdown，**章节顺序固定**，`#` 一级标题为行业名：

```
# <name>

> 数据截至 <asOf>　|　生命周期：<阶段中文>　|　HHI <hhi>（<集中度中文>）

## 一、行业概览
- 行业规模：<formatMoney(size)> 亿美元
- 同比增长：<formatPercent(yoy)>
- 预测 CAGR：<formatPercent(cagr)>
- 预测规模：<formatMoney(forecastSize)> 亿美元
- 渗透率：<formatPercent(penetration)>
- 加权毛利率：<weightedMargin>%

### 增长驱动
- <每项一行>        ← 无内容时输出 `- （未填写）`

### 主要风险
- <每项一行>        ← 无内容时输出 `- （未填写）`

## 二、价值链结构
| 环节类型 | 环节 | 增加值占比 | 毛利率 | 壁垒 | 代表企业 |
| --- | --- | --- | --- | --- | --- |
| 上游/中游/下游 | … | 22% | 35% | 高 | 纳博特斯克 |

合计占比：<n>%（>100 时追加 "　⚠ 占比合计超过 100%"）

## 三、波特五力
| 力量 | 强度 | 依据 |
| --- | --- | --- |
| 现有竞争者 | 3/5 | … |

综合压力：<avg>/5（<level 中文>）　行业吸引力：<attractiveness>/100

## 四、竞争格局
| 企业 | 份额 | 收入(亿美元) | 护城河 |
| --- | --- | --- | --- |
| … |

CR3 <x>%　CR5 <y>%　HHI <z>（<中文>）

## 五、数据来源
- [title](url)（asOf）    ← 非 http(s) URL 输出纯文本，不生成链接
```

金额与百分数一律复用 §2 的格式化函数，保证 CLI/harness 可稳定断言。

---

## 5. 渲染与行为契约

- `client.js` 是**纯浏览器 JS**：`window.__ModuleLoader__.load({ id: '@local/dsh-industry-analysis', factory(require) {...} })`，
  `factory` 内**只能** `require('react')`。
- 导出对象含 `inject: ['slots', 'locale']` 与 `apply(ctx)`。
- `apply` 内用 `ctx.effect(() => ctx.locale.register('industryAnalysis', DICT), 'industry-analysis: dictionaries')` 注册字典，
  并在 `sidebar.panellist` 与 `main` 两个槽位各注册一次。
- 面板根元素 class 前缀 `dsh-ia-`；所有 chrome 颜色**只**用 `--dsw-alias-*` token。
- 五个分区 tab：`overview` / `chain` / `forces` / `landscape` / `report`（顺序固定，共 5 个）。
- 交互要求（harness 会走真实 handler）：
  1. 空态出现「新建行业」「载入示例」按钮；
  2. 载入示例后 KPI 卡渲染出 4 个数值；
  3. 五个 tab 均可切换且各自渲染出对应标题；
  4. 新增 / 重命名 / 删除行业；
  5. 价值链环节可增删改（含 stage 三选一）；
  6. 五力每项 score 可改（1..5），综合压力随之变化；
  7. 玩家可增删改，CR/HHI 随之变化；
  8. 报告区文本随数据变化，复制/下载不抛错；
  9. `localStorage` 写回，刷新后 `sanitizeDoc` 能还原；
  10. 弹窗 `Esc` 可关闭；破坏性操作走 `window.confirm`。
- 语言：`zh` / `en` 两套字典，键集合必须完全一致（harness 会断言无缺无冗）。

---

## 6. 验收基线

| 项 | 要求 |
| --- | --- |
| `node --check client.js` / `index.js` | 通过 |
| `package.json` / `locale/*.json` | JSON 可解析 |
| `exports` 全部路径可解析 | 4/4（`.` `./client` `./locale/*.json` `./icon`） |
| `files` 全部 glob 命中 | 全部 |
| `icon.svg` | 合法 SVG，< 256 KiB |
| zh/en 键集一致 | 必须 |
| 主题 token | chrome 无字面色值（artwork 除外） |
| 槽位注册 | `Slots.listSubTree` 两个槽位 `active: true` |
| 独立 harness | 全部断言通过 |

---

## 7. 示例数据要求

示例行业必须是**真实行业**，且每个关键数字都能指到来源（写进 `sources`）。
估算/推算的数字须在对应 `note` 字段里显式标注「推算」。
口径不一致时必须在 `note` 里写清，不得让两个不可比的数字并列相加。
