# 08 · 文案系统（Content Design）

> Polaris 的核心信条：**文案与像素同等地位**。每个组件自带文案规格；AI 生成 UI 时必须先过本章。

---

## 一、声音与语气

| | 前台 Storefront | 后台 Admin |
|---|---|---|
| 声音 | 亲切、自信、具体 | 中性、高效、精确 |
| 语气 | "You've got free shipping"（有温度但克制） | "Product updated"（事实陈述） |
| 感叹号 | 禁止 | 禁止 |
| 人称 | you / your | 用户产出用名词，不用"你的" |
| 缩写 | 可以（you're / don't） | 可以 |

**通用规则**：sentence case（每条 UI 文案只首词大写 + 专有名词）；CTA = 动词 + 名词（"Add to cart" / "Save changes"）；数字用阿拉伯数字（"3 items"）；日期时间永远 locale 格式化；不写 "please"（浪费空间且低效）；不写 "oops"。**唯一例外**：电商既成标准的主 CTA 可保留名词形态（`Checkout` / `Continue`），但不得新造名词型动作（如 `Submission`）。

## 二、微文案模板库（封闭枚举）

### 按钮
| 场景 | ✅ | ❌ |
|---|---|---|
| 加入购物车 | `Add to cart` | `Buy now!` / `Submit` |
| 主操作 | `Save changes` | `OK` / `Confirm` |
| 危险确认 | `Delete 3 products`（带数量） | `Yes, delete`（文案不明说对象） |
| 取消 | `Cancel` | `No, thanks` |

### 错误（3.3.3：说怎么修）
```
✗ "Invalid input"
✓ "Enter a valid email address, like name@example.com"
✓ "Card number is incomplete. Enter all 16 digits."
✓ "Payment declined by your bank. Try another card or contact your bank."
```
规则：一句话 ≤100 字符；先问题后修法；不指责（不说 "you entered"）；**永不只在顶部汇总**——错误在字段旁 + 提交时 scroll-to-first-error。

### Toast（≤3 词，名词+动词，Polaris 式）
`Product updated` · `Order refunded` · `3 items exported` · `Settings saved`
最多一个动作（`Undo` / `View order`）；常规展示 5000ms（`--m-toast-duration`），**带动作时 10000ms（`--m-toast-duration-action`）**，hover/focus 暂停计时；错误类不用 Toast（用 Banner 或 Modal）。

### Banner（页面级）
```
info:    "Fulfillment for 2 orders is paused until you update shipping rates."   [Review orders]
success: "Refund of $42.00 was issued to Visa •••• 4242."
warning: "Inventory is negative for 5 variants."                                  [Fix now]
critical:"Payments are disabled because your billing information expired."        [Update billing]  ← 不可关闭
```
规则：一句完整句说明因果 + 一个动作按钮；critical 常驻直到问题解决。

### 空状态
```
标题（名词性）: "No orders yet"
正文（一句：能做什么）: "Orders appear here once customers check out."
主 CTA: "Set up payments"     次链接: "Import orders"
```
禁止："Nothing to see here :)"、占位 Lorem、无 CTA 的空态。

### Tooltips
≤80 字符；解释"是什么/为什么"，不复述按钮文字（按钮已写 "Duplicate"，tooltip 写 "Create a copy with the same variants"）。

## 三、法律固定文案（原样使用）

| 场景 | 文案 |
|---|---|
| EU/UK 价格 | `Incl. VAT` (+) `Plus shipping calculated at checkout`（链接 shipping page） |
| US/CA 价格 | `Tax calculated at checkout` |
| 促销（Omnibus） | `Lowest price in the last 30 days: $XX.XX`（ES/IT 强制展示原语） |
| 评价披露 | `Received a free product in exchange for a review`（徽章 + tooltip 全文） |
| 退订 | `Unsubscribe`（一词，一步完成） |
| Cookie | `Accept all` / `Reject all` / `Manage preferences`（拒绝同等大小） |
| Prop 65 | `⚠ WARNING: This product can expose you to [chemical], known to the State of California to cause [harm]. For more information go to www.P65Warnings.ca.gov` |
| EU 撤回 | `14-day right of withdrawal` → WithdrawalButton: `Request withdrawal` |

## 四、AI 生成文案的附加规则

1. 生成任何 UI 前先从本章模板库取；模板没有 → 按规则写 → 记录到模板库评审。
2. 禁止营销腔混入功能 UI（"Supercharge your workflow 🚀" ❌）。
3. 表单校验文案逐字段定制，不用统一 "This field is required"。
4. 数字敏感场景（价格/库存/倒计时）文案与数据必须同源绑定，不允许静态占位上线。
5. Bot 披露的法源锚点是 EU AI Act Art. 50（首次交互）与 CA AB 1609（2027-01-01，>$5 亿营收）。**CA SB 243 只管陪伴型聊天机器人，明确排除客服 bot，不得作为客服场景的引用依据。**

## 五、AI 影像披露（结构占位 · 法务复核前不得出厂）

| 场景 | key | en | 用法 |
|---|---|---|---|
| AI 生成影像 | `pdp.aiGenerated` | `AI-generated image` | badge 专用；不得只写 "AI" |
| AI 修饰影像 | `pdp.aiRetouched` | `AI-retouched photo` | 与真实摄影同组时使用 |
| 详情入口 | `pdp.aiImageDetails` | `Image details` | caption/详情按钮；展开来源与工具 |

规则：

1. **三处同口径**：PDP、商品卡、邮件中的同一披露必须取同一 key，不得各写一套。
2. **法务复核前只入目录、不作出厂默认**：`docs/06 §7.1` 的 `法务复核` 字段是门禁，未过则不得在面向消费者的页面渲染默认文案。
3. 文案不得暗示"完全真实""纯人工"或"无修饰"；来源只允许 `docs/10 §2.4` 的四值枚举。
4. 图像披露不与促销文案合并（"AI-generated image · 20% off" ❌）——披露必须独立可读。
