# 09 · 前台基础（Storefront Foundations）

> 前台的唯一 KPI：**访客 → 信任 → 订单**。所有前台决策的裁判是转化率与退回率，美学服务于此。舞台人格 = Expressive（见 docs/05-motion-iconography.md）。

---

## 一、体验原则

1. **商品是主角**：版面为图让路——大面积留白、中性 surface、克制装饰。
2. **快就是设计**：LCP ≤2.5s / INP ≤200ms / CLS ≤0.1（75 分位实测）。设计选择直接计分：首图不懒加载、区块不加 JS 动画库、第三方脚本 ≤3 个。
3. **信任前置**：价格透明、评价真实、退换无忧、支付安全——这些信息出现在**用户疑虑产生的位置**，而不是页脚。
4. **少一步是一步**：加购不跳页（抽屉）、结算不强制注册、能自动填充不打字。
5. **移动优先**：70% 流量在手机；所有规格以 375px 宽定义后向上增强。

## 二、页面骨架

```
Header（sticky, h: var(--m-header-h-mobile) 移动 / var(--m-header-h) 桌面）
  ├─ Logo ｜ 主导航（≤6 项，更多进 Menu）｜ 搜索（图标或输入框，≥md 展开）｜ 账户 ｜ 购物袋(icon + count badge)
  └─ 宣告条（可选, announcement bar）: 一句 + 链接，背景 `--m-announce-bg` / 文字 `--m-announce-fg`（品牌插槽，brand-tokens.css），h-var(--m-announce-h)，可关闭（24px 触达）
Main
  ├─ 内容容器 max-w-1280 gutter 16/24
  └─ 区块节奏 --m-space-section，交替底 bg-band（同页 ≤3 次）
Footer
  ├─ 精简链接组（Shop / Help / Company）＋ Newsletter（合规见 docs/06-accessibility-compliance.md）
  └─ 法律行: © · Privacy · Terms · Shipping · Returns · Cookie Preferences · (DE) Impressum
        · 支付图标行（卡组织 + PayPal/钱包）· 市场切换（货币/国家）
```

Header 规则：滚动后加 `.is-stuck` 收缩至 `--m-header-h-stuck`（56px，300ms standard；运行时由页面脚本切换）；移动端主导航全屏抽屉（drawer z-300）；搜索是独立覆盖层（`--m-z-cover`，200），打开即聚焦输入框。

## 三、区块模式库（首页构件）

| 区块 | 规格 | 禁止 |
|---|---|---|
| Hero | 单幅构图：display 标题（≤8 词）+ 副题 + 1 个主 CTA；图 3:2/16:9，文字区可读性 ≥4.5:1（图上加 scrim 渐变） | 自动轮播（Baymard：用户不看第 2 帧）；100vh 锁定；≥2 个 CTA |
| 精选集合 | 2×2 或 1+3 卡片，图 4:5，标题 3xl | 纯文字列表 |
| 商品网格 | 4 列（复用 PLP 商品卡） | 横向滚动藏内容（必须配可见分页箭头） |
| 价值主张条 | 3 项：免运费门槛 · 30 天退换 · 安全支付；icon 24 + 一句话 | 堆砌 6+ 项 |
| 评价墙 | 3-4 条，星级 + 一句话 + 头像/国家；真实来源（FTC） | 虚构评价；无来源的 "5000+ happy customers" |
| Newsletter | 标题 + 邮箱框 + 按钮 + 合规小字（"Unsubscribe anytime"）；不勾选默认同意 | 弹窗拦截首次访问 |

## 四、交互基建

| 模式 | 规格 |
|---|---|
| 骨架屏 | PLP/PDP 首屏用骨架（布局稳定的 aspect-ratio 占位），禁止白屏转圈 |
| 乐观更新 | 加购 → 抽屉即时打开（本地先成功），失败回滚 + Toast |
| 无限滚动 | PLP 用 **"Load more" 按钮 + 已见计数**（"Showing 24 of 180"）；不用纯无限流（回退位置丢失、页脚永不可达） |
| 滚动锚定 | 返回 PLP 保留滚动位置与筛选状态（后退导航不重置） |
| 错误兜底 | 页面级错误 = 插图 + "Something went wrong" + Retry + 联系客服；付款相关错误走 12 章规格 |

## 五、性能预算（设计侧可查表）

完整分配表见 `docs/05 §四`（本表是店面视角的摘要，口径以该表为准）。

| 项 | 预算 |
|---|---|
| LCP 元素（hero / PDP 首图） | ≤100KB 移动 / ≤150KB 桌面（AVIF），`fetchpriority="high"`，永不 lazy，禁止 blur-up |
| 首屏非 LCP 图片 | 合计 ≤250KB |
| 自有 JS | 首屏 ≤120KB，单路由 ≤170KB（brotli） |
| 异步三方 JS | 首次 ≤100KB，**LCP 之后**加载；评论区点击后再水合 |
| 同步三方 JS | **0KB**（唯一例外：CMP stub ≤20KB 内联）；"≤3 个脚本"计数条款废止 |
| 字体 | ≤2 个 WOFF2 变量字体，合计 ≤180KB |
| 首次传输总量 | ≤1.2MB（目标 1.0MB），含 HTML/CSS/JS/字体/首屏图 |
| 主线程 | 加载期长任务合计 ≤200ms，单任务 ≤50ms |
| 布局稳定 | 所有媒体声明宽高比；骨架占位等高；字体 `size-adjust` |

## 六、前台专属 token 覆盖（`.stage-storefront`）

```css
.stage-storefront {
  --m-card-shadow: var(--m-shadow-e1);   /* 卡片浮起感 */
  --m-card-radius: var(--m-radius-xl);   /* 16px 圆角 */
  --m-overlay-blur: 4px;                 /* 弹层背后轻毛玻璃 */

  /* 中性 CTA —— 画廊舞台原则 */
  --m-primary: var(--m-ink-12);          /* Add to cart / Checkout = 近黑 */
  --m-primary-text: var(--m-ink-12);     /* 链接、ghost、开关、选中环随之中性 */
  --m-fg-link: var(--m-ink-12);
}
.theme-dark .stage-storefront {
  --m-primary: var(--m-ink-2);           /* 深色主题：近白 CTA */
  --m-primary-fg: var(--m-ink-12);
}
```

正文 16px（text-lg）、CTA 高 52px（`--m-btn-h-cta`）、区块 expressive 动效解锁（450–600ms）。**移动端表单控件统一 44px 高 / 16px 字号**（tokens.css 移动端块；低于 16px 会触发 iOS 聚焦缩放）。

**为什么前台主按钮是近黑而不是品牌绿**：商品图是彩色的，品牌色实底按钮与商品争抢视觉焦点；近黑 CTA 让商品当主角，是欧美 DTC 的成熟范式（Everlane / Aritzia / SSENSE / Shopify Dawn 默认主题）。品牌色退守"品牌时刻"：logo、宣告条、营销区块、强调徽章。后台不受影响（`--m-primary` 仍指向品牌绿）——组件 API 完全相同，只有舞台 token 层不同。

## 七、安全区与吸底容器

iOS 的刘海与小白条会把贴边元素压住，因此四个 token 与四条吸底容器是绑定的契约：

`--m-safe-top` / `--m-safe-right` / `--m-safe-bottom` / `--m-safe-left` = `env(safe-area-inset-*, 0px)`。

| 吸底/贴边容器 | 必须让开的轴 |
|---|---|
| `.sf-sticky-atc__inner`（PDP 粘性加购条） | 底 + 左右 |
| `.sf-mobilenav__head` / `__body`（全屏移动导航） | 顶 + 底 + 左右 |
| `.m-drawer__footer`（购物车抽屉底栏） | 底 |
| `.m-toast-stack`（Toast 栈） | 底 |

写法固定为 `padding-block-end: calc(基准内边距 + var(--m-safe-bottom))`，不得裸写 `env()`（否则宿主未声明 cover 时得到未定义而非 0）。

**两条不可拆的契约**（`conformance.test.mjs` 机器锁定）：

1. `env(safe-area-inset-*)` 只有在宿主声明 `<meta name="viewport" content="… viewport-fit=cover">` 时才非 0——**渲染上表任一容器的页面必须声明 `cover`**。
2. 反之，**声明了 `cover` 的页面必须至少消费一个 `--m-safe-*` token**：只扩视口不让位，等于把正文推进小白条里。所以 `cover` 只加在真正有吸底件的页面上（当前：`05-form`、`08-home`、`09-plp`、`10-pdp`、`design-system`），不做全量铺开。

**为什么左右用 `padding-left/right` 而不是逻辑属性**：安全区是物理量，缺口在设备的物理左侧，不随 RTL 镜像。用 `padding-inline-start` 会在 RTL 下把左缺口内边距加到右侧。这四处因此是 R15 的行级例外，理由标记 `meridian-allow: safe-area-inset-is-physical` 留在声明行上。
