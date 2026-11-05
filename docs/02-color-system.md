# 02 · 色彩系统

> 核心思想：**色板不是颜色集合，是对比度的承诺**。每个 12 阶色带的阶位用途固定，对比度由构造保证（Radix Colors 方法论），使用者在任何阶位组合中都不会做出无障碍错误。

---

## 一、12 阶语义（全系统唯一色彩语法）

| 阶 | 用途 | 典型消费者 |
|---|---|---|
| 1 | 页面背景（page bg） | `--m-bg-page` |
| 2 | 弱背景 / 次级表面 | `--m-bg-band`、`--m-bg-inset` |
| 3 | 组件背景（tint 底） | 状态族 `*-bg` |
| 4 | 组件背景 hover | tint 组件 hover |
| 5 | 选中组件背景 / 弱分隔 | 选中态底（`--m-bg-surface-selected` 可用 3 阶） |
| 6 | 弱边框 / 分隔 | `--m-border`（装饰基线，非语义边界） |
| 7 | 组件边框 / 焦点 | 状态族 `*-border`（success / danger / info） |
| 8 | 强边框 / 控件边界 | `--m-border-strong`、warning / accent 的 `*-border` |
| 9 | **实底填充**（该色带最高饱和点） | `--m-primary`、`*-solid` |
| 10 | 实底 hover / pressed | `--m-primary-hover` |
| 11 | 低对比文本（正文级彩色文字） | `*-fg`、`--m-fg-link` |
| 12 | 高对比文本 / 深色锚点 | `--m-fg`（浅色模式正文） |

**规则**：阶位语义全局唯一。看到 `brand-9` 就知道是实底，看到 `danger-11` 就知道是红色文本。**禁止跨阶越权组合**（如拿 5 阶做文本底色）。

> **v1.3 修正**：第 5–8 阶不再笼统承诺 ≥3:1。WCAG 1.4.11 只对"识别控件所必需的视觉信息"生效，因此**语义边界必须落在第 7/8 阶或 `--m-border-strong`**；第 5/6 阶只作装饰分隔。状态描边按色带分别取阶：success/danger/info 用 7 阶，warning/accent 因暖色亮度高，必须到第 8 阶才能过线。
>
> **v1.6 复核（暖色带倒挂：算术必然，不是笔误）**：`warning` / `accent` 的 9 阶必须够亮才能承载深字（`warning-9 #EFB000` L=0.494，深字 8.37:1），而 8 阶必须够暗才能对白底 ≥3:1（要求 L ≤ 0.30；实测 `warning-8 #B07C0E` L=0.237）。若要让 8 阶"比 9 阶更浅"，8 阶就得 L > 0.494——那会直接跌出 3:1。**两者在同一色带内不可同时成立。**
>
> **v1.7 变更**：tint 徽章改为纯填充分离（去描边）。描边职责交给 `--m-badge--outline` 变体与真正的控件边界。理由：8 阶描边的 3:1 门槛是"识别控件所必需"，而徽章是信息标签、不是可交互控件；浅底 + 11 阶文字已满足 4.5:1。solid 徽章仍用 9 阶填充（亮底 + 深字），outline 徽章仍保留状态族描边（7/8 阶按色带）——三者是不同边缘策略的变体。
>
> 唯一禁止的组合：**同一元素上叠加 8 阶描边与 9 阶实底**（`border: 1px solid var(--m-warning-border)` 与 `background: var(--m-warning-solid)` 同时成立）。此时描边比填充更暗，"实底"反而比边界更浅，层级反转。
>
> **v2 修正方向（不是调 8 阶）**：暖色带的"亮实底"与"深描边"本就分属两条轨道。正确做法是把 `*-solid` 从 12 阶色带中解耦，单独给出一条亮实底轨（按 §十 的死区规则校验），色带只保留深描边轨。仅重生成色带解决不了这个问题。

## 二、八条色带及其用途边界

| 色带 | 用途 | 禁止 |
|---|---|---|
| `ink`（中性微冷，v1.7 降 chroma） | 页面骨架、正文、边框、中性控件 | — |
| `brand`（Pine 绿） | 主操作、品牌强调、链接、选中态 | 语义状态（成功≠品牌） |
| `accent`（Terracotta 赤陶） | 促销标签、活动强调（`emphasis-*`） | 系统告警（与 warning 混淆） |
| `info` | 中性通知、引导提示 | 错误提示 |
| `success` | 成功、可用、已完成 | — |
| `warning` | 需要行动的告警（合并 Polaris 的 caution+warning，降低选择噪音） | 错误 |
| `danger` | 危险操作、错误、促销价 | 普通强调 |
| `mystic`（AI 紫） | **仅限 AI 能力 UI**（生成、推荐理由、AI 徽标） | 任何普通 UI——紫色是 AI 的"身份证" |

## 三、语义层词汇表（业务代码唯一可用）

### 表面与内容

| Token | 浅色值 | 深色值 | 用途 |
|---|---|---|---|
| `--m-bg-page` | `#FFFFFF`（后台 ink-2） | `#0F1216`（后台 `#0B0E12`） | 页面底 |
| `--m-bg-surface` | `#FFFFFF` | `#161A20`（后台 `#141821`） | 卡片/面板（后台灰底白卡） |
| `--m-bg-surface-hover` | ink-2 | `#1C2129` | 可点卡片 hover |
| `--m-bg-surface-selected` | ink-3 | `#232935` | 选中项 |
| `--m-bg-inset` | ink-2（前台）/ ink-3（后台） | `#0B0E12` / `#090C10` | 输入框、内衬面板 |
| `--m-bg-band` | ink-2 | `#10141A` | 前台区块交替底 |
| `--m-bg-chrome` | `#FFFFFF`（前台导航融入内容）/ ink-2（后台） | `#0F1216` / `#0B0E12` | 常驻框架 |
| `--m-bg-scrim` | 48% 黑 | 60% 黑 | 弹层遮罩 |
| `--m-fg` | ink-12 | `#DEE0E2` | 正文 |
| `--m-fg-muted` | ink-11 | `#B3B6BC` | 次要文本 |
| `--m-fg-subtle` | ink-9 | `#95989E` | 占位符/注脚 |
| `--m-fg-disabled` | ink-8 | `#61666C` | 禁用 |
| `--m-fg-link` | ink-12（前台）/ brand-11（后台） | ink-2 / brand-4 | 链接（正文内联必须带下划线） |
| `--m-border` / `--m-border-strong` | ink-6 / ink-8 | `#262C36` / ink-9 | 装饰边框 / 控件边界（≥3:1） |

### 状态族五件套（success / warning / critical / info / emphasis 通用）

| 后缀 | 用途 | 例 |
|---|---|---|
| `*-fg` | 状态色文本/图标（浅底上 ≥4.5:1） | `text-critical` |
| `*-bg` | 状态 tint 衬底（对 `*-fg` 预校准） | `bg-success-bg` |
| `*-border` | 状态描边（对 bg ≥3:1） | `border-warning-border` |
| `*-solid` | 实底填充（徽章/实底按钮） | `bg-critical-solid` |
| `*-solid-hover` / `*-solid-active` | 实底按钮 hover / pressed（success / info / critical / emphasis 四族；warning 无按钮用法，故不提供） | `bg-critical-solid-hover` |
| `*-solid-fg` | 实底上的文字 | `text-critical-solid-fg` |

**命名规则即对比度规则**：`*-fg` 永远配 `*-bg`，`*-solid-fg` 永远配 `*-solid`。禁止交叉（如 `critical-fg` 配 `warning-bg`——校验器与 review 都会拦）。

### 舞台主色映射（重要设计决策）

`--m-primary` 的指向**由舞台决定**，组件 API 不变（`m-btn--primary`）：

| 舞台 | primary 实底 | hover 方向 | 理由 |
|---|---|---|---|
| **Storefront** | **ink-12 近黑**（深色主题 = ink-2 近白） | 浅色：微微提亮（黑是端点）；深色：压暗到 ink-4（白是端点）——统一按“远离端点” | **画廊舞台原则**：商品图是彩色的，品牌色实底按钮会与商品争抢视觉。黑白灰 CTA 是欧美 DTC 主流（Everlane / Aritzia / SSENSE / Shopify Dawn 默认）。链接、ghost、开关、选中环随之走中性 |
| **Admin** | brand-9 品牌绿 | 浅色：9→10（变深）；深色：9→8（变浅）——同样按“远离端点” | 运营工具需要品牌识别度与一致感（Polaris 同哲学：绿色是 Shopify Admin 的身份色） |

品牌色在前台的合法自留地：**品牌时刻** —— logo、宣告条（announcement bar）、营销区块、强调徽章。前台的绿色出现频率应低到"翻页时才注意到"，而不是每个按钮都在喊品牌口号。

### 商务专属

| Token | 用途 |
|---|---|
| `--m-price-sale` | 促销价（浅色=danger-11 红；欧盟市场可整体替换为品牌色——EU 促销红并非法定） |
| `--m-price-compare` | 划线原价（fg-subtle + strikethrough） |
| `--m-price-fg` | 常规价 |
| `--m-ai-fg` / `--m-ai-bg` | AI 功能（生成文案、智能推荐） |

> **语义例外**：`--m-price-sale` 在 storefront 借用 `danger-11` 的红色，但只表达"促销价"，不携带错误/危险语义；`admin` 不消费 `price-sale`。品牌可在 Brand Kit 整体替换为 brand/accent，EU 市场促销红并非法定。

## 四、表面层级（Surface Ranks）—— 背景是有序阶梯，不是颜色集合

**为什么单列一节**：只有"页面色 + 卡片色"两级时，做记录型页面（订单、商品、设置）够用；一旦遇到**多窗格外壳**（IDE、聊天、邮件、CRM：导航栏 + 工作区 + 检视栏），作者必然要靠直觉决定"哪一栏该是什么底色"，而直觉会给出**层级颠倒**的结果（工作台面比框架更暗、两个侧栏一灰一白）。这不是页面作者水平问题，是模型缺了一级。

| rank | 浅色（前台 / 后台） | 深色（前台 / 后台） | Token | 角色 | 典型区域 |
|---|---|---|---|---|---|
| −2 | `ink-2` / `ink-3` | `#0B0E12` / `#090C10` | `--m-bg-inset` | 凹槽 | 输入框内衬、代码块底、空态区、`kbd` |
| −1 | `#FFFFFF` / `ink-2` | `#0F1216` / `#0B0E12` | `--m-bg-chrome` | **常驻框架** | 导航栏、检视栏、工具栏、顶栏 |
| −1 | `#FFFFFF` / `ink-2` | `#0F1216` / `#0B0E12` | `--m-bg-page` | 画布 | 最外层底（仅在缝隙可见） |
| **0** | `#FFFFFF` / `#FFFFFF` | `#161A20` / `#141821` | `--m-bg-surface` | **工作台面 / 卡片 / 内容** | 阅读区、表格、卡片、表单 |
| +1 | = surface | = surface | surface + `--m-shadow-e2/e3` | 浮层 | Popover、Modal、Drawer |

> 前台例外：导航与画布同为白色（时尚站惯例，让商品图独占视觉），框架靠**底边线**而非底色后退；后台必须保持"灰框架 + 白卡"的落差。深色下两侧都遵循同一语义：surface 永远比 chrome 亮一档。

**两条铁律**

1. **浅色主题下：越亮 = 越靠前（内容），越暗 = 越后退（结构）。** 深色主题数值反向，但**语义指向不变**——`surface` 永远比 `chrome` 亮一档。判断口诀："用户的眼睛停在哪里，哪里就是 rank 0。"
2. **框架色区域内的 hover / 选中必须换梯度。** `--m-bg-surface-hover` 只对白色台面成立；在**后台浅色**的 chrome 上它与 chrome **同值**（都是 `ink-2`），直接使用会让 hover 完全不可见。chrome 内必须使用：

```css
.chrome-nav a:hover      { background: var(--m-bg-chrome-hover); }     /* 一档更深 */
.chrome-nav a.is-active  { background: var(--m-bg-chrome-selected); }  /* 两档更深 + 左侧指示条 */
```

若组件**可能落在任意底色上**（导航、工具条、列表行等可复用组件），改用 **host-agnostic 状态层叠加**——它不依赖宿主底色，对任意 rank 都成立：

```css
.host-agnostic:hover { background: color-mix(in oklab, var(--m-fg) 8%, transparent); }
```

> **v1.5 补充**：这条不只适用于 chrome。任何**非白台面**（`bg-band`、`bg-inset`、深色任意层）内的 hover 都不得直接使用 `--m-bg-surface-hover`——storefront 浅色下它与 `bg-band` 同值（都是 ink-2），hover 会整块消失。可复用组件一律用状态层叠加。
>
> **v1.5 阶梯修正**：storefront 的 `--m-primary-tint` 由 ink-2 改为 ink-3。原值与 `--m-bg-surface-hover` 同值，导致“已选项比 hover 项更浅”的语义反转（combobox、列表选中均受影响）。

## 五、两种拓扑：Canvas+Card 与 Chrome+Work-surface

层级阶梯本身不含"该怎么排"，排布由拓扑决定。Meridian 承认两种合法拓扑，**选错拓扑 = 层级颠倒**：

| 拓扑 | 结构 | 适用 | 规则 |
|---|---|---|---|
| **A · 画布 + 卡片**<br>Canvas + Card | 灰画布 + 其上浮起的白卡 | **记录型页面**：列表、表格、表单、仪表盘（前台全部页面） | 画布 = `bg-page`；每个内容块 = `bg-surface` 卡片；卡片靠**底色差**分离（后台白卡 on ink-2 / 前台灰卡 on 白）；"白底白卡"的兜底场景才用描边 |
| **B · 框架 + 工作台面**<br>Chrome + Work surface | 灰框架包围一块白色工作台面 | **外壳型（多窗格）**：IDE、AI 对话、邮箱、CRM 等 2–3 栏常驻布局 | 导航/检视栏/工具栏 = `bg-chrome`；**工作台面 = `bg-surface`（白色）**；台面内可用 `bg-inset` 做凹槽（输入框、代码块） |

**判据**："内容是**一块块可数的卡片**吗？"→ 是则拓扑 A；"内容是一整片**连续的流**（对话、文档、代码）吗？"→ 是则拓扑 B。

> ⚠️ 最常见的错误：把拓扑 A 的"灰底白卡"套到外壳型布局上。结果框架与台面同灰，层级消失；作者再靠直觉给某一栏改白色，就产生了"两个侧栏一灰一白"的乱象。
>
> ⚠️ 另一个高发错误：**双层叠加**。例如"灰色粘性条 + 白色输入框"会让输入框悬浮在一个与它无归属关系的底色上。正确做法：粘性区底色 = **它所在台面的颜色**（拓扑 B 下即 `bg-surface`），输入框靠**边框 + e1 阴影**与台面分离，而不是靠底色差异。

### 5.1 卡片的分离方式：底色差优先，描边只作兜底（v1.7 表面轴）

"卡片要不要描边"不是审美偏好，是**画布对比度的函数**。先量，再选。

| 画布 → 卡片 | 实测 | 结论 |
|---|---|---|
| 后台：`ink-2 #F7F8F9` → 白卡 | **1.06:1** | 填充分离成立；后台默认无描边 |
| 前台：`#FFFFFF` → 灰卡（ink-2） | **1.06:1** | 填充分离成立；前台默认走 `tinted` |
| 前台：`#FFFFFF` → 白卡 | **1.00:1** | 填充分离不可用，只能靠描边（兜底档） |

由此：

- **后台（画布 = ink-2）默认无描边。** `.stage-admin .m-card` 未声明 `data-surface` 时即纯填充分离；再画描边会得到"双弱边缘"——填充 1.06 与描边 1.52 同时存在时，眼睛读到的不是"一块浮起的面"，而是"一个画出来的框"。
- **前台（画布 = 白）优先用 `tinted` 灰卡**；白卡必须保留描边（1.00:1 下唯一可行的分离手段）。"白底白卡 + 描边"是兜底，不是默认。
- 卡内 header/footer 横线跟随卡片档位：无描边卡内一律关闭（`--m-card-divider: transparent`）；只有兜底的白卡才保留。

四个取值（`data-surface`，封闭集）：

```html
<div class="m-card">                          <!-- 默认：按舞台自动（后台无描边 / 前台白卡描边） -->
<div class="m-card" data-surface="filled">    <!-- 纯填充：无描边、无阴影（后台默认即此档） -->
<div class="m-card" data-surface="tinted">    <!-- 灰卡：无描边、无阴影（前台默认即此档） -->
<div class="m-card" data-surface="elevated">  <!-- 无描边 + e1 阴影 -->
```

**`tinted` / `filled` 的启用检查**：

1. 画布与卡片必须不同色（否则卡片消失）。前台白画布用 `tinted`（ink-2），后台灰画布用 `filled`（白卡）。
2. 无描边卡片不要再加阴影。"底色差 + 弱阴影"是两种弱信号叠加，比描边更脏。
3. 圆角跟随舞台 token（前台 16 / 后台 12），不要为了"看起来更现代"手工调小。

> 实测参照：成熟 C 端产品的画布/卡片差约 **1.05:1、无描边、无阴影、圆角 16px**。Meridian 前台的 `tinted` 即此组合。

**前台落地（v1.7）**：结账流三页与两张订单汇总改用 `tinted`；商品卡改"无容器"（透明底 + 透明 1px 盒模型，商品图自身承担边界）。默认白卡描边只保留给"白底白卡"的兜底场景。

**浮层阴影分级**（阴影只表达层高，不表达品牌感；内容卡本身永远不用 e2 以上）：

- 商品卡 quick-add 气泡：`--m-shadow-e2`（它是浮在卡片媒体上的独立层，不是卡片本身）；
- 抽屉 / 模态：`--m-shadow-e3`；toast：`--m-shadow-e4`（与 §四 elevation 表一致）。

## 六、已校准的对比契约（不允许自行发明组合）

| 前景 | 背景 | 比率 | 场景 |
|---|---|---|---|
| `fg` (ink-12) | `bg-page` | ≈15.3:1 | 正文 |
| `fg-muted` (ink-11) | `bg-page` | ≈5.8:1 | 次要文本 |
| `fg-subtle` (ink-9) | `bg-page` | ≈5.3:1 | 注脚（仅 ≥12px 非关键信息） |
| `primary-fg` (#FFF) | `primary`（前台 ink-12 / 后台 brand-9） | 14.5:1 / 6.44:1 | 主按钮；后台内嵌焦点环取此色（前台外环用 `border-focus`） |
| `#FFF` | `critical-solid` (danger-9) | ≈5.2:1 | 危险按钮 |
| `#2B1F02` | `warning-solid` | ≥7:1 | 告警实底（深字） |
| `#FFFFFF` | `emphasis-solid` / `accent-9` | ≈5.2:1 | 促销实底（白字） |
| `border-focus` (info-9) | `bg-surface` / `bg-page` | ≈5.8:1 | 焦点环（**WCAG 1.4.11** 非文本对比；2.4.11 只约束“焦点不被遮挡”，2.4.13 才是 AAA 焦点外观，均与此数值无关） |
| `border-strong` (ink-8) | `bg-surface` / `bg-inset`(admin) | 3.54:1 / 3.16:1 | 控件边界（WCAG 1.4.11） |
| `*-border` | `*-bg` | 3.07–5.42:1 | 状态描边（success/danger/info 第 7 阶；warning/accent 第 8 阶） |
| `border` (ink-6) | `bg-surface` | ≈1.5:1 | 装饰边框基线（非语义、无 WCAG 义务）——语义边界一律用 `border-strong` |
| `fg-subtle` (ink-9) | **admin `bg-inset` (ink-3)** | **≈4.74:1 ✓** | v1.4 起 ink-9 已加深；`bg-inset` 内文字可直接用 `fg-subtle`，但不得再调浅 |

> 深色侧同理：`border-strong`(ink-9) 对 `bg-surface` ≈3.28:1；`border-focus`(info-5) ≈8.7:1；状态描边统一用各色带第 6 阶（5.1–8.3:1）。这些值由 `ai/selfcheck/contrast.test.mjs` 的 `UI_LIGHT/UI_DARK` 永久回归。

## 七、状态层公式（替代散落的 hover 色）

tint / 白底组件统一用 **M3 状态层**，不再逐个调 hover 色：

```css
.card:hover        { background: color-mix(in oklab, var(--m-fg) var(--m-state-hover), transparent); }
.card:active       { background: color-mix(in oklab, var(--m-fg) var(--m-state-pressed), transparent); }
.card[aria-selected="true"] { background: color-mix(in oklab, var(--m-fg) var(--m-state-selected), transparent); }
```

实底（9 阶）组件用显式 token。方向规则只有一条：**hover / pressed 必须“远离当前端点”**——浅色主题端点在深端，故 9→10 变深；深色主题端点在浅端，故 9→8 变浅。前台主操作是端点色：浅色为近黑（ink-12），hover 只能提亮 8%、pressed 再提亮到 14%；**深色为近白（ink-2），hover 必须压暗到 ink-4、pressed 到 ink-5**（`tokens.css` 已按此实现，勿照抄“永远提亮”）。pressed 永远比 hover 更远离端点，不得回弹。写死方向，AI 不需要判断。

## 八、数据可视化色板（独立 8 色，按序取用）

**独立分类色板**，不继承状态语义；浅色对白底、深色对 `#161A20` 均 ≥3:1。CVD 模拟（Viénot protan/deutan/tritan）下最小 CIEDE2000 ≥12（浅色）/ ≥10（深色），由 `ai/selfcheck/chart-cvd.test.mjs` 永久回归。

| # | Token | 浅色 | 深色 |
|---|---|---|---|
| 1 | `--m-chart-1` | `#0072B2` | `#1E63C3` |
| 2 | `--m-chart-2` | `#D55E00` | `#D55E00` |
| 3 | `--m-chart-3` | `#009E73` | `#009E73` |
| 4 | `--m-chart-4` | `#CC79A7` | `#A64B7A` |
| 5 | `--m-chart-5` | `#5B21B6` | `#B49BF2` |
| 6 | `--m-chart-6` | `#5F6C80` | `#F7D378` |
| 7 | `--m-chart-7` | `#264653` | `#7FC8C0` |
| 8 | `--m-chart-8` | `#000000` | `#FFFFFF` |

规则：
- ≤4 个系列用 1-4；5-8 按序追加；超过 8 个系列 = 图表设计错误，必须聚合。
- **>4 系列必须叠加图案或直接标注**，不得只靠颜色；同一图表避免只靠相邻色相（如 2/6 橙/红）区分。
- 本表是**固定分类色板**，禁止把第 2 色当 warning、第 6 色当 error 使用。语义状态图（如"缺货率"）才允许直接使用状态色。
- 深色主题消费同一组 token（自动切到浅色化值），不得在图表内手写 hex。
- 深浅两套是按各自底色独立优化的分类色板；同一系列号在深色可换色相，图表必须提供图例/直标来维持系列识别。
- **v1.5 语义隔离**：图表内禁止把 chart-5（紫）当作 AI 能力标识（AI 只用 `--m-ai-*`）、禁止用 chart-8（黑/白）充当主操作色；网格线统一 `--m-chart-grid`，不得写 ink-5。
- 本表是 CVD 校准过的资产：**禁止局部替换单色**，任何换色必须重跑 `ai/selfcheck/chart-cvd.test.mjs`。

## 九、深色模式策略

- **机制**：语义层整体重指向（见 tokens.css `.theme-dark`），业务代码零感知。主题类可挂在 `html` 或任意祖先元素；前台 `.stage-storefront` 与后台 `.stage-admin` 都支持跨元素挂载（v1.3 补齐前台）。
- **方法**：中性 ink 色带"双向翻转"（fg 取 1-4 阶、bg 取 11-12 区间自造锚点），彩色族文本升到 4 阶、tint 底改用 9 阶的 14-16% alpha——保证任意组合仍然成对达标。
- **范围**：后台全量支持；前台为 opt-in（品牌可关）。
- **图片**：深色模式下产品图容器保持浅色衬底（`--m-bg-inset`），禁止给产品图加暗色滤镜。

### 9.1 三态主题与 OS 跟随（v1.7）

主题模式是封闭三值：`light` / `dark` / `auto`。

| 模式 | 挂载 | 行为 |
|---|---|---|
| `light`（默认） | 无属性 或 `[data-theme="light"]` | 浅色舞台，与 v1.6 完全一致 |
| `dark` | `[data-theme="dark"]` / `.theme-dark` | 显式深色（沿用既有规则） |
| `auto` | `[data-theme="auto"]` / `.theme-auto` | 声明 `color-scheme: light dark`，并由 `@media (prefers-color-scheme: dark)` 重指向到与显式深色**逐声明等同**的块 |

实现约束：

1. **默认舞台不翻转。**`auto` 是 opt-in，`:root` 仍为 `color-scheme: light`。把默认改成 `auto` 会让所有存量站点在用户 OS 为深色时突然变深——视觉可见 + 打断品牌一致性，属 **v2.0 MAJOR**，已登记为 **O11**，本版不实施。
2. **自动深色与显式深色必须同源。**`@media (prefers-color-scheme: dark)` 内的四组块（主语义 / 后台 / 图表 / 代码与 toast）以 `AUTO-DARK-PARITY` 标记注释，由 `ai/selfcheck/auto-theme-parity.test.mjs` 逐声明比对——改一处漏一处即红。选镜像而非 `light-dark()` 改造，是因为深色值已按各自底色独立校准，重构会打断 `dark-contrast.test.mjs` 的解析口径。
3. **入口**：`design-system.html` 与店面原型（08/09/10）的页头有 `[data-theme-cycle]` 按钮，三态循环并写入 `localStorage("m-theme")`；`11-checkout` 不放（结账页尽量减少出口）。行为由 `ai/meridian-behavior.js` 的 `MeridianBehavior.theme`（`get/set/cycle`）提供，宿主应用可直接调 `set("auto")` 而不经过按钮。

## 十、品牌替换配方（Brand Kit）

### 10.1 唯一的硬约束：实底必须落在"对比死区"之外

实底（9 阶）上的文字只有两种合法配色：`#FFFFFF`（浅字）或 `#2B1F02`（深字）。二者对填充亮度的要求方向相反：

| 配色 | 要求（相对亮度 L） | 等价说法 |
|---|---|---|
| 白字 ≥4.5:1 | **L ≤ 0.183** | 实底必须足够暗 |
| 深字 ≥4.5:1 | **L ≥ 0.241** | 实底必须足够亮 |
| **0.183 < L < 0.241** | 两种都不达标 | **死区：此处不存在合法实底** |

所以配方约束的不是 HSL 的 L 值，而是**相对亮度**。HSL 的 L 不是感知亮度——同一 L 值在不同色相上的实际亮度差可达三倍以上，这正是旧配方把橙压成泥棕的成因。

### 10.2 两种合法模式（系统内已同时存在）

| 模式 | 适用 | 已发布实例 | 实测 |
|---|---|---|---|
| **深底 + 白字** | 品牌色本身较暗，或需要强对比的主 CTA | `brand-9 #0F6B57`（L=0.113） | 白字 **6.44:1** |
| **亮底 + 深字** | 品牌色鲜艳、促销/状态标注 | `warning-9 #EFB000`（L=0.494） | 深字 **8.37:1** |

七条色带的 9 阶实测全部在死区外：brand 6.44 / info 5.79 / success 4.93 / danger 5.23 / mystic 6.13 / accent 5.18（白字），warning 8.37（深字）。

### 10.3 生成步骤（替代固定 L/S 表）

1. 取品牌主色的**色相 H**，饱和度用该色相能到的最高值，不做统一下压。
2. 计算相对亮度 L，据此选定模式：
   - **L ≤ 0.183** → 深底 + 白字，锚点即当前色
   - **L ≥ 0.241** → 亮底 + 深字，锚点即当前色
   - **落在死区** → 二选一：压到 L≈0.18（配白字）或提到 L≈0.25（配深字），并在品牌文档写明取舍
3. 由锚点反推 12 阶：1–8 阶沿同色相向浅端展开；10 阶比 9 阶暗一档；11 阶为对白底 ≥4.5:1 的文本色；12 阶为深锚点。
4. **`--m-primary-fg` 必须与锚点同时确定**（`#FFFFFF` 或 `#2B1F02`），不得默认白字。
5. 生成后重跑对比契约表（docs/02 §六），失败只调 9/11 阶。

### 10.4 一个反直觉的结论

**"品牌槽位装不下鲜艳色"是旧配方的产物，不是对比度的要求。**

以番茄橙 `#FF5F00` 为例：它 L=0.294，天然落在亮侧——**配深字是 5.3:1，完全达标**。旧配方把它拖到 L33 后得到 `#824226`（L=0.088）：对比度更好（白字 7.62:1），但品牌没了。

真正的取舍不是"鲜艳 vs 可读"，而是"**白字 vs 深字**"。一旦承认深字合法，鲜艳品牌就能原样保留。

> `#2B1F02` 是**对比常量**，不以 primitive 形式暴露给 Brand Kit：把它变成可品牌化变量会直接破坏"暖色实底 8.3:1"，因此它只作为 `--m-warning-solid-fg` 的字面量存在——但它同时是**亮底模式的通用深字**，`--m-primary-fg` 可以取它。
