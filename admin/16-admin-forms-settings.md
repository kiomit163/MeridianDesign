# 16 · 后台：表单与设置

---

## 一、表单布局

```
┌ Card: Product details ────────────────┐
│  Product title *                      │ ← Label: 顶部、550、含必填标记
│  ┌──────────────────────────────────┐ │
│  │ Merino wool crew sweater         │ │ ← h-36 输入框, bg-surface, border-strong
│  └──────────────────────────────────┘ │
│  Appears in your online store and in  │ ← Help text: xs, fg-muted
│  search engines.                      │
│                                       │
│  Description                          │ ← 可选字段不标 *
│  ┌──────────────────────────────────┐ │
│  │ Rich text…                       │ │
│  └──────────────────────────────────┘ │
└───────────────────────────────────────┘
[动作条:  右对齐  Cancel(plain)  Save(primary)]
```

| 规则 | 规格 |
|---|---|
| Label | 顶部对齐（比行内 label 快 2 倍，Baymard/NNG 共识）；必填策略：**标可选不标必填**（表单大多必填时，只给可选项注 "Optional"） |
| 字段宽 | 按内容定长：邮编 120px / 电话 200px / 标题全宽——宽度即暗示格式 |
| 分组 | 相关字段进同一 Card；Card 标题 14/20 650；组间 16px |
| Help text | 永久显示（不放 tooltip 里藏）；≤2 行 |
| 双列 | 仅短字段对（First/Last name、City/ZIP）；错误信息需同行空间 |
| 动作条 | 表单末右对齐；或长表单用顶部 Save Bar（14 章）双保险 |

## 二、校验时机（两阶段）

```
首次提交前: 不打扰（输入中不报错，防"未完成即报错"）
首次提交后: 字段失焦即校验（on blur） + 修正立即清除
提交失败:   ① 错误摘要 Banner（critical）："Fix 3 errors to continue."
           ② 焦点移到第一个错误字段
           ③ 每字段: border-critical + ⚠ 图标 + 下方修法文案（08 章模板）
```

实时校验仅限强规则（卡号 Luhn、邮箱格式）且**只在用户停止输入 500ms 后**。

## 三、控件选用表（封闭映射）

| 数据 | 控件 | 禁止 |
|---|---|---|
| ≤5 个互斥选项 | Radio | Select（藏选项） |
| >5 个互斥选项 | Select / Combobox（可搜） | — |
| 开关型 | Switch（即时生效）或 Checkbox（需提交）——语义区分：Switch=立即，Checkbox=随表单 | Switch 放进需保存的表单 |
| 多选 ≤7 | Checkbox 组 | 多选 Select |
| 多选 >7 或需搜索 | Combobox 多值（token 化） | — |
| 日期 | DatePicker + locale 预览 | 自由文本 |
| 数字+单位 | Stepper（数量）/ 输入框+后缀（"$ USD"） | 纯数字无单位 |
| 富文本 | 简化工具栏（≤8 按钮） | Word 级工具栏 |

## 四、保存模式决策表

| 页面类型 | 模式 | 理由 |
|---|---|---|
| 资源编辑（商品/订单备注） | Save Bar + ⌘S | 变更集大，需要明确提交点 |
| 设置开关 | **Autosave**（Switch 翻转即存）+ "Saved" 微提示 | 单点变更，提交仪式是负担 |
| 文本密集设置 | Save Bar | 防误触丢失 |
| 危险设置（税率/支付） | Save Bar + 保存时二次确认模态 | 代价不对称 |

Autosave 失败必须可见：字段旁 warning badge "Not saved · Retry"——静默失败禁止。

## 五、破坏性操作确认矩阵

| 操作 | 确认强度 |
|---|---|
| 单项删除（可撤销） | 无模态：执行 + Toast "Product deleted · [Undo]"（10s） |
| 单项删除（不可撤销） | 模态：对象名回显 + [Cancel] [Delete]（critical 按钮，**不是**主动作位） |
| 批量删除 N 项 | 模态 + **输入数量确认**（"Type 24 to confirm"） |
| 停用/下架 | 模态说明后果（"Storefront link will 404"）+ 影响 N 列表 |
| 退款 | 模态：金额回显 + 原因选择 + 客户可见说明预览 |

规则：确认模态的主动作**永远不是**危险动作本身（危险动作用 critical 实底但排右侧）；标题说明后果不问句（"Delete 3 products?" ✅ —— 问句可，标题必须含对象与数量）。

## 六、设置页模式

```
┌ 锚点导航(≥1280 左栏) │ 内容(640px) ────────────┐
│ General            │ Card: Store details       │
│ Payments           │   字段…                   │
│ Shipping           │   Last updated Sep 12 by HK│ ← 审计信息
│ Taxes              │   [Restore default]        │
└────────────────────┴───────────────────────────┘
```

- 每张设置卡显示**最后修改人/时间**（多人运营信任基础）。
- 设置变更即时的显示生效范围（"Applies to all markets"）。
- 只读但重要的信息（API key）：单行 mono + 复制按钮（点击 Toast "Copied"）+ 显示/隐藏。
- 法定不可关闭项（EU 退换政策字段）锁定并解释原因。

## 七、货币与本地化输入

金额输入：接受本地格式输入（1.299,00 / 1,299.00），失焦即格式化为市场格式并右对齐 + tnum；币种由市场决定不可改（显示后缀）。日期输入永远 DatePicker，禁手填歧义格式。
