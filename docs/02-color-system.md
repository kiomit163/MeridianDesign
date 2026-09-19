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
| 5 | 弱边框 / 分隔 | 状态族 `*-border` |
| 6 | 常规边框 | `--m-border` |
| 7 | 强边框 / 焦点描边 | `--m-primary-border` |
| 8 | 边框 hover | `--m-border-strong` hover |
| 9 | **实底填充**（该色带最高饱和点） | `--m-primary`、`*-solid` |
| 10 | 实底 hover / pressed | `--m-primary-hover` |
| 11 | 低对比文本（正文级彩色文字） | `*-fg`、`--m-fg-link` |
| 12 | 高对比文本 / 深色锚点 | `--m-fg`（浅色模式正文） |

**规则**：阶位语义全局唯一。看到 `brand-9` 就知道是实底，看到 `danger-11` 就知道是红色文本。**禁止跨阶越权组合**（如拿 5 阶做文本底色）。

## 二、八条色带及其用途边界

| 色带 | 用途 | 禁止 |
|---|---|---|
| `ink`（冷中性） | 页面骨架、正文、边框、中性控件 | — |
| `brand`（Pine 绿） | 主操作、品牌强调、链接、选中态 | 语义状态（成功≠品牌） |
| `accent`（Amber 琥珀） | 促销标签、活动强调（`emphasis-*`） | 系统告警（与 warning 混淆） |
| `info` | 中性通知、引导提示 | 错误提示 |
| `success` | 成功、可用、已完成 | — |
| `warning` | 需要行动的告警（合并 Polaris 的 caution+warning，降低选择噪音） | 错误 |
| `danger` | 危险操作、错误、促销价 | 普通强调 |
| `mystic`（AI 紫） | **仅限 AI 能力 UI**（生成、推荐理由、AI 徽标） | 任何普通 UI——紫色是 AI 的"身份证" |

## 三、语义层词汇表（业务代码唯一可用）

### 表面与内容

| Token | 浅色值 | 深色值 | 用途 |
|---|---|---|---|
| `--m-bg-page` | `#FFFFFF` | `#0F1216` | 页面底 |
| `--m-bg-surface` | `#FFFFFF` | `#161A20` | 卡片/面板（后台灰底白卡） |
| `--m-bg-surface-hover` | ink-2 | `#1C2129` | 可点卡片 hover |
| `--m-bg-surface-selected` | ink-3 | `#232935` | 选中项 |
| `--m-bg-inset` | ink-2 | `#10141A` | 输入框、内衬面板 |
| `--m-bg-band` | ink-2 | `#10141A` | 前台区块交替底 |
| `--m-bg-scrim` | 48% 黑 | 60% 黑 | 弹层遮罩 |
| `--m-fg` | ink-12 | `#F1F3F6` | 正文 |
| `--m-fg-muted` | ink-11 | `#AEB7C4` | 次要文本 |
| `--m-fg-subtle` | ink-9 | `#8E99AA` | 占位符/注脚 |
| `--m-fg-disabled` | ink-8 | `#5C6675` | 禁用 |
| `--m-fg-link` | brand-11 | brand-4 | 链接 |
| `--m-border` / `--m-border-strong` | ink-5 / ink-6 | `#262C36` / `#363D49` | 边框 |

### 状态族五件套（success / warning / critical / info / emphasis 通用）

| 后缀 | 用途 | 例 |
|---|---|---|
| `*-fg` | 状态色文本/图标（浅底上 ≥4.5:1） | `text-critical` |
| `*-bg` | 状态 tint 衬底（对 `*-fg` 预校准） | `bg-success-bg` |
| `*-border` | 状态描边（对 bg ≥3:1） | `border-warning-border` |
| `*-solid` | 实底填充（徽章/实底按钮） | `bg-critical-solid` |
| `*-solid-fg` | 实底上的文字 | `text-critical-solid-fg` |

**命名规则即对比度规则**：`*-fg` 永远配 `*-bg`，`*-solid-fg` 永远配 `*-solid`。禁止交叉（如 `critical-fg` 配 `warning-bg`——校验器与 review 都会拦）。

### 舞台主色映射（重要设计决策）

`--m-primary` 的指向**由舞台决定**，组件 API 不变（`m-btn--primary`）：

| 舞台 | primary 实底 | hover 方向 | 理由 |
|---|---|---|---|
| **Storefront** | **ink-12 近黑**（深色主题 = ink-2 近白） | 微微提亮（黑已是端点，方向例外） | **画廊舞台原则**：商品图是彩色的，品牌色实底按钮会与商品争抢视觉。黑白灰 CTA 是欧美 DTC 主流（Everlane / Aritzia / SSENSE / Shopify Dawn 默认）。链接、ghost、开关、选中环随之走中性 |
| **Admin** | brand-9 品牌绿 | 变深（9→10） | 运营工具需要品牌识别度与一致感（Polaris 同哲学：绿色是 Shopify Admin 的身份色） |

品牌色在前台的合法自留地：**品牌时刻** —— logo、宣告条（announcement bar）、营销区块、强调徽章。前台的绿色出现频率应低到"翻页时才注意到"，而不是每个按钮都在喊品牌口号。

### 商务专属

| Token | 用途 |
|---|---|
| `--m-price-sale` | 促销价（浅色=danger-11 红；欧盟市场可整体替换为品牌色——EU 促销红并非法定） |
| `--m-price-compare` | 划线原价（fg-subtle + strikethrough） |
| `--m-price-fg` | 常规价 |
| `--m-ai-fg` / `--m-ai-bg` | AI 功能（生成文案、智能推荐） |

## 四、表面层级（Surface Ranks）—— 背景是有序阶梯，不是颜色集合

**为什么单列一节**：只有"页面色 + 卡片色"两级时，做记录型页面（订单、商品、设置）够用；一旦遇到**多窗格外壳**（IDE、聊天、邮件、CRM：导航栏 + 工作区 + 检视栏），作者必然要靠直觉决定"哪一栏该是什么底色"，而直觉会给出**层级颠倒**的结果（工作台面比框架更暗、两个侧栏一灰一白）。这不是页面作者水平问题，是模型缺了一级。

| rank | 浅色 | 深色 | Token | 角色 | 典型区域 |
|---|---|---|---|---|---|
| −2 | `ink-3` | `#0E1218` | `--m-bg-inset` | 凹槽 | 输入框内衬、代码块底、空态区、`kbd` |
| −1 | `ink-2` | `#0B0E12` | `--m-bg-chrome` | **常驻框架** | 导航栏、检视栏、工具栏、顶栏 |
| −1 | `ink-2` | `#0F1216` | `--m-bg-page` | 画布 | 最外层底（仅在缝隙可见） |
| **0** | `#FFFFFF` | `#141821` | `--m-bg-surface` | **工作台面 / 卡片 / 内容** | 阅读区、表格、卡片、表单 |
| +1 | = surface | = surface | surface + `--m-shadow-e2/e3` | 浮层 | Popover、Modal、Drawer |

**两条铁律**

1. **浅色主题下：越亮 = 越靠前（内容），越暗 = 越后退（结构）。** 深色主题数值反向，但**语义指向不变**——`surface` 永远比 `chrome` 亮一档。判断口诀："用户的眼睛停在哪里，哪里就是 rank 0。"
2. **框架色区域内的 hover / 选中必须换梯度。** `--m-bg-surface-hover` 只对白色台面成立；在 chrome 上它与 chrome **同值**（浅色下都是 `ink-2`），直接使用会让 hover 完全不可见。chrome 内必须使用：

```css
.chrome-nav a:hover      { background: var(--m-bg-chrome-hover); }     /* 一档更深 */
.chrome-nav a.is-active  { background: var(--m-bg-chrome-selected); }  /* 两档更深 + 左侧指示条 */
```

若组件**可能落在任意底色上**（导航、工具条、列表行等可复用组件），改用 **host-agnostic 状态层叠加**——它不依赖宿主底色，对任意 rank 都成立：

```css
.host-agnostic:hover { background: color-mix(in oklab, var(--m-fg) 8%, transparent); }
```

## 五、两种拓扑：Canvas+Card 与 Chrome+Work-surface

层级阶梯本身不含"该怎么排"，排布由拓扑决定。Meridian 承认两种合法拓扑，**选错拓扑 = 层级颠倒**：

| 拓扑 | 结构 | 适用 | 规则 |
|---|---|---|---|
| **A · 画布 + 卡片**<br>Canvas + Card | 灰画布 + 其上浮起的白卡 | **记录型页面**：列表、表格、表单、仪表盘（前台全部页面） | 画布 = `bg-page`；每个内容块 = `bg-surface` 卡片；卡片靠**边框**（后台）或**边框 + e1 阴影**（前台）与画布分离 |
| **B · 框架 + 工作台面**<br>Chrome + Work surface | 灰框架包围一块白色工作台面 | **外壳型（多窗格）**：IDE、AI 对话、邮箱、CRM 等 2–3 栏常驻布局 | 导航/检视栏/工具栏 = `bg-chrome`；**工作台面 = `bg-surface`（白色）**；台面内可用 `bg-inset` 做凹槽（输入框、代码块） |

**判据**："内容是**一块块可数的卡片**吗？"→ 是则拓扑 A；"内容是一整片**连续的流**（对话、文档、代码）吗？"→ 是则拓扑 B。

> ⚠️ 最常见的错误：把拓扑 A 的"灰底白卡"套到外壳型布局上。结果框架与台面同灰，层级消失；作者再靠直觉给某一栏改白色，就产生了"两个侧栏一灰一白"的乱象。
>
> ⚠️ 另一个高发错误：**双层叠加**。例如"灰色粘性条 + 白色输入框"会让输入框悬浮在一个与它无归属关系的底色上。正确做法：粘性区底色 = **它所在台面的颜色**（拓扑 B 下即 `bg-surface`），输入框靠**边框 + e1 阴影**与台面分离，而不是靠底色差异。

## 六、已校准的对比契约（不允许自行发明组合）

| 前景 | 背景 | 比率 | 场景 |
|---|---|---|---|
| `fg` (ink-12) | `bg-page` | ≥14:1 | 正文 |
| `fg-muted` (ink-11) | `bg-page` | ≈5.3:1 | 次要文本 |
| `fg-subtle` (ink-9) | `bg-page` | ≈4.6:1 | 注脚（仅 ≥12px 非关键信息） |
| `primary-fg` (#FFF) | `primary` (brand-9) | ≈5.6:1 | 主按钮 |
| `#FFF` | `critical-solid` (danger-9) | ≈4.9:1 | 危险按钮 |
| `#2B1F02` | `emphasis-solid`/`warning-solid` | ≥7:1 | 促销/告警实底（深字） |
| `border-focus` | 任意 surface | ≥3:1 | 焦点环（WCAG 1.4.11） |
| `border` (ink-5) | `bg-surface` | ≥1.6:1 | 装饰边框（非语义）——语义边界用 `border-strong` |
| `fg-subtle` (ink-9) | **`bg-inset`** | **≈4.3:1 ✗** | **禁止**：`fg-subtle` 的校准基准是画布/台面（rank −1/0），在凹槽（rank −2）上跌破 4.5:1。凹槽内的文字请用 `fg-muted`(ink-11) 或更深 |

## 七、状态层公式（替代散落的 hover 色）

tint / 白底组件统一用 **M3 状态层**，不再逐个调 hover 色：

```css
.card:hover        { background: color-mix(in oklab, var(--m-fg) var(--m-state-hover), transparent); }
.card:active       { background: color-mix(in oklab, var(--m-fg) var(--m-state-pressed), transparent); }
.card[aria-selected="true"] { background: color-mix(in oklab, var(--m-fg) var(--m-state-selected), transparent); }
```

实底（9 阶）组件用显式 token：浅色主题 **hover 变深**（9→10），深色主题 **hover 变浅**（9→8）。方向规则写死，AI 不需要判断。

## 八、数据可视化色板（固定 8 色，按序取用）

按色觉安全排序（蓝→青→琥珀→紫→粉→绿→橙→灰），直接映射到色带 9 阶：

```
1 #1E63C3 (info-9)   2 #0F6B57 (brand-9)   3 #EFB000 (warning-9)  4 #6C3FE0 (mystic-9)
5 #E86B6D (danger-6) 6 #2A8767 (brand-8)   7 #D8A437 (accent-6)   8 #66738A (ink-9)
```

规则：≤4 个系列用 1-4；超过 8 个系列 = 图表设计错误，必须聚合。深色模式下统一用各带 4 阶。禁止在图表里用语义状态色（除非图表本身就是状态语义，如"缺货率"）。

## 九、深色模式策略

- **机制**：语义层整体重指向（见 tokens.css `.theme-dark`），业务代码零感知。
- **方法**：中性 ink 色带"双向翻转"（fg 取 1-4 阶、bg 取 11-12 区间自造锚点），彩色族文本升到 4 阶、tint 底改用 9 阶的 14-16% alpha——保证任意组合仍然成对达标。
- **范围**：后台全量支持；前台为 opt-in（品牌可关）。
- **图片**：深色模式下产品图容器保持浅色衬底（`--m-bg-inset`），禁止给产品图加暗色滤镜。

## 十、品牌替换配方（Brand Kit）

替换 brand 色带 = 按以下配方从品牌主色（HSL 的 H）生成 12 阶，替代 Pine：

```
1  L97 S12   2  L94 S18   3  L88 S28   4  L80 S38
5  L70 S45   6  L60 S50   7  L50 S52   8  L40 S52
9  L33 S55  ← 品牌主色锚点（白字需 ≥4.5:1，不足则降 L）
10 L27 S55  11 L30 S60  ← 对白底 ≥4.5:1   12 L18 S60
```

生成后必须重跑对比契约表（第四节），失败先调 9/11 阶。`accent/warning` 的实底永远配深字（#2B1F02），不接受白字。
