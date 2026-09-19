# MERIDIAN — AI Coding Rules（机器执行优先级最高）

You are building UI for a Western-market e-commerce platform (storefront + admin) using the **Meridian Design System**. These rules are **checkable constraints** — the validator `ai/validate.mjs` enforces the machine-checkable subset. Non-compliance = build failure.

**Token entry points**: `ai/tokens.css` (CSS custom properties, prefix `--m-`) · `ai/tailwind-theme.css` (Tailwind v4 utilities) · `ai/tokens.json` (source of truth).

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

### Rule ↔ clause map（十条硬规则必须 10/10 有守卫）

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
| — 12px 字号地板 | R08 | `text-xs` 起 |
| — img 声明宽高 | R12 | `width` + `height` |
| — 合规结构 prop | R13 | `verified` / `market` / `compareAtVerified` |
| — 引用完整性 | R14 | `docs/02 §六` 带文件名 |
| — RTL 逻辑属性 | R15 | `margin-inline-start` |

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

## 2. Stage discipline (storefront ≠ admin)

| Aspect | Storefront | Admin |
|---|---|---|
| Root class | `.stage-storefront` | `.stage-admin` (+ `.theme-dark` optional) |
| Page bg | white | `--m-bg-page` gray (ink-2) |
| Shell topology | A · Canvas+Card (always) | A for record pages, **B · Chrome+Work-surface for multi-pane shells** (docs/02 §五) |
| Body text | 16px (`text-lg`) | 14px (`text-md`) |
| Density | airy, sections `--m-space-section` | productive, row 36px default |
| Shadow | cards use `--m-shadow-e1` + border | border-first, shadow by exception |
| Motion | expressive allowed (450–600ms on entry) | restrained (100–300ms) |
| Buttons | primary CTA `--m-btn-h-cta` (52px) | standard `--m-btn-h-md` (36px) |
| Primary color | `--m-primary` re-pointed to **near-black ink** (dark theme: near-white) — product imagery is the protagonist | `--m-primary` = brand green |

Never import admin patterns (data tables, save bars) into storefront, and never import marketing patterns (hero sections, banding) into admin.

## 3. Interaction state contract

State priority (highest wins): `disabled` → `loading` → `active` → `focus-visible` → `hover` → default.

- Hover/press on tinted components: overlay `color-mix(in oklab, currentColor var(--m-state-hover), transparent)` (pressed 12%, selected 10%).
- Solid fills: use `-hover`/`-active` semantic tokens (light theme darkens, dark theme lightens).
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
node ai/validate.mjs src        # must exit 0
```

Also verify manually: keyboard-only walkthrough of the flow; dark theme pass (`theme-dark`); German-length content pass (labels +35%); no horizontal scroll at 320px.

## 8. 校验器已知局限（零依赖路线的定价）

- 模板字符串拼接的类名（`` `z-[${n}]` ``）不解析 → 保守放行。
- Sass/Less 嵌套与 mixin 不支持；SFC 的 `:class`/`:style` 动态绑定不解析。
- 命名级字阶（如 `text-base`）是否越界无法在当前判定，随 S2 的 `tokens.api.md` 落地。
- R13 依赖组件标签名；业务侧 wrapper 必须登记进 `meridian.config.json` 的 `componentAliases`。
- R14 只判三种形式：`<dir>/NN-*.md §X`、跨目录裸「NN 章」、`vX.Y.Z`。**同目录裸章节引用与「（第N节）」不判**——判定需读散文语义，硬判会造误报。本轮手工归位一次（Task 15），残留由 S2 的锚点系统接管。
- demo 层（`design-system.html`）整体关闭 R01/R11（色板浏览器必须直接引用 ramp），区段级收窄待 S2。
- 运行时事实（焦点是否真的可见、ARIA 是否真的正确）由 S4 的 axe / Playwright 接管。
