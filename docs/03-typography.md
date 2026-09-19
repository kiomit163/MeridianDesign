# 03 · 字体系统

> 原则：**字阶是有限菜单，不是自由市场**。前台大气、后台致密；两个舞台共享一套字体与权重调校，只用字号与密度区分。

---

## 一、字体策略

| 用途 | 字体 | 说明 |
|---|---|---|
| 后台 UI + 前台正文 | **Inter Variable** | Atlassian Sans/Polaris 同款路线：开源可变字体、最优屏显、AI 训练语料最丰富 |
| 前台品牌展示（`--m-font-display`） | 品牌插槽（默认回落 Inter） | 时尚/奢侈品可换衬线（如 Fraunces、Source Serif）；科技感可换 Geist/Space Grotesk。**只能整体替换，不能局部混用** |
| 代码/单号/SKU | 系统 mono 栈 | 追踪单号、API Key 用 mono + `--m-info-fg` |

**性能硬约束**：自托管 WOFF2 变量字体；`<link rel="preload">` 主字体；`font-display: swap` + `size-adjust` 防 CLS；单页面字体请求 ≤2 个文件。禁用 Google Fonts 运行时引入（GDPR：IP 传输至美国已有判例风险）。

## 二、权重调校（Inter 专属）

Inter 的 400/500/600 视觉偏轻，全系统使用调校权重（Polaris/Atlassian 验证过的方案）：

| Token | 值 | 用途 |
|---|---|---|
| `--m-weight-regular` | 450 | 正文 |
| `--m-weight-medium` | 550 | 次强调、标签、按钮 |
| `--m-weight-semibold` | 650 | 标题、表格表头 |
| `--m-weight-bold` | 700 | **仅前台 display**；后台禁止 |

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
| `--m-text-display` | clamp(36→60) | 首屏 hero | 禁止 |

### 前台标题映射

| 角色 | Token | 权重 | 追踪 |
|---|---|---|---|
| Display（hero） | `--m-text-display` | 700 | `--m-tracking-tightest` |
| H1（PDP 商品名/集合页） | `--m-text-5xl`（≤768px 用 3xl） | 650 | tight |
| H2（区块标题） | `--m-text-4xl` | 650 | tight |
| H3（卡片组标题） | `--m-text-2xl` | 650 | — |
| Lead（副标题） | `--m-text-xl` | 450 | — |

### 后台标题映射（Polaris 风格，克制）

| 角色 | Token | 权重 |
|---|---|---|
| 页面标题 | `--m-text-2xl` (20/28) | 650 |
| 卡片标题 | `--m-text-md` (14/20) | 650 |
| 小节标题 | `--m-text-sm` (13/20) | 650 |
| 表头 | `--m-text-xs` (12/16) | 550 + fg-muted |

## 四、排版规则（硬约束）

1. **正文最小 12px**，任何场景禁止更小（含法律小字——用 12px + fg-muted）。
2. **行长 45–75ch**：前台正文列 `max-w` ≈ 65ch；后台表单说明 ≤60ch。
3. **行高**：正文 1.6（前台）/1.45（后台），标题 = 4px 网格（见刻度），display 1.05。
4. **数字一律 `tabular-nums`**：价格、库存、表格、倒计时（`.tnum` 已在 base 提供）。价格永远走 Price 组件，不许手拼。
5. **追踪**：≤20px 标题可用 tight；正文永不加宽（letter-spacing > 0 仅限 ALL-CAPS 短标签如 "FREE SHIPPING"，≤3 词）。
6. **禁止**：全大写正文、两端对齐、正文下划线（链接除外）、纯斜体强调（用 weight-550）、文字替代图标语义。
7. **多语言**：德语 +35% 文本膨胀 → 按钮/标签永不定宽（`w-fit` / auto），标题容器禁止固定高度；中文/西文混排只用 `lang` 属性控制。
8. **层级兜底**：当不确定层级时，优先"字号降一级 + fg-muted"，而不是加粗——加粗是稀缺资源。

## 五、价格排版（商务核心场景）

| 元素 | 规格 |
|---|---|
| 常规价 | `text-lg`（PDP）/ `text-md`（卡片），weight-550，`--m-price-fg` |
| 促销价 | 同尺寸，weight-650，`--m-price-sale` |
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

LCP 元素若是文字（hero 标题）：该文本节点使用系统字体栈回落渲染可接受；若是商品图：图片优先于字体预算（见 09 章）。
