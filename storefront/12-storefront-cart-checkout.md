# 12 · 前台：购物车与结算

> 弃单率 ~70%（Baymard）。三大杀手：**后期才见的费用、强制注册、复杂流程**——本章规格逐条反制。结算页是全站唯一允许"去装饰化"的页面（无导航干扰、无营销打扰）。

---

## 一、购物车抽屉（默认加购反馈面）

```
┌ Cart (drawer, 420px, z-drawer) ──────┐
│ Your cart (3)                  [×]   │
│ ▓ Free shipping progress ─────────   │
│   $12 away from free shipping        │ ← 进度条 primary；达成后变 success "You've unlocked free shipping"
│ ┌─────────────────────────────────┐  │
│ │ 图72px │ 名称(2行clamp)  $68.00  │  │
│ │        │ Walnut / Medium   ×24  │  │ ← 行内移除 24px+热区44
│ │        │ [− 1 +]                │  │
│ └─────────────────────────────────┘  │
│ 推荐位（可选, ≤2 件, "Pairs well with"）│ ← 禁止预勾选、禁止自动加购
├──────────────────────────────────────┤
│ Subtotal              $204.00        │
│ Incl. VAT (UK/EU) / Tax at checkout  │
│ [Checkout]  (primary, 52px, 全宽)     │
│ 🔒 Secure checkout · Free returns    │ ← 信任行
│ 或 View cart（次链接）                 │
└──────────────────────────────────────┘
```

规则：加购后立即打开（乐观更新）；抽屉内改数量/移除即时生效；关闭=回 PDP 滚动位置。购物车页（`/cart`）保留用于完整审阅（Baymard：抽屉编辑体验受限），入口在 header 图标与抽屉底部。

## 二、Express 结算（置顶原则）

钱包按钮（Shop Pay / Apple Pay / Google Pay / PayPal）出现在**两个位置**：PDP 加购区上方 + Checkout 第一步顶部独立区块 "Express checkout"（分隔线 "or" 连接常规通道）。钱包不可用时整块隐藏，不留空壳。

## 三、Checkout 流程（Accordion 三步式，推荐）

```
┌ 精简头部: Logo | 🔒 Secure checkout | 步骤指示器 ────┐
│ Express checkout（首屏顶部区块）                     │
│ ─ or continue below ─                              │
│ ▼ 1 · Contact    ✅ 已完成→可折叠展开                │
│     guest-first: "Continue as guest" 默认主路        │
│     （"Save my info for faster checkout" 勾选=事后建户）│
│ ▼ 2 · Shipping   当前步展开                          │
│ ▶ 3 · Payment    锁定态                             │
│ ┌ Order summary（桌面右栏 sticky / 移动顶部折叠条）──┐ │
│ │ 行项目缩略图+名称+价 · Subtotal · Shipping · Tax  │ │
│ │ · Total(全流程同一数字) · 优惠码入口                │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

| 规则 | 规格 |
|---|---|
| **已完成步骤必须可折叠展开回看**（Baymard：手风琴最大错误是完成后锁死） | 点击已完成步标题 → 展开编辑 → 保存后重算费用 |
| 费用透明 | Shipping 费用与 Tax 在**各自步骤完成后立现**；Total 从第一步起显示且永不后期跳涨（反 drip pricing） |
| 地址 | autocomplete 建议 ≤10 条、**用户确认后**才填入；国家切换即时重排字段（docs/07 §三）；账单=收货默认复用（3.3.7 冗余录入） |
| 卡表单 | 字段顺序=物理卡：Number→Expiry→CVC；`autocomplete="cc-number/cc-exp/cc-csc"`；数字键盘 `inputmode`；卡组织图标随输入切换 |
| 优惠码 | 折叠入口（"Have a code?"），失败显示原因不抖动；**不做成首屏大输入框**（诱导离站找码） |
| 按钮 | 每步一个主按钮（"Continue to shipping" → "Pay now"）；支付按钮加载态锁全表单 |
| 联系方式 | 邮箱错误就地报；手机号仅市场需要时出现 |

## 四、SCA / 3DS2（欧盟 PSD2）专用状态

银行验证是**正常流程不是错误**：

| 状态 | UI |
|---|---|
| Frictionless（风控通过） | 无感，不渲染任何 3DS UI |
| Challenge（弹窗式） | 模态内嵌 iframe（max-w 400px），标题 "Verify with your bank"；超时倒计时 + "Didn't get the code? Resend" |
| App 切换（银行 app） | "Complete the verification in your banking app, then return here" + 返回后自动轮询 |
| 失败 | 明确原因（"Verification timed out"）+ Retry + 换卡路径；**已填信息全保留** |

## 五、支付方式矩阵（本地化排序）

| 市场 | 展示顺序 |
|---|---|
| US/CA | Cards · Shop Pay/Apple Pay/Google Pay · PayPal · Klarna/Afterpay |
| UK | Cards · PayPal · Clearpay · Klarna |
| **DE** | **PayPal** · Cards · Klarna（4 期）· Invoice（SEPA 后端） |
| FR | Cards · PayPal · Klarna · Paylib |
| AU | Cards · PayPal · Afterpay |
| NL/BE | iDEAL / Bancontact 置顶（本地主流） |

规则：方法按市场转化率排序；每项=单选行（图标+名+"You'll be redirected to PayPal to complete." 副句）；禁隐藏可用方法。

## 六、确认页（Conversion 完成态）

```
✓ Order #1042 confirmed (success 大图标 + 650 标题)
"Confirmation sent to jane@example.com"（真实邮箱回显）
What happens next: 3 步时间线（Confirmed → Packed → Shipped）
[Track order] [Create account（一键带出，可选）] [Continue shopping]
EU/UK: WithdrawalButton "Request withdrawal · 14 days"（2026-06 法定一键撤回）
配送明细卡（地址/方法/明细）→ 错误在此修正入口
```

## 七、弃单挽回组件

| 触点 | 规格 |
|---|---|
| 结算中途离开 | 无弹窗拦截（禁止 exit-intent 弹层在结算页） |
| 邮件挽回 | 恢复链接直达**填充完毕的 checkout**，非空白购物车页 |
| 价格/库存变化 | 恢复时明确列出变化项（"1 item price changed"）重新确认 |
