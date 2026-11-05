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
| hover | bg-primary-hover | 状态层 8% | 状态层 8% | `--m-critical-solid-hover` |
| pressed | primary-active | 12% | 12% | `--m-critical-solid-active` |
| disabled | opacity .5 | opacity .5 | opacity .5 | opacity .5 |

规则：一屏一 primary；destructive 必经确认（admin/16-admin-forms-settings.md矩阵）；前台 `cta` 尺寸仅在主转化路径。

## Input / Select / Textarea / Combobox

h-36（`--m-input-h`；**移动端 44**、字号 **16px**，见 tokens.css 移动端块）、bg-surface、border-strong、radius-md；focus → 后台内嵌焦点环；error → border-critical + `aria-invalid`；disabled → bg-inset + opacity .5。Combobox：输入过滤 + 键盘 ↑↓ Enter + 多值 token 化。**Select 选项 ≤5 时改用 Radio**（admin/16-admin-forms-settings.md）。参考实现（ai/meridian-ui.css）：Input/Select/Textarea = §02 表单控件；Combobox = `.m-combobox`；CommandPalette = `.m-palette`（§04 Overlays）。

## Checkbox / Radio / Switch

视觉 20px、热区 44×44（表格 productive 行内若有 Switch，热区可降至 24px——恰好满足 WCAG 2.5.8 底线，避免与相邻行重叠）；选中 `bg-primary` 白勾；Switch：on=primary / off=`--m-control-off-bg` 底白球，带移动动画 150ms，**默认热区 44×44（`min-height:44px`，v1.5）**。语义：Switch=即时生效，Checkbox=随表单提交（admin/16-admin-forms-settings.md）。

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

stage 决定默认分离方式：后台 `bg-surface` 白卡 on ink-2 画布（无描边）；前台优先 `tinted` 灰卡（无描边），白卡兜底才带 1px 描边。radius-lg/xl（stage 决定）+ padding 16/24；头部插槽（标题 + 动作区）、主体、底部动作条；卡内 header/footer 横线仅兜底白卡保留。可折叠手风琴变体（chevron 200ms）。嵌套卡禁用第二层阴影（用 bg-inset 区分）。

**表面轴**（`data-surface`，封闭集）：默认（按舞台：后台 filled / 前台白卡描边）· `filled`（纯填充，无描边无阴影）· `tinted`（灰卡，无描边无阴影；前台默认）· `elevated`（无描边 + e1）。启用 `filled`/`tinted` 的前提是**画布 ≠ 卡片色**，否则卡片消失（见 docs/02 §5.1）。无描边卡内的 `--m-card-divider` 必须为 transparent。

**共享边缘网格**（`data-card-grid`，v1.6）：n 张卡片拼成一张表，相邻卡片共用一条线（4n 条 → n+1 条）。

| 层 | 规则 |
|---|---|
| 容器 | `display: grid` + `gap: 0` + 1px 外环（`box-shadow`，不占布局） |
| 单元 | `border: 0`，只用 `inset` 画左/上两条线；右/下由邻居或容器提供，天然不重叠 |
| 列数 | 旋钮 `--m-card-grid-cols`（未声明取 3），不得写死 `grid-template-columns` |
| 圆角 | **0**。共享线在四角会断开，圆角与"一张表"的语义冲突 |
| hover | 用 `bg-surface-hover` 底色，**不加阴影**——加阴影会让单元浮出网格，破坏共用边 |
| RTL | 左线镜像为右线（`inset -1px`） |

> 对照依据：Arco 的 `.arco-card-grid` 用 5 条 `box-shadow` 同时画外框与内分隔线，卡片自身无 border。

## Tabs

下划线式（后台）/ 药丸式（前台）二选一；激活下划线 2px primary；键盘 ←→ 循环；`role="tablist/tab/tabpanel"`。**PDP 信息区禁用 Tabs**（storefront/11-storefront-pdp.md 结论：用手风琴）。

## Accordion

默认展开项按语义决定（Description 展开）；单项展开模式；触发区 44px 高；chevron 旋转 200ms；内容进出用 grid-template-rows 过滤（不测高度）。

## DataTable / Pagination / Filters

见 admin/15-admin-data-tables.md全量规格。挂点：`<table data-slot="table">`、行 `data-state="selected|loading"`、排序头 `aria-sort`。

**键盘模型（v1.6，`:table[data-grid]` opt-in）**：每行首个可聚焦控件组成一个 roving 组，仅当前行 `tabindex="0"`，其余 `-1`。

| 键 | 行为 |
|---|---|
| `↑` / `↓` | 在行间移动焦点（不改变选中态） |
| `Home` / `End` | 首行 / 末行 |
| `Space` | 由行内控件自行处理（复选框切换），表格不拦截 |
| `Tab` | 离开整个表格，进入下一个区域 |

理由：后台表格常有 50–200 行，朴素 Tab 需逐行按到底才能离开。**不做整行聚焦**（`role="grid"` + 行 `tabindex`）——行内已有交互控件时会与之争夺焦点，是把可访问性问题从"Tab 太多"换成"焦点语义混乱"。行内无单一可聚焦控件的表格不启用本模型（实现会静默跳过）。


## ProductCard / Price / Swatch / Quantity / Rating

| 组件 | 契约要点 |
|---|---|
| `ProductCard` | **stretched link**：卡容器 `div` + 名称链接 `::after` 覆盖整卡；swatch/quick add 为兄弟节点并 `z-index:1`；媒体 4:5；徽章 ≤1；见 storefront/10-storefront-plp.md |
| `Price` | props: `amount` `compareAt` `market` `perUnit` `size`；自动 locale 格式化 + 税注 + tabular-nums；**compareAt 只接受后端 30 天最低价**（Omnibus） |
| `Swatch` | 视觉 24px（卡）/32px（PDP），**热区 ≥44×44（实现 48）**（`::before` 承载视觉圆）；边界 `border-strong` ≥3:1；无货=置灰+斜杠；选中双环 + tooltip 色名；颜色走 `--m-swatch-color`（brand-tokens.css） |
| `QuantityStepper` | −/值/+ 各 44px；与 52px CTA 同排时由 `.sf-buyrow` 整体提升到 52px（三段一起长）；min 1 max=库存/限购；长按步进（400ms 起 80ms 步频） |
| `Rating` | 星 16px；半星显示；`4.8 (312)` 结构；0 评不渲染 |

## CartDrawer / FreeShippingBar / TrustStrip / Wallet

见 storefront/12-storefront-cart-checkout.md、storefront/13-storefront-trust-conversion.md。`CartDrawer` 挂点 `data-state="open|closed"`、行项 `data-line-key`；`FreeShippingBar` 无门槛配置渲染为空。

| 组件 | 契约要点 |
|---|---|
| `Wallet` | `m-wallet--shop-pay / --apple-pay / --google-pay / --paypal`；品牌锁定色只在 `meridian-ui.css`；文字/填充 ≥4.5:1；高度 52px；无可用钱包时整块不渲染 |

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
| 标签字号 | 工具族标签统一 `--m-text-sm`（13px，v1.5 从 12px 上调）；纯图标工具不涉及 |

### 购买箱基线（数量 × CTA，v1.7 · O25）

PDP 的「数量步进器 + 加购 CTA」是第二类复合容器，同样受"子控件共享一条基线"约束：

| 规则 | 说明 |
|---|---|
| 同排等高 | 步进器外框与 CTA 共享 52px 基线（`--m-btn-h-cta`）；`.sf-buyrow` 同时把 −/输入/+ 三段拉到容器内容高（外框 52 = 内容 50 + 2px 边框），**不得只拉伸外框** |
| 默认高度 | 不在购买箱同排时，`QuantityStepper` 保持 44px；52px 是组合语境的提升，不是组件默认 |
| 禁止手搓 | 页面不得用 `.m-row` + 行内 `gap` / `flex` 复刻该行；`.sf-buyrow` 是唯一组合入口 |
| 窄屏 | ≤767px 纵向堆叠：步进器保持内容尺寸，CTA `flex-basis:100%` 独占一行 |

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

---

## 状态契约 A · 变更生命周期（Mutation Lifecycle）

> 补 v1.6 的空缺：此前状态词汇表只有 `disabled / loading / active / focus / hover / default`，
> 全部是**外观态**，没有"用户点了之后、服务器确认之前"这一段。于是乐观/悲观、失败面、撤销
> 三件事由每个团队各自发明，仓库内已出现两套互相冲突的失败口径。

**唯一的机器挂点**：`data-state`，取值封闭如下，不得自造。

| `data-state` | 含义 | 必须可见 |
|---|---|---|
| `idle` | 未提交 | — |
| `pending` | 已提交、未确认（**禁用重复提交**） | 行内进度：按钮 `loading` 宽度锁定 / 行内 spinner |
| `optimistic` | 本地先行、服务端未确认 | 该行 `opacity` 不变；显示"同步中"弱提示 |
| `confirmed` | 服务端确认 | 200ms 成功 flash（仅一次） |
| `failed` | 失败且已回滚 | **就地**错误（行/字段内），不是 Toast |
| `rolledback` | 乐观写入被撤销 | 恢复原值 + 一次性 Toast（带 `Undo` 或 `Retry`） |

三条硬规则：

1. **乐观更新只允许用于可逆操作**（加购、收藏、排序、可见性开关）。金额、库存、权限、发布状态必须悲观。
2. **错误不得用 Toast 承载**（Toast 会消失、没有上下文、无法聚焦）。跨舞台统一：错误就地 + 必要时汇总 Banner。
3. **提交锁**：`pending` 期间同一实体不得再次提交；实现方式是 `disabled` 而不是仅视觉降透明度。

## 状态契约 B · 权限态（Permission / 403）

> 补 v1.6 的空缺：此前"权限"只在 Saved Views 处以"权限另设"出现一次，全库没有 403 的渲染规则。
> 后果是可预见的错法——把无权访问渲染成空状态，然后告诉用户"去创建第一个"。

| 状态 | 语义 | 必须呈现 |
|---|---|---|
| `no-access` | 已登录但无该资源权限 | **不是空态**：说明缺哪个角色 + 如何申请 + 申请入口 |
| `deleted-elsewhere` | 资源已被他人删除 | "已被删除" + 返回列表 + 谁/何时（若可得） |
| `partial` | 部分数据可读 | 可读部分正常渲染 + 不可读区块单独标注，不得整体报错 |
| `session-expired` | 会话失效 | 全屏阻断 + 重新登录，且**保留未提交输入** |

铁律：**空态、无权限、出错、已删除是四种不同的东西**，不得复用同一套文案与同一张插画。

## 状态契约 C · AI 输出生命周期

> 补 v1.6 的空缺：此前只有 AI 的**输入侧**（`mystic` 色、`ai` badge、Composer、合规小字），
> 输出侧为零。于是"未审的 AI 段落"与"作者原文"在产品里不可区分——而"紫色是 AI 身份证"
> 这条规则存在的意义，正是防止这件事。

| 阶段 | 必须 | 禁止 |
|---|---|---|
| 生成中 | 流式输出 + `停止` 按钮；`aria-live="polite"` 播报开始/结束 | 无停止的阻塞式转圈超过 3s |
| 生成完成 | 溯源标记（模型/时间/来源）；`regenerate` 明确"替换上一次"还是"追加变体" | 直接写入正文而不标注来源 |
| 采纳前 | `Accept` / `Reject` / `编辑后采纳`；生成文本与原文视觉可分（`--m-ai-bg` 底） | 生成结果与人工内容同底同色 |
| 采纳后 | 保留 `data-provenance="ai"` 挂点，供审计与撤回 | 抹除来源痕迹 |
| 发布 | 凡对外发布的 AI 内容必须经人工确认；队列化时显示审核状态 | 自动发布 |
| 失败 | 配额/限流/超时分别给出可操作提示 | 与网络错误共用一条文案 |

铁律：**AI 只允许出现在四个视觉位**——能力入口徽章、生成中的容器、已生成内容的底、溯源标签。其余位置出现紫色即为误用。

### C.2 影像溯源挂点（v1.7）

文本侧的 `data-provenance="ai"` 不适用于影像。影像使用四值枚举；属性是机器挂点，**可见披露才是契约本体**：

| 挂点 | 取值 | 约束 |
|---|---|---|
| `<img data-provenance>` / `<video data-provenance>` | `photograph` / `ai-generated` / `ai-retouched` / `illustration` | 每张影像必填；缺省与未知值均被 R13 拒绝 |
| `<img data-provenance-disclosure>` / `<video …>` | `badge` / `caption` | `ai-generated` / `ai-retouched` 必填，且必须真的渲染对应可见物 |
| 文本 `data-provenance` | `ai` | 维持契约 C；不得与影像四值混用 |

披露复用 `.m-badge.m-badge--neutral` 与 `--m-badge-h` / `--m-badge-gap`：不新增颜色、不新增尺寸档。badge 位置、小图退化与视频时序见 `docs/10 §2.4`。
