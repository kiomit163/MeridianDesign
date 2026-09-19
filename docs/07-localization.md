# 07 · 本地化（US · CA · UK · DE · FR · AU）

> 欧美不是同一个市场：税制、地址、日期、支付方式、退货法定义务全部不同。**本地化是组件属性（props），不是翻译问题。**

---

## 一、市场速查表

| 维度 | US | CA | UK | DE | FR | AU |
|---|---|---|---|---|---|---|
| 日期 | MM/DD/YYYY | DD/MM/YYYY | DD/MM/YYYY | DD.MM.YYYY | DD/MM/YYYY | DD/MM/YYYY |
| 货币格式 | $1,299.00 | CA$1,299.00 | £1,299.00 | 1.299,00 € | 1 299,00 € | A$1,299.00 |
| 税显示 | 结账时另计 | 结账时另计（省税） | **含 VAT** | **含 MwSt.** | **含 TVA** | **含 GST** |
| 税注 | "Taxes calculated at checkout" | 同左 | "Incl. VAT" | "Inkl. MwSt." | "TVA incluse" | "Incl. GST" |
| 地址：州/省字段 | ✅ state | ✅ province | ❌ 无 | ❌ 无 | ❌ 无 | ✅ state |
| 邮编 | 5 位 ZIP | A1A 1A1 | 英式 postcode | PLZ (5 位) | 5 位 | 4 位 |
| 单位 | 英制（in/lb） | 混合 | 公制 | 公制 | 公制 | 公制 |
| 置信支付方式 | Cards/Wallets/PayPal/Klarna | Cards/PayPal | PayPal/Clearpay/Klarna | **PayPal/发票/Klarna**（卡占比低） | Cards/PayPal | Cards/PayPal/Afterpay |
| 法定特殊项 | Prop 65（CA） | 双语（EN/FR 法定） | 14 天撤回 | **Impressum**（两跳内可达）+ Widerruf | 14 天撤回 | — |

## 二、组件级本地化属性

| 组件 | 本地化 props |
|---|---|
| `Price` | `market`（决定货币/千分位/符号位置/税注）、`compareAt`（Omnibus 由后端注入）、`perUnit`（DE/FR/IT） |
| `AddressForm` | 按 country schema 渲染字段（第二节的字段矩阵），`autocomplete` 全覆盖 |
| `DatePicker` | 永远 locale 格式化；输入框旁显示解析预览（"Wed, Sep 17"） |
| `PaymentMethods` | `market` → 方法排序（第三节），顺序本地化不全局化 |
| `WithdrawalButton` | EU/UK 市场渲染（一键撤回，2026-06-19 新规），非 EU 市场不渲染 |
| `LegalFooter` | DE 注入 Impressum 链接；CA 双语切换；所有市场含退订/条款/隐私 |

## 三、地址字段矩阵（不再有"全球统一地址表单"）

```
US: firstName lastName | address1 address2 | city state(_select_) zip5 | phone
CA: + province(_select_) postalCode(A1A 1A1)
UK: address1 address2 | city | county(可选) | postcode
DE: address1 | PLZ Ort  ← 州字段不存在，加了就是错的
FR: address1 address2 | codePostal Ville（注意 FR 地址顺序：街名在邮编前）
AU: address1 suburb state(_select_) postcode(4)
```

规则：字段标签不用 "ZIP"（对非美市场用 "Postal code"）；电话必填与否按市场配置（DE 多数场景可不填）；姓名允许连字符/重音/长名——**校验规则只拦空白**，其余全部放行（web.dev 原则）。

## 四、文本膨胀预算

| 语言 | 相对英文 | 布局约束 |
|---|---|---|
| 德语 | **+35%** | 按钮/徽章禁止定宽；导航项预留扩展；标题允许换行到 2 行 |
| 法语 | +20% | 同上 |
| 荷兰语（NL 市场） | +10% | 同上 |

自检法：德语字符串灌入 + 320px 视口 = 无截断、无溢出、按钮不换行破相（换行允许，破相不允许）。`text-overflow: ellipsis` 仅限表格单元格与商品标题（≤2 行 clamp）。

## 五、尺码与单位

- 服饰鞋类提供 **SizeConverter** 组件：US/UK/EU 三列对照 + cm 对照，模态呈现（Baymard：尺码疑虑是服饰退货主因）。
- 尺寸/重量/容量单位随市场（US 英制，其余公制）——数据存公制，展示层转换。
- 温度、汇率等不做展示转换（无必要不引入）。

## 六、翻译工作流约束

1. UI 字符串全部走 i18n key，**组件代码零硬编码文案**（含 aria-label）。
2. 文案规则（09 章）适用于所有语言：句首大写、动词开头 CTA；德语名词全大写规则由翻译侧处理。
3. 灌稿后必须过三关：德语膨胀关（第四节）、RTL 关（当前市场无 RTL，但布局用逻辑属性 `margin-inline` 保证未来安全）、日期/金额快照关。
