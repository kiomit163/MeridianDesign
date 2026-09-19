# 05 · 动效 · 图标 · 图像

---

## 一、动效：双人格系统（Carbon productive/expressive 方法学）

| 人格 | 舞台 | 特征 |
|---|---|---|
| **Productive**（高效） | 后台 | 快、小位移、只解释因果；100–300ms |
| **Expressive**（表达） | 前台 | 稍慢、有空间叙事（抽屉滑入、区块浮现）；200–600ms |

### 时长阶梯

| Token | 值 | 用途 |
|---|---|---|
| `--m-duration-100` | 100ms | 开关、checkbox、tooltip 淡入 |
| `--m-duration-150` | 150ms | **hover/pressed 标准反馈**（颜色、状态层） |
| `--m-duration-200` | 200ms | 焦点环、小面板、手风琴 |
| `--m-duration-300` | 300ms | 抽屉/模态进入、页面切换 |
| `--m-duration-450` | 450ms | 大面积内容过渡 |
| `--m-duration-600` | 600ms | 仅前台表达性（hero 元素浮现、区块级） |

### 缓动

| Token | 值 | 用途 |
|---|---|---|
| `--m-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 默认一切（M3 emphasized） |
| `--m-ease-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | 元素入场（decelerate） |
| `--m-ease-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | 元素退场（accelerate） |

**入场用 enter + 300ms，退场用 exit + 150ms**——退场永远比入场快（用户等着走）。

### 动效模式库（封闭枚举，禁止即兴）

| 模式 | 规格 |
|---|---|
| hover 反馈 | 状态层 8%，150ms standard，**不用位移** |
| 卡片悬浮（前台） | e1→e2 阴影过渡 + `translateY(-2px)`，200ms standard |
| 抽屉 | 右滑入 300ms enter / 退出 150ms exit；scrim 淡入 200ms |
| 模态 | 缩放 0.96→1 + 淡入，200ms enter |
| Toast | 底部/顶部滑入 200ms，退场 150ms |
| 骨架屏 | shimmer 1.5s 循环（浅色: ink-3→ink-2；深色反向） |
| 列表 stagger | 前台仅限首屏 ≤8 项，每项延迟 40ms，总量 ≤320ms |
| 加购反馈 | 商品飞入购物车图标（前台专属表达性时刻，450ms）——可选，绝不在后台出现 |

### Reduced Motion 契约

`tokens.css` 已全局禁用（时长归零、scroll-behavior auto）。组件契约补充：位移类动效降级为**透明度切换**；进度类（骨架 shimmer、加载环）保留但降速可选；**信息不得仅靠动效传达**（加载中 = spinner + `aria-busy`）。

### 性能红线

只动 `transform` / `opacity`（合成层）；触发 `layout` 的过渡（width/height/top/left）禁止；长列表滚动区禁用 transition；动效中禁用 `will-change` 常驻（临时声明即可）。

---

## 二、图标系统

| 项 | 规格 |
|---|---|
| 画板 | 24×24 网格（Carbon 32px 派生），关键线：外边距 2px，笔触 1.5px @24 |
| 风格 | **Outline 为主**（后台全部 + 前台功能图标）；Fill 仅限前台情感图标（星级、收藏） |
| 尺寸 | 16（行内/表格）/ 20（按钮）/ 24（导航、空状态）——三档封闭 |
| 颜色 | 继承 `currentColor`；语义色仅限状态五件套 `*-fg` |
| 交付 | SVG sprite 或 React 组件；`aria-hidden="true"`（除非是唯一语义载体→`role="img"` + label） |

规则：同一界面同一图标只表达同一含义（购物袋 ≠ 购物车图标混用）；新图标先查库，库中没有再画；图标+文字并排时 gap `--m-space-2`。

---

## 三、图像规范（电商核心资产）

### 宽高比纪律（防 CLS + 统一栅格）

| 场景 | 比例 | 说明 |
|---|---|---|
| 商品主图（PDP） | **4:5** | 欧美服饰/家居标准；每 SKU 全套同比例 |
| 商品卡（PLP） | 4:5 | 与 PDP 一致，hover 切换第二图 |
| 生活方式图 / Banner | 3:2（桌面）/ 4:5（移动，srcset 裁切） | 文案区留白 ≥40% |
| 用户评价图 | 1:1，≤4 张横排，点击进灯箱 | |
| 头像 | 1:1 圆形 pill | |

所有 `<img>` 必须带 `width`/`height` 属性或 CSS `aspect-ratio`（校验项）。

### 性能规则（LCP 是转化指标）

- **LCP 图（PDP 首图 / hero）永不懒加载**：`fetchpriority="high"` + `loading="eager"` + preload。
- 其余全部 `loading="lazy" decoding="async"`。
- 格式：AVIF 优先，WebP 兜底；`srcset` 3 档（400/800/1200w）+ `sizes`。
- 商品图底色：浅色模式 `--m-bg-inset`（自动兼容深色模式），禁止透明 PNG 直接上深色页。
- 首屏图片字节预算 ≤150KB（压缩后）；整页 ≤1.2MB。

### Alt 文本规则

产品图描述**产品本身**（"Drum coffee table in walnut with glass top"），不写 "image of / photo of"；营销图描述**信息意图**；纯装饰 `alt=""`；带文字的 banner 必须在 alt 或相邻文本中重复该文字（ADA 诉讼高发点）。
