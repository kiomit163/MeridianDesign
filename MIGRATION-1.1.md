# 1.0.x → 1.1.0 迁移说明

共 8 条，逐条含"受影响代码怎么改"。

## ① 默认舞台翻转（breaking）

- 前台：无需动作。原本写了 `.stage-storefront` 的可保留（等价），也可删除。
- 后台：**必须**在 `<html>` 或 `<body>` 加 `.stage-admin`，否则会拿到前台近黑 CTA + 16px 正文。
- ⚠ 未加 `.stage-storefront` 的存量前台：主按钮会从品牌绿变近黑——这是有意的 fail-loud，但需提前告知商家。

## ② 主题类与舞台类可同元素

`.theme-dark` / `[data-theme="dark"]` 现在与 `.stage-*` 同元素可用，也可放根元素。`AGENTS §2` 表格已更新。
```html
<html class="theme-dark">                   <!-- 可 -->
<html class="theme-dark stage-admin">      <!-- 可，等价于 <html class="stage-admin"><body class="theme-dark"> -->
```

## ③ 焦点环改 `outline`

由 `box-shadow` 改为 `outline`。若你曾为组件补过 `box-shadow` 焦点环，删除它（会与 base 层重复且被组件层 `box-shadow` 覆盖）。若你曾用 `outline:none` 抑制焦点，**改 `/* meridian-allow: <原因> */` 并给替代指示**，不可裸写 `outline:none`（R09 会判）。

## ④ `body` 字号走 `--m-body-fs`

```css
/* 之前 */
body { font-size: var(--m-text-lg); }
/* 之后（基线已切到 token，不写亦可） */
body { font-size: var(--m-body-fs); }  /* 前台 16 / 后台 14 */
```

## ⑤ 7 个新语义 token 与替代写法

| 旧写法 | 新写法 |
|---|---|
| `background: var(--m-danger-10)`（按钮 hover/pressed） | `background: var(--m-critical-solid-hover)` |
| `background: var(--m-ink-8)`（开关关闭轨道） | `background: var(--m-control-off-bg)` |
| `background: var(--m-ink-12); color: #fff`（tooltip） | `background: var(--m-tooltip-bg); color: var(--m-tooltip-fg)` |
| `--_solid: var(--m-ink-9)`（badge 实底） | `--_solid: var(--m-neutral-solid)` |
| `background: var(--m-brand-3); color: var(--m-brand-12)`（头像） | `background: var(--m-primary-tint); color: var(--m-primary-text)` |
| `background: var(--m-ink-12); color: var(--m-ink-1)`（size-pill 选中） | `background: var(--m-primary); color: var(--m-primary-fg)` |
| `color: #fff` / `background: #fff` / `box-shadow: rgb(...)` | 改 `--m-fg-on-solid` / `--m-shadow-e1` |

## ⑥ 字号地板（11/10/9px → 12px）

`font-size: 11px | 10px | 9px` 一律改 `font-size: var(--m-text-xs)`（= 12px）。`components/18-component-contracts.md` 的"合规小字 11px"已改为 12px + `fg-subtle`。法律文本、Prop 65 警告、EAA 标注等都按 12px 落地。

## ⑦ 密度默认 48px

- 默认 comfortable 48px（`<tr>` 高）。
- 切换 productive 36px：在外层加 `data-density="productive"` 即可。
- 切换入口放在页头设置；不进 URL、不入 Saved Views。

## ⑧ 间距 31 处归位

`.m-palette li` 等组件的 `padding: 8px 10px` 现在是 `padding: var(--m-space-2) var(--m-space-3)`，间隙从 6/10/14px 放宽到 8/12/16px。视觉上：徽章/标签/代码块/分页的间距略松。这是已声明的视觉变更。

## ⑨ 头像色差

`M0.avatar` 底色由 `var(--m-brand-3)`（浅绿）变 `var(--m-primary-tint)`（更浅一档）；文字由 `var(--m-brand-12)`（深绿）变 `var(--m-primary-text)`。整体偏中性。如需还原历史配色，写：
```css
.m-avatar { background: var(--m-brand-3); color: var(--m-brand-12); } /* meridian-allow: pre-1.1-avatar */
```
