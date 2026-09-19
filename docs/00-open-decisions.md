# 待决设计决策

| # | 决策 | 现状 | 影响面 | 目标轮次 |
|---|---|---|---|---|
| O1 | 商家主题可覆盖到哪一层（仅 Brand Kit / 任意 public 组件 token） | 未定；`docs/01 §四` 表写"产品团队可覆盖 `--m-*`" | 主题系统、token 公共面 | S3 |
| O2 | 深色前台 opt-in 关闭时，rank 阶梯与产品图衬底规则是否仍成立 | 未定 | 深色契约 | S3 |
| O3 | 阶位单调性是否作为硬约束 | S1 已按"用途为准 + 倒挂登记"处理；若要单调需 MAJOR 重生成 | 全色带 | 需要时另开 |
| O4 | 是否提供带行为的官方参考实现（headless + conformance） | 当前只有 CSS；焦点缺陷即源于此 | 组件层、S4 | S4 |
| O5 | 图表是否独立色板（现 8 色取自语义色带 9 阶，2 色不达 3:1） | 未定 | 数据可视化 | S2 |
| O6 | 87 演示 vs 22 契约：收缩演示还是扩契约 | 演示数量是契约的 4 倍 | 组件层可抄性 | S4 |
| O7 | core / commerce / console 包边界（多窗格外壳规则现混在电商规范内） | 未定 | 版本与决策耦合 | S6 |

## 校验器已知局限（零依赖路线的定价）

来自 `ai/AGENTS.md §8` 的原文摘录：

- 模板字符串拼接的类名（`` `z-[${n}]` ``）不解析 → 保守放行。
- Sass/Less 嵌套与 mixin 不支持；SFC 的 `:class`/`:style` 动态绑定不解析。
- 命名级字阶（如 `text-base`）是否越界无法在当前判定，随 S2 的 `tokens.api.md` 落地。
- R13 依赖组件标签名；业务侧 wrapper 必须登记进 `meridian.config.json` 的 `componentAliases`。
- R14 只判三种形式：`<dir>/NN-*.md §X`、跨目录裸「NN 章」、`vX.Y.Z`。**同目录裸章节引用与「（第N节）」不判**——判定需读散文语义，硬判会造误报。本轮手工归位一次，残留由 S2 的锚点系统接管。
- demo 层（`design-system.html`）整体关闭 R01/R11（色板浏览器必须直接引用 ramp），区段级收窄待 S2。
- 运行时事实（焦点是否真的可见、ARIA 是否真的正确）由 S4 的 axe / Playwright 接管。

## O8（新增）：`engine.run()` 文档层允许标记误报
引擎对 `AGENTS.md` 中以 `/* meridian-allow: ... */` 形式出现的文档示例误解析为未消耗标记并报 stale。根因：`collectAllows(text)` 对所有 layer 跑，doc 文件不在豁免。判定方向：在 `run()` 入口对 `layer === "doc"` 跳过 `collectAllows`（文档不是被审计代码）。S1 已通过手工删除 2 处 AGENTS.md 内的展示性 marker 暂缓，但治本应改引擎。**代价**：不动引擎则 spec 文档里的 marker 示例持续产生 stale 信号。**目标轮次**：S2 引擎完善。
