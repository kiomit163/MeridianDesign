# 13 · 前台：信任与转化系统

> 欧美消费者的默认姿态是怀疑（欺诈防范意识强）。信任不是口号横幅，是**在疑虑出现的瞬间给出证据**。

---

## 一、信任素材库（全部绑定真实数据）

| 素材 | 规格 | 出现位置 |
|---|---|---|
| 安全支付 | 🔒 "Secure checkout" + 支付图标行 | 结算入口旁、抽屉底部、footer |
| 退换保障 | "Free 30-day returns"（写明承担方与流程） | PDP 信任条、footer、退货政策页 |
| 免运费 | 门槛值 + 进度反馈 | 全站条、抽屉、结算 |
| 评价 | 真实评分人数（FTC：不可虚构） | PDP 标题下、商品卡、首页墙 |
| 媒体/认证背书 | 仅真实可查（Forbes 引用、认证 logo） | 首页信任区 |
| 实体存在 | 地址/客服时效（"Replies within 24h"） | footer、联系页 |

**禁令**：虚构徽章（"SSL Secured" 大金章等过时样式）、无来源统计（"10,000+ happy customers" 无截图/链接）、自动播放的信任轮播。

## 二、免运费进度条（最强单一杠杆）

- 公式：`剩余 = 门槛 − 小计`；文案两态：
  - 未达：`You're $12.00 away from free shipping` + 进度条（primary，宽度=小计/门槛）
  - 已达：`✓ You've unlocked free shipping`（success）
- 位置：抽屉顶（首屏可见）、购物车页、结算首步。
- 语义：`role="progressbar"` + `aria-valuenow`（已达成金额）/ `aria-valuemin`（0）/ `aria-valuemax`（门槛）/ `aria-valuetext`（“$12.00 away from free shipping”）；进度宽度不得是唯一信息（文案已含金额）。
- 门槛为空（全场免邮）：不渲染组件，信任条改写 "Free shipping on every order"。

## 三、评价系统（Ratings & Reviews）

```
PDP 评论区:
┌ ★★★★☆ 4.8 · 312 reviews ──────────────────────┐
│ [.Size 分布条形图]  [照片 (24)] [筛选: ★4 ★3 带图] │
│ ┌────────────────────────────────────────────┐ │
│ │ Jane D. · Verified buyer · ★★★★★  Sep 2     │ │
│ │ "Fits true to size, quality exceeded..."    │ │
│ │ [图1][图2][图3]                             │ │
│ │ ⚠ Received a free product   ← FTC 披露徽章   │ │
│ │ 👍 Helpful (12)   商家回复卡(bg-inset)        │ │
│ └────────────────────────────────────────────┘ │
│ [Write a review]  [Load more (20/312)]          │
└─────────────────────────────────────────────────┘
```

| 规则 | 说明 |
|---|---|
| 差评**不隐藏、不排序沉底** | 默认混合排序（Most helpful）；压制差评 = FTC 违规 |
| 激励披露 | 免费换评价必须常显徽章；insider/员工评价披露 |
| Verified buyer | 订单号后端验证后标记，不可手工打标 |
| 照片评价 | 1:1 缩略 ≤4 横排，灯箱浏览 |
| 商家回复 | bg-inset 卡片，"Response from Meridian" 前缀 |
| 追评 | "Update after 2 months" 结构支持（耐用品信任） |

## 四、紧迫感的伦理边界（组件级强制）

| 组件 | 允许 | 禁止 |
|---|---|---|
| 库存提示 | `Only 3 left`（verified inventory） | 无数据凭空生成；<阈值才显示（默认 ≤10） |
| 促销倒计时 | 真实截止时间的促销倒计时 | 常驻"限时"重置倒计时；首次访问假倒计时 |
| 价格锚定 | 30 天最低价（Omnibus 校验通过） | 临时提价再划线 |
| 社会证明 | 真实销量区间（"500+ sold this month"） | 虚构实时购买 Toast（"Anna from Berlin just bought…"） |

组件接口强制：Urgency 组件无 `verified` 数据源时**渲染为空**——系统结构上杜绝假紧迫感。倒计时元素用 `role="timer"` + `aria-live="off"`（见 docs/06-accessibility-compliance.md §2.3），剩余时间同时以文本呈现。

## 五、邮件捕获与订阅

| 模式 | 规格 |
|---|---|
| 弹窗 | 首次访问触发延迟 ≥30s 或滚动 50% 后；同会话不再弹；有价值交换（10% off 首单）；合规小字 + 不预勾选 |
| 内嵌 | footer + 首页底部常驻表单 |
| 确认 | double opt-in（CA 市场默认做法；CASL 要求可证明的明示同意）；欢迎邮件内含优惠码 |
| 退订 | 一步退订，页脚常驻 |

## 六、找回信任的失败时刻

| 场景 | 规格 |
|---|---|
| 支付失败 | 不指责文案（"Your bank declined this payment"）+ 三选一（重试/换卡/联系银行）+ 已填信息保留 |
| 库存不足中途 | "1 item just sold out. Your cart has been updated." + 替代推荐 |
| 价格变动恢复 | 见 12 章第七节 |
| 售后 | 确认页 + 邮件 + 账户三处同一订单状态；退换入口 ≤2 跳可达 |

## 七、转化检查单（PDP/Checkout 上线前过一遍）

- [ ] 三秒内可答：这是什么 / 多少钱 / 能退吗 / 什么时候到
- [ ] 加购到结算 ≤3 步，guest 默认
- [ ] 全部价格含税模式正确（按市场）
- [ ] BNPL 消息在价旁
- [ ] 移动端粘性加购条工作
- [ ] 钱包按钮出现且顺序正确
- [ ] 所有紧迫感元素数据源 verified
- [ ] 评论区含差评与披露徽章
- [ ] 确认页含撤回按钮（EU/UK）
