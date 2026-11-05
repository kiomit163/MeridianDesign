# 07 · 本地化（US · CA · UK · DE · FR · AU）

> 欧美不是同一个市场：税制、地址、日期、支付方式、退货法定义务全部不同。**本地化是组件属性（props），不是翻译问题。**

---

## 一、市场速查表

| 维度 | US | CA | UK | DE | FR | AU |
|---|---|---|---|---|---|---|
| 日期 | MM/DD/YYYY | EN: MM/DD/YYYY · FR: DD/MM/YYYY | DD/MM/YYYY | DD.MM.YYYY | DD/MM/YYYY | DD/MM/YYYY |
| 货币格式 | $1,299.00 | EN: CA$1,299.00 · FR: 1 299,00 $ | £1,299.00 | 1.299,00 € | 1 299,00 € | A$1,299.00 |
| 税显示 | 结账时另计 | 结账时另计（省税） | **含 VAT** | **含 MwSt.** | **含 TVA** | **含 GST** |
| 税注 | "Taxes calculated at checkout" | 同左 | "Incl. VAT" | "Inkl. MwSt." | "TVA incluse" | "Incl. GST" |
| 地址：州/省字段 | ✅ state | ✅ province | ❌ 无 | ❌ 无 | ❌ 无 | ✅ state |
| 邮编 | 5 位 ZIP | A1A 1A1 | 英式 postcode | PLZ (5 位) | 5 位 | 4 位 |
| 单位 | 英制（in/lb） | 混合 | 公制 | 公制 | 公制 | 公制 |
| 主流支付方式 | Cards/Wallets/PayPal/Klarna | Cards/PayPal | PayPal/Clearpay/Klarna | **PayPal/发票/Klarna**（卡占比低） | Cards/PayPal | Cards/PayPal/Afterpay |
| 法定特殊项 | Prop 65（CA） | 双语（EN/FR 法定） | 14 天撤回 | **Impressum**（两跳内可达）+ Widerruf | 14 天撤回 | — |

> **CA 是双语市场，不是单一格式市场**：日期、货币、税注随 **locale** 切换，不能只按 `market=CA` 决定。`Price` / `DatePicker` 必须同时接收 `market + locale`，并分别快照 EN-CA 与 FR-CA。

> **首发市场边界**：本表覆盖 US/CA/UK/DE/FR/AU 六个市场；NL/BE/IT/ES 沿用同一 `market + locale` 模型扩展（支付矩阵已列出 NL/BE 的 iDEAL/Bancontact，但地址与税则需先补表再上线）。

## 二、组件级本地化属性

| 组件 | 本地化 props |
|---|---|
| `Price` | `market` + `locale`（共同决定货币/千分位/符号位置/税注）、`compareAt`（Omnibus 由后端注入）、`perUnit`（DE/FR/IT） |
| `AddressForm` | 按 country schema 渲染字段（docs/07 §三），`autocomplete` 全覆盖 |
| `DatePicker` | 永远 locale 格式化；输入框旁显示解析预览（"Wed, Sep 17"） |
| `PaymentMethods` | `market` → 方法排序（storefront/12-storefront-cart-checkout.md §五），顺序本地化不全局化 |
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

自检法：`npm run l10n` 会把真实阿拉伯语与德语长词灌进导航/按钮/表头/卡片头/页脚，在 320px 与 375px 下实测：允许换行（`.m-btn` 用 `min-height` 兜底），**不允许溢出视口或截断控件文字**。`text-overflow: ellipsis` 仅限表格单元格与商品标题（≤2 行 clamp）。

## 五、尺码与单位

- 服饰鞋类提供 **SizeConverter** 组件：US/UK/EU 三列对照 + cm 对照，模态呈现（Baymard：尺码疑虑是服饰退货主因）。
- 尺寸/重量/容量单位随市场（US 英制，其余公制）——数据存公制，展示层转换。
- 温度、汇率等不做展示转换（无必要不引入）。

## 六、翻译工作流约束

1. UI 字符串全部走 i18n key，**组件代码零硬编码文案**（含 aria-label）。
2. 文案规则（docs/08-copywriting.md §一）适用于所有语言：句首大写、动词开头 CTA；德语名词全大写规则由翻译侧处理。
3. 灌稿后必须过三关：德语膨胀关（docs/07 §四）、RTL 关、日期/金额快照关。**RTL 现状**：`meridian-ui.css` 组件层与 `site.css / admin.css` 组合层的关键方向已改用逻辑属性（margin/padding/inline-start/end、抽屉/开关/进度/表头/导航下划线、tooltip 居中、角标定位）；原型正文仍为 LTR 中文稿，但运行时已实测三件事——`npm run a11y` 的 `[rtl]` 检查强制 `dir="rtl"` 后的镜像与溢出；`npm run i18n` 校验真实语言包的 key/ICU/复数/长度/术语；`npm run l10n` 把 `i18n/ar.json`、`i18n/de.json` 与伪本地化 en-XA 灌进 UI 骨架，检查连写、字距与 320/375px 溢出。三条均须全绿才能发版。进入 RTL 市场前仍需过迁移清单：残留物理圆角、图标方向性镜像、货币与日期格式。

## 七、TMS 流程与发布前核对（全量流程）

**权威链路**：`i18n/en.json`（源）→ TMS（Crowdin，配置见 `i18n/crowdin.yml`）→ `i18n/<locale>.json` → `npm run i18n` → `npm run l10n` → 人工签核。

| 关卡 | 执行者 | 判定 | 记录 |
|---|---|---|---|
| 源文案 | 产品/文案 | key 化、无拼接、ICU 占位符完整 | PR |
| 机器预检 | CI | `npm run i18n`：key 对齐、占位符/复数类别、长度预算（de 1.35× / ar 1.4×）、禁用片段、不译术语 | CI 日志 |
| 翻译 | 译者（TMS） | 术语表命中、翻译记忆复用、不允许改动占位符 | TMS 版本 |
| 复核 | 二语审校 | 双人复核；结账/法务类抽样回译 | TMS 审批记录 |
| 排版 | CI | `npm run l10n`：真实语言包 + en-XA 在 320/375px 不溢出、不截断 | CI 日志 |
| 发布前人工 | QA | NVDA/VoiceOver 冒烟 8–12 条关键串（价格/促销/错误/合计）；记录版本与听感问题 | 下表 |

**发布前读屏核对记录（每版本每语言一行）**

| 版本 | 语言 | AT / 浏览器 | 关键串 | 结果 | 核对人 | 日期 |
|---|---|---|---|---|---|---|
| 1.4.0 | en | NVDA 2025.x / Chrome | 价格、加入购物车、错误、合计 | 待填 | — | — |
| 1.4.0 | ar | VoiceOver / Safari | 同上 + RTL 连写 | 待填 | — | — |

**为什么语音不能进 CI**：语音由 AT 与操作系统合成，受语音包、标点停顿、厂商策略影响；同一 AX 树在 NVDA/JAWS/VoiceOver 上的输出并不一致。可自动化的边界是 AX 树（`npm run ax`）与语义/焦点顺序（`npm run behavior`），语音层保留受控人工核对并留档。
