# DSH Plugins

一组为 [DeepSeek Harness](https://deepseek.com) (DSH) 编写的侧栏插件。每个插件都在 DSH Web 的侧边栏注册一个入口，并在主面板打开一块独立的工作区。

Nine sidebar plugins for DeepSeek Harness. Each registers a sidebar entry and its own main-panel workspace, ships zh/en locales, and keeps its data in `localStorage`.

## 插件列表 / Plugins

| 插件 | 中文名 | English | 说明 |
| --- | --- | --- | --- |
| [`dsh-kanban`](plugins/dsh-kanban) | 敏捷看板 | Kanban Board | 四列看板，卡片拖拽流转阶段，WIP 上限提示 |
| [`dsh-mindmap`](plugins/dsh-mindmap) | 思维导图 | Mind Map | 逐节点生长的导图，框选批量删除，径向树自动布局，导出 SVG/PNG/Markdown/JSON |
| [`dsh-flowboard`](plugins/dsh-flowboard) | 流程图板 | Diagram Board | 流程图、架构图、泳道图、组织架构图与 Runbook，含模板库、平移缩放、节点与连线编辑 |
| [`dsh-note-wall`](plugins/dsh-note-wall) | 便签墙 | Note Wall | 自由摆放的便签墙，用于收集零散想法 |
| [`dsh-prd-studio`](plugins/dsh-prd-studio) | PRD 工作台 | PRD Studio | 撰写、结构化并导出产品需求文档 |
| [`dsh-bizcanvas`](plugins/dsh-bizcanvas) | 商业画布 | Business Model Canvas | Osterwalder 九宫格，便签可在格子之间拖动，支持多份命名画布 |
| [`dsh-competitive-analysis`](plugins/dsh-competitive-analysis) | 竞品分析 | Competitive Analysis | 竞品画像、加权维度矩阵、结论与风险，导出 Markdown |
| [`dsh-market-analysis`](plugins/dsh-market-analysis) | 市场分析 | Market Analysis | 市场规模与 CAGR、加权细分、CR/HHI 集中度、趋势与报告导出 |
| [`dsh-industry-analysis`](plugins/dsh-industry-analysis) | 行业分析 | Industry Analysis | 行业规模与生命周期、价值链经济学、波特五力、集中度 |

每个插件目录里通常包含：

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包清单：`dsh.bundle.patch` 指向 loader patch，`dsh.client` 声明客户端平台与注入依赖 |
| `cordis.patch.yml` | 向 loader 插入一条形如 `{ id, name }` 的条目 |
| `index.js` | Host 半：多数插件只需 `export function apply() {}` |
| `client.js` | 浏览器半：注册侧栏入口与主面板，含全部交互逻辑 |
| `locale/{zh,en}.json` | 插件在市场上的显示文案 |
| `icon.svg` | 原创图标 |
| `SPEC.md` / `DELIVERY.md` | 接口契约与交付验收记录（部分插件提供） |

## 安装 / Install

插件以 `link:` 依赖装进 DSH profile，因此本仓库需要先克隆到本地，再让 profile 指向它。

**1. 克隆到本地**

```bash
git clone https://github.com/ll011702pf/dsh-plugins.git
cd dsh-plugins
```

**2. 把插件接进你的 profile**

DSH 桌面版的 profile 位于 `~/.dsh/profiles/desktop/`。在它的 `package.json` 里为想用的插件加上 `link:` 依赖，并把包名按依赖顺序加入 `dsh.profile.bundles`：

```json
{
  "dependencies": {
    "@local/dsh-kanban": "link:/absolute/path/to/dsh-plugins/plugins/dsh-kanban"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@local/dsh-kanban"
      ]
    }
  }
}
```

把 `link:` 的路径换成你本机的克隆位置，其余 bundle 保持你 profile 中原有的顺序，新插件追加在后面。

**3. 安装依赖并重启**

在该 profile 目录里执行 `pnpm install`，然后重启 DeepSeek Harness。侧栏出现对应入口即安装成功。

> 包名使用 `@local/` 前缀，表示这些是本地链接包而非 npm 发布包。若你改了插件目录名或包名，需要同步修改 `cordis.patch.yml` 里的 `name`，两者必须一致。

## 开发 / Development

所有插件都是纯 ESM，无构建步骤，唯一的例外是 `dsh-flowboard`——它的 `client.js` 由 `src/` 下的三个片段拼接而成：

```bash
cd plugins/dsh-flowboard
node build.mjs          # 从 src/ 重新生成 client.js
node build.mjs --check  # 校验已提交的 client.js 与重新构建结果字节一致
```

改动任何插件后，至少跑一遍语法检查：

```bash
node --check plugins/<name>/client.js
node --check plugins/<name>/index.js
```

插件在浏览器半里通过 `window.__ModuleLoader__.load({ id, factory })` 暴露 `{ inject, apply }`；`apply` 内用 `ctx.locale`、`ctx.slots` 等宿主服务完成注册。样式请使用宿主的 `--dsw-alias-*` 主题令牌，不要写死颜色值，否则深色主题下会失真。

## 验证 / Checks

`checks/` 下保留了竞品分析插件的验证过程记录：

```bash
cd checks/dsh-competitive-analysis-checks/harness
node verify.mjs        # 30 项：清单、导出、图标、本地化、纯函数
node regress-date.mjs  # 11 项：时间戳与文件名的恶意输入回归
```

两个脚本都按自身位置解析插件目录，克隆到任意路径都能直接运行。

## 许可 / License

本仓库未附带许可证文件。如需在他人项目中复用，请先联系作者。
