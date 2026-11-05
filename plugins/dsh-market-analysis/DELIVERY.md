# dsh-market-analysis — 交付与验收记录

状态：**已安装并激活**。侧栏入口 `market-analysis`（order 40）与主面板 `main` 键 `market-analysis` 均在线且 `active: true`（`Slots.listSubTree` 实测）。

## 交付物

| 文件 | 大小 | 作用 |
| --- | --- | --- |
| `package.json` | 845 B | 包清单：`@local/dsh-market-analysis`，`dsh.bundle.patch` + `dsh.client`（web, immediately, 3 个 inject） |
| `cordis.patch.yml` | 77 B | 单行 insert：`id: market-analysis` → `@local/dsh-market-analysis` |
| `index.js` | 393 B | Host 半：`export function apply() {}`，全部状态由浏览器持有 |
| `client.js` | 142.9 KB / 3310 行 | 浏览器半：注册侧栏入口 + 市场分析主面板，含全部交互、纯函数指标与本地持久化 |
| `locale/zh.json` | 217 B | 插件市场显示文案：市场分析 |
| `locale/en.json` | 199 B | 同上的英文 |
| `icon.svg` | 837 B | 原创图标：墨绿渐变底 + 四根递增柱与上扬趋势线 |
| `SPEC.md` | 189 行 | 冻结的接口契约（Lead 持有，供后续维护） |

安装位置：`~/.dsh/profiles/desktop`，以 `link:` 依赖指向工作区该目录。
`plugin_manager` 返回 `application: "applied"`，`warnings: []`。
因为是软链接安装，「包内文件即工作区文件」，改完即生效。

## 产品能力

五个板块，全部围绕一个「市场」文档：

1. **概览** — 4 张 KPI（市场规模 / 年复合增速 / 预测规模 / 加权同比）、规模演进横向条形图（含逐年增速）、驱动因素与风险两个可增删的要点列表。
2. **细分市场** — 表格：细分 / 规模 / 占比 / 同比 / 毛利率 / 玩家数，按规模降序，页脚给出合计与加权同比。
3. **竞争格局** — CR3、CR5、HHI 三张指标卡（含集中度判定），按份额降序的玩家列表，带份额条、营收、总部、备注。
4. **趋势** — 卡片式，1–5 影响强度点阵、时间窗口徽标、依据文本。
5. **报告** — 由当前市场全部数据实时生成的 Markdown，可复制、下载 `.md`、导出 JSON；下方是数据来源列表。

其他：多市场标签页切换、新建/重命名/删除市场、中英双语（148 个键两语言完全对齐）、
`localStorage["dsh.market-analysis.doc.v1"]` 持久化、空态、`Esc` 关闭弹窗、`window.confirm` 保护破坏性操作。

内置示例数据是**真实市场**：全球电动汽车充电桩市场，含 6 个玩家、5 个细分、3 个趋势、15 条来源。

## 验收结果

| 检查 | 结果 |
| --- | --- |
| `node --check client.js` / `index.js` | 通过 |
| `package.json`、`locale/*.json` JSON 解析 | 通过 |
| `exports` 全部路径解析（`.` `./client` `./locale/*.json` `./icon`） | 5/5 通过 |
| `files` 全部 glob 命中 | 5/5 通过 |
| 图标为合法 SVG、< 256 KiB | 837 B，通过 |
| zh/en 字典键集合一致 | 148 / 148，无缺无冗余 |
| 模拟宿主 smoke harness（`smoke-verifier` 独立编写） | **60/60 通过** |
| 主题 token：chrome 仅用 `--dsw-alias-*` | 通过，无字面色值外泄 |
| 面板注册（`Slots.listSubTree`） | 两个槽位均在线 |

### 复现

```bash
node .verify-market-analysis/harness.mjs     # 60/60
node --check dsh-market-analysis/client.js
```

harness 会以假的 `window.__ModuleLoader__` 载入真实 `client.js`，跑 `apply()`，
用自建 hook runtime 渲染面板，再通过真实 handler 驱动全部交互；指标用**独立于插件**
的参考实现核对。

## 示例数据出处

演示数据不是编的。全部数字来自下列来源，派生值在备注里显式标注「推算」。

| 数字 | 值 | 来源 |
| --- | --- | --- |
| 2025 市场规模 | 56,000 百万美元 | Precedence Research（2024 = 45.91bn、2033 = 274.49bn 两端的自洽推算） |
| 2033 预测规模 | 274,490 百万美元 | Precedence Research |
| CAGR | 21.98%（2024–2033） | 由上述两端点反解（厂商口径 23.13% 与自身端点矛盾，采用自洽值） |
| 公共桩存量 | 700 万+，2025 年 +33% | IEA Global EV Outlook 2026 |
| 中国公共桩 | 471.7 万台 | EVCIPA / 天下工场研究 |
| 特来电份额 | 19% | EVCIPA 口径 |
| 星星充电份额 | 16.9% | EVCIPA 口径 |
| ChargePoint FY26 收入 | 4.112 亿美元（-1%） | ChargePoint 财报 |
| EVgo FY2025 收入 | 3.841 亿美元（+50%） | EVgo 财报 |
| ABB E-mobility 收入 | 4.62 亿美元 | ABB 2025 财报 |
| 特斯拉超充收入 | 35 亿美元 | **推算**：10-K「Services and other」中归属超充的估算 |
| 特来电美元收入 | 6.80 亿美元 | **推算**：48.91 亿元按 7.2 汇率折算 |
| 星星充电美元收入 | 4.90 亿美元 | **推算**：按中国市场规模 × 份额估算 |
| 各细分同比/毛利率 | — | 区间估计，跨 MRFR / GMI / 运营商财报交叉推断 |

需要特别注意的口径差异：**特来电 19% 与星星充电 16.9% 是中国公共桩保有量口径，
其余玩家份额是全球营收口径**，两者不可直接相加比较。这一点已写进对应玩家的备注字段。

## 已知限制

- **未做视觉验证**：本环境没有浏览器控制能力，无法截图确认明暗主题下的实际渲染。
  已验证的是语法、清单、主题 token 使用、槽位注册与 60 项行为断言；「看起来对不对」
  需要在页面上人工过一眼。
- 「规模演进」条形图目前只读。编辑概览的弹窗不含历史序列的编辑入口，
  历史数据来自示例或存储；这是刻意的范围收敛，不是遗漏。
- 玩家份额合计若不足 100% 属于正常（只列了主要玩家），超过 100% 才会提示检查。
