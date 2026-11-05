# dsh-kanban — 交付与验收记录

状态：**已安装并激活**。侧栏入口 `kanban`（order 30）与主面板 `main` 键 `kanban` 均在线且 `active: true`。

## 交付物

| 文件 | 大小 | 作用 |
| --- | --- | --- |
| `package.json` | 753 B | 包清单：`@local/dsh-kanban`，`dsh.bundle.patch` + `dsh.client`（web, immediately, 3 个 inject） |
| `cordis.patch.yml` | 58 B | 单行 insert：`id: kanban` → `@local/dsh-kanban` |
| `index.js` | 333 B | Host 半：`export function apply() {}`，板上状态全部由浏览器持有 |
| `client.js` | 43.6 KB / 997 行 | 浏览器半：注册侧栏入口 + 看板主面板，含全部交互与本地持久化 |
| `locale/zh.json` | 217 B | 插件市场显示文案：敏捷看板 |
| `locale/en.json` | 199 B | 同上的英文 |
| `icon.svg` | 1235 B | 原创图标：靛蓝渐变底 + 三列看板卡片 |
| `SPEC.md` | 8.8 KB | 冻结的接口契约（Lead 持有，供后续维护） |

安装位置：`~/.dsh/profiles/desktop`，以 `link:` 依赖指向工作区该目录。
`plugin_manager` 返回 `application: "applied"`，`warnings: []`。

## 产品能力

- 四列敏捷看板（待办 / 进行中 / 评审 / 已完成），横向滚动。
- 每列显示卡片数与 WIP 徽章；进行中上限 3、评审上限 2，超限变红。
- 每列 `+` 新建卡片，并自动打开编辑器聚焦标题。
- 卡片编辑器：标题、详情、优先级（低/中/高/紧急）、所属列、删除、取消、保存；`Esc` 取消。
- 拖拽：列间与列内移动，按卡片中点计算插入位置并显示落点指示线；落回原位为 no-op。
- 键盘可达：每张卡片有「移到上一列 / 下一列」按钮，与拖拽共用同一 `moveCard`。
- 持久化：全部改动写入 `localStorage["dsh.kanban.board.v1"]`，重新加载即恢复。
- 空态：整板空态与单列空态分别有中英文提示。
- 中英双语，全部 UI 文案走 `ctx.locale`，38 个键在两语言中完整对齐、无缺无冗余。

## 验收结果（Lead 侧，命令与实测）

| 检查 | 结果 |
| --- | --- |
| `node --check client.js` / `index.js` | 通过 |
| `package.json`、`locale/*.json` JSON 解析 | 通过 |
| `exports` 全部路径解析（`.` `./client` `./locale/*.json` `./icon`） | 5/5 通过 |
| `files` 全部路径存在 | 通过 |
| 冻结标识符（包名、row id、loader id、侧栏 id/order、main key、命名空间、存储键、CSS 前缀） | 全部一致 |
| 双语字典键集对比 SPEC §6 | zh 38/38，en 38/38，missing 0，extra 0 |
| 图标为合法 SVG（`xmlns` + `viewBox 0 0 64 64`，1235 B） | 通过；与 note-wall 图标非同一文件 |
| 主题令牌：7 个 `--dsw-alias-*`；字面色仅 4 个优先级强调色 | 符合约定 |
| `prefers-reduced-motion` 降级 | 已实现 |
| 仅 `require('react')`，无 JSX / 无 TS | 通过 |
| 桩化运行时加载模块并 `apply` | 注册两个 slot + 1 个 locale effect，两组件均无异常渲染 |
| 伪造/损坏 localStorage 载荷 × 12 种（null、字符串、数组、错类型列、重复 id、非法优先级等） | 12/12 安全降级，零抛错 |
| `localStorage` 读写抛错（隐私模式/配额） | 板上仍可正常工作（内存态） |
| 真实数据渲染统计 | 4 列、5 卡、2 个 WIP 徽章、14 个操作按钮，中英文案正确内嵌 |
| 拖拽索引数学 9 个用例（跨列、同列上移/下移、自落点、空列钳位、末位） | 9/9 通过 |
| 实时插槽：`sidebar.panellist` | `kanban` order 30，`active: true`，已有入口全部保留 |
| 实时插槽：`main` | `kanban` 键存在且 `active: true` |

## 未验证项（如实声明）

- **屏幕实际渲染效果**：我没有浏览器控制权，无法截图或断言面板的视觉呈现、明暗主题对比、20px 下图标观感。
- **真实指针拖拽**：拖拽索引逻辑已用等价数学证明，但未在浏览器中做真人拖放操作。
- 独立验证 teammate 在本轮被中断，未产出 `verify-report.md`；上表为 Lead 直接实测所得，已覆盖其计划检查项。

## 修复记录

- 00:21 修正 `client.js:702/704`：卡片标题/详情原用 `h3`/`p`，作为 `<button>` 子元素属非法 phrasing content，改为 `span`；CSS 按类名生效，渲染不变。
