# AI 提示词模板（Prompt Templates）

> 给 AI 编码助手的可复用提示词。使用时把 `{{ }}` 替换为实际内容。所有模板默认以 `ai/AGENTS.md` 为系统级约束（在仓库根放置即可自动生效）。

---

## 1. 新建前台页面

```
Build the {{collection page}} for {{store}} following Meridian Design System.

Read first: storefront/10-storefront-plp.md, docs/04-spacing-layout-elevation.md, ai/AGENTS.md

Storefront stage needs no class (:root is storefront); never add .stage-admin to storefront pages.
Requirements:
- Composition: PageHeader (breadcrumb + H1 + item count) → filter/sort bar → 4-col product grid (2 col @<768px) → "Load more" with progress copy
- Product cards: reuse <ProductCard> contract (components/18-component-contracts.md §ProductCard) — media 4:5, one badge max, Price component with compareAt
- Filters: URL-state driven (?size=&color=), result counts, empty-results state with [Clear all]
- Data: use the fixtures in {{mock-data.ts}}; all prices go through <Price market="US">
- States: skeleton on first load (8 cards), empty, error with retry

Acceptance: `node ai/validate.mjs . --exclude ai/selfcheck/fixtures` exits 0; keyboard-only walkthrough passes; no layout shift at 320px.
```

## 2. 新建后台页面（列表型）

```
Build an admin {{orders index page}} per Meridian admin specs.

Read first: admin/14-admin-foundations.md, admin/15-admin-data-tables.md, ai/AGENTS.md

Root element carries .stage-admin (and .theme-dark when the dark theme is on).
Requirements:
- App shell slot (sidebar stays untouched), PageHeader with one primary action [New order] + secondary [Export]
- Saved views row: All / Awaiting fulfillment (badge counts), search, filter chips, sort
- DataTable per §15: numeric right + tnum, sticky header, first-col sticky on overflow, row hover/selected states, 48px comfortable rows（可用 data-density="productive" 切 36px）
- Selection: cross-page selection pool, bulk bar replaces filter row, bulk delete requires type-to-confirm (16 §五)
- Pagination: numeric, 50/page default; loading skeleton; empty states (none / no-match)
- Save current filter+sort as view; "Modified" state offers [Save as view]

Acceptance: aria-sort on sortable headers, focus trap in all overlays, `node ai/validate.mjs . --exclude ai/selfcheck/fixtures` exits 0.
```

## 3. 新建组件

```
Create <Price> per Meridian contract (components/18-component-contracts.md §Price, docs/03-typography.md §五).

Storefront stage needs no class (:root is storefront); never add .stage-admin to storefront pages.

Contract:
- Props: amount:number, compareAt?:number, market:'US'|'CA'|'UK'|'DE'|'FR'|'AU', perUnit?:string, size:'md'|'lg'
- Renders: locale-formatted amount (tabular-nums), compareAt struck-through in --m-price-compare, tax note per market (07 §一), BNPL slot optional
- Omnibus guard: compareAt must come from server-provided 30-day-low — prop named `compareAtVerified`, if false compareAt is not rendered
- Colors only via tokens: --m-price-sale / --m-price-compare / --m-price-fg
- data-slot attributes: price | sale | compare | note

Deliver: component + states demo + tests for DE (1.299,00 €) and US ($1,299.00) formatting.
```

## 4. 存量代码 token 化改造

```
Refactor {{path}} to Meridian tokens. Rules (ai/AGENTS.md §1):

Storefront stage needs no class (:root is storefront); never add .stage-admin to storefront pages.

1. Replace every raw color with the closest semantic token (docs/02 §三 mapping table)
2. Replace spacing with --m-space-* on the 4px grid (docs/04 §一)
3. Replace z-index/transition values with ladder tokens
4. Replace font sizes with --m-text-* and weights with --m-weight-* (regular/medium/semibold/bold); never emit 450/550/650 — the system ships no @font-face, so those numeric weights collapse to two steps on Windows (docs/03 §2.1)
5. Do NOT change any visual output beyond: off-grid spacing snaps to nearest step, raw shadows map to e1–e4
Run `node ai/validate.mjs {{path}} --exclude ai/selfcheck/fixtures` after; iterate until exit 0. Show a diff summary table (before → after) per rule.
```

## 5. 上线前合规/无障碍审计

```
Audit {{checkout flow}} against:

Storefront stage needs no class (:root is storefront); never add .stage-admin to storefront pages.

- docs/06-accessibility-compliance.md (WCAG 2.2 AA mapping table + GDPR consent spec + dark-pattern never-list)
- docs/07-localization.md (DE expansion, address schema, tax display)
- storefront/12-storefront-cart-checkout.md (guest-first, collapsible completed steps, SCA states, express placement)

Report format: per checkpoint — ✅ pass / ❌ fail + file:line + the exact rule + suggested fix. Group: A11y / Compliance / Conversion / Localization. End with a blocking-issues list ordered by legal risk.
```

---

### 使用心法

1. **先让 AI 读规范再写代码**——把对应文档路径写进 prompt（如上），不要只说 "use the design system"。
2. **验收条件写进 prompt**——`node ai/validate.mjs . --exclude ai/selfcheck/fixtures` 退出码、键盘走查、320px 检查都是可执行验收。
3. **改造类任务要求 diff 摘要**——防止 AI 静默重写。
