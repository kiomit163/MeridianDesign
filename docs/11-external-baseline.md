# 11 · 外部基线（External Baseline）

> 这份规范的前六轮审计一直在回答"我们自己是否自洽"，从未回答"我们与外部世界是否同步"。`AUDIT-1.4.0.md` 的 30 条发现里有 26 条落在这个盲区：外部趋势对标、真实浏览器像素、转化数据、性能实测、多品牌主题化。本表是根因 D 的方法论补丁——**没有登记在本表里的"趋势判断"，不构成修改规范的理由。**

---

## 一、维护规则

1. 每行必须写清 **对标对象 + 对标日期 + 结论 + 落点**。结论只有三种：**采用**（写入契约或 token）、**观察**（进入决策记录，不改契约）、**拒绝**（附理由，防止下一轮重复讨论）。
2. **对标日期**是最后一次实际打开官方来源、确认结论仍然成立的日期，不是来源的发布日期，也不是"我记得是这样"的日期。
3. 表尾的**最后核对日期**登记在 `docs/00`，是唯一事实源；超过 **90 天**由 `ai/selfcheck/external-baseline.test.mjs` 报红。每批发版前先核对本表，再动 token。
4. 对标不是投票：多数外部产品这么做，不等于本仓要这么做。结论必须落到本仓的 token、规则或门禁之一；落不下来的，写成 `docs/00` 的 O 决策，而不是悄悄改规范。
5. 外部产品只作为**上限与边界**的参照，不作为像素级模仿对象。任何"对标某主题"的选择必须按 `docs/10` 的立场声明，并承担"不可辨识"的后果。

---

## 二、基线表

| 对标对象 | 对标日期 | 结论 | 落点 |
|---|---|---|---|
| **B01 Shopify Online Store 2.0 / Horizon**：`color_scheme` 输入由 `color_scheme_group` 产出，字体走 `font_picker`；Horizon 以嵌套主题块组织页面 | 2026-11-05 | **采用其分层模型，拒绝任意覆盖**。商家只应选择"预定义色彩方案组 × 字体配对"，不直接暴露任意 `--m-*`。色彩方案组在生成时已满足对比与阶位契约，运行时只做整组替换 | O1 裁定；Brand Kit 覆盖层；`docs/02` 主题策略 |
| **B02 Apple HIG · Liquid Glass 材质**：半透明材质随背景取色，标准控件自动采用 | 2026-11-05 | **拒绝默认玻璃化，允许受控的一层**。仅在导航与浮层允许一层半透明材质，必须提供不透明回退与 `prefers-reduced-transparency` 分支。商品色是电商的第一事实，玻璃会随背景改变商品观感 | `docs/04` Elevation；前台浮层；O2 深色契约 |
| **B03 M3 Expressive · 形状档位与表达性字阶**：新增形状库、形状变形与角半径档位；弹簧物理动效；Emphasized 字阶 | 2026-11-05 | **部分采用**。圆角档位语义化（小/中/大/全圆）；表达性字阶只允许前台 hero 一档，后台保持 productive；弹簧动效只用于抽屉与浮层，且仍受 `prefers-reduced-motion` 约束 | `docs/03` 字阶；`docs/04` 圆角；`docs/05` 动效 |
| **B04 web.dev Baseline · `light-dark()` 与 View Transitions**：`light-dark()` 自 2024-05 起 Baseline 新可用，但"广泛可用"在 2026-11 仍未达成；同文档视图转场自 2025-10 起 Baseline 新可用 | 2026-11-05 | **采用但分级**。`light-dark()` 只作为增强，必须保留 `data-theme` + 媒体查询回退；同文档视图转场只用于列表→详情，带 reduced-motion 回退；跨文档转场不采用 | V-05 深色跟随；O2；`docs/05` 动效契约 |
| **B05 Baymard · PDP 商品页图库**：图库可发现性是购买决策瓶颈；缩略图在移动端同样必要；图序承担"能不能买"的信息结构 | 2026-11-05 | **采用为硬规则**。缩略图必须明示还有更多图；图 1 全貌 → 图 2 材质 → 图 3 使用 → 图 4 细节的序列写入美术指导；不采用无限滚动图库 | `docs/10` 影像指导；`prototypes/10-pdp.html`；后续 PDP 转化检查 |
| **B06 Chrome 发布节奏 / DevTools 特性窗口**：Chrome 153 起稳定版改为双周发布（2026-09-08），DevTools 新特性改为月度回顾 | 2026-11-05 | **采用为核对节奏**。CI 固定浏览器版本，不追 canary；每季度核对一次 Baseline 与 DevTools 能力，新特性先进入 Baseline 再进入 token；每次 MAJOR 发版前重跑本表 | `docs/00` 运行时事实；验收测试；季度复核 |
| **B07 2026-11 独立站审美水位**：暖中性色、材质触感、编辑式衬线、克制动效已成为主流表达；"光滑 SaaS 蓝"退潮 | 2026-11-05 | **观察，不写成硬契约**。作为 Batch 3 表达层的输入：允许一页一个主张、允许衬线 display、允许材质与纹理，但潮流不能变成永久的对比度豁免；所有表达仍受无障碍与性能门约束 | Batch 3；`docs/10`；品牌时刻清单 |
| **B08 CSS `oklch()` 色彩空间**：`oklch()` 自 2023-05 起 Baseline 新可用，2026-11 已属 Baseline widely available；Tailwind CSS v4（2025-01）默认色板即 OKLCH；`display-p3` 广色域需 `@media (color-gamut: p3)` 且必须与色带一起重建 | 2026-11-05 | **本版不动色带，只登记事实**。现有 HEX 色带在 sRGB 内自洽，逐值替换为 OKLCH 会改变感知亮度并击穿已校准的对比契约（`contrast.test.mjs` / `chart-cvd.test.mjs` 全部需重算）。OKLCH 与 P3 必须与 `CHANGELOG:130` 的 v2 色带重建**同批**落地——HEX 值 + `color-gamut: p3` 只是伪广色域（浏览器仍按 sRGB 渲染） | v2.0 色带重建（5.3）；`docs/02 §二`；O3 |

---

## 三、故意不覆盖的对标面（诚实边界）

以下三项不在本表内，因为它们不是"读官方文档"能解决的，留给对应批次：

- **真实转化数据**：没有真实店铺、没有 A/B 分流，任何"转化率提升"的断言都只能是引用外部研究，不得写成本仓结论。留给 Batch 5 的指标登记。
- **多品牌主题化**：在 O1 裁定之前，无法对标"商家自定义到什么程度"；B01 只给出分层模型，不给数值边界。
- **AI 影像来源与披露**：属于 Batch 4 的结构层问题，不是趋势对标；本表只约束"影像序列与可发现性"。

---

## 四、复核入口

核对时直接打开以下官方来源，不依赖二手转述：

- Shopify 主题输入设置（`color_scheme` / `color_scheme_group` / `font_picker`）：<https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings>
- Apple Liquid Glass 技术总览：<https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass>
- Material 3 形状与角半径档位：<https://m3.material.io/styles/shape/overview-principles>
- `light-dark()` 的 Baseline 状态：<https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark>
- 同文档视图转场进入 Baseline：<https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available>
- Baymard 图库缩略图可发现性研究：<https://baymard.com/research-articles/truncating-product-gallery-thumbnails>
- Chrome 版本与 DevTools 月度回顾：<https://developer.chrome.com/release-notes>、<https://developer.chrome.com/blog/new-in-devtools-october-2026>

> 表中的"最后核对日期"见 `docs/00`。本文件不重复登记日期——两处日期必然漂移，漂移后测试只会保护错的那一份。
