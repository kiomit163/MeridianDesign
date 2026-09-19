# Meridian S1 · 让承诺为真：机器层修复设计

- **状态**：待用户审阅
- **日期**：2026-09-19
- **范围**：S1（六个子项目中的第一个）。S2–S6 见 §3.2 Deferred 清单。
- **基线**：git `143edd0`（v1.0.0 现状快照）
- **来源**：2026-09-19 全量审计（27 文件逐行 + 机器层实测）

---

## 1. 问题陈述

`ai/AGENTS.md:3` 承诺"非合规 = 构建失败"。实测该承诺为假：

| 实测项 | 结果 |
|---|---|
| 15 处植入真违规的 AI 典型输出 | 命中 **1** 处，漏 14 处 |
| 4 处合规代码 | 全部误报（`p-[16px]`/`mt-[12px]`/`gap-[24px]`/`IconOnlyButton aria-label`） |
| `validate.mjs . --json` | 20 处违规但 **exit 0**（CI 假绿） |
| 系统第一原则"primitive 禁止直接使用" | **无任何守卫**；参考实现自己越权 14 处、演示 35 处 |
| `AGENTS.md §1` 十条"validator-enforced"硬规则 | 有守卫 4 条，逻辑错误 2 条，无守卫 4 条 |
| 字号地板 12px（`docs/03:67`"任何场景禁止更小"） | 实现 33 处 11/10/9px，且 `18:159` 把 11px 写成规格 |
| 前台近黑 CTA 依赖 `.stage-storefront` | README 方式 A 与 5 个 prompts 模板均未提及 → 漏写即全站品牌绿，静默 |
| `.theme-dark` 与 `.stage-*` 同元素 | 后代选择器失效，而 `AGENTS.md:42` 教的正是这个写法 |
| 焦点环 | `box-shadow` 被组件层以更高特异性覆盖（`.m-sidenav a.is-active` 0,2,1 > `:where()` 0,1,0）；`.m-check`/`.m-switch` 的可聚焦元素 `opacity:0` 且可见部件无焦点样式 → WCAG 2.4.7 在参考实现里就不合格 |
| 12 阶语法"全系统唯一" | 三份阶位表冲突（5/6/7 阶错位一档）；7/8 色带存在阶位倒挂；`docs/02 §十` 品牌配方算出的 9 阶方向与 shipped 色带相反 |
| 密度默认 | `AGENTS.md:46` 说 36px，`docs/15:40` 说 48px 默认，实现取 comfortable，`--m-table-row-h-productive` 零消费者 |
| 17 章整节讲 Toast | 无 `.m-toast` 实现，5 个 toast 相关 token 全为孤儿 |

同轮附带修复：6 处章节交叉引用指错、`18:121` 引用不存在的 v1.0.1 记录、README 文件地图目录名仍为 `设计规范0913`、16 处物理方向属性违反 `docs/07:65` 自设的逻辑属性要求。

---

## 2. 决策记录（均已与发起人确认）

| # | 决策 | 选定 | 被否及理由 |
|---|---|---|---|
| D1 | 本轮范围 | 只做 S1，S2–S6 各自独立 spec→plan→实现 | 一次性总 spec：细节被压扁且违反"一份 spec 一个计划"节奏 |
| D2 | 校验器内核 | **零依赖 + 事实级匹配 + fixture 精确集合断言** | `@babel/parser`（使 `ai/` 不能再整目录拷走）；stylelint+eslint 全家桶（给规范仓库装两个生态，认知负荷与双份配置不划算） |
| D3 | 字号地板 | **12px 硬地板，零例外**（= `--m-text-xs`，本就是菜单最小级） | 11px+白名单角色：需"上下文角色"才能判定，AI 误用概率上升；文本 vs 非文本两地板：代码里都是 `span`，实际退化成靠 review 自觉 |
| D4 | 舞台默认值 | **`:root` = Storefront 浅色，后台必须显式 `.stage-admin`** | 只加声明式校验：校验器只防已写下的代码，不防"默认就错"；C 方案（两边都强制）语义冗余 |
| D5 | 阶位真相 | **以"用途→阶"为唯一表，把倒挂登记为契约**（黄橙族 9 阶=亮实底配深字；深色族 9 阶=深实底配白字），配方拆同两分支 | 重生成色带求严格单调：MAJOR 全量重刷且背离 Radix 构造（其 9 阶本是彩度峰值非排序项）；只钉表不解释倒挂：下轮重开同问题 |
| D6 | 工程基线 | **git init + v1.0.0 基线 + 最小 package.json（`node --test`）** | 不碰 git：S2 的生成物 diff 门无处挂、无回滚点、CHANGELOG 无据 |

设计不变量：**每条 error 级规则必须当场存在一条合规写法**；**每条规则必须同时有真阳性与真阴性 fixture，断言命中集合相等而非"至少命中"**。

---

## 3. 范围

### 3.1 In

1. 工程基线与本地门禁（git 已建，补 `package.json`、`.gitignore` 已建）
2. `validate.mjs` v2 内核 + 14 条规则 + 行级例外 + 退出码/SARIF/baseline
3. `ai/selfcheck/` fixture 与 `node --test` 回归集
4. 焦点环改 `outline` 并收敛单一声明点；`.m-check`/`.m-radio`/`.m-switch` 补可见焦点
5. 舞台默认值翻转 + `.stage-*` 与 `.theme-dark` 复合选择器 + 新增 `--m-body-fs`
6. 实现层 49 处 primitive 越权清零（6 个新语义 token 承接 + 4 处复用既有 token），同步写入 `tokens.json`
7. 33 处 <12px 字号清零，`18:159` 合规小字改 12px
8. 补 `.m-toast` 参考实现与 `[data-density="productive"]`
9. 阶位表单点化 + 品牌配方两分支化
10. 密度默认三处统一；16 处物理方向属性转逻辑属性
11. `.stage-*` 写入 README 方式 A 与 5 个 prompts 模板
12. 6 处章节引用修正 + 引用形式约定 + `R14` 引用完整性校验
13. `CHANGELOG.md`（承接 v1.0.1 引用）、`MIGRATION-1.1.md`、`docs/00-open-decisions.md`
14. README 文件地图更新与目录名修正
15. `design-system.html` 定性为 demo 层（`ramp-demo` 区段标记），其中 <12px 与自造 z-index 一并修

### 3.2 Deferred（原样登记，禁止本轮膨胀）

- **S2**：`tokens.json` 真 DTCG 化、生成器（`tokens.css`/`tailwind-theme.css`/`breakpoints.ts`/`tokens.api.md`）、断言式对比契约与阶位单调性检查、88 个 Tailwind 漏投影补全、95 个孤儿 token 清理（本轮只动 §3.1-6/8 点名的 5+5 个）、图表独立色板
- **S3**：主题即数据、租户主题包、发布前对比度门禁、`derive-brand.ts`、token public/internal 面、版本语义重写的工程化
- **S4**：8 个复杂组件的 headless 行为 + conformance 测试、axe 运行时验证（届时升级 R09/R10）、Playwright 视觉回归、Lighthouse 预算门、87 演示 vs 22 契约收敛
- **S5**：GPSR/单价义务全欧盟范围/VerpackG/WEEE、邮件与 PDF 发票契约、钱包按钮服务商品牌合规、前后台缺失页（站内搜索/账户与 RMA/Notify me/成员权限/审计日志/促销构建器/导入导出中心）、`docs/19-legal-citations.md`
- **S6**：`LICENSE`、`core/commerce/console` 包边界、远端 CI、字体与图标资产授权清单

---

## 4. 设计

### 4.1 目录结构

```
ai/
├── validate.mjs          入口。CLI 与路径完全向后兼容（README/AGENTS/prompts 三处引用不改）
├── checks/               一规则一文件（r01-raw-color.mjs … r15-rtl-logical.mjs）
│   └── index.mjs         规则注册表：{id, severity, layers, on, match, fix}
├── lib/
│   ├── classify.mjs      路径 → layer: define | component | feature | demo | doc
│   ├── parse-css.mjs     剥注释 → {prop, value, line, selector} 流
│   ├── parse-markup.mjs  标签 → {tag, attrs, classes[], line}
│   └── spacing.mjs       任意值 → px 归一（rem×16）+ 4 网格取模
├── selfcheck/
│   ├── fixtures/<Rxx>/{pass,fail}/*
│   ├── manifest.json     每个 fail 文件的精确命中集 [{rule,file,line,col}]
│   └── rules.test.mjs    node --test：集合相等断言（漏报与误报同样红）
├── tokens.css · meridian-ui.css · tailwind-theme.css · tokens.json · AGENTS.md · prompts.md
```

零第三方依赖；`ai/` 整目录拷进项目仍可运行（保持现有交付形态）。

### 4.2 内核：从"扫整行"到"扫事实"

`classify(path) → scan(file) → 事实流 → rule.on(fact)`。三点消除旧缺陷：

- **CSS 先剥注释**：`/* #fff */`、被注释掉的 `z-index: 999` 不再误报；字符串字面量保留（R10/R13 需要）。
- **类名逐 token 拆分**：`p-[16px] mt-[12px] gap-[24px]` 各自独立判定，不再塌成一条命中。
- **属性名归一**：`z-index: 9999`、`style={{ zIndex: 9999 }}`、`z-[9999]`、Tailwind 内置 `z-10…z-50` 走同一逻辑通道。
- 换行处理：Windows 下 git `autocrlf` 会在工作区留 CRLF，`split("\n")` 尾部带 `\r` → 统一 `split(/\r?\n/)`,并对 value 做 `trim()`，避免行尾锚点失配。

### 4.3 规则表（14 条，全 error 级）

| ID | 判定 | 适用 layer | 合规写法 | 本轮新增 |
|---|---|---|---|---|
| R01 | 裸色值：CSS 值位、JSX/HTML 属性、字符串字面量、`text-[#fff]` | feature, component | `var(--m-*)` / 语义工具类 | 事实级重写 |
| R02 | `z-index` 字面量、`style={{zIndex:N}}`、`z-[N]`、内置 `z-10…z-50` | 全部（define 除外） | `z-[var(--m-z-modal)]` | +3 通道 |
| R03 | `transition/animation` 简写中带命名关键帧的时长、`duration-[900ms]`、`duration-<数字>`、自造缓动 | 全部（define 除外） | `duration-[var(--m-duration-150)]` | 简写解析 |
| R04 | `!important` | feature, component | — | 例外收窄 |
| R05 | 间距归一化取模：`p-[0.6rem]`(9.6px)、`p-3.5`(14px)、`p-[7px]` 违规；`p-[16px]`/`p-4` 合规 | 全部（define 除外） | `p-4` / `p-[var(--m-space-4)]` | 反向逻辑修正 |
| R07 | 自造圆角 `rounded-[6px]`、`border-radius: 6px` | 全部（define 除外） | `rounded-md` / `rounded-[var(--m-radius-md)]` | 新 |
| R08 | 不在字阶菜单内的 `font-size` 字面量（含 11/10/9px、`text-[13px]`） | 全部（define 除外） | `text-xs…text-display` | 新（D3） |
| R09 | `outline:none`/`outline:0` 无替代 | feature, component | 依赖 base 焦点环 | 新 |
| R10 | 反向：含 `<svg`、自身无 `aria-label/labelledby`、无可读文本的交互元素 | feature | `aria-label="Close"` | 逻辑反转 |
| R11 | feature/component 层引用 primitive `--m-(ink\|brand\|accent\|info\|success\|warning\|danger\|mystic)-N` | feature, component | 语义 token | 新（第一原则） |
| R12 | `<img>` 无 `width`+`height` 且无 `aspect-ratio`/`class` 声明 | feature, demo | 声明宽高 | 新（`docs/05:82` 承诺项） |
| R13 | 合规结构：`<Urgency>` 缺 `verified`；`<Price>` 缺 `market`；出现 `compareAt` 而无 `compareAtVerified`；`<ReviewItem>` 出现属性拒绝表中的任一项：`onlyPositive` `hideNegative` `filterNegative` `suppressUnfavorable` | feature | 传 verified / market | 新（"结构上不可能"可回归） |
| R14 | 文档引用完整性：`docs/NN §N` 目标文件与章节必须存在；`vX.Y.Z` 引用必须在 CHANGELOG 有对应条目 | doc | 带文件名的引用 | 新 |
| R15 | `margin-left/right`、`padding-left/right`（不含 `border-*`，不含定位属性 `left/right`） | feature, component | `margin-inline-*` | 新 |

**编号说明**：ID 从旧版 6 条延续，`R06`（旧"图标按钮子串命中"）由 `R10` 取代并保留空缺不复用，便于既有工单追溯。故"14 条规则"的编号区间是 R01–R15 缺 R06。

**已知局限（写进 `AGENTS.md` 末尾，不隐瞒）**：模板字符串拼接（`` `z-[${n}]` ``）不解析；Sass/Less 嵌套简写不支持；R13 依赖组件标签名，业务侧 wrapper 需在 `meridian.config.json` 注册 `componentAliases`。这些是零依赖路线的定价；S4 引入 axe/Playwright 后 R09/R10 升级为运行时验证。

### 4.4 例外机制与文件分层

```css
.m-btn--destructive:hover { background: var(--m-critical-solid-hover); } /* meridian-allow: wallet-brand-lock */
```

- 无 `reason` 的标记不生效；命中数为 0 的标记报 `stale-allow`（防注释腐烂）。
- 删除 `validate.mjs:29` 的文件级 `TOKEN_FILES` 白名单。分层取代：
  - `define` = `tokens.css` / `tokens.json` / `tailwind-theme.css` → 仅 R01/R11 天然豁免，R02–R15 照查
  - `component` = `meridian-ui.css` → R11 严格生效（本轮清 14 处）
  - `feature` = 业务代码 → 全规则
  - `demo` = `design-system.html` → R01/R11 仅在 `/* meridian-begin: ramp-demo */ … end` 区段内关闭；其余规则（含 R02/R05/R08/R09/R12）全量生效 → 本轮清 28 处 <12px 与 `:53` 的自造 z-index，色板浏览器区的 45 处 hex 与 35 处 ramp 引用保留
- `meridian.config.json`（可选）：`ignore` globs、`componentAliases`、`demoRegions`、`baseline` 路径。

### 4.5 CLI 与退出码

| 行为 | v1 | v2 |
|---|---|---|
| 有违规 + `--json` | exit 0 | **exit 1** |
| 输出 | text/json | text/json/**sarif**（可挂 PR 批注） |
| 存量债 | 无 | `--baseline baseline.json`：按 `file:rule` 记账，只减不增，新增即红 |
| 局部重跑 | 整目录 | `--only=R11,R13`、`--ignore` |
| 排序 | 不稳定 | 稳定：`file → line → ruleId` |

本地门禁：`npm run lint` = `node ai/validate.mjs . && node --test`。

### 4.6 fixture 体系

`manifest.json` 为唯一真相：每条规则的 `fail/*` 文件登记精确命中集，`pass/*` 登记"必须 0 命中"。断言为**集合相等**，故漏报与误报同样红。入库内容包含：审计用的 15 处植入样本原样、4 个历史误报（常驻反例）、`Invoice #1042`、`Order #A1B2`、`z-[var(--m-z-modal)]`、`duration-[var(--m-duration-150)]`、`text-[var(--m-fg-muted)]`、`tokens.css` 内的 `var(--m-ink-2)`（define 层合法）、`margin-inline-start`。

### 4.7 焦点环

单一声明点移到 `tokens.css`（消费者必载），删除 `tailwind-theme.css:143` 与 `meridian-ui.css:22` 两份重复实现；机制由 `box-shadow` 改 `outline`，组件层不再占用该属性 → 争用从结构上消失；移除 `border-radius: inherit` 副作用行。

```css
/* tokens.css */
:where(button,a,input,select,textarea,summary,[tabindex],.m-tool,.m-size-pill,.m-page):focus-visible {
  outline: var(--m-focus-ring-width) solid var(--m-focus-ring-color);
  outline-offset: var(--m-focus-ring-offset);                                  /* :root = 2px */
}
.stage-admin :where(...):focus-visible { outline-offset: calc(-1 * (var(--m-focus-ring-width) + 1px)); }
.m-check input:focus-visible + .box,
.m-radio input:focus-visible + .box,
.m-switch input:focus-visible + .track { outline: var(--m-focus-ring-width) solid var(--m-focus-ring-color); outline-offset: 2px; }
```

### 4.8 舞台与 token 层

```css
:root, .stage-storefront   { --m-primary: var(--m-ink-12); --m-primary-hover: color-mix(in oklab, var(--m-ink-12) 86%, #fff);
                             --m-primary-active: color-mix(in oklab, var(--m-ink-12) 94%, #fff); --m-primary-fg: #fff;
                             --m-primary-text: var(--m-ink-12); --m-primary-tint: var(--m-ink-2); --m-primary-border: var(--m-ink-7);
                             --m-fg-link: var(--m-ink-12); --m-fg-link-hover: var(--m-ink-9);
                             --m-card-shadow: var(--m-shadow-e1); --m-card-radius: var(--m-radius-xl);
                             --m-overlay-blur: 4px; --m-body-fs: var(--m-text-lg); }
.stage-admin               { --m-primary: var(--m-brand-9); /* +hover/active/fg/text/tint/border */
                             --m-fg-link: var(--m-brand-11); --m-card-shadow: none; --m-card-radius: var(--m-radius-lg);
                             --m-overlay-blur: 0px; --m-body-fs: var(--m-text-md); }
/* 深色：主题类可在根元素，也可与 stage 同类元素共存 */
:root.theme-dark, [data-theme="dark"], [data-theme="dark"] .stage-storefront, .stage-storefront.theme-dark { …近白 CTA 端点反转… }
.theme-dark .stage-admin, .stage-admin.theme-dark { …品牌绿 + 深色表面… }
body { font-size: var(--m-body-fs); }   /* 取代两处硬写 --m-text-lg；删 .stage-admin 里同值死代码 --m-text-md 重声明 */
```

新增语义 token（同时写入 `tokens.json`，避免扩大"事实来源"漂移）：`--m-body-fs`、`--m-critical-solid-hover`、`--m-critical-solid-active`、`--m-control-off-bg`、`--m-tooltip-bg`、`--m-tooltip-fg`、`--m-neutral-solid`。

primitive 越权消除映射：`--m-danger-10`→`--m-critical-solid-hover/-active`；`--m-ink-8`→`--m-control-off-bg`；tooltip 的 `--m-ink-12`/`--m-ink-6`/`#fff`→`--m-tooltip-bg/-fg`；size-pill 选中→复用 `--m-primary`+`--m-primary-fg`（视觉零变化）；头像→复用 `--m-primary-tint`+`--m-primary-text`（**唯一有可见色差项**：brand-2 替 brand-3、brand-11 替 brand-12，需登记）；neutral badge→`--m-neutral-solid`。

### 4.9 补两处"文档承诺、实现缺席"

- `.m-toast` 参考实现（右下/底部居中两态、e4、`--m-toast-*`、`--m-z-toast`、`role="status"`/`alert`），使 17 章规格可抄
- `[data-density="productive"] .m-table td { height: var(--m-table-row-h-productive) }`，密度默认统一为 **48px 默认 / 36px 可切换**，`AGENTS.md:46` 相应改写

### 4.10 文档一致性

1. 阶位表：`docs/02 §一` 加"该阶是否比前一阶更深"与"例外"两列；黄橙族（hue≈45–75°）9 阶=亮实底必须配 `#2B1F02` 深字，深色族 9 阶=深实底配白字；`tokens.css:13-20` 重复表删除，改为指向 `docs/02 §一`。
2. `docs/02 §十` 品牌配方拆为同两分支，并给出 9 阶判定式（对白底 ≥4.5:1 → 深实底白字；否则 → 亮实底深字）。
3. 引用修正 6 处：`docs/01:16`、`docs/07:64`（文案是 08 不是 09）、`docs/02:189`（契约表是 §六）、`docs/07:26`（地址矩阵是 §三）、`docs/07:28`（支付顺序在 12 §五）；约定引用一律带文件名，R14 校验。
4. `.stage-*` 写入 README 方式 A 第 2 步与 `prompts.md` 5 个模板 Requirements 首行；`docs/04 §六` 焦点环规格同步为 outline 口径。
5. 新建 `docs/00-open-decisions.md`：登记 7 项待决（主题所有权、深色前台 opt-in 边界、阶位单调性立场、是否提供带行为参考实现、图表色板独立化、87 演示 vs 22 契约、包边界）+ §4.3 校验器已知局限。
6. `CHANGELOG.md` 起 1.0.1/1.1.0 条目（承接 `18:121` 悬空引用）；README 文件地图目录名改 `设计规范0919`，删除 `09-storefront-foundations.md*` 伪条目，补 `ai/checks`、`ai/selfcheck`、`CHANGELOG.md`、`package.json`。
7. 16 处物理方向属性转 `margin-inline-*`/`padding-inline-*`/`border-inline-*`。
8. `docs/12 §二` 增一行：钱包按钮必须使用服务商原生组件，Meridian 只约束容器与间距（Apple Pay/Shop Pay/PayPal 有强制品牌规范）；实现在 S5。

### 4.11 版本与迁移

定 **v1.1.0**，同步改写治理章节为："任何视觉可见的值变更 ≥ MINOR；语义重指向或删 token = MAJOR + 迁移说明"（修掉"改 primitive 值 = PATCH"的隐患）。`MIGRATION-1.1.md` 记录：舞台默认值翻转、焦点环机制、7 个新语义 token（6 个用于越权承接 + `--m-body-fs`）、字号地板、密度默认、头像色差。

**已声明副作用**：已上线但未加 `.stage-storefront` 的前台，升级后主按钮由品牌绿变近黑。这是 D4 想要的 fail-loud，但需提前告知使用方。

---

## 5. 验收判据（全部可执行）

| # | 判据 | 验证方式 |
|---|---|---|
| A1 | 15 处植入真违规命中 15、4 处合规代码误报 0 | `node --test`（manifest 集合相等） |
| A2 | 14 条规则每条至少 1 真阳性 + 1 真阴性 | fixture 清单核对 |
| A3 | 存在违规时 `--json`/`--sarif`/text 三态退出码均非 0 | 测试断言退出码 |
| A4 | 实现层 primitive 直接引用 49 → **0** | `node ai/validate.mjs . --only=R11` |
| A5 | <12px 字号 33 → **0** | `--only=R08` |
| A6 | 物理方向属性 16 → **0** | `--only=R15` |
| A7 | 悬空引用/错误章节号 → 0 | `--only=R14` |
| A8 | 键盘人工走查：checkbox/radio/switch/tabs/modal/drawer 焦点在 浅色·深色·`.stage-admin` 同元素 三种组合下全部可见 | 清单勾选（axe 属 S4） |
| A9 | 舞台默认值：不给任何 stage 类的裸前台 → 近黑 CTA；给 `.stage-admin` → 品牌绿 + 14px 正文 | 最小 HTML 样张目视 |
| A10 | 基线可证：`git diff 143edd0` 中除 §4.8 声明的色差项外无未登记视觉变更 | diff 审阅清单 |
| A11 | `npm run lint` 全绿；`AGENTS.md §1` 十条硬规则 10/10 有守卫 | 规则↔条款映射表核对 |

---

## 6. 风险

| 风险 | 处置 |
|---|---|
| `outline` 焦点环在极旧浏览器不跟随圆角 | 目标浏览器基线为 2026 现代版本；`docs/04` 记录基线，不做 polyfill |
| 舞台翻转影响已在跑的未声明前台 | §4.11 迁移说明 + 主动告知；baseline 文件可临时豁免存量 |
| 校验器 v2 是全新代码，可能引入新误报 | fixture 精确集合断言是唯一防线；历史误报集合作为常驻反例入库 |
| R13 依赖组件命名，业务别名会漏 | `componentAliases` 注册表 + 已知局限文档化 |
| CRLF 环境导致行尾 `\r` 干扰匹配 | §4.2 统一 `split(/\r?\n/)` + value `trim()`，并加一条 CRLF fixture 进回归集 |
| 头像从 brand-3/brand-12 换成 primary-tint/primary-text 产生可见色差 | 唯一登记的视觉变更项，A10 明确豁免 |

---

## 7. 交付顺序（供 writing-plans 展开）

1. 基线（已完成：git `143edd0`）+ `package.json` + `meridian.config.json` 骨架
2. `ai/lib/*` 解析层 + `ai/checks/*` 14 条规则 + `validate.mjs` v2 入口
3. `ai/selfcheck/` fixture 与 manifest，跑到全绿（此步之后才有资格改规范文件）
4. 焦点环与舞台重排（`tokens.css` / `tailwind-theme.css` / `meridian-ui.css`）
5. 字号/圆角/方向属性/primitive 清零（含 5+2 新 token 同步 `tokens.json`）
6. `.m-toast` + 密度实现
7. 文档一致性批次（阶位表/配方/引用/README/prompts/open-decisions/CHANGELOG/MIGRATION）
8. §5 全判据复核 + README 文件地图与版本收尾
