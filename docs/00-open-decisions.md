# 待决设计决策

> 基线表最后核对日期：2026-11-05（表在 `docs/11-external-baseline.md`；超 90 天由 `ai/selfcheck/external-baseline.test.mjs` 报红）

| # | 决策 | 现状 | 影响面 | 目标轮次 |
|---|---|---|---|---|
| O1 | 商家主题可覆盖到哪一层（仅 Brand Kit / 任意 public 组件 token） | 未定；`docs/01 §四` 表写"产品团队可覆盖 `--m-*`" | 主题系统、token 公共面 | S3 |
| O2 | 深色前台 opt-in 关闭时，rank 阶梯与产品图衬底规则是否仍成立 | 未定 | 深色契约 | S3 |
| O3 | 阶位单调性是否作为硬约束 | v1.4 已修正 ink-9→12 的倒挂并加亮度单调性回归；其余色带仍按"用途为准 + 倒挂登记"，硬约束需 MAJOR 重生成 | 全色带 | 需要时另开 |
| O4 | 是否提供带行为的官方参考实现（headless + conformance） | **已解决（v1.4）**：`npm run a11y` 用 axe-core + Chrome CDP 跑 5 个页面（WCAG A/AA + 320px）；参考实现仍只有 CSS，行为层契约由组件规范约束 | 组件层、S4 | 已关闭 |
| O5 | 图表是否独立色板（现 8 色取自语义色带） | **已解决（v1.4）**：独立 8 色 `--m-chart-*`；对白底/深底 ≥3:1，CVD 模拟最小 ΔE2000 浅色 ≥12 / 深色 ≥10（`chart-cvd.test.mjs`） | 数据可视化 | 已关闭 |
| O6 | ~~87 演示 vs 22 契约~~ **已裁定（v1.6）**：契约规模以 `components/18` 的 `##` 分组为准（当前 **15 组组件契约 + 3 份状态契约**），不再引用历史数字；演示数量（87）保留，但不再充当契约规模的度量 | 数字口径已统一并由测试守护 | — | 已关闭 |
| O7 | core / commerce / console 包边界（多窗格外壳规则现混在电商规范内） | 未定 | 版本与决策耦合 | S6 |
| O9 | demo 层 R01/R11 整体豁免 vs 区段级 | **已解决（v1.4）**：demo 层纳入 R01/R11；`design-system.html` 静态源 0 裸色 / 0 primitive，ramp 浏览器仅通过运行时动态 `var()` 注入 | 治理 / 校验器 | 已关闭 |
| O10 | 后台侧栏在 768–1023px 是否要自动收成图标轨道 | **已解决（v1.5）**：`.m-shell__sidenav` 与 `.ad-sidenav` 统一为 ≤1024 → 56px 图标轨，<768 → 抽屉，≥1024 → 240px（可手动 64px） | 后台外壳 / 密度 | 已关闭 |
| O11 | 深色默认是否跟随系统（`[data-theme="auto"]` 是否成为缺省） | **机制已就位（v1.7），默认不翻转**：`auto` 为 opt-in 三态之一，`:root` 仍 `color-scheme: light`；翻转默认 = 存量站点在深色 OS 下集体变深，属视觉可见的 MAJOR | 前台默认舞台 / 品牌一致性 | v2.0 |
| O12 | `WIRING_ALLOW` 是"永久 API 面"还是"限期债" | **已裁定（v1.7 Batch 2）**：组合层不设永久白名单，全部零消费者类进入 `wiring-baseline.json` 的 ticket（附理由 + 目标批次），deadMax 棘轮只减不增；`.ad-*` 组合层定位仍是"业务侧可裁剪的示例实现"，裁掉时按 MAJOR 迁移 | 治理 / 组合层定位 | 已关闭 |
| O13 | AI 影像披露条款的法务适用范围（哪些类目、哪些市场强制） | **结构已落地（v1.7 Batch 4），法务复核未过**：`docs/06 §7.1` 逐条登记生效日期与适用面，`法务复核` 为 `待`；对应文案只入目录、不进出厂默认 | 合规 / `docs/06` | v2.0 · 法务门 |
| O14 | 邮件面纳入范围还是明确排除 | 未定；当前设计系统对邮件是沉默，而邮件覆盖 30–50% 营收渠道 | 电商承诺边界 | v2 规划会 |
| O15 | 表现预算分配表以 MB 还是元素数为准（"第三方脚本 ≤3"废止后用什么口径守 LCP） | **已裁定（v1.7 · 3.10）**：按**分类字节预算 + 加载阶段 + 主线程时间**三轴；同步三方 JS = 0KB（CMP stub ≤20KB 内联为唯一例外），异步三方必须在 LCP 后加载。完整表见 `docs/05 §四` | 性能契约 / LCP | 已关闭 |
| O19 | `.sf-sticky-atc` 吸底加购在 13 个原型中仍 **0 消费者**（Batch 3 的 PDP 接线未消费它），"抽屉盖住吸底 ATC"仍无法做运行时验证 | 未定；它是 W-02 的记账债，接线前不得用删类销债 | 接线 / 吸底转化 | v2.0 |
| O20 | R15 只检查 `margin` / `padding` 长期属性，`transform-origin: left center` 这类**物理轴向的第三个家族**不在覆盖内（改逻辑属性会把刘海内缩在 RTL 下镜像错）。扩面或明示不覆盖，二选一 | 未定；Batch 3 的 RTL 复评未处置，R15 覆盖边界仍缺裁定 | RTL 契约覆盖边界 | v2.0 |
| O21 | 跳过导航有**两套并行实现**：`.m-skip-link`（`inset-inline-start`，5 屏消费）与 `.m-skip`（`top` 物理定位、translate -200%，W-05 零消费者）。两者都自称 WCAG 2.4.1 契约 | 未定；删一套是 MAJOR，标废弃并接线也需迁移说明 | 组件去重 / 物理-逻辑属性 | v2.0 |
| O23 | `.m-crumbs` 没有当前项样式（`aria-current="page"` 无色阶/字重变化），06 只能内联 `color` / `font-weight` 复刻；02 的今日项则靠 `is-active`。同一语义两种实现 | 未定；需补 `.m-crumbs [aria-current="page"]` 并删内联（R18 会随之下降） | 组件契约缺口 | v2.0 |
| O24 | `.ad-sidenav` 刻意不声明 width（依赖 `.m-shell__sidenav` 的 56/240 两档），组合层单独引用时没有宽度；admin/14 未记录 `.ad-topbar` 的搜索/通知/账户顺序与 `.ad-builder` 三栏结构 | 未定；builder 结构仍只在 06 的呈报清单里 | 组合层文档债 | v2.0 |
| O25 | PDP 数量步进器（44px）与加购 CTA（52px）同排高度不一致；`.sf-buyrow` 只拉伸外框、内部三段仍 44px，且该组合类未文档化且零消费者。页面用 `.m-row` 手搓，六门全绿仍可出厂 | **已裁定并修复（v1.7 补丁）**：`.sf-buyrow` 把外框与三个子控件一起对齐到 `--m-btn-h-cta`；PDP 改用该组合类；`storefront/11` 与 `components/18` 补契约；a11y 门新增计算高度断言 | 购买箱 / 同排基线 | 已关闭 |

## v2.0 方向登记（计划 5.1–5.6，只定契约与顺序，不在 v1.7 实施）

| # | 方向 | 为什么必须 MAJOR | 前置 / 关联决策 |
|---|---|---|---|
| 5.1 | **机器可读商务层与视觉原子同源**：`Product/Offer/AggregateRating/Review` JSON-LD 由 `Price`/`Rating`/`ProductCard` 的同一 props 生成；`compareAt` 的 30 天最低价约束同时投影到 `priceSpecification`；补 `llms.txt` 与商品目录导出契约 | 新增一整层事实来源与消费方（Agent），并要求"可见价 = 机器价"；现有架构是 CSS 单源，不含结构化输出（全仓 `application/ld+json` 现为 0） | 先完成 5.2 或与其同批；5.1 之前先让反向接线门覆盖新消费者 |
| 5.2 | **block 级主题作用域**：`data-m-scheme`（section/block 粒度覆盖封闭属性集），支持"页头深绿 + 首屏浅底 + 促销带反转"并存 | 同时开放公共覆盖面 → 语义重指向，必须带迁移说明 | 关闭 O1；与 5.1 同批或先于 5.1 |
| 5.3 | **OKLCH 色带重建**：7 条色带重生成 + 全部对比断言重跑 + `*-solid` 解耦到独立亮实底轨；与 `color-gamut: p3` 同批 | 视觉可见 + 阶位语义变更；同一色带内 8/9 阶倒挂是算术必然，重生成解决不了，必须解耦 | 先裁定 O3（阶位单调性是否硬约束） |
| 5.4 | **深色默认跟随系统**：3.2 的机制已就位，翻转默认即 MAJOR | 改变默认舞台；存量站点在深色 OS 下集体变深 | 关闭 O2；`dark-contrast.test.mjs` 扩到自动态 |
| 5.5 | **邮件面**：独立工作流，不塞进 v1.7。取舍需明示——(a) `tokens.json` 编译出邮件变量；(b) 明确"邮件不属于本设计系统范围"并从电商承诺里删掉 | 邮件客户端是另一套 CSS 支持子集（table 布局、深色图片反转、预览截断）；当前状态是沉默，等于漏掉 30–50% 营收渠道 | 关闭 O14（产品决策，非规范决策） |
| 5.6 | **包边界**：core / commerce / console 分离 | 5.1/5.2 会让 commerce 特化条款继续膨胀，不划边界则 v2 决策仍与电商耦合 | 关闭 O7 |

## 贯穿指标（v1.7 起逐版追踪）

> 计划 §10 曾要求写进 `ai/selfcheck/manifest.json`；执行期已证伪——该文件是规则违规清单，不是指标表（见计划 2.1 回填）。指标的账本按下表分散在各自的门禁文件与测试日志里，**每版发版前更新当前值**。

| # | 指标 | 当前值（2026-11-05） | 唯一账本 / 守护 |
|---|---|---|---|
| ① | 三文件接线率 | site **32.9%**（49/149）· admin **45.8%**（38/83）· meridian **91.35%**（169/185） | `ai/selfcheck/wiring-baseline.json` + `wiring.test.mjs`（G-231） |
| ② | 原型内联 `style=` 数 | **692**（基线 834；测法 `grep -o 'style="' prototypes/*.html \| wc -l`） | `ai/selfcheck/r18-baseline.json` + `r18-inline-style.test.mjs` |
| ③ | 零 `<img>` 店面页数 | **1**（`12-account.html`；08–11 已有 26 张影像） | `conformance.test.mjs` 影像扫描 + 本表人工复核 |
| ④ | `theme-dark` 可达性 | **3/5** 店面页可切换（08/09/10；11 刻意不提供，12 未接线） | `runtime-batch3.mjs`（08/09/10）+ 本表 |
| ⑤ | 镜像字段归属率 | **419/419（100%）** | `tokens-sync.test.mjs` 归属表 |
| ⑥ | 外部基线表最后核对日期 | **2026-11-05** | `docs/11-external-baseline.md` + `external-baseline.test.mjs`（90 天） |

## 校验器已知局限（零依赖路线的定价）

来自 `ai/AGENTS.md §8` 的原文摘录：

- 模板字符串拼接的类名（`` `z-[${n}]` ``）不解析 → 保守放行。
- Sass/Less 嵌套与 mixin 不支持；SFC 的 `:class`/`:style` 动态绑定不解析。
- 命名级字阶（如 `text-base`）是否越界无法在当前判定，随 S2 的 `tokens.api.md` 落地。
- R13 依赖组件标签名；业务侧 wrapper 必须登记进 `meridian.config.json` 的 `componentAliases`。
- R14 只判三种形式：`<dir>/NN-*.md §X`、跨目录裸「NN 章」、`vX.Y.Z`。**同目录裸章节引用与「（第N节）」不判**——判定需读散文语义，硬判会造误报。本轮手工归位一次，残留由 S2 的锚点系统接管。
- demo 层（`design-system.html`）已纳入 R01/R11；静态源 0 裸色 / 0 primitive。色板浏览器通过运行时动态 `var()` 注入，不产生静态事实（非业务代码）。
- 运行时事实：`npm run a11y`（axe-core，WCAG A/AA + 320px + `dir="rtl"`）、`npm run behavior`（CDP 真实按键）、`npm run ax`（AX 树快照：role/name/状态/live）、`npm run i18n`（语言包 key/ICU/复数/长度/术语）、`npm run l10n`（真实语言包 + 伪本地化的窄屏排版）均已接入 CI；仍未自动化的是 AT 合成语音与翻译语义审校（TMS 流程 + 发布前人工核对，见 docs/07 §七）。

## 镜像归属（v1.7 · 2.5）

`ai/tokens.json` 是 `ai/tokens.css` 的镜像，但"镜像"不等于"全比过"。`ai/selfcheck/tokens-sync.test.mjs` 维护一张**归属表**：每个叶子键必须落在"已比对（附断言出处）"或"显式不比对（附理由）"之一；未归属、模式空转、排除项缺理由均为红。新增 json 字段时先决定它属于哪张表，再写值——否则 CI 直接拒绝。

当前显式不比对项（以测试内表为准）：`$schema` / `$name` / `$description`（元数据与散文）、`color.surface-ranks-note`、舞台覆盖的 `note`、`typography.body-fs`（散文，实际值在 `stage.*`）、`typography.roles.$note`、`typography.rules`、`elevation.e1–e4`（层级用途散文，数值契约在 `z-ladder`）、无障碍目标尺寸与对比度比率（分别由 axe target-size、`runtime-a11y` 与 `contrast.test.mjs` 执行；CSS 无对应 token）。

## O8（已解决 · S2）：`engine.run()` 文档层允许标记误报
引擎对 `AGENTS.md` 中以 `/* meridian-allow（保留线）: 理由 */` 形式出现的文档示例误解析为未消耗标记并报 stale。根因：`collectAllows(text)` 对所有 layer 跑，doc 文件不在豁免。判定方向：在 `run()` 入口对 `layer === "doc"` 跳过 `collectAllows`（文档不是被审计代码）。S1 已通过手工删除 2 处 AGENTS.md 内的展示性 marker 暂缓，但治本应改引擎。**代价**：不动引擎则 spec 文档里的 marker 示例持续产生 stale 信号。**目标轮次**：S2 引擎完善。
**S2 处置**：`engine.run()` 对 `layer === "doc"` 跳过 `collectAllows`（文档不是被审计代码），回归测试钉在 `ai/lib/engine.test.mjs`。
