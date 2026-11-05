# MERIDIAN — AI Coding Rules（机器执行优先级最高）

You are building UI for a Western-market e-commerce platform (storefront + admin) using the **Meridian Design System**. These rules are **checkable constraints** — the validator `ai/validate.mjs` enforces the machine-checkable subset. Non-compliance = build failure.

**Token entry points**: `ai/tokens.css` (CSS custom properties, prefix `--m-`；**运行时唯一事实来源**) · `ai/tailwind-theme.css` (Tailwind v4 utilities) · `ai/tokens.json` (DTCG 机器镜像 + `$version` 唯一版本声明).

---

## 0. Token grammar

```
--m-{category}-{concept}(-{variant})(-{state})
--m-fg-muted            ✅ semantic
--m-critical-solid      ✅ status family × role
--m-space-4             ✅ primitive
--m-button-bg           ✅ component layer
--m-brand-9             ⚠️ primitive — FORBIDDEN in feature code; only in tokens.css
```

Semantic categories: `bg-*` (page/surface/surface-hover/surface-selected/inset/band/scrim) · `fg-*` (fg/muted/subtle/disabled/inverse/link) · `border`/`border-strong`/`border-focus` · `primary*` · five status families `{success|warning|critical|info|emphasis}` × `{fg|bg|border|solid|solid-fg}` · `ai-*` · commerce: `price-sale`/`price-compare`/`price-fg`.

## 1. Hard rules (validator-enforced)

### Rule ↔ clause map（十一条硬规则必须 11/11 有守卫）

| AGENTS 条款 | 规则 | 合规写法 |
|---|---|---|
| §0 primitive 禁用 | R11 | 语义 token |
| 1 无裸色值 | R01 | `var(--m-fg)` / `bg-surface` |
| 2 不自造 z-index | R02 | `z-[var(--m-z-modal)]` |
| 3 不自造时长/缓动 | R03 | `duration-[var(--m-duration-150)]` |
| 4 无 !important | R04 | 行级 `meridian-allow: <reason>` |
| 5 间距走 4px 网格 | R05 | `p-4` / `p-[var(--m-space-4)]` |
| 6 图标元素需名称 | R10 | `aria-label="Close"` |
| 7 圆角只用菜单值 | R07 | `rounded-md` |
| 8 焦点必须可见 | R09（+ tokens.css 单一焦点环） | 不写 `outline:none` |
| 9 复合容器用 tool 族 | 语义级靠 review；数值面由 R05/R07 覆盖 | `.m-tool` |
| 10 表面 rank | 语义级靠 review | `--m-bg-*` 阶梯 |
| — RTL 逻辑属性 | R15 | `margin-inline-start` |
| — 12px 字号地板 | R08 | `text-xs` 起 |
| — 行高只能来自 token | R16 | `var(--m-leading-*)` / `--m-body-leading` |
| — img 声明宽高 | R12 | `width` + `height` |
| — 合规结构 prop | R13 | `verified` / `market` / `compareAtVerified` |
| — 引用完整性 | R14 | `docs/02 §六` 带文件名 |

> R06 编号在历史迁移中退役（原 `color-pair` 规则被对比契约测试取代），编号不复用。

豁免只有一种写法：`/* meridian-allow: <原因> */`（或 `// meridian-allow: <原因>`）。无理由的标记不生效；未被消耗的标记会以 `stale-allow` 失败。文件级白名单已废除。

1. **No raw color values** — never `#hex`, `rgb()`, `hsl()`, `oklch()` outside token files. Use `var(--m-*)` or Tailwind semantic utilities (`bg-surface`, `text-critical`, `border-line`).
2. **No invented z-index** — only `var(--m-z-raised|nav|drawer|modal|toast|tooltip)` (or `0`/`-1` for local stacking).
3. **No invented motion values** — durations only from `var(--m-duration-100|150|200|300|450|600)`; easings only `var(--m-ease-standard|enter|exit)`.
4. **No `!important`** (the reduced-motion block in tokens.css is the only exception).
5. **Spacing on the 4px grid** — padding/margin/gap use standard steps (`--m-space-1..24`); `2px` (`--m-space-05`) only inside control internals; no arbitrary `[7px]` values.
6. **Icon-only interactive elements require `aria-label`**.
7. **Radius**: controls `--m-radius-md` (8), admin cards `--m-radius-lg` (12), storefront cards/media `--m-radius-xl` (16), pills `--m-radius-pill`. Never another number.
8. **Focus must be visible** — never `outline: none` without the focus-ring replacement (the base reset already provides it; don't remove it).
9. **Composite containers use the tool family** — inside a toolbar or composer bar, use `.m-tool` (square / pill / chip) at the shared `--m-tool-h` baseline (32px; `--m-toolbar--sm` → 28px). **Never place `.m-btn` (36px page-level control) inside a toolbar** — mixing size systems is the single cause of misaligned borders/icons. Pick the shape family by what it carries (square = icon only, pill = icon + label, chip = selected filter), never by desired width.
10. **Assign every region a surface rank before styling it** — backgrounds are an ordered ladder (docs/02 §四): `inset` (−2 well) → `chrome` (−1 persistent frame) → `surface` (0 work area/card) → `+1 overlay`. Light theme: brighter = closer/more attention, darker = receding structure; dark theme inverts numerically but not semantically (`surface` is always one step brighter than `chrome`). Two rules that follow:
    - **Never recede the work area**: in a 2–3 pane shell (IDE/chat/mail/CRM) the center work surface is `--m-bg-surface` (white in light) and nav/inspector panes are `--m-bg-chrome`. Putting a canvas fill on the work surface and a surface fill on a side pane inverts the whole hierarchy.
    - **Inside chrome, hovers must change rung**: `--m-bg-surface-hover` equals `--m-bg-chrome` in the admin light stage (both `ink-2`), so a chrome region using it has an invisible hover. Use `--m-bg-chrome-hover` / `--m-bg-chrome-selected`, or a state-layer overlay (`color-mix(in oklab, var(--m-fg) 8%, transparent)`) for host-agnostic components such as `.m-sidenav`.
    - **No double fills**: a sticky region's background must equal the surface it lives on; separate it from scrolling content with a border (and a shadow on the inner control), not with a second background layer.
    - **Non-white surfaces need the same rung change**: in storefront light `--m-bg-surface-hover` equals `--m-bg-band`, so a hoverable row inside a band or inset must use a state-layer overlay instead.
11. **Line-height comes from tokens** — `line-height` must be `var(--m-leading-*)`, `var(--m-body-leading)`, `var(--m-code-leading)`, or `inherit/normal`. Raw numbers fail R16. Optical title tokens: `--m-leading-title-1/2/3`, `--m-leading-tight`, `--m-leading-lead/copy/note/label/none`.

## 2. Stage discipline (storefront ≠ admin)

| Aspect | Storefront | Admin |
|---|---|---|
| Root class | 默认（`:root` 即前台）；`.stage-storefront` 可选显式声明 | **`.stage-admin` 必写**（+ `.theme-dark`，可与舞台类同元素或置于根元素） |
| Page bg | white | `--m-bg-page` gray (ink-2) |
| Shell topology | A · Canvas+Card (always) | A for record pages, **B · Chrome+Work-surface for multi-pane shells** (docs/02 §五) |
| Body text | 16px (`text-lg`) | 14px (`text-md`) |
| Density | airy, sections `--m-space-section` | **row 48px comfortable 默认**；`[data-density="productive"]` 切 36px |
| Card separation | `tinted` gray card on white, no border; white-card fallback keeps 1px border | filled white card on ink-2, no border; shadow by exception |
| Motion | expressive allowed (450–600ms on entry) | restrained (100–300ms) |
| Buttons | primary CTA `--m-btn-h-cta` (52px) | standard `--m-btn-h-md` (36px) |
| Primary color | `--m-primary` re-pointed to **near-black ink** (dark theme: near-white) — product imagery is the protagonist | `--m-primary` = brand green |

Never import admin patterns (data tables, save bars) into storefront, and never import marketing patterns (hero sections, banding) into admin.

### 2.1 组合层与单一源（G-229）

单一源的 CSS 层是**闭合五件**：`ai/tokens.css`（token）→ `ai/brand-tokens.css`（品牌插槽，唯一允许原始色值的地方）→ `ai/meridian-ui.css`（组件 `m-*`）→ `ai/admin.css`（后台组合层 `ad-*`）/ `ai/site.css`（店面组合层 `sf-*`）。引入顺序即此顺序。产品侧持有逐字节副本并在 `assets_md5.txt` 记录（闭合集：盘上有而记录无 = 红，反之亦然）。

- **前缀纪律**：`ad-*` 只出现在后台组合层与后台页面，`sf-*` 只出现在店面组合层与店面页面，**互不引用**；组合层**不新增 `m-*` 的规则块**（`m-*` 归 `meridian-ui.css`；组合层可组合使用它，也可在自己的 `ad-*`/`sf-*` 作用域里补上下文规则）。**舞台作用域**（`stage-admin` / `stage-storefront`）只在 `tokens.css`。跨层重复的同一个类只许留一份 —— 删副本，而不是留两份同值。
- **`.rv` 动效守卫**：`site.css` 的入场动效族（`.rv` / `.rv--fade` / `.rv-N`）必须自带 `@media (prefers-reduced-motion: reduce)` 段；新增任何组合层 keyframes 同此。`tokens.css` 的全局收缩是兜底，不是免写守卫的理由。
- **门**：`node ai/checks/prototypes-gate.mjs` 的 G-229 探针（CSS 层五件全扫 + 前缀纪律 + `.rv` 守卫）。

### 2.2 反向接线门（G-231）

G-229 只保证"用到的类存在"，不保证"声明的类被用"——零消费者的 CSS 会继续被 CI 守护属性写法。G-231 反向计量五层的每个类是否被签署屏 / 演示页 / 行为层消费：死类逐名登记在 `ai/selfcheck/wiring-baseline.json` 的 ticket（理由 + 目标批次），`deadMax` 只准下调且必须等于当前债量，`defsFloor` 只准上调（删类=MAJOR），`layers[*].own` 与实测全等。重算用 `node ai/selfcheck/lib/wiring.mjs --emit`；清偿后须同步改小 `deadMax`，新增类必须与消费者同批出厂（不变量 #7）。

- **门**：`npm test` 的 `ai/selfcheck/wiring.test.mjs`（G-231 五条）。字符串级消费判定由 `runtime-behavior.mjs` 的真实计算样式断言兜底（例如 Sidebar v2 的 240/64/56px 图标轨与 localStorage 持久化）。

## 3. Interaction state contract

State priority (highest wins): `disabled` → `loading` → `active` → `focus-visible` → `hover` → default.

- Hover/press on tinted components: overlay `color-mix(in oklab, currentColor var(--m-state-hover), transparent)` (pressed 12%, selected 10%).
- Solid fills: use `-hover`/`-active` semantic tokens. The single rule is **move away from the current endpoint**: light theme darkens (9→10), dark theme lightens (9→8). Storefront primary is an endpoint colour — near-black in light (hover lightens 8%, pressed 14%) and near-white in dark (hover darkens to `ink-4`, pressed to `ink-5`). Never copy the light-theme direction into dark.
- Transitions: `transition: background-color, border-color, color, box-shadow var(--m-duration-150) var(--m-ease-standard)`.
- Every async action shows a loading state within 100ms (button spinner or skeleton — never both a spinner AND a frozen layout).
- `prefers-reduced-motion`: handled globally in tokens.css; do not add per-component overrides.

## 4. Accessibility contract (WCAG 2.2 AA — non-negotiable)

- Text contrast ≥4.5:1 (≥3:1 for ≥24px text); UI borders/icons ≥3:1. Only pre-approved token pairs may be combined.
- Target size ≥24×24px (WCAG 2.5.8); primary touch targets ≥44×44px; keep ≥8px gap between adjacent targets.
- Form fields: `<label>` bound via `for`/`id`; help text via `aria-describedby`; errors via `aria-invalid` + `role="alert"` message that states **how to fix**.
- Overlays (modal/drawer): focus trap, Esc to close (except forced steps), focus returns to trigger, `aria-modal="true"`.
- Toast = `aria-live="polite"`; destructive confirmations & critical banners = `role="alert"`.
- Images: meaningful `alt` (product photos describe the product, not "image of"); decorative → `alt=""`.
- Icon-only buttons: `aria-label`. Badges with color meaning include visually-hidden text.
- Sliders/drag interactions need a keyboard alternative (WCAG 2.5.7).

## 5. Commerce content rules

- **Prices**: always rendered through the Price component — `tabular-nums`, locale-formatted, currency per market; sale price uses `text-price-sale` with genuine compare-at (30-day-low, EU Omnibus); EU/UK/AU show "incl. VAT", US/CA tax-exclusive.
- **Urgency/scarcity claims** ("Only 3 left", countdowns) must bind to real inventory/session data — fake urgency is forbidden.
- **Consent**: no pre-ticked boxes; "Reject all" must equal "Accept all" in prominence; no tracking fires pre-consent.
- **No dark patterns**: no drip pricing, no confirm-shaming, no pre-selected paid add-ons, no hidden unsubscribe, no fake review counts.
- Copy: sentence case, verb+noun CTAs ("Add to cart"), no exclamation marks in admin, errors say how to fix, toasts ≤3 words ("Product updated").

## 6. Composition recipes (when building, compose — never restyle)

| Build | Compose |
|---|---|
| Page (storefront) | `bg-page` + container `max-w-storefront` + sections with `--m-space-section` rhythm |
| Page (admin) | app shell → PageHeader (breadcrumbs, title, actions) → Card sections (max-w-admin) |
| Data table | Card > sticky header table, `tnum` on numeric cols, bulk bar on select, saved views above |
| Form | label top + input (`--m-input-h`) + help text + inline error; footer actions right-aligned |
| Feedback | Banner (page-level) > Toast (transient) > Modal (blocking decision) — never invent a 4th |
| Empty state | illustration slot + heading + one primary action + subdued hint |
| Toolbar / composer | `.m-toolbar` + `.m-tool` family at `--m-tool-h`; one `.m-tool--send` max; spacer before it; `nowrap` |

## 7. Before you finish (self-check)

```bash
node ai/validate.mjs . --exclude ai/selfcheck/fixtures    # must exit 0
```

Also verify manually: keyboard-only walkthrough of the flow; dark theme pass (`theme-dark`); German-length content pass (labels +35%); no horizontal scroll at 320px.

## 8. 校验器已知局限（零依赖路线的定价）

- 模板字符串拼接的类名（`` `z-[${n}]` ``）不解析 → 保守放行。
- Sass/Less 嵌套与 mixin 不支持；SFC 的 `:class`/`:style` 动态绑定不解析。
- 命名级字阶（如 `text-base`）是否越界无法在当前判定，随 S2 的 `tokens.api.md` 落地。
- R13 依赖组件标签名；业务侧 wrapper 必须登记进 `meridian.config.json` 的 `componentAliases`。
- R14 只判三种形式：`<dir>/NN-*.md §X`、跨目录裸「NN 章」、`vX.Y.Z`。**同目录裸章节引用与「（第N节）」不判**——判定需读散文语义，硬判会造误报。本轮手工归位一次（Task 15），残留由 S2 的锚点系统接管。
- demo 层（`design-system.html`）已纳入 R01/R11；静态源 0 裸色 / 0 primitive。色板浏览器通过运行时动态 `var()` 注入，不产生静态事实（非业务代码）。
- 运行时事实（五条门禁均接入 CI）：`npm run a11y`（axe-core，WCAG A/AA + 320px + `dir="rtl"`）、`npm run behavior`（CDP 真实按键：焦点陷阱/归还、tabs/seg/combobox、focus-visible、标题层级）、`npm run ax`（Chrome AX 树快照：role/name/状态/live，9 场景）、`npm run i18n`（key/ICU 复数/长度/术语）、`npm run l10n`（真实语言包 + 伪本地化 en-XA 的窄屏排版）。行为层参考实现为 `ai/meridian-behavior.js`，契约见 docs/06 §2.1。
- 仍未自动化：AT 的合成语音（NVDA/VoiceOver 语音引擎与语音包，发布前按下表人工核对）、翻译语义质量与回译（TMS 审校 + 抽样回译）、原生 `<dialog>` 的浏览器 chrome 焦点（规范行为，已明确排除）。
