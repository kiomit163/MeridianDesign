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
| 骨架屏 | shimmer 1.5s 循环（浅色: ink-3→ink-2；深色反向）；`prefers-reduced-motion` 下降级为**静态占位块**（不加动画） |
| 列表 stagger | 前台仅限首屏 ≤8 项，每项延迟 40ms，总量 ≤320ms |
| 加购反馈 | 商品飞入购物车图标（前台专属表达性时刻，450ms）——可选，绝不在后台出现 |

### Reduced Motion 契约（v1.7 分级）

全局处置分两类，**位移类关闭、颜色类保留**——这不是放宽，是修正"一刀切归零"造成的两个副作用：交互反馈消失（按下无反应）、`.rv` 入场动画停在起始态（元素不可见）。

```css
@media (prefers-reduced-motion: reduce) {
  /* 1. 动画：位移/缩放/旋转一律关闭，只保留终态 */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
  /* 2. 过渡：只允许不产生位移的属性，且用最短时长 */
  *, *::before, *::after {
    transition-property: opacity, color, background-color, border-color, box-shadow, fill, stroke !important;
    transition-duration: var(--m-duration-100) !important;
    transition-delay: 0ms !important;
  }
}
```

由此派生四条硬约束：

1. **加载态必须静态可读**：骨架 = 静态占位块（形状等于最终布局），加载环 = 静态圆环 + 文案/`aria-busy`，不依赖转动表达"在加载"。
2. **信息不得仅靠动效传达**：加载中 = 容器 `aria-busy="true"` + 可见文本或 spinner；位移动效（抽屉/Toast）降级为透明度切换。
3. **`.rv` 必须停在终态**：降级块显式写 `animation: none; opacity: 1; translate: none;`——若只归零时长，`animation-fill-mode: both` 会把元素冻结在 0% 关键帧，整块内容不可见（已修复的真实缺陷）。
4. **transition-property 允许表是封闭的**：新增可过渡属性（如 `translate`/`scale`/`filter`）必须同时更新本期契约与 `prototypes-gate` 的守卫，否则降级下会被静默裁剪。

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
| 竖版 story / reel / 视频封面 | **9:16** | 与 4:5 商品图同页出现时，竖版只用于叙事区，不得用于商品主图 |
| 用户评价图 | 1:1，≤4 张横排，点击进灯箱 | |
| 头像 | 1:1 圆形 pill | |

所有 `<img>` 必须带 `width`/`height` 属性或 CSS `aspect-ratio`（校验项）。

### 性能规则（LCP 是转化指标）

- **LCP 图（PDP 首图 / hero）永不懒加载**：`fetchpriority="high"` + `loading="eager"` + preload。
- 其余全部 `loading="lazy" decoding="async"`。
- **格式优先级：AVIF > WebP > JPEG**（JPEG 只作最末兜底）。用 `<picture>` 逐层声明，不做 UA 嗅探；AVIF 编码质量以 SSIM 而非固定 CRF 验收。
- **`srcset` 五档：400 / 800 / 1200 / 1600 / 2400w** + `sizes`。缩略图（≤120px 视觉）只需 400/800 两档——给缩略图挂 2400 是浪费流量，不是"更清晰"。
- **LQIP / blur-up**：
  - 占位物 = 图片主色的 `background-color`（优先）或 ≤32px 的内联 WebP/AVIF（base64）；
  - **LCP 图禁止 blur-up**：占位先渲染再替换会把 LCP 计时推后，是负优化；LCP 图直接用 `--m-bg-inset` 实底 + `fetchpriority="high"`；
  - 非 LCP 图允许 `filter: blur(12px)` → `none` 的 150ms 透明度过渡，且必须在 `prefers-reduced-motion: reduce` 下退化为直接显示。
- **视频契约**：`<video>` 必须带 `poster`（9:16 或 16:9 对应容器比例）、`playsinline`、`muted`、`preload="none"`，**默认不自动播**；播放必须由用户手势触发，且提供可见的播放/暂停控件与静音状态。自动播放只允许出现在无声装饰背景，且必须在 `prefers-reduced-motion: reduce` 下停用。
- 商品图底色：浅色模式 `--m-bg-inset`（自动兼容深色模式），禁止透明 PNG 直接上深色页。
- **商品图与内容卡上禁止叠加玻璃/毛玻璃层**（含 hover 遮罩使用 `backdrop-filter`）：会改变商品颜色观感，违反 §02 §六的对比契约。玻璃只允许出现在固定/浮动面板（`docs/04 §3.1`）。
- 首屏图片字节预算见 §四"性能预算分配表"（v1.7 起由分类额度替代单一整页上限）。

### Alt 文本规则

产品图描述**产品本身**（"Drum coffee table in walnut with glass top"），不写 "image of / photo of"；营销图描述**信息意图**；纯装饰 `alt=""`；带文字的 banner 必须在 alt 或相邻文本中重复该文字（ADA 诉讼高发点）。

---

## 四、性能预算分配表（v1.7 · O15 裁定：按字节 + 主线程，不按标签数）

单一"整页 ≤1.2MB"无法回答"钱花在哪"，而"第三方脚本 ≤3 个"是**计数式条款**——一个标签管理器可以在 1 个 `<script>` 下再拉 40 个脚本、2MB 代码，计数完全不约束成本。v1.7 起改用**分类字节预算 + 加载阶段 + 主线程时间**三轴。

首次加载预算（移动端 75 分位，brotli/gzip 后）：

| 类别 | 预算 | 说明 |
|---|---|---|
| LCP 元素（hero / PDP 首图） | **≤100KB 移动 / ≤150KB 桌面**（AVIF） | 全页唯一允许 `fetchpriority="high"` 的图片；禁止 blur-up |
| 首屏非 LCP 图片 | 合计 ≤250KB | eager 但不得抢占 LCP 带宽 |
| 折叠线下图片 | 单张 ≤120KB，全部 `loading="lazy"` | |
| 字体 | ≤2 个 WOFF2 变量字体，合计 ≤180KB | `unicode-range` 子集 + `size-adjust`；`font-display: swap` |
| CSS | 全量 ≤60KB；首屏关键 CSS 内联 ≤14KB | 按层拆分，未用层不加载 |
| 自有 JS | 首屏 ≤120KB，单路由 ≤170KB | 行为层保持零依赖 |
| **异步三方 JS** | 首次 ≤100KB，且必须在 LCP 之后加载 | `defer`/`async` 只是起点，还要用 `requestIdleCallback` 或交互触发水合 |
| **同步三方 JS** | **0KB**（渲染阻塞三方一律禁止） | 唯一例外：CMP stub ≤20KB 内联 |
| 首次传输总量 | ≤1.2MB（目标 1.0MB） | 含 HTML / CSS / JS / 字体 / 首屏图 |
| 主线程 | 加载期长任务合计 ≤200ms，单任务 ≤50ms | INP 保护 |
| INP / CLS | INP ≤200ms；CLS ≤0.1 | 设计约束，不是"优化目标" |

**必异步清单**（不在此列不等于可同步）：分析/标签管理、A/B 测试、评论 widget、客服/聊天、营销像素、个性化推荐、视频播放器（先渲染 facade，交互后再加载播放器）。

**允许同步的封闭白名单**：

1. 主题引导脚本：≤2KB 内联，首帧前设置 `data-theme`，防深色闪烁；
2. 同意管理 stub：≤20KB 内联，只做选择记录，不拉三方 SDK。

除以上两项外，任何同步三方脚本 = 评审缺陷，不因"业务方要求"豁免。预算超限的处置顺序：先砍首屏非 LCP 图，再砍三方，最后才动 LCP 图——**LCP 图是转化资产，不是优化缓冲区。**
