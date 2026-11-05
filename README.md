# Meridian Design System（子午线）

**面向欧美市场的企业级电商视觉设计规范** · v1.6.0 · 2026-11-05

> 子午线连接东西。一套 token 骨架，驱动两个舞台：**卖货的前台**（信任 · 转化 · 表达）与**运营的后台**（密度 · 效率 · 控制），并且让 AI 能确定性地产出符合规范的界面。

---

## 体系来源（精髓承接）

- **Shopify Polaris**（2025-10 起转向 Web Components）：语义角色色板、状态族五件套、content-first 文案、Contextual Save Bar、Saved Views、"何时删除一个组件"的判断（Sheet 废弃案例）
- **IBM Carbon**：2x 编号间距、相对 layer token、productive/expressive 双动效人格、数据可视化固定色板
- **GitHub Primer**：三层 token + "primitive 禁止直接使用"的机器可查规则、语义状态词汇
- **Radix Colors**：12 阶语义刻度、对比度由构造保证
- **Material 3**：状态层公式（8/12/16%）、emphasized easing、时长阶梯
- **Atlassian**：状态即 token 维度、2px 焦点环、Inter Variable 调校权重
- **shadcn/ui + Tailwind v4**：CSS 变量优先 + `@theme inline`、radius 单旋钮、`data-slot` 机器挂点
- **Baymard / FTC / EDPB / EAA / Omnibus**：转化模式与合规组件（WCAG 2.2 AA、GDPR 对等拒绝、FTC 评价规则、30 天最低价、2026-06 EU 一键撤回）

## 文件地图

```
仓库根/
├── README.md                          ← 你在这里
├── AUDIT-1.4.0.md                     ← 独立审计报告（P0–P3 清单 + 验收标准 + 状态）
├── docs/                              ← 设计基础（所有人必读 01/02）
│   ├── 01-design-philosophy.md        设计哲学：来源解构 + 十原则 + 架构图
│   ├── 02-color-system.md             色彩：12 阶语义 / 8 色带 / 对比契约 / 深色模式
│   ├── 03-typography.md               字体：Inter 调校 / 双舞台字阶 / 价格排版
│   ├── 04-spacing-layout-elevation.md 间距/网格/海拔/Z 阶梯/焦点环/触达
│   ├── 05-motion-iconography.md       动效双人格 / 图标 / 图像与 LCP
│   ├── 06-accessibility-compliance.md WCAG 2.2 AA 映射 / GDPR / FTC / 暗黑模式禁令
│   ├── 07-localization.md             US/CA/UK/DE/FR/AU 速查 + 地址矩阵
│   ├── 08-copywriting.md              文案系统：模板库 + 法律固定文案
│   ├── 10-art-direction.md            美术指导：影像序列/插画契约/版式原型/字体身份/品牌时刻
│   └── 09-storefront-foundations.md*  （放 storefront/ 目录）
├── storefront/                        ← 前台规范
│   ├── 09-storefront-foundations.md   骨架/区块库/性能预算
│   ├── 10-storefront-plp.md           集合页：商品卡/筛选/排序/分页
│   ├── 11-storefront-pdp.md           PDP 全解剖：画廊/变体/价格块/粘性加购
│   ├── 12-storefront-cart-checkout.md 购物车抽屉/结算三步/SCA/支付矩阵/确认页
│   └── 13-storefront-trust-conversion.md 信任系统/评价/伦理紧迫感/检查单
├── admin/                             ← 后台规范
│   ├── 14-admin-foundations.md        App Shell/Save Bar/Saved Views/⌘K/异步任务
│   ├── 15-admin-data-tables.md        数据表格全规格
│   ├── 16-admin-forms-settings.md     表单/校验时机/保存决策/破坏性确认矩阵
│   └── 17-admin-feedback-dashboard.md Banner/Toast/Modal 决策树/仪表盘
├── components/
│   └── 18-component-contracts.md      15 组组件契约（变体×状态矩阵+挂点）+ 3 份状态契约
├── i18n/                              ← 语言包与 TMS 规则（en 源 / ar / de / 术语表 / QA 规则 / crowdin.yml）
└── ai/                                ← 机器层（AI coding 入口）
    ├── AGENTS.md                      放到仓库根 = AI 自动遵守的规则
    ├── tokens.css                     三层 token（唯一允许色值的地方）
    ├── tailwind-theme.css             Tailwind v4 @theme 桥接
    ├── tokens.json                    DTCG 主题层镜像（运行时源为 tokens.css）
    ├── validate.mjs                   合规校验器（node ai/validate.mjs . --exclude ai/selfcheck/fixtures）
    ├── meridian-behavior.js           参考行为层（焦点陷阱/方向键/组合框，零依赖）
    ├── selfcheck/runtime-a11y.mjs     运行时无障碍门禁（axe-core + Chrome CDP）
    ├── selfcheck/runtime-behavior.mjs 键盘与焦点行为门禁（CDP 真实按键）
    ├── selfcheck/runtime-ax.mjs       AX 树快照门禁（读屏输入层基线）
    ├── selfcheck/runtime-l10n.mjs     本地化门禁（真实语言包 + 伪本地化）
    ├── i18n/validate-catalogues.mjs   语言包门禁（key/ICU/复数/长度/术语）
    ├── i18n/pseudo.mjs                伪本地化生成器（en-XA）
    └── prompts.md                     5 个可复用 AI 提示词模板
```

## 快速开始

**方式 A · 我要用 AI 编码（推荐）**
1. 把 `ai/` 整个目录复制进项目，`AGENTS.md` 放仓库根（或 `.cursor/rules`、`CLAUDE.md` 引用它）。
2. 引入样式：`@import "ai/tokens.css"; @import "ai/tailwind-theme.css";`
   舞台：`:root` 已是**前台浅色**（主操作近黑）；**后台必须在 `<html>` 或 `<body>` 加 `.stage-admin`**，否则会拿到前台的按钮色与 16px 正文。深色加 `.theme-dark` 或 `data-theme="dark"`，可与舞台类同元素。
3. 每次生成页面前，让 AI 先读对应规范文档（prompts.md 模板已内置）。
4. 提交前跑 `node ai/validate.mjs . --exclude ai/selfcheck/fixtures`（或直接 `npm run lint`）。
5. 安装依赖后跑 `npm run a11y`（axe-core + Chrome CDP；逐页检查 WCAG A/AA、320px reflow、`dir="rtl"` 镜像；需要本机 Chrome/Chromium，CI 自动 setup）。
6. 需要交互组件时，直接引用 `ai/meridian-behavior.js`（浮层焦点陷阱、tabs/seg 方向键、combobox 键盘）。
7. 门禁：`npm run behavior`（键盘/焦点）、`npm run ax`（AX 树快照）、`npm run i18n`（语言包）、`npm run l10n`（真实语言包 + 伪本地化排版）。全部一起跑：`npm run verify`。AX 基线有意图变更时用 `npm run ax -- --update` 重建并审阅 diff。

**方式 B · 我要人肉设计/评审**：按 `docs/01 → 02 → 04` 顺序读，前台看 `storefront/`，后台看 `admin/`，评审用 storefront/13-storefront-trust-conversion.md §七与 components/18-component-contracts.md。

**方式 C · 我要接入品牌**：改 `ai/tokens.css` 的 brand 色带（docs/02-color-system.md §第八节 配方）+ `--m-font-display` + `--m-radius` 旋钮，语义层与业务代码零改动。

## 治理

**事实来源只有一句话**：`ai/tokens.css` 是运行时唯一事实来源；`ai/tokens.json` 是 primitive + semantic 主题层的 DTCG 机器镜像（含 `$version` 唯一版本声明）。两者由 `ai/selfcheck/tokens-sync.test.mjs` 按**归属表**比对：每个镜像键必须登记为"已比对（附断言出处）"或"显式不比对（附理由）"，未归属即红；禁止单边修改。

- 语义变更走 SemVer：**任何视觉可见的值变更 ≥ MINOR**（含 primitive 改值——它是整张对比契约的输入）；加 token = MINOR；改语义指向、删 token 或改变默认舞台 = MAJOR + 迁移说明 + codemod。版本以 `ai/tokens.json` 的 `$version` 为唯一声明，README / tokens.css / meridian-ui.css / design-system.html / package.json / CHANGELOG 必须一致（`acceptance.test.mjs` 逐源断言）。
- 新规则分两类：**可校验的**必须进 `validate.mjs` 并配 fixture；**不可机械判定的**（如“表面 rank 是否选对”）必须在 AGENTS.md 标 `review-only` 并给出判断依据，否则不予收录。
- 违规处理顺序：校验器拦截 → review 打回 → 模板库补充（让同类违规下次不可能发生）。
- 缺陷入口：审计发现按 `AUDIT-1.4.0.md` 的 A-xx 编号登记，修复后回填状态；Deferred 项必须有排期与理由。
