# 18 · 组件契约（Component Contracts）

> 面向实现者与 AI 的机器友好契约：**变体 × 状态矩阵 + 挂点 + 禁忌**。实现层框架无关（React/Vue/Web Component 均可），但必须保留 `data-slot` 与 `data-state` 属性（AI 与样式系统的寻址契约，shadcn 2026 约定）。

**通用状态优先级**（所有交互组件）：`disabled → loading → active → focus-visible → hover → default`。

---

## Button

| Prop | 值域 | 默认 |
|---|---|---|
| `variant` | `primary` / `secondary` / `tertiary`(文字钮) / `ghost` / `destructive` | `secondary` |
| `size` | `sm`(32) / `md`(36, 后台默认) / `lg`(44) / `cta`(52, 前台主 CTA) | `md` |
| `iconOnly` | bool（必须 `aria-label`） | false |
| `loading` | bool（文本换进行时，宽度锁定） | false |

| 状态 | primary | secondary | tertiary | destructive |
|---|---|---|---|---|
| default | bg-primary | bg-surface+border-strong | text-fg 透明底 | bg-critical-solid |
| hover | bg-primary-hover | 状态层 8% | 状态层 8% | danger-10 |
| pressed | primary-active | 12% | 12% | danger-10 |
| disabled | opacity .5 | opacity .5 | opacity .5 | opacity .5 |

规则：一屏一 primary；destructive 必经确认（admin/16-admin-forms-settings.md矩阵）；前台 `cta` 尺寸仅在主转化路径。

## Input / Select / Textarea / Combobox

h-36（`--m-input-h`）、bg-surface、border-strong、radius-md；focus → 后台内嵌焦点环；error → border-critical + `aria-invalid`；disabled → bg-inset + opacity .5。Combobox：输入过滤 + 键盘 ↑↓ Enter + 多值 token 化。**Select 选项 ≤5 时改用 Radio**（admin/16-admin-forms-settings.md）。

## Checkbox / Radio / Switch

视觉 20px、热区 44×44；选中 `bg-primary` 白勾；Switch：on=primary / off=ink-8 底白球，带移动动画 150ms。语义：Switch=即时生效，Checkbox=随表单提交（admin/16-admin-forms-settings.md）。

## Badge

```
tone: success | warning | critical | info | emphasis | promo | neutral | ai
variant: tint(bg+border+fg) | solid(实底) | outline(仅边框)
progress: complete(✓) | partial(◔) | empty  ← 可选进度点（Polaris Badge 继承）
```
`promo` 与 `emphasis` 默认同值，独立 `--m-badge-promo-*` token 供品牌整体覆盖促销徽章配色（参考实现 `.m-badge--promo`）。
高度 20px、radius-pill、text-xs、`tnum` 用于计数徽章。语义必须有 sr-only 文本（"Status: unfulfilled"）。

## Banner / Toast / Modal / Drawer / Popover / Tooltip

见 admin/17-admin-feedback-dashboard.md决策树与规格表。补挂点契约：

```
<Modal data-slot="overlay|dialog|header|body|footer" data-state="open|closed">
```
通用叠加契约：焦点禁锢 → Esc → 焦点归还；scrim=`--m-bg-scrim`；前台叠加 `--m-overlay-blur: 4px`。

## Card

`bg-surface` + border + radius-lg/xl（stage 决定）+ padding 16/24；头部插槽（标题 + 动作区）、主体、底部动作条（bg-inset 分隔线）；可折叠手风琴变体（chevron 200ms）。嵌套卡禁用第二层阴影（用 bg-inset 区分）。

## Tabs

下划线式（后台）/ 药丸式（前台）二选一；激活下划线 2px primary；键盘 ←→ 循环；`role="tablist/tab/tabpanel"`。**PDP 信息区禁用 Tabs**（storefront/11-storefront-pdp.md 结论：用手风琴）。

## Accordion

默认展开项按语义决定（Description 展开）；单项展开模式；触发区 44px 高；chevron 旋转 200ms；内容进出用 grid-template-rows 过滤（不测高度）。

## DataTable / Pagination / Filters

见 admin/15-admin-data-tables.md全量规格。挂点：`<table data-slot="table">`、行 `data-state="selected|loading"`、排序头 `aria-sort`。

## ProductCard / Price / Swatch / Quantity / Rating

| 组件 | 契约要点 |
|---|---|
| `ProductCard` | 整卡单链接；媒体 4:5；徽章 ≤1；swatch 可选；见 storefront/10-storefront-plp.md |
| `Price` | props: `amount` `compareAt` `market` `perUnit` `size`；自动 locale 格式化 + 税注 + tabular-nums；**compareAt 只接受后端 30 天最低价**（Omnibus） |
| `Swatch` | 24px（卡）/32px（PDP）；无货=置灰+斜杠；选中 2px primary 环 + tooltip 色名 |
| `QuantityStepper` | −/值/+ 各 44px；min 1 max=库存/限购；长按步进（400ms 起 80ms 步频） |
| `Rating` | 星 16px；半星显示；`4.8 (312)` 结构；0 评不渲染 |

## CartDrawer / FreeShippingBar / TrustStrip

见 storefront/12-storefront-cart-checkout.md、storefront/13-storefront-trust-conversion.md。`CartDrawer` 挂点 `data-state="open|closed"`、行项 `data-line-key`；`FreeShippingBar` 无门槛配置渲染为空。

## Urgency / ReviewItem / WithdrawalButton / ConsentBanner

| 组件 | 强制行为 |
|---|---|
| `Urgency` | 无 `verified` 数据源渲染为空（反假紧迫感） |
| `ReviewItem` | `incentivized`/`verifiedBuyer` 徽章常显；差评不可被参数隐藏 |
| `WithdrawalButton` | 仅 EU/UK market 渲染；一键流程含状态回执 |
| `ConsentBanner` | Reject=Accept 同尺寸；颗粒度三开关；预合意零脚本 |

## Skeleton / EmptyState / ErrorState / Spinner

Skeleton：`bg-inset` + shimmer 1.5s + `aria-busy` 容器；形状=最终布局（禁止圆形 spinner 替代结构骨架）。EmptyState 三件套见 admin/14-admin-foundations.md。ErrorState：插图 + 人话 + Retry + 保留输入。

## CommandPalette（⌘K）

z-modal；输入即搜（资源 + 动作 + 跳转）；↑↓ Enter；结果分组（Actions / Orders / Products / Help）；每项右侧快捷键提示。列表虚拟化 >200 项。

---

## Toolbar 与形状变体族（复合容器的地基）

**为什么需要这一节**：当多个子控件挤进同一个容器（输入框底栏、表头操作条、卡片工具行），
如果各自沿用不同尺寸体系（按钮系统 36px / 图标按钮 32px / 分段控件 28px），边框、圆角、
图标基线就会互相错位 —— 这是"拼凑感"的唯一起源。**解法不是在页面里微调，而是让复合容器的
子控件共享一条基线。**

### 三种形状变体族（按"承载什么"选，不按"想多宽"选）

| 族 | 类名 | 圆角 | 宽度 | 何时用 |
|---|---|---|---|---|
| **方形** | `.m-tool--square` | 4px（`--m-radius-sm`） | = 高度 | 纯图标，无文字（附件、刷新、更多） |
| **药丸** | `.m-tool--pill` | 9999px | 随内容（受 max-width 约束） | 图标+标签 或 纯标签（"始终授权"、模式切换、模型选择） |
| **芯片** | `.m-tool--chip` | 9999px | 随内容 | 已选项/状态过滤（可含移除按钮） |

三族**共享同一基线高度** `--m-tool-h`（默认 32px，`--m-toolbar--sm` 降为 28px）。
族内必须零差异：同一条工具栏里，方形工具的宽高 = 药丸工具的高。

> 实现注意：基础规则 `.m-tool` **不得声明 `border-radius`**，否则会以"同优先级靠后"的次序覆盖形状族圆角。
> 形状族与状态规则必须写在基础规则之后。（这是本组件库曾出现的真实 bug，见 v1.0.1 修复记录。）

### Toolbar 容器规格

```
.m-toolbar                     →  align-items:center; gap:4px; flex-wrap:nowrap
.m-toolbar--loose              →  gap:8px（工具组之间）
.m-toolbar .sep                →  1px × 16px 竖分隔线（组间视觉切分）
.m-toolbar .spacer             →  弹性占位（把主操作推到右侧）
.m-toolbar--sm                 →  基线降为 28px（次级工具条）
```

| 规则 | 说明 |
|---|---|
| 间距分两档 | 工具之间 **4px**（并列关系）；工具组与主操作之间 **8px + sep**（层级关系）。禁止混用 6/10/12px |
| 主操作唯一 | 一条工具栏最多一个实底主操作（`.m-tool--send`）；其余工具默认透明底，hover 才显形 |
| 不用 Button | 复合容器内**禁止使用 `.m-btn`**（那是 36px 的页面级控件）；统一用 `.m-tool` 族 |
| 折叠优先于换行 | `flex-wrap:nowrap`；空间不足时把低频工具收进 "⋯" 溢出菜单，而不是折成两行 |
| 宽度约束 | 药丸类工具必须设 `max-width`（默认 14rem），内部标签 `text-overflow: ellipsis` —— 德语 +35% 时不会撑破容器 |
| 高度一致 | 若某工具视觉上必须更高（如圆形头像触发器），它属于**容器外**的兄弟元素，不混进 toolbar |

### Composer（输入容器）契约

```
┌ .m-composer ───────────────────────────────┐
│  .m-composer__input   (textarea, 无边框)      │  ← focus-within 时容器描边转 focus 色
│  ──────────────────────────────────────────  │
│  [square][pill 始终授权]  … spacer … [pill 模型 ▾][send]  ← .m-composer__bar
└────────────────────────────────────────────┘
   .m-composer__legal  ← 合规小字（"内容由 AI 生成"），容器外下方
```

| 规则 | 说明 |
|---|---|
| 焦点语义 | 输入域**无边框**，焦点态由容器 `:focus-within` 表达（单一边框来源） |
| 主操作位置 | `send` 永远在最右，`margin-left: 8px` 与工具组拉开 |
| 禁用态 | 输入为空时 `send` 用 `[disabled]`（bg-inset + fg-disabled），不用降透明度 |
| 模型/模式选择器 | 用药丸族 + `▾`，`max-width: 14rem`；展开后用 Popover（e2），不使用原生 select |
| 合规小字 | 固定 12px（`--m-text-xs`）+ `fg-subtle`；位于容器**外部**下方（不属于工具栏基线）。v1.1 迁移说明曾声称已改 12px 但文档漏改，v1.2 补齐 |
| 与页面关系 | Composer 通常是 sticky 底部；sticky 时用**实底 + 顶边线**，不用渐隐遮罩（渐变会吃掉工具图标对比度） |
