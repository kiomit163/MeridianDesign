# 06 · 无障碍与合规（欧美市场入场券）

> 欧美电商的三重法律底座：**WCAG 2.2 AA**（ADA 诉讼 + 欧盟 EAA 2025-06 生效）、**GDPR**、**FTC/Omnibus 交易真实性**。本章把法律要求翻译成组件规格——合规不是文档附录，是设计系统的一部分。

---

## 一、WCAG 2.2 AA → 系统映射表

| 条款 | 要求 | Meridian 落点 |
|---|---|---|
| 1.4.3 对比度 | 文本 4.5:1 / 大字 3:1 | 02 章对比契约表，唯一允许组合 |
| 1.4.11 非文本对比 | UI 边框/图标/焦点 ≥3:1 | `border-focus`、`border-strong` 已校准 |
| 1.4.12 文本间距 | 用户调间距不破版 | 行高用倍数、容器不用固定高度 |
| 1.4.13 悬停内容 | tooltip 可悬停/可消失/可持续 | Tooltip 组件契约（components/18-component-contracts.md） |
| 1.4.10 Reflow | 320px 无横向滚动、400% 缩放可用 | 断点测试底线 |
| 2.4.7 焦点可见 | 全键盘可操作 + 焦点环 | 全局 base 焦点环，禁止移除 |
| 2.4.11 焦点不遮挡 | 焦点元素不被 sticky 头遮住 | sticky 头留 `scroll-margin-top` |
| 2.5.3 标签包含名称 | 可见标签 ⊆ accessible name | 按钮 aria-label 包含可见文字 |
| 2.5.7 拖拽替代 | 滑块/拖拽排序有按键路径 | Slider 组件双操作模式 |
| **2.5.8 目标尺寸** | ≥24×24px | 04 章触达表；swatch/步进器热区 44px |
| 3.2.6 一致帮助 | 同位置提供帮助入口 | 后台页头帮助插槽 |
| 3.3.1/3.3.3 错误识别与建议 | 指出错误 + 怎么修 | 表单错误文案模板（admin/16-admin-forms-settings.md） |
| 3.3.7 冗余录入 | 同流程不重复输入 | 结账地址 → 收货地址自动带出 |
| 3.3.8 无障碍认证 | 登录无认知测试 | 邮件验证码替代 CAPTCHA 优先 |

## 二、键盘与读屏标准

| 场景 | 契约 |
|---|---|
| Tab 顺序 | 视觉顺序 = DOM 顺序；禁止 `tabindex>0` |
| 模态/抽屉 | 开启时焦点入内 → 焦点圈禁锢 → Esc 关闭（强制步骤除外）→ 焦点归还触发元素 |
| Toast | `aria-live="polite"`（成功/中性）；危险确认 `role="alert"` |
| Banner | info/success = `role="status"`；warning/critical = `role="alert"`（Polaris 同款） |
| 表格排序 | `<th aria-sort>` + 表头按钮 |
| 徽章含义 | 颜色之外提供视觉隐藏文本（"Out of stock"） |
| 骨架屏 | 容器 `aria-busy="true"`，数据到位后解除 |
| 价格朗读 | Price 组件输出 `$29.00, on sale from $49.00`（.sale 不读 "dash"） |

## 三、GDPR / Cookie 合意组件规格（欧盟/英国）

1. **先合意后脚本**：任何非必要 cookie 在合意前不得发射（含分析、像素）—— Consent 组件是系统级拦截器，不是装饰层。
2. **对等拒绝**："Reject all" 与 "Accept all" **同尺寸、同层级、同屏**（EDPB 口径）；只有 "Accept all" 高亮的 = 违规。
3. **颗粒度**：必要 / 分析 / 营销 三组独立开关；默认全关，无预勾选。
4. **不设 cookie wall**：拒绝后完整功能可用（付费墙模式仅限内容站）。
5. **随时改主意**：页脚常驻 "Cookie Preferences" 入口，复用同一组件。
6. 记录合意凭据（时间/版本/选择），后台可查——Admin 提供合意日志表。

## 四、欧盟 EAA（2025-06-28 生效）落地清单

- 电商全链路可访问：PLP → PDP → Cart → Checkout → 确认页 → 邮件（邮件也要语义 HTML + 对比度）。
- 客服通道可访问（表单 + 电话，不只靠聊天弹窗）。
- 发布**无障碍声明**（accessibility statement），页脚链接，写明符合标准与反馈渠道。
- 违反 EAA 罚则由成员国自定（最高可达营业额比例罚款），2026 年起各国进入执法期。

## 五、交易真实性合规 → 组件规格

| 法律 | 要求 | 组件规格 |
|---|---|---|
| **EU Omnibus 6a** | 降价宣告必须展示过去 30 天最低价（ES/IT 更严） | Price 组件的 `compareAt` 必须由后端价格历史提供，前台无手动输入；Admin 保留价格历史表 |
| DE PAngV | 含税总价 + 运费链接 + 单价（Grundpreis） | Price 组件 `perUnit` 属性；运费说明 "plus shipping" 链接在价旁 |
| **FTC 评价规则**（2024-10 生效） | 禁假评/禁以好评为条件激励/禁压制差评/利益相关须披露 | Review 组件：`incentivized` 徽章（"Received a free product"）常显；Admin 评价表禁"仅好评"筛选导出 |
| **US Prop 65**（2025 短版新规） | 化学品警告：短版须点名至少 1 种化学品 | PDP 警告组件：⚠ + 文本 + 官方链接，置于规格区（不许藏页脚） |
| CAN-SPAM / CASL | 每封营销邮件退订 + 实体地址；加拿大需 opt-in | EmailCapture 组件默认不勾选（CASL 加拿大市场强制 double opt-in）；页脚退订常驻 |
| **EU 撤回权**（2026-06-19 新规） | 在线销售须提供**一键撤回按钮/链接** | OrderConfirmation 与账户页内置 "Request withdrawal" 一键入口组件（含 14 天倒计时显示） |

## 六、暗黑模式（Dark Patterns）禁止清单

以下模式在系统层**结构上不可能实现**（组件不提供能力）+ 审计禁令：

1. **Drip pricing**：结账前出现新增强制费用 → Checkout 总价组件从第一步起展示全费用。
2. **假紧迫感**：倒计时/"仅剩 X 件"未绑定真实库存/会话数据 → Urgency 组件强制传入 `verified` 数据源，无数据不渲染。
3. **人造原价**：compare-at 不过 30 天最低价校验 → 见 Price 组件。
4. **预勾选加购/合意**：Checkbox 默认全关是硬编码行为，不可配置。
5. **Confirm-shaming**（"不，我不想省钱"）：放弃文案模板库只提供中性写法（"No thanks"）。
6. **退订障碍**：退订链接一步完成（CAN-SPAM 允许但 discouraged 额外步骤；CASL 强制一步）。
7. **差评拦截**：Review 组件不提供"仅好评展示"参数。
8. **强制注册**：Checkout 强制 guest-first（见 storefront/12-storefront-cart-checkout.md）。
