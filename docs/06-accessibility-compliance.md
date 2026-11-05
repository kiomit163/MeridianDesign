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
| 1.3.1 信息与关系 | 结构语义正确 | 原生 table/th、label/for、fieldset/legend；`data-slot` 仅作挂点 |
| 1.4.1 颜色使用 | 不以颜色为唯一信息载体 | 徽章 sr-only 文本、链接下划线、状态图标辅助 |
| 1.3.5 输入用途识别 | 表单字段声明用途（autocomplete） | 结账地址/卡号字段强制 `autocomplete`（storefront/12 §三） |
| 1.2.2 字幕 | 预录视频提供字幕 | PDP 视频组件必须带 caption 轨（v1.5 新增） |
| 1.2.3 音频描述 | 预录视频提供音频描述或等价文本 | 有讲解音轨时提供文字版；纯氛围视频 `muted` 且无信息音 |
| 1.2.5 音频描述（AA） | 同上，AA 级 | 商品视频默认无音轨，规避该条 |
| 2.2.2 暂停/停止/隐藏 | 自动播放 >5s 的动效可暂停 | 视频/倒计时/轮播必须提供暂停；骨架 shimmer 在 RM 下静态 |
| 2.3.1 闪光阈值 | 每秒 ≤3 次闪光 | 促销/倒计时动效禁止频闪 |
| 1.4.4 文本缩放 | 200% 缩放不丢内容 | 字号用 rem / token；文本容器不锁高度 |
| 1.4.5 文本图像 | 不用图片替代文本 | 商品图只承载商品信息；价格/标题/CTA 一律真实文本 |
| 2.1.1 键盘 | 全部功能可键盘完成 | 原生控件优先；自定义组件补键位（Combobox/CommandPalette） |
| 2.1.2 无键盘陷阱 | 焦点可进可出 | 模态 / 抽屉 Esc + 焦点归还；禁止无限焦点圈 |
| 2.4.1 跳过区块 | 提供跳过导航 | `.m-skip` 聚焦时显形 |
| 2.4.3 焦点顺序 | 视觉顺序 = DOM 顺序 | 禁止 `tabindex>0`；布局用逻辑属性 |
| 2.4.4 链接目的 | 链接文本可独立理解 | 禁止裸 "Learn more"；图标链接必须 aria-label |
| 2.4.6 标题与标签 | 标题层级与标签描述性 | 每页一个 H1；表单标签说明字段用途 |
| 3.1.1 页面语言 | 声明语言 | `<html lang>`；`lang` 随 locale 切换 |
| 3.2.1/3.2.2 焦点与输入 | 不意外改变上下文 | 焦点不触发跳转；输入不自动提交 |
| 3.2.3/3.2.4 一致性 | 导航与识别一致 | 共享 header/footer 与 Admin shell；同义同图标 |
| 3.3.2 标签或说明 | 输入有标签与说明 | Label 顶部 + help text；placeholder 不作唯一标签 |
| 4.1.2 名称角色值 | 可访问名称/角色/状态 | 原生语义优先；`aria-*` 只补缺失语义 |

> 本表是 WCAG 2.2 AA 在**设计系统层**的可落点，不是完整法律意见。运行时事实（焦点是否真的可见、ARIA 是否正确）由 S4 的 axe / Playwright 接管（O4）；组件层未覆盖的条款由页面走查补齐。

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

### 2.1 参考行为层（`ai/meridian-behavior.js`）

CSS 只能表达状态，不能表达焦点顺序。凡需要「开/关 + 焦点移动」的组件，必须挂到参考行为层（零依赖，可直接复制）：

| 挂载点 | 行为 | 对应契约 |
|---|---|---|
| `[data-overlay-open="id"]` + `[data-overlay-close]` | 打开时：兄弟节点 `inert`、`aria-modal="true"`、`body` 锁滚动、焦点进入首个可聚焦件；Tab/Shift+Tab 在容器内循环；Esc 关闭；关闭后浮层自身 `inert`（退出可访问树）并把焦点归还触发元素 | 2.1.1 / 2.1.2 / 2.4.3 |
| `[data-tabs]` | `tablist/tab` 语义、roving tabindex、←/→/Home/End（`dir=rtl` 时方向镜像）、`aria-selected` 同步 | 4.1.2 / 2.1.1 |
| `[data-seg]` | `group` + `aria-pressed`、roving tabindex、方向键切换 | 4.1.2 / 2.1.1 |
| `[data-combobox]` | `combobox` + `aria-expanded`/`aria-controls`/`aria-activedescendant`、↑/↓/Home/End、Enter 选中、Esc 收起、输入过滤 | 4.1.2 / 2.1.1 |
| `[data-side-rail]` | 后台侧栏图标轨：切换 `.ad-sidenav.is-rail` 并同步 `aria-pressed`；状态写 `localStorage`（键 `meridian.side-rail`），进页面即恢复（admin/14 §2.2「可手动收成 64px，状态持久化」）。折叠态的标签走裁剪（名字保留），不是 `display:none` | 4.1.2 / 2.1.1 |
| `<dialog>` 原生模态 | 由浏览器提供 top layer 与 Esc；背景不可聚焦，关闭后焦点归还 | 2.1.2 / 2.4.3 |
| `.m-skip-link` → `#main[tabindex="-1"]` | 首个 Tab 露出，Enter 把焦点送到主内容 | 2.4.1 |

**原生 dialog 的边界（明确契约）**：`showModal()` 已让文档其余部分进入 inert，AX 树里背景节点同样消失，因此 Tab 只能到达对话框内部元素；到达末尾时可能进入浏览器 chrome（地址栏等）。这是规范行为，也是 2.1.2「不得把键盘用户困在页面内」所要求的可离开性，**不是缺陷**。门禁断言的是「不落到背景页面」，不是「永不离开页面」。若要严格循环，需在行为层拦截 Tab 首尾回绕（当前不采用，避免与 2.1.2 的出口语义冲突）。

**Toast 播报**：单条 `role="status"` + `aria-atomic="true"`，不额外给容器加 `aria-live`（避免双播报）。

**窄屏横滚例外**：≤767px 时标签栏与分段控件改为内部横滚以容纳长语言；此时外环会被容器裁掉，故这两类控件改画内嵌环（`outline-offset: calc(-1 * var(--m-focus-ring-width))`），2.4.7 仍成立。该偏移由 `runtime-behavior.mjs` 在 320px 实测。

### 2.2 运行时守卫（真实浏览器，非文档声明）

| 命令 | 覆盖 | 失败条件 |
|---|---|---|
| `npm run a11y` | axe-core（WCAG 2.0/2.1/2.2 A/AA）、320px reflow、`dir=rtl` 镜像 | 任一 serious/critical 违规、横向滚动、tooltip 偏移 >1px |
| `npm run behavior` | 真实 CDP 键盘：skip link、焦点环可见、dialog/drawer/lightbox 焦点陷阱与归还、tabs/seg 方向键、combobox、toast、同列焦点顺序、标题层级 | 任一断言失败 |
| `npm run ax` | Chrome accessibility tree 快照（role / name / checked·selected·expanded / live·atomic·relevant），9 个场景：默认页、抽屉打开、原生 dialog、组合框展开、live region、4 个原型 | 任一基线漂移且未显式更新 |
| `npm run i18n` | 语言包 key 对齐、ICU 占位符、CLDR 复数类别、控件长度预算、禁用片段、不译术语 | 任一规则不符 |
| `npm run l10n` | 用 `i18n/*.json` 真实语言包 + 伪本地化 en-XA 灌稿，320/375px 检查溢出、控件截断、字距拆连写 | 任一溢出或截断 |

五条都在 CI 中执行；`npm run verify` = lint + a11y + behavior + ax + i18n + l10n。

**AX 快照说明**：读屏软件读的就是这棵树。快照冻结的是「AT 的输入」，不是「合成语音」——后者由 NVDA/VoiceOver 的语音引擎决定，无法在 CI 中逐字断言（见 docs/07 §七 的发布前人工核对）。

### 2.3 时间性内容与媒体（v1.5 新增）

自动播放、循环、倒计时都属于 WCAG 2.2.2 的管辖范围。规范只允许两种形态：

| 形态 | 规则 |
|---|---|
| PDP / 首页视频 | **默认不自动播放**；若自动播放必须 `muted` + `loop` + **可见播放/暂停按钮**，且暂停后状态可被 `aria-pressed` 读出；无音轨时也要有暂停（画面运动本身即干扰） |
| 促销倒计时 | 绑定真实截止时间；`role="timer"` + `aria-live="off"`（不要每秒播报）；倒计时结束不自动跳转、不自动加价 |
| 骨架屏 / 加载环 | RM 下静态；非 RM 下 shimmer ≤1.5s 循环且不携带信息 |
| 轮播 | 首页 hero 禁止自动轮播（storefront/09 §三）；其他轮播必须提供暂停 + 前后按钮 |

### 2.4 进度与计时的语义（v1.5 新增）

- **进度条**（免运费进度、上传进度）：`role="progressbar"` + `aria-valuenow/min/max` + `aria-valuetext`（如 “$12 away from free shipping”），视觉宽度不得是唯一信息来源。
- **倒计时**：`role="timer"`，不要放进 `aria-live` 区域；剩余时间同时以文本呈现。
- **异步任务**：容器 `aria-busy="true"`，完成后移除并播报一次结果（Toast `role="status"`）。

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
- 违反 EAA 罚则由成员国自定（最高可达营业额比例罚款）；成员国自 2025-06-28 起适用，并陆续进入执法期。

## 五、交易真实性合规 → 组件规格

| 法律 | 要求 | 组件规格 |
|---|---|---|
| **EU Omnibus 6a** | 降价宣告必须展示过去 30 天最低价（ES/IT 更严） | Price 组件的 `compareAt` 必须由后端价格历史提供，前台无手动输入；Admin 保留价格历史表 |
| DE PAngV | 含税总价 + 运费链接 + 单价（Grundpreis） | Price 组件 `perUnit` 属性；运费说明 "plus shipping" 链接在价旁 |
| **FTC 评价规则**（2024-10 生效） | 禁假评/禁以好评为条件激励/禁压制差评/利益相关须披露 | Review 组件：`incentivized` 徽章（"Received a free product"）常显；Admin 评价表禁"仅好评"筛选导出 |
| **US Prop 65**（2025 短版新规） | 化学品警告：短版须点名至少 1 种化学品 | PDP 警告组件：⚠ + 文本 + 官方链接，置于规格区（不许藏页脚） |
| CAN-SPAM / CASL | 每封营销邮件退订 + 实体地址；加拿大要求**可证明的明示同意**（CASL），系统默认采用 double opt-in | EmailCapture 组件默认不勾选（CA 市场默认 double opt-in）；页脚退订常驻 |
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

## 七、法源与复核（本表不是法律意见）

| 条目 | 法源 / 版本 | 系统落点 |
|---|---|---|
| WCAG 2.2 AA | W3C Recommendation, 2023-10-05 | §一映射表；运行时由 axe / Playwright 验证 |
| 欧盟 EAA | Directive (EU) 2019/882，成员国自 2025-06-28 适用 | 全链路可访问 + 无障碍声明 |
| GDPR | Regulation (EU) 2016/679 | §三 Consent 组件规格 |
| EU Omnibus | Directive (EU) 2019/2161, Art. 6a | Price `compareAt` 30 天最低价 |
| FTC 评价规则 | 16 CFR Part 465，2024-10-21 生效 | Review 披露 / 禁压制差评 |
| US Prop 65 | California Health & Safety Code §25249.6；短版警告 2025-01-01 起 | PDP 警告组件 |
| CAN-SPAM / CASL | 15 U.S.C. §7701 / S.C. 2010, c. 23 | 退订一步 / CA double opt-in |
| EU 撤回权 | Consumer Rights Directive 2011/83/EU（14 天） | WithdrawalButton；**"2026-06-19 一键撤回"的具体法源与适用市场须由法务复核**，组件能力与法定义务解耦，非 EU/UK 市场不渲染 |

> 法务条目随成员国转化与执法口径变化；上线前由法律顾问复核，设计系统只负责把要求落成组件行为。

### 7.1 AI 影像与 Bot 披露（v1.7 · 结构层）

> 本表只登记**生效日期、适用面与系统落点**，不代替法律意见。`法务复核` 为 `待` 的条目，其对应文案只入目录、不进出厂默认（见 `docs/08 §五`）。

| 条目 | 法源 / 版本 | 生效与适用面 | 系统落点 | 法务复核 |
|---|---|---|---|---|
| EU AI Act Art. 50 | Regulation (EU) 2024/1689, Art. 50 | **2026-08-02** 起适用；AI 交互与合成内容须以机器可读方式标记 | 影像 `data-provenance` + 可见披露；bot 首次交互披露 | 待 |
| CA SB 942（AB 853 修订） | California AI Transparency Act | **2026-08-02** 生效；适用月活 >100 万的生成式 AI 提供者；可见 manifest + 潜在元数据 | C2PA / IPTC `DigitalSourceType` 登记（平台侧消费） | 待 |
| CA SB 1050 | 2026 年签署 | **2027-01-01** 生效；视频/音频**广告**中的 AI 合成表演者；商品静帧与背景不在此列 | 视频/广告披露（启用合成表演者时） | 待 |
| NY GBL §396-b | N.Y. Gen. Bus. Law §396-b | **2026-06-09** 生效；广告中的合成表演者披露 | 视频/广告披露 | 待 |
| 市场侧素材政策 | Amazon 等平台的 AI 人物标注规则（非法律） | 无统一生效日，随平台政策 | 上架前素材登记与披露 | 待 |
| CA SB 243 | California Companion Chatbot Law | **2026-01-01** 生效；只管陪伴型聊天机器人，**明确排除客服/交易机器人** | **不构成客服 bot 披露依据** | 已（排除项） |
| CA AB 1609 | 2026-09-28 签署 | **2027-01-01** 生效；年营收 >5 亿美元的企业的客服 bot 须披露并转人工 | Bot 披露 + human handoff | 待 |

**Bot 披露的主依据是 EU AI Act Art. 50。** 在加州，客服场景的成文依据是 AB 1609（2027-01-01），不是 SB 243——后者只管陪伴型聊天机器人，且明文排除客服 bot；引用错法源会让整条条款在执法时失效。
