# Meridian 视觉设计规范 · 独立审计报告

| 项 | 值 |
|---|---|
| 审计对象 | Meridian Design System **v1.4.0**（2026-10-24 基线） |
| 审计日期 | 2026-10-25 |
| 审计范围 | `docs/01–08`、`storefront/09–13`、`admin/14–17`、`components/18`、`ai/tokens.css`、`ai/meridian-ui.css`、`ai/site.css`、`ai/admin.css`、`ai/AGENTS.md`、`README.md`、`CHANGELOG.md` |
| 审计方式 | 文档穷读 + token↔实现↔文档三方对读 + **独立重算对比度** + 运行机器门禁 |
| 机器证据 | `npm run lint` → 校验器 **0 violations**；`node --test` → **191/191 pass**（10.3s） |
| 严重度 | P0 上线阻断 / P1 严重 / P2 中等 / P3 卫生 |
| 处置 | Fix（本轮修复）/ Deferred（排期）/ Won't fix（附理由）/ Retracted（评审纠错） |
| 修复目标版本 | **v1.5.0**（MINOR：存在视觉可见值变更，按 README 治理条款） |

---

## 一、总体裁定

**治理与工程化：行业前 5%。视觉表达与落地一致性：行业中位。**

值得肯定的三点（不是客套，是它区别于多数自研规范的地方）：

1. **Surface Rank（02 §四/§五）**：把背景建模成有序阶梯 + 两种拓扑 + 判据。这是原创洞察，能消灭“多窗格层级颠倒”一整类 bug。
2. **对比度由构造保证**：12 阶 + 预校准组合 + `contrast.test.mjs` 永久回归。本次独立重算 8 组声明（ink-12/白、brand-9/白、danger-9/白、warning-9/深字、ink-8/白、ink-9/ink-3 等），**全部与文档一致（误差 < 0.1）**。
3. **失败模式入库**：1.00:1 白环、1.11:1 内嵌环、4.41 emphasis、ink 倒挂——每处都留了“我们曾经错过”的证据链。

必须承认的短板：

- **它定义了约束，没有定义风格。** 前台 = Inter + 近黑 CTA + 8px 圆角 + 系统衬线 display，准确描述是“Shopify Dawn，但文档更好”。规范引用了 Everlane / Aritzia / SSENSE 作为目标，但那些品牌的辨识度来自美术指导（摄影、裁切、超大留白、非对称网格），而本规范 100+ 页里**没有一页美术指导**。
- **落地一致性靠人肉。** 191 个测试钉住的是“已经想到的点”；本次 2 个 P0 与 5 个 P1 全部落在测试盲区。

| 维度 | 分 | 依据 |
|---|---|---|
| Token 分层与架构 | 9.5 | 三层分离、单旋钮、舞台重指向 |
| 色彩与对比契约 | 9.0 | 独立重算通过 |
| 字体与排版 | 7.5 | 行高 token 化被实现绕过（A-10） |
| 间距 / 网格 / 层级 | 8.5 | Surface Rank 优秀；密度旋钮只兑现 20%（A-07） |
| 动效 | 8.0 | 双人格清晰；reduced-motion 自相矛盾（A-11） |
| 无障碍（规格） | 8.5 | 组件层规格完整 |
| 无障碍（覆盖与落地） | 7.0 | 缺 2.2.2/1.2.x（A-05）；Switch 触达不达标（A-01） |
| 电商合规 | 9.0 | Omnibus / FTC / GDPR 落成组件属性 |
| 机器可执行性 | 9.5 | 15 规则 + 191 测试真实绿 |
| 文档一致性 | 6.5 | 版本/事实来源/触达口径漂移 |
| 品牌与视觉表达 | 6.0 | 合规满分，气质缺席 |
| **总评** | **8.4 / 10** | |

---

## 二、P0–P3 清单（含证据行号与验收标准）

> 行号基于 v1.4.0 基线；修复后行号会漂移，以 ID 为准。

### P0 · 上线阻断

| ID | 问题 | 证据 | 影响 | 验收标准（可判定） | 状态 |
|---|---|---|---|---|---|
| **A-01** | Switch 可点区域仅 20px 高，违反 WCAG 2.5.8（≥24×24） | [meridian-ui.css#L169-L172](file:///d:/Meridian Design/ai/meridian-ui.css#L169-L172)：`.m-switch` 无 `min-height`；隐藏 `input` 无尺寸；轨道 `36×20`。与 [18#L33](file:///d:/Meridian Design/components/18-component-contracts.md#L33) 承诺的“热区 44×44”矛盾 | 后台设置页大量使用 Switch；EAA / WCAG AA 主张被最常用控件击穿 | ① `.m-switch` 计算盒高 ≥44px；② 隐藏 input 覆盖整个 label；③ conformance 测试断言 `min-height:44px`；④ Chrome 实测热区 ≥44 | **Fixed** |
| **A-02** | 前台输入框全局 14px / 36px，iOS 聚焦强制缩放视口 | [tokens.css#L580](file:///d:/Meridian Design/ai/tokens.css#L580) `--m-input-font: text-md`；全目录无移动端覆盖；[04#L99](file:///d:/Meridian Design/docs/04-spacing-layout-elevation.md#L99) 自定移动端 44px 触达 | 结算页版式被击穿（70% 移动流量），并连带 1.4.10 Reflow 风险 | ① `≤767px` 时 `--m-input-font: 1rem`、`--m-input-h: 44px`；② 回归测试断言该媒体块；③ 原型 320/375px 实测聚焦不缩放 | **Fixed** |

### P1 · 严重

| ID | 问题 | 证据 | 影响 | 验收标准 | 状态 |
|---|---|---|---|---|---|
| **A-03** | Undo Toast 标注 10s，全局 Toast 写死 5000ms | [16#L73](file:///d:/Meridian Design/admin/16-admin-forms-settings.md#L73) vs [17#L31](file:///d:/Meridian Design/admin/17-admin-feedback-dashboard.md#L31) vs [tokens.css#L609](file:///d:/Meridian Design/ai/tokens.css#L609) | 唯一需要长驻的 Toast 被砍半，撤销窗口丢失 | 新增 `--m-toast-duration-action: 10000ms`；17/08/16 三处口径一致；测试断言 token 与文档 | **Fixed** |
| **A-04** | 表面阶梯在 storefront 坍缩：`primary-tint`(ink-2) 比 `surface-hover`(ink-3) 更浅 | [tokens.css#L270-L272](file:///d:/Meridian Design/ai/tokens.css#L270-L272)、[meridian-ui.css#L148-L149](file:///d:/Meridian Design/ai/meridian-ui.css#L148-L149) | Combobox 已选项看起来比 hover 项“更轻”；选中态语义反转 | ① storefront `primary-tint` 改为 ink-3；② 亮度单调：`L(primary-tint) < L(surface-hover)`，由测试断言；③ docs/02-color-system.md §四 补“非白底 hover 用状态层” | **Fixed** |
| **A-05** | WCAG 2.2.2 / 1.2.x / 1.3.5 / 2.3.1 未映射 | [06 映射表](file:///d:/Meridian Design/docs/06-accessibility-compliance.md#L7-L40)；“静音循环视频”见 [11#L84](file:///d:/Meridian Design/storefront/11-storefront-pdp.md#L84)，shimmer 见 [05#L42](file:///d:/Meridian Design/docs/05-motion-iconography.md#L42) | 视频/倒计时/shimmer 无暂停路径；EAA 主张缺项 | 06 新增“时间性内容与媒体”节 + 映射行；PDP 视频要求播放/暂停且默认不自动播；倒计时 `role="timer"`；测试断言 06 含 2.2.2 / 1.2.2 | **Fixed** |
| **A-06** | 文档指导 primitive 用法，且 `z-nav+` 不在封闭阶梯 | [09#L20](file:///d:/Meridian Design/storefront/09-storefront-foundations.md#L20) `bg-brand-9`；[09#L30](file:///d:/Meridian Design/storefront/09-storefront-foundations.md#L30) `z-nav+`；[18#L21-L22](file:///d:/Meridian Design/components/18-component-contracts.md#L21-L22) `danger-10/12`；[18#L33](file:///d:/Meridian Design/components/18-component-contracts.md#L33) `ink-8`；[17#L72](file:///d:/Meridian Design/admin/17-admin-feedback-dashboard.md#L72) `ink-5` | 作者除越权无路可走；R02/R11 不扫文档，门禁永远绿 | ① 宣告条改用既有品牌插槽 `--m-announce-bg/-fg`，新增 `--m-chart-grid`、`--m-z-cover: 200`；② 上述文档改为语义 token；③ 测试断言文档中不再出现 `bg-brand-\d`、`z-nav+` | **Fixed** |
| **A-07** | “密度是旋钮”只兑现表格行高 | [01 原则 10](file:///d:/Meridian Design/docs/01-design-philosophy.md#L63-L64)；token 层仅 `--m-table-row-h-*` | 切到 productive 后卡片/表单不跟随，节奏割裂 | ① `[data-density="productive"]` 覆盖 `--m-card-padding/-field-gap/-body-leading/-table-row-h`；② 01/14 明确密度作用域四类；③ 测试断言该块存在 | **Fixed** |
| **A-08** | 深色主操作 hover 方向：散文“提亮”，实现“压暗” | [02#L80](file:///d:/Meridian Design/docs/02-color-system.md#L80)、[02#L170](file:///d:/Meridian Design/docs/02-color-system.md#L170)、AGENTS §3 vs [tokens.css#L491-L493](file:///d:/Meridian Design/ai/tokens.css#L491-L493) | 文档是给 AI 读的：AI 会在深色写出“越 hover 越白”的按钮 | ① 规则改写为“远离端点（浅色变深 / 深色变浅；近黑/近白端点例外）”并给两套值；② 测试断言深色 hover 亮度 < primary | **Fixed** |
| **A-09** | 自定“相邻触达 ≥8px”与 toolbar 4px 直接冲突 | [04#L100](file:///d:/Meridian Design/docs/04-spacing-layout-elevation.md#L100) vs [tokens.css#L623](file:///d:/Meridian Design/ai/tokens.css#L623)、[18#L140](file:///d:/Meridian Design/components/18-component-contracts.md#L140) | 规范内部互斥，作者无所适从 | 04 改写为“目标 ≥24px 时允许 4px 并列；未达 24px 或移动端主操作才要求 8px/44px”，并给出 toolbar 例外 | **Fixed** |
| **A-10** | 行高“已 token 化”被组合层绕过且无门禁 | [03#L46](file:///d:/Meridian Design/docs/03-typography.md#L46)、[03#L71](file:///d:/Meridian Design/docs/03-typography.md#L71) vs [site.css#L129-L149](file:///d:/Meridian Design/ai/site.css#L129-L149)（1.04/1.08/1.15/1.3/1.55）、`admin.css` 4 处 | 最容易被违反的规则恰好不可校验 | ① 新增 9 个光学行高 token（title-1/2/3、lead、copy、note、label、none、tight）；② css/原型全部改 token；③ 新增校验 **R16**：component/feature 层禁止裸 `line-height` | **Fixed** |
| **A-11** | reduced-motion “进度类保留”与全局 0.01ms 归零矛盾 | [05#L48](file:///d:/Meridian Design/docs/05-motion-iconography.md#L48) vs [tokens.css#L739-L748](file:///d:/Meridian Design/ai/tokens.css#L739-L748) | 规格承诺与实际行为不一致（shimmer 实际被冻结） | 05 改写为“全局归零是唯一契约；加载态用静态占位 + `aria-busy`，不依赖动画传达进度” | **Fixed** |

### P2 · 中等

| ID | 问题 | 证据 | 处置 | 验收标准 | 状态 |
|---|---|---|---|---|---|
| **A-12** | 对比契约把焦点环对比引成 WCAG 2.4.11 | [02#L152](file:///d:/Meridian Design/docs/02-color-system.md#L152) | Fix | 改为 1.4.11（非文本对比）/ 2.4.13（AAA 焦点外观），并注明 2.4.11 是“不被遮挡” | **Fixed** |
| **A-13** | 链接 hover 由 15.4:1 降到 5.3:1（视觉像“变禁用”） | [tokens.css#L299-L300](file:///d:/Meridian Design/ai/tokens.css#L299-L300) | Fix | storefront `fg-link-hover` 改为 ink-12（不降对比），hover 反馈改由下划线加重承担；测试断言 `L(hover) ≥ L(default)` | **Fixed** |
| **A-14** | `--m-leading-display: 1.05` 与 px 行高同族，单位混用未说明 | [tokens.css#L155-L165](file:///d:/Meridian Design/ai/tokens.css#L155-L165) | Fix | 03/02 明确“display 与光学行高 token 为无单位比值（随字号缩放）”；tokens.json 增 `typography.roles` 镜像并测试比对 | **Fixed** |
| **A-15** | 大模态圆角文档 24 / token 16 | [04#L79](file:///d:/Meridian Design/docs/04-spacing-layout-elevation.md#L79) vs [tokens.css#L612](file:///d:/Meridian Design/ai/tokens.css#L612) | Fix | 04 改为“模态 = xl 16；2xl 24 仅全屏 Sheet / 营销卡”，与 token 一致 | **Fixed** |
| **A-16** | 工具族标签 12px（composer 主交互面） | [meridian-ui.css#L465](file:///d:/Meridian Design/ai/meridian-ui.css#L465) | Fix | 改为 `--m-text-sm`（13px）；conformance 断言 | **Fixed** |
| **A-17** | 无货 swatch `opacity:.4` 把 3:1 边框一起变淡 | [meridian-ui.css#L401](file:///d:/Meridian Design/ai/meridian-ui.css#L401) | Fix | 改为仅淡化色层（`color-mix`），边框保持 `border-strong` 全强度；测试断言无 `opacity:.4` | **Fixed** |
| **A-18** | 状态族仅 critical 有 `solid-hover/active` | [tokens.css#L326-L327](file:///d:/Meridian Design/ai/tokens.css#L326-L327) | Fix | 补 success / info / emphasis 的 `-solid-hover/-active`（浅色 9→10→12；深色 9→8→7），json 同步 | **Fixed** |
| **A-19** | 图表色与语义色撞车（chart-5 紫≈AI、chart-6=ink-9、chart-8=黑） | [02#L176-L185](file:///d:/Meridian Design/docs/02-color-system.md#L176-L185) | **Won't fix** | 该 8 色为 CVD 校验过的固定分类板（ΔE2000 ≥12/≥10），换色需重跑模拟且收益低；改为在 02 增加“图表内禁止 AI 紫徽标、禁止用 chart-8 充当 CTA”约束 | **Accepted** |
| **A-20** | `#2B1F02` 写在语义层而非 primitive | [tokens.css#L319](file:///d:/Meridian Design/ai/tokens.css#L319) | **Won't fix** | 暖色实底专用墨是“固定对比常量”，进入品牌可调面反而会破坏 8.3:1；在 02 注明其不可品牌化 | **Accepted** |
| **A-21** | App Shell 使用 `100vh`，且无 dvh 策略 | [admin.css#L64](file:///d:/Meridian Design/ai/admin.css#L64) | Fix | 改为 `100vh` + `100dvh` 递进；04 增“视口单位：应用外壳用 dvh，hero 禁用 vh 锁定” | **Fixed** |
| **A-22** | “≤1024 收 56px 图标栏”无实现（仅 ≥1024 手动 64px） | [admin.css#L60](file:///d:/Meridian Design/ai/admin.css#L60) vs [admin.css#L165-L167](file:///d:/Meridian Design/ai/admin.css#L165-L167) | Fix | 04/14 改为真实实现口径：`<768` 抽屉、`768–1023` 保留 240px、`≥1024` 可手动 64px；并登记为 O10 待决 | **Fixed** |
| **A-23** | 进度条 / 倒计时无 ARIA 契约 | [13#L24](file:///d:/Meridian Design/storefront/13-storefront-trust-conversion.md#L24) | Fix | 06/13 增 `role="progressbar"` + `aria-valuenow/min/max`、`role="timer"` + 不打断播报 | **Fixed** |
| **A-24** | warning/accent 阶位倒挂：border(8) 亮度远低于 fill(9) | [tokens.css#L102-L103](file:///d:/Meridian Design/ai/tokens.css#L102-L103)、[#L60-L61](file:///d:/Meridian Design/ai/tokens.css#L60-L61) | **Deferred v2** | 修正需重生成暖色带（MAJOR，触碰对比契约）；本轮在 02 登记为“暖色带已知倒挂”，并约束 tint 徽章不使用 8 阶描边（改用无边框 + 图标辅助） | **Deferred** |

### P3 · 卫生

| ID | 问题 | 证据 | 处置 | 状态 |
|---|---|---|---|---|
| **A-25** | `docs/01` 章节头部仍写 v1.0 | [01#L3](file:///d:/Meridian Design/docs/01-design-philosophy.md#L3) | 删除章节内版本戳，改为“版本唯一来源：`ai/tokens.json` `$version`” | **Fixed** |
| **A-26** | “单一事实来源”三处说法不一 | [AGENTS#L15](file:///d:/Meridian Design/ai/AGENTS.md#L15)、[tokens.css#L10-L11](file:///d:/Meridian Design/ai/tokens.css#L10-L11)、[README#L83](file:///d:/Meridian Design/README.md#L83) | 统一为：`tokens.css` = 运行时事实；`tokens.json` = DTCG 镜像 + `$version` 唯一声明；两者由测试锁死 | **Fixed** |
| **A-27** | “一切新规则必须可校验”与 AGENTS 9/10 “靠 review”互斥 | [README#L84](file:///d:/Meridian Design/README.md#L84) | 改为“可校验的进校验器；不可校验的必须标注 review-only 并附判断依据” | **Fixed** |
| **A-28** | README 文件地图根目录仍为 `设计规范0913/` | [README#L23](file:///d:/Meridian Design/README.md#L23) | 改为仓库根 | **Fixed** |
| **A-29** | 字段宽 120/200px、缩略图 88px、modal 384/720 未 token 化 | 16#L27、11#L86、17#L37 | **Deferred**（无视觉缺陷，属下一轮资产化） | **Deferred** |
| **A-30** | `--m-space-05` 与 Tailwind `0.5` 命名不一致 | [tokens.css#L176](file:///d:/Meridian Design/ai/tokens.css#L176) | **Won't fix**（改名 = MAJOR；已在 token 注释登记） | **Accepted** |
| **A-31** | 版本门只覆盖 5 源，漏 `package.json` / `design-system.html` | [acceptance.test.mjs#L21-L27](file:///d:/Meridian Design/ai/selfcheck/acceptance.test.mjs#L21-L27) | 扩到 7 源并升版 v1.5.0 | **Fixed** |

### 评审纠错（自查撤回的误判）

| 原判 | 事实 | 处置 |
|---|---|---|
| “CTA 标签 13px” | `.m-btn--cta` 已是 `--m-text-lg`(16px)，13px 仅为基础/后台按钮，符合 docs/03-typography.md §三 | **Retracted** |
| “PDP swatch 32px 未实现” | `.m-swatch--lg` 已存在（`padding: space-2` → 视觉 32），conformance 已断言 | **Retracted** |
| “组件计数 22 与 40 不符” | “22 契约”只出现在 CHANGELOG **历史条目**，属当时事实 | **Retracted** |

---

## 三、修复工作流（P0 → P3）

```
Gate 0 基线          审计文档签署（本文件） + 191 测试快照
   ↓
Batch 1  P0 止血     A-01 / A-02                        门：G1 + 视觉复评 + 独立评审
   ↓
Batch 2  P1 自洽     A-03…A-11（含 R16 新规则 + 9 个 token）门：G1/G2 + 视觉复评 + 独立评审
   ↓
Batch 3  P2 打磨     A-12…A-18 / A-21…A-23               门：G1/G2 + 视觉复评 + 独立评审
   ↓
Batch 4  P3 卫生     A-25…A-28 / A-31（版本升 1.5.0）      门：G1/G3
   ↓
Gate 5  验收闭环     审计状态回填 + CHANGELOG + 回归清单核对
```

### 门禁定义

| 门 | 内容 | 通过条件 |
|---|---|---|
| **G1 机器门** | `npm run lint` = `validate.mjs`（0 violations）+ 全部 `node --test` | 退出码 0；测试数只增不减 |
| **G2 回归门** | 新增 `ai/selfcheck/audit-regressions.test.mjs`，每个 A-xx 一条断言 | 每条修复都有对应测试；删代码即红 |
| **G3 一致性门** | 版本 7 源一致、tokens.json ↔ tokens.css parity、孤儿 token 白名单 | 全绿 |
| **G4 视觉复评** | 调用 **frontend-design 插件** 对受影响页面/组件做设计评审（层级、排版、状态、品牌表达） | 评审结论写入本文件“评审记录” |
| **G5 独立评审** | 由独立 subagent（或第三方）在**不看修复意图**的前提下审 diff + 跑门禁 | 无新增 P0/P1；意见逐条回应 |

### 每次评审的固定动作（防止“闭门造车”）

1. 先跑机器门（G1/G2），**不接受口头通过**。
2. 再调用 `trae-remote-official:frontend-design` 插件，按“Purpose / Tone / Constraints / Differentiation”四问复评受影响界面，并要求指出至少 1 条可改进项。
3. 独立评审只给 diff 与验收标准，不给实现理由；其结论单独成段。
4. 评审记录写回本文件，含日期、范围、结论、遗留。

### 回滚策略

- 每个 Batch 一个可独立回滚的提交；token 改名/删除一律不做（避免 MAJOR 迁移）。
- 若 G4/G5 判定某项修复造成视觉退化：保留测试、回退样式值，并在本文件登记“已尝试 + 退回原因”。

---

## 四、验收矩阵（修复后逐条勾选）

| ID | 机器断言 | 人工/视觉断言 | 结果 |
|---|---|---|---|
| A-01 | `conformance`: `.m-switch{min-height:44px}` | Chrome 实测热区 ≥44×44 | ✅ |
| A-02 | `audit-regressions`: 移动端输入 token | 375px 聚焦不缩放（iOS 模拟） | ✅ |
| A-03 | `audit-regressions`: `--m-toast-duration-action: 10000ms` | Undo Toast 驻留 10s | ✅ |
| A-04 | 亮度单调：primary-tint < surface-hover | Combobox 选中比 hover 重 | ✅ |
| A-05 | 06 含 2.2.2 / 1.2.2 / 1.3.5 | PDP 视频有暂停控件 | ✅ |
| A-06 | 文档无 `bg-brand-\d` / `z-nav+` | 宣告条消费 `--m-announce-bg`（原型已加载 brand-tokens.css） | ✅ |
| A-07 | `[data-density="productive"]` 四类覆盖 | 切密度后卡片/表单同步收紧 | ✅ |
| A-08 | 深色 `L(hover) < L(primary)` | 深色按钮 hover 压暗 | ✅ |
| A-09 | 04 含 toolbar 例外条款 | — | ✅ |
| A-10 | R16 全仓 0 违规 + 9 token 被消费 | 标题光学行高不变 | ✅ |
| A-11 | 05 无“进度类保留”表述 | 骨架在 RM 下静态 | ✅ |
| A-12 | 02 引 1.4.11 / 2.4.13 | — | ✅ |
| A-13 | `L(link-hover) ≥ L(link)` | 链接 hover 不变浅 | ✅ |
| A-14 | json `typography.roles` 与 CSS 一致 | — | ✅ |
| A-15 | 04 写“模态 xl 16” | — | ✅ |
| A-16 | `.m-tool` 字号 = text-sm | Composer 标签更易读 | ✅ |
| A-17 | 无 `opacity:.4` on swatch | 无货 swatch 边框仍 3:1 | ✅ |
| A-18 | json/CSS 三族 solid-hover | — | ✅ |
| A-21 | `100dvh` 存在 | 移动端外壳不被地址栏裁切 | ✅ |
| A-22 | 04/14 与实现一致 | — | ✅ |
| A-23 | 06 含 `progressbar` / `timer` | — | ✅ |
| A-25…A-28, A-31 | 版本 7 源一致 + 文档措辞 | — | ✅ |

---

## 五、评审记录

| 轮次 | 日期 | 门 | 范围 | 结论 | 遗留 |
|---|---|---|---|---|---|
| R0 | 2026-10-25 | G1 基线 | 全仓 | `validate` 0 violations；191/191 pass | 本清单 A-01…A-31 |
| R1 | 2026-10-25 | G1+G2 | Batch 1–2（P0/P1） | 0 violations；213/213 pass；R16 注册且 fixture 真阳/真阴齐备 | 进入视觉复评 |
| R2 | 2026-10-25 | G4 视觉复评（第 1 轮） | 08-home / design-system | 通过：Switch 热区 44、工具标签 13px、深色 hover 压暗、AnnouncementBar 组件为品牌绿。**不通过**：08-home 公告条透明（缺 brand-tokens.css）、375px hero/网格未折叠（inline grid 覆盖媒体查询） | 已修复（见 §六） |
| R3 | 2026-10-25 | G5 独立评审（第 1 轮） | diff + 验收标准 | **不允许发布**：P1 公告条 token 未定义；P2 Combobox 选中=hover、链接 hover 被特异性吃掉、Toast 口径分裂、倒计时语义只落 06、侧栏 56px 口径分裂、AUDIT §六为空 | 已修复（见 §六） |
| R4 | 2026-10-25 | G4 视觉复评（第 2 轮） | 08-home 1440/375 | 公告条 `rgb(15,107,87)`/白字/40px；375：hero 单列、商品 2 列 158px、故事单列、无横滚；品牌故事 padding 89.6/48 恢复 | 截图因浏览器视口 0×0 未能重生成（见 §六 限制 1） |
| R5 | 2026-10-25 | G5 独立评审（第 2 轮） | 10 条复核 + 门禁 | 10 条中 7 条通过；剩余 P2：故事带纵向 padding 丢失（已修）、AUDIT §六为空（本节）、侧栏口径分裂（已统一实现为 ≤1024→56px）；P3：Admin 深色方向（已修）、Combobox 区分偏弱（已加内嵌指示条） | 关闭 |

---

## 六、执行结果（v1.5.0）

> 与 `git diff` 一一对应。门禁终态：`node ai/validate.mjs . --exclude ai/selfcheck/fixtures` → **0 violations**；`npm test` → **213/213 pass**（基线 191）。

### 6.1 机器门（G1/G2/G3）

| 证据 | 结果 |
|---|---|
| `npm run lint`（validator + 全量测试） | 退出 0；213/213 |
| 新增规则 R16（行高 token） | `--only=R16` 0 违规；`R16/fail` 2 命中、`pass` 0 误报；已进 acceptance 规则表 |
| tokens.json ↔ tokens.css parity | 绿（新增 success/info/emphasis `-solid-hover|-active` 双边同步） |
| 孤儿 token | 绿（新增 `--m-z-cover`、`--m-toast-duration-action`、三族 solid 状态进白名单并注明理由） |
| 版本门 | 7 源一致 1.5.0（README / tokens.json / tokens.css / meridian-ui.css / design-system.html / package.json / CHANGELOG），另 `package-lock.json` 同步 |
| prototypes-gate | 绿（含 G-225 对标卡位置：已把对标卡移至 head 前 400 字符内） |

### 6.2 代码与 token 变更

- **P0**：`.m-switch` 热区 44（隐藏 input 铺满 label）；`≤767px` 输入 16px / 44px。
- **P1**：`primary-tint`→ink-3；combobox hover→`surface-hover`（选中再加深内嵌 2px primary 指示条，含 RTL）；正文链接 hover 增加更高特异性 2px 下划线；新增 9 个光学行高 token 并把 site/admin/demo/prototype 全部收口；`[data-density=productive]` 四类覆盖；`--m-chart-grid` 被 `.ad-chart .gl` 消费；`100dvh` 递进（sidenav/builder/login）。
- **P2/P3**：`.m-tool` 13px；无货 swatch 只淡化色层（color-mix 带 fallback）；公告条原型与 `.sf-announce` 改用 `--m-announce-bg/-fg`；`.ad-sidenav` 在 `≤1023px` 实际收成 56px，与 `.m-shell` 同口径；文档全部按“远离端点”改写；版本/事实来源/文件地图/规则编号统一。

### 6.3 视觉复评（G4，frontend-design 插件 + 真实浏览器）

实测（1440×900 / 375×812，同源 iframe）：

| 项 | 实测 |
|---|---|
| 公告条 | 背景 `rgb(15,107,87)`、文字白、高度 **40px**、单行不折 |
| 品牌故事 band | padding-block **89.6px**（1440）/ **48px**（375），内容不贴边 |
| 375 版式 | hero 1 列 328px；商品 2 列 158px；故事 1 列；`scrollWidth = clientWidth`；名称/价格不截断 |
| 1440 版式 | hero 2×600px；商品 4×300px；`scrollWidth = clientWidth` |
| Switch | label 命中区 482.5×44，点击轨道外仍可切换 |
| Composer | 8 个 pill 均 13px，无溢出/错位 |
| 深色主按钮 hover | `#F6F8FA` → `#E6EAF0`（L 0.9363→0.8196，压暗） |

### 6.4 独立评审（G5）

两轮独立评审共提出 **1×P1 + 9×P2/P3**，全部关闭：

| 发现 | 处置 |
|---|---|
| 08-home 未加载 brand-tokens → 公告条透明 | 补 `<link>` + `.sf-announce` 改 token；新增“原型必须加载所用 token 的样式表”断言 |
| Combobox 选中与 hover 同色 | hover→surface-hover；selected 加内嵌 2px primary + RTL 镜像 |
| 正文链接 hover 被特异性覆盖 | 新增 `:where(p,.m-prose,.sf-prose) a:not(.m-btn):hover`（(0,2,1)） |
| Toast 5s/10s 口径分裂（17 决策树、08） | 三处统一并加断言 |
| 倒计时 timer 只写 06 | storefront/13-storefront-trust-conversion.md §四 补 `role="timer"` + `aria-live="off"` |
| 侧栏 56px 文档/实现分裂 | 实现补 `≤1023px .ad-sidenav{width:56px}`，文档回到原口径，O10 关闭 |
| 品牌故事带纵向 padding 丢失 | 补 `sf-section`，实测 89.6/48 |
| AUDIT §六 为空 | 本节即回填 |
| package-lock 1.4.0 / 测试数 209 / R15 重复 | 全部修正 |
| 02 Admin 行缺深色方向 | 补“浅色 9→10 / 深色 9→8” |

### 6.5 已知限制（不阻塞发布，登记待办）

1. **截图证据**：浏览器标签视口为 0×0，无法重生成 `visual-review-2026-10-25/final-*`；本轮以上表**计算样式实测值**替代截图。旧截图早于最终代码，不应作为证据引用。
2. **Combobox 选中底差**：ink-2 vs ink-3 仅 1.055:1（后台 1.061:1），已加内嵌 2px primary 指示条作为第二线索；若未来要求“底色即可辨”，需换 ink-4（会影响 hover 阶梯，属 MINOR）。
3. **tokens.json 为单向镜像**：仅覆盖 primitive + 语义主题层；LAYER 3（字阶角色、toast 时长、z 阶梯）只在 CSS。`--m-opacity-disabled` 等未镜像，属既有约定，非本轮引入。
4. **`.ad-sidenav` 无原型实例**：CSS 已实现，但没有 admin 原型使用它（现有 admin 页用组合层直写），属 S4 组件示范债。
   **v1.6.0 追溯升级：本条不作为"已知限制"继续挂账，改为未闭环缺陷。** 复核数据：`ai/admin.css` 现有 `ad-*` 选择器类 **83 个，产物消费者 0 个**（接线率 0%）；`ai/site.css` `sf-*` 类 142 个 / 被消费 15 个（接线率 16.9%）。`conformance.test.mjs:37-39` 仍在用 3 条正则守护 `.ad-sidenav` 的 **CSS 文本存在性**，而该类没有任何屏幕渲染它——根因是本仓只有"用的类必须有定义"（G-228 正向门），没有"定义的类必须被使用"（反向门）。处置见 [docs/superpowers/plans/2026-11-05-wiring-and-baseline-remediation-v1.7.0.md](docs/superpowers/plans/2026-11-05-wiring-and-baseline-remediation-v1.7.0.md) 根因 B 与 Batch 2（G-231 接线门）。
5. **API 面 token 无仓内消费者**：`--m-z-cover`、`--m-toast-duration-action`、success/info/emphasis 的 solid 状态由业务侧/行为层取用（白名单已注明）。
6. **Deferred**：暖色带阶位倒挂（A-24，需 MAJOR 重生成）、字段宽/缩略图等魔数（A-29）、图表与 AI 紫隔离（A-19 以规则约束代替换色）。

### 6.6 签署

**结论：v1.5.0 可发布。** 依据：无 P0/P1 未闭环；213/213 机器门全绿；G4 两轮、G5 两轮均完成且发现项全部关闭。发布后按 §6.5 跟踪 6 条已登记限制。
