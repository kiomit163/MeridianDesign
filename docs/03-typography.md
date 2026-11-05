# 03 · 字体系统

> 原则：**字阶是有限菜单，不是自由市场**。前台大气、后台致密；两个舞台共享一套字体与权重调校，只用字号与密度区分。

---

## 一、字体策略

| 用途 | 字体 | 说明 |
|---|---|---|
| 后台 UI + 前台正文 | **Inter Variable** | Polaris/Atlassian 同款调校路线：开源可变字体、最优屏显、AI 训练语料最丰富 |
| 前台品牌展示（`--m-font-display`） | 品牌插槽（默认：前台用本地衬线栈，后台回落 Inter） | 时尚/奢侈品可换衬线（如 Fraunces、Source Serif）；科技感可换 Geist/Space Grotesk。**只能整体替换，不能局部混用**。**v1.5 警告**：本地衬线栈在 Windows/macOS 落不同字面，跨平台并不同形；品牌上线前必须自托管 1 个可变衬线并配度量匹配 fallback（预算内），默认栈只用于原型 |
| 代码/单号/SKU | 系统 mono 栈 | 追踪单号、API Key 用 mono + `--m-info-fg` |

**性能硬约束**：自托管 WOFF2 变量字体；`<link rel="preload">` 主字体；`font-display: swap` + `size-adjust` 防 CLS；单页面字体请求 ≤2 个文件。禁用 Google Fonts 运行时引入（GDPR：IP 传输至美国已有判例风险）。

## 二、字重阶梯（v1.6 改为静态档）

```
| Token | 值 | 用途 |
|---|---|---|
| `--m-weight-regular` | 400 | 正文 |
| `--m-weight-medium` | 500 | 次强调、标签、按钮 |
| `--m-weight-semibold` | 600 | 标题、表格表头 |
| `--m-weight-bold` | 700 | **仅前台 display**；后台禁止 |
```

### 2.1 为什么放弃 450 / 550 / 650

那三档是为 **Inter 变量字体**做的调校（Polaris / Atlassian 同款）。但本系统**不交付字体文件**（无 `@font-face`），字体不可控时浏览器按"就近匹配"回落到静态档：

| 请求 | Windows 雅黑实际 | macOS 苹方实际 |
|---|---|---|
| 450 | 400 | 400 |
| 550 | 400 | 500 |
| 650 | 700 | 600 |

也就是说 `450` 与 `550` 在 Windows 上**渲染完全相同**——"半粗"这个语义层级根本不存在。改成 400/500/600 至少让 Apple / Android 能分辨，Windows 仍只剩 400/700 两档。

> **因此：标题层级不得只靠字重表达。** 必须同时用字号或颜色（`fg` / `fg-muted`）承担区分。这条在 Windows 上是硬约束，不是建议。

## 二之二、CJK 排版（zh / ja / ko）

拉丁文的行高与字距不能直接套到汉字上。三处差异已写入 `tokens.css` 的 `:lang()` 覆盖块：

| 项 | 拉丁 | CJK | 原因 |
|---|---|---|---|
| 正文行高 | 1.6 | **1.75** | 汉字满格、笔画密，1.6 视觉上偏挤 |
| 后台行高 | 1.45 | **1.6** | 1.45 在 14px 中文正文下已接近密排 |
| productive 密度 | 1.38 | **1.5** | 密度可以紧，但不能紧到失去行间气口 |
| 标题字距 | `-0.02em` | **0** | 负字距让汉字互相贴合；`0` 就是 `0`，不给"轻微收紧"留口子 |

实现方式：覆盖的是**变量**（`--m-body-leading`）而不是 `line-height` 属性——这样每一处消费点自动跟随，不需要在每个组件里重复声明。

> 尚未覆盖：标点避头尾与中西文自动间距（`text-spacing-trim` / `text-autospace`）浏览器支持尚不一致，暂以 `line-break` 默认行为为准，等基线后再补。

## 三、字阶

### 通用刻度（tokens）

| Token | px/行高 | 前台用途 | 后台用途 |
|---|---|---|---|
| `--m-text-xs` | 12/16 | 徽章、图注 | 徽章、表头辅助 |
| `--m-text-sm` | 13/20 | 商品卡次信息 | 按钮、正文次级 |
| `--m-text-md` | 14/20 | — | **后台正文默认** |
| `--m-text-lg` | 16/24 | **前台正文默认** | 大正文 |
| `--m-text-xl` | 18/28 | lead 文本 | — |
| `--m-text-2xl` | 20/28 | 小标题 | 后台页面标题上限 |
| `--m-text-3xl` | 24/32 | 区块标题 | — |
| `--m-text-4xl` | 30/38 | 区块大标题 | — |
| `--m-text-5xl` | 36/44 | 页面标题 | — |
| `--m-text-6xl` | 44/52 | 营销标题 | — |
| `--m-text-display-sm` | clamp(32→48) | 次级叙事区块（品牌故事、集合导语） | 禁止 |
| `--m-text-display` | clamp(36→60) | 页面级叙事标题（专题、落地页） | 禁止 |
| `--m-text-display-lg` | clamp(44→96) | **首屏 hero（唯一允许 96px 的场景）** | 禁止 |

> **前台叙事档（v1.7）**：display 由单档拆为三档，上限从 60px 提到 96px，全部为流式 clamp（视口驱动，无断点跳变）。分档解决的是"60px 装不下大屏 hero、但每个区块都上 hero 尺寸会毁掉层级"——**同一页面最多一个 display-lg**，其余叙事区块用 display-sm 或 display。后台不受影响，仍禁止 display 档。

> **行高已 token 化（v1.3）**：`--m-leading-xs … --m-leading-6xl` 与 `--m-leading-display` 与上表一一对应；组件 UI 文本与标题必须使用这些 token。长文正文由 `--m-body-leading` 驱动（前台 1.6 / 后台 1.45）；display/hero 与代码块允许光学例外（见 §四.3）。Tailwind 侧桥接为 `--text-*--line-height`，因此 `text-lg` 等工具类不会再落回浏览器默认行高。
>
> **v1.5 光学行高族**：`--m-leading-title-1/2/3`、`--m-leading-tight`、`--m-leading-lead`、`--m-leading-copy`、`--m-leading-note`、`--m-leading-label`、`--m-leading-none` 均为**无单位比值**（随字号缩放）。组件层与组合层禁止再写裸 `line-height`，由校验规则 **R16** 强制；`tokens.json` 的 `typography.roles` 是同一组值的镜像。

### 前台标题映射

| 角色 | Token | 权重 | 追踪 |
|---|---|---|---|
| Display-lg（首屏 hero，每页最多 1 处） | `--m-text-display-lg` | `--m-weight-bold` | `--m-tracking-tightest` |
| Display（页面级叙事标题） | `--m-text-display` | `--m-weight-bold` | `--m-tracking-tightest` |
| Display-sm（次级叙事区块） | `--m-text-display-sm` | `--m-weight-bold` | `--m-tracking-tightest` |
| H1（PDP 商品名/集合页） | `--m-text-5xl`（≤768px 用 3xl） | `--m-weight-semibold` | tight |
| H2（区块标题） | `--m-text-4xl` | `--m-weight-semibold` | tight |
| H3（卡片组标题） | `--m-text-2xl` | `--m-weight-semibold` | — |
| Lead（副标题） | `--m-text-xl` | `--m-weight-regular` | — |

> 组件类映射：`.sf-display-lg` / `.sf-display` / `.sf-display-sm`（`ai/site.css`）。三者共用 `--m-font-display` + `--m-leading-display`，只差字号；**不得**用 `--m-text-6xl` 拼"伪 hero"绕过本表。

### 后台标题映射（Polaris 风格，克制）

| 角色 | Token | 权重 |
|---|---|---|
| 页面标题 | `--m-text-2xl` (20/28) | `--m-weight-semibold` |
| 卡片标题 | `--m-text-md` (14/20) | `--m-weight-semibold` |
| 小节标题 | `--m-text-sm` (13/20) | `--m-weight-semibold` |
| 表头 | `--m-text-xs` (12/16) | `--m-weight-medium` + fg-muted |

## 四、排版规则（硬约束）

1. **正文最小 12px**，任何场景禁止更小（含法律小字——用 12px + fg-muted）。
2. **行长 45–75ch**：前台正文列 `max-w` ≈ 65ch；后台表单说明 ≤60ch。
3. **行高**：组件 UI 文本与标题走 `--m-leading-*`；长文正文 1.6（前台）/1.45（后台）；display/hero 用 `--m-leading-display`（1.05）或 `--m-leading-title-1/2`，代码块固定 `--m-code-leading` (1.7)。**除这些 token 外禁止自定义行高**（R16 校验；光学行高族见 §三）。
4. **数字一律 `tabular-nums`**：价格、库存、表格、倒计时（`.tnum` 已在 base 提供）。价格永远走 Price 组件，不许手拼。
5. **追踪**：≤20px 标题可用 tight；正文永不加宽（letter-spacing > 0 仅限 ALL-CAPS 短标签如 "FREE SHIPPING"，≤3 词）。
6. **禁止**：全大写正文、两端对齐、正文下划线（链接除外）、纯斜体强调（用 `--m-weight-medium`）、文字替代图标语义。
7. **多语言**：德语 +35% 文本膨胀 → 按钮/标签永不定宽（`w-fit` / auto），标题容器禁止固定高度；中文/西文混排只用 `lang` 属性控制。
8. **层级兜底**：当不确定层级时，优先"字号降一级 + fg-muted"，而不是加粗——加粗是稀缺资源。

## 五、价格排版（商务核心场景）

| 元素 | 规格 |
|---|---|
| 常规价 | `text-lg`（PDP）/ `text-md`（卡片），`--m-weight-medium`，`--m-price-fg` |
| 促销价 | 同尺寸，`--m-weight-semibold`，`--m-price-sale` |
| 划线原价 | 同尺寸或 -1 级，`--m-price-compare` + line-through，**必须紧邻促销价右侧** |
| 节省徽章 | `Save 20%` → emphasis 或 critical bg 徽章，Omnibus 30 天最低价校验后端保证 |
| 单价（DE 法定 Grundpreis） | `text-xs` + fg-muted，"= 12,90 € / 100 ml"，仅 DE/FR/IT 市场 |
| 税注 | EU/UK/AU："Incl. VAT"；US/CA：结算页展示税。`text-xs` fg-muted |

## 六、字体加载模板

```html
<link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
<style>
  @font-face {
    font-family: "Inter Variable";
    src: url("/fonts/inter-variable.woff2") format("woff2-variations");
    font-weight: 100 900;
    font-display: swap;
    size-adjust: 100%;
  }
</style>
```

LCP 元素若是文字（hero 标题）：该文本节点使用系统字体栈回落渲染可接受；若是商品图：图片优先于字体预算（见 storefront/09-storefront-foundations.md）。

> **v1.5 纠正**：模板里的 `size-adjust: 100%` 是**无操作**，不会防 CLS。真正的防抖动做法是为 fallback 字体声明与 Inter 度量对齐的 `ascent-override / descent-override / line-gap-override`（按字体实际度量测算），并用同一 `font-family` 名字回退；否则 `font-display: swap` 在 LCP 文本上仍会发生换字跳动。
