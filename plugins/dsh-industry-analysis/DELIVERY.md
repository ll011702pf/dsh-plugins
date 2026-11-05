# dsh-industry-analysis — 交付与验收记录

状态：**已安装并激活**。侧栏入口 `industry-analysis`（order 45）与主面板 `main` 键 `industry-analysis`
均在线且 `active: true`（`Slots.listSubTree` 实测）。`plugin_manager` 返回 `application: "applied"`、`warnings: []`。

## 交付物

| 文件 | 大小 | 作用 |
| --- | --- | --- |
| `package.json` | 882 B | 包清单：`@local/dsh-industry-analysis`，`dsh.bundle.patch` + `dsh.client`（web, immediately, 3 个 inject） |
| `cordis.patch.yml` | 81 B | insert 行：`id: industry-analysis` → `@local/dsh-industry-analysis` |
| `index.js` | 411 B | Host 半：`export function apply() {}`，全部状态由浏览器持有 |
| `client.js` | 约 133 KB | 浏览器半：注册侧栏入口 + 行业分析主面板，含全部交互、纯函数指标与本地持久化 |
| `locale/zh.json` | 217 B | 插件市场显示文案：行业分析 |
| `locale/en.json` | 199 B | 同上的英文 |
| `icon.svg` | 1,232 B | 原创图标：价值链脊柱 + 三个环节节点 + 高亮中游 |
| `SPEC.md` | 300 行 | 冻结的接口契约（供后续维护） |

安装位置：`~/.dsh/profiles/desktop`，以 `link:` 依赖指向工作区该目录（已确认软链目标正确）。
因为是软链接安装，「包内文件即工作区文件」，改完即生效。

## 产品能力

五个板块，全部围绕一个「行业」文档：

1. **行业概览** — 4 张 KPI（行业规模 / 同比增长 / 预测 CAGR / 渗透率）、生命周期徽标、
   规模演进横向条形图（含逐年增速）、增长驱动与主要风险两个可增删的要点列表。
2. **价值链** — 按上游/中游/下游分组排序的表格：环节 / 增加值占比 / 毛利率 / 壁垒 / 代表企业；
   页脚给出合计占比与加权毛利率，超过 100% 时红字告警。
3. **波特五力** — 五项固定力量（顺序由 `FIVE` 常量锁定，输入乱序也会规范化），
   1–5 点阵可点击评分、每项依据文本可编辑；实时给出综合压力、压力等级、行业吸引力 0–100。
4. **竞争格局** — CR3 / CR5 / HHI 三指标卡 + 集中度判定，按份额降序的玩家表（含份额条、收入、护城河、定位、口径备注）。
5. **研究报告** — 由当前行业数据实时生成的 Markdown，章节顺序固定，可复制、下载 `.md`、导出 JSON；下方是数据来源列表（仅 http(s) 渲染为链接）。

其他：多行业标签页切换、新建/重命名/删除行业、中英双语（运行时字典 132 键两语言完全对齐）、
`localStorage["dsh.industry-analysis.doc.v1"]` 持久化、空态、`Esc` 关闭弹窗、`window.confirm` 保护破坏性操作。

## 验收结果

| 检查 | 结果 |
| --- | --- |
| `node --check client.js` / `index.js` | 通过 |
| `package.json`、`locale/*.json` JSON 解析 | 通过 |
| `exports` 全部路径解析（`.` `./client` `./locale/*.json` `./icon`） | 4/4 通过 |
| `files` 全部 glob 命中 | 通过 |
| 图标为合法 SVG、< 256 KiB | 1,232 B，通过 |
| zh/en 字典键集合一致（运行时 + 磁盘） | 132 / 132，无缺无冗 |
| 独立 harness 断言 | **57/57 通过** |
| 主题 token：chrome 仅用 `--dsw-alias-*`,无字面色值外泄 | 通过（字面色仅 artwork 与品牌底文字） |
| 未引入 Harness Client 包 / 仅 `require('react')` | 通过 |
| 面板注册（`Slots.listSubTree`） | 两个槽位均 `active: true` |

### 复现

```bash
node .verify-industry-analysis/harness.mjs     # 57/57
node --check dsh-industry-analysis/client.js
```

harness 的参考算法**独立从 SPEC 文本推导**（未从 `client.js` 抄逻辑），并以假 `__ModuleLoader__`
载入真实 `client.js`、跑 `apply()`、用自建 hook runtime 渲染面板、通过真实 handler 驱动交互。

## 示例数据出处

演示行业是**真实的全球工业机器人产业**，主数据来自 IFR World Robotics 2026（2026-09-24 发布）：

| 数字 | 值 | 来源 |
| --- | --- | --- |
| 2025 全球装机 | 603,307 台（+11%） | IFR World Robotics 2026 |
| 2025 全球保有量 | 5,079,078 台（+9%） | IFR World Robotics 2026 |
| 2029 装机预测 | 806,000 台 | IFR World Robotics 2026 |
| 中国 2025 装机 / 全球占比 | 354,000 台 / 59% | IFR WR2026 |
| 中国本土厂商国内份额 | 55%（2024 为 57%） | IFR WR2026 |
| 机器人密度 韩/德/日/美/中 | 1220 / 449 / 446 / 307 / 166 台每万人 | IFR US 初值稿 |
| 发那科机器人分部营收 | ¥329,566 百万（FY2024） | FANUC 财报 PDF |
| 传动执行部件占 BOM | 40%–56% | Source by Spec |

**推算项（已在 `note`/研究文档中标注「推算」）**：市场规模 199 亿美元（603,307 台 × 约 3.3 万美元均价）、
预测规模 266 亿美元、`cagr`（预测期口径）、`history` 各年金额、`penetration`（以机器人密度折算）、
价值链各环节 share/margin、除发那科外的厂商份额与营收。

### 口径警告（已写入数据与研究文档）

1. **市场规模口径互不相同。** GMI $17.78bn、Grand View $33.96bn、Fortune $24.43bn 的统计边界不同；
   本数据集用「装机台数 × 均价」自洽口径，**不可与任一第三方金额并列作印证**。
2. **台数是主口径，金额是派生。** 增长率若用台数口径与第三方金额 CAGR 不可直接比较。
3. **厂商营收口径不统一**（分部/集团、日元/美元、财年截至 3 月），折算汇率 150 日元/美元；
   `players[].revenue` 仅用于量级比较，**不可加总当作行业总收入**。
4. **中国本土 55% 是「中国市场内」口径**，与全球营收份额不是一回事，不可相加。
5. `cagr` 是**预测期**（2025→2029）口径，与 `history` 的历史 CAGR 是两个概念。

## 已知限制

- **未做视觉验证**：本环境没有浏览器控制能力，无法截图确认明暗主题下的实际渲染。
  已验的是语法、清单、主题 token 使用、槽位注册与 57 项行为断言；「看起来对不对」需在页面上人工过一眼。
- 规模演进条形图目前只读，历史序列的编辑入口在「编辑概览」弹窗内未提供（刻意的范围收敛）。
- 玩家份额合计若不足 100% 属正常（只列主要玩家），超过 100% 才提示检查。
- 示例数据中的份额/营收为量级估算，用于演示工作台，不作为投资或采购依据。

## 协作备注（本次环境的故障）

原计划的两位 teammate（`sample-researcher`、`harness-author`）在运行中被环境反复中断，
两次重试均未留下任何落盘产物。最终两项工作由 Lead 亲自完成：
真实数据检索（IFR 一手报告 + 厂商财报 + 搜索引擎抓取，因 `web_search` 缺 API key，改用 `web_fetch`）、
以及独立验证 harness 的编写。这也使 harness 的独立性由「不同 agent」变成「同一 agent 但严格依 SPEC 推导」，
交付记录如实保留这一点。
