# dsh-bizcanvas — 交付与验收记录

状态：**已安装并写入 profile 的 bundle 列表**。重启 DeepSeek Harness 后，左侧栏会出现「商业画布」入口（order 35，排在思维导图之后）。

## 交付物

| 文件 | 大小 | 作用 |
| --- | --- | --- |
| `package.json` | 846 B | 包清单：`@local/dsh-bizcanvas`，`dsh.bundle.patch` + `dsh.client`（web, immediately, 3 个 inject） |
| `cordis.patch.yml` | 64 B | 单行 insert：`id: bizcanvas` → `@local/dsh-bizcanvas` |
| `index.js` | 375 B | Host 半：`export function apply() {}`，画布状态全部由浏览器持有 |
| `client.js` | 68 KB / 1571 行 | 浏览器半：注册侧栏入口 + 主面板，含全部交互、持久化与导出 |
| `locale/zh.json` | 194 B | 插件市场显示文案：商业画布 |
| `locale/en.json` | 226 B | 同上的英文 |
| `icon.svg` | 2459 B | 原创图标：青绿底 + 三乘三画布九宫格（左/右列通高） |
| `SPEC.md` | 18 KB | 冻结的接口契约（Lead 持有，供后续维护） |

安装位置：`~/.dsh/profiles/desktop`，以 `link:` 依赖指向工作区该目录，并已写入
`dsh.profile.bundles`。

## 产品能力

- **九大模块**：重要合作 / 关键业务 / 核心资源 / 价值主张 / 客户关系 / 渠道通路 /
  客户细分 / 成本结构 / 收入来源，按真实商业画布布局排布（11 列 × 3 行网格，左右列通高、
  中间价值主张通高、底部成本与收入各占半幅）。每个模块有自己的强调色与引导问题。
- **便签式条目**：点模块标题栏的 `+` 新建条目并自动打开编辑器聚焦输入框。
- **条目编辑器**：内容、所属模块、七种颜色（默认 + 六色便签）、删除、取消、保存；
  `Esc` 取消且不保存。空内容条目显示「未命名条目」占位而非破版。
- **拖拽归类**：模块间与模块内拖拽，按条目中点计算插入位置并显示落点指示线；
  拖回原位是真正的 no-op（文档字节不变）。
- **键盘可达**：每个条目有「移到上一个/下一个模块」按钮，与拖拽共用同一 `moveItem`；
  第一个模块禁用向上、最后一个禁用向下。
- **多画布**：标签页切换、`+` 新建、头部输入框重命名、`confirm` 后删除当前画布；
  删空后显示面板空态并可一键恢复。
- **导出**：Markdown（`# 画布名` + 每个非空模块 `## 标题` + `- 条目`）、
  JSON（`{version, exportedAt, canvases}`）、复制 Markdown 到剪贴板，均带 toast 反馈。
- **持久化**：全部改动写入 `localStorage["dsh.bizcanvas.doc.v1"]`，重新加载即恢复；
  localStorage 抛错时仍以内存态正常工作。
- **中英双语**：68 个 UI 键在两语言中完整对齐，无缺无冗余；切换语言即时重绘。
- **响应式**：面板窄于 900px 时九宫格降级为单列，按阅读顺序纵向排列。

## 验收结果（实测命令与结果）

| 检查 | 结果 |
| --- | --- |
| `node --check client.js` / `index.js` | 通过 |
| `package.json`、`locale/*.json` JSON 解析 | 通过 |
| `exports` 全部路径解析（`.` `./client` `./locale/*.json` `./icon`） | 4/4 通过 |
| `files` 全部路径存在 | 5/5 通过 |
| 冻结标识符（包名、row id、loader id、侧栏 id/order 35、main key、命名空间、存储键、CSS 前缀） | 全部一致 |
| 双语字典键集对比 SPEC §7 | zh 68/68，en 68/68，missing 0，extra 0，空值 0 |
| 模拟宿主 harness | **34/34 通过，0 失败** |
| 损坏 localStorage 载荷 × 14 种 | 14/14 安全降级，零抛错 |
| `localStorage.setItem` 抛错 | 面板仍正常渲染九个模块 |
| 字面色 | 仅 16 个：9 个模块强调色 + 6 个便签色 + 固定墨色 `#23262b`；其余全部 `--dsw-alias-*` 主题令牌 |
| 图标 | 合法 SVG，`viewBox 0 0 64 64`，2459 B，底色 `#0f6f6a`（与其余五个插件均不同） |
| 图标观感 | Pillow 以 8 倍超采样重放几何，在 256px 与 22px 下均清晰读出九宫格画布 |
| 安装 | `dsh plugin --profile desktop add link:…` → `+ @local/dsh-bizcanvas 1.0.0` |
| profile 清单 | 依赖与 `dsh.profile.bundles` 均已写入；从 profile 解析包得到正确名称、patch 与 68039 B 的 `client.js` |

详细逐项证据见 `.verify-bizcanvas/report.md`。

## 未验证项（如实声明）

- **真实浏览器渲染**：无浏览器控制权，未能截图断言明暗主题对比、真实宽度下的
  11 列网格、20px 侧栏图标观感。图标仅以几何重放方式验证。
- **真实指针拖拽**：拖拽索引数学与 no-op 路径通过驱动真实 handler 证明，
  但未在浏览器中做真人拖放。
- **运行中应用的插槽实况**：bundle 已安装并入列，但 `dsh --profile desktop --dump-config`
  在 Electron 之外被拒绝（"profile is managed exclusively by the Electron application"），
  无法在此做实时 `Slots.listSubTree` 检查。**需要重启应用加载新 bundle。**

## 构建过程记录

- 接口契约由 Lead 先写死（`SPEC.md`），随后 `bundle-shell` teammate 交付清单、
  patch、Host 半、双语 locale 与图标，Lead 复核并推动了图标配色的独特性修正。
- 负责 `client.js` 的 teammate 在产出任何内容前耗尽预算中断，由 **Lead 本人接手完整实现**
  （1571 行），并自建 `.verify-bizcanvas/harness.mjs` 进行验收。
- 过程中修正的 harness 自身缺陷：hook store 在每次重渲染时被清空（改为跨渲染保留、
  仅 mount 时重置）、按钮文案匹配方式、剪贴板 Promise 的微任务时序、以及状态类名白名单。
