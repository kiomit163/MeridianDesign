# 10 · 前台：集合页 / 商品列表页（PLP）

---

## 一、商品卡（Product Card）——全站复用原子

```
┌─────────────────────┐
│  媒体 4:5            │ ← 主图；hover 淡入第二图（150ms）；图上叠徽章区（左上）
│  [Sale -20%]        │
├─────────────────────┤
│  集合名/副题 (xs, muted, 可选)  │
│  商品名 (md, --m-weight-medium, 2行 clamp)  │ ← aria-label 含名+价
│  ★4.8 (312)     (xs, muted)  │ ← 有评才显示
│  $68.00  $85.00(划线)          │ ← Price 组件；促销价 price-sale
│  ○●○ 色卡 (可选, ≤5+展开)      │ ← swatch 24px，选中环 primary
└─────────────────────┘
```

| 项 | 规格 |
|---|---|
| 容器 | 透明底 + 透明 1px 盒模型（无描边、无阴影），radius-xl；商品图自身承担边界。hover 只让媒体图 `scale(1.03)`（300ms，`prefers-reduced-motion` 下静止），不抬卡、不投射；**整卡可点 = stretched link**：卡容器为 `div`，主链接挂在商品名，以其 `::after` 覆盖整卡；卡内 swatch / quick add 为兄弟节点并 `z-index:1`，禁止把交互控件嵌进 `<a>` |
| 徽章 | 最多 1 个：`Sale`（critical 实底或 tint）· `New`（emphasis）· `Low stock`（warning）——优先级 Sale > New；tint 徽章无描边 |
| 售罄 | 图片降饱和 60% + "Sold out" 徽章 + 保留卡可点进 PDP（可到货提醒）；**不隐藏商品** |
| 加购快捷 | 桌面 hover 显示 "Quick add"（选尺寸弹出）；**移动端不放**（误触高发），点击进 PDP |
| swatch | 视觉 24px，热区 ≥44px（实现 48）；切换即换主图；无货色号显示但置灰（Baymard：禁隐藏无货变体） |

## 二、PLP 布局

```
┌ Header ────────────────────────────────────────────┐
│ Breadcrumb: Home / Women / Outerwear               │
│ H1 Outerwear (5xl→移动 3xl)   128 items (muted)     │
├────────────────────────────────────────────────────┤
│ 排序 select ｜ Filter(移动开抽屉) ｜ 已选筛选 chips  │
├────────┬───────────────────────────────────────────┤
│ 桌面筛选 │ 商品网格 4 列（平板 3 / 移动 2）              │
│ 侧栏 240 │                                             │
│ ≥md 显示 │         [Load more] Showing 24 of 128       │
└────────┴───────────────────────────────────────────┘
```

## 三、筛选系统（Faceted Filters）

| 项 | 规格 |
|---|---|
| 分组 | ≤6 组，常用置顶（Size / Color / Price / Availability）；每组可折叠 |
| Price | 双滑块（键盘可操作）+ min/max 输入 |
| 已选状态 | 顶部 chips（label + × ，24px 触达）+ 每组内计数 "Jackets (12)" |
| 结果反馈 | 改筛选 → 网格骨架 300ms → 更新；结果数实时显示 |
| 空结果 | "No products match. Remove a filter to see more." + [Clear all] |
| URL | 筛选状态入 URL（`?size=m&color=black`）——可分享、可后退、SEO 可收录 |
| 移动端 | 底部抽屉（h-85dvh，回落 85vh；z-`--m-z-drawer`）：分组手风琴 + 底部吸底 [Show 128 results] |

**禁用**：筛选后自动跳页、隐藏结果数、侧栏广告（PLP 唯一目标：找到商品）。

## 四、排序

封闭枚举：`Featured`（默认，业务排序）/ `Price: Low to High` / `Price: High to Low` / `Newest` / `Best selling`。Select 走 `--m-input-h`：桌面 36px，≤767px 自动升到 44px（tokens.css MOBILE FORM FLOOR，同时把字号钉在 16px 以避开 iOS 聚焦缩放），变更即应用。

## 五、分页

"Load more" 按钮（secondary，44px）+ 进度文案。SEO 需要时补充 canonical 分页链接。禁止无限滚动与数字分页混用。

## 六、状态

| 状态 | 规格 |
|---|---|
| 首载 | 8 张卡骨架（同尺寸占位），`aria-busy` |
| 换页/筛选 | 网格区局部骨架，页头不动 |
| 无货集合 | 正常列表 + Sold out 徽章 + 到货通知入口 |
| 错误 | 区块级错误卡 + Retry |
