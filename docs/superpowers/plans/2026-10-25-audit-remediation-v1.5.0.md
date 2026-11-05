# Meridian v1.5.0 · 审计修复执行计划

> 依据：[AUDIT-1.4.0.md](../../AUDIT-1.4.0.md)
> 目标：把 P0–P3 清单逐条落到 **代码 + token + 规格 + 测试** 四层，且每批过 5 道门。
> 原则：**先证伪，再修复**；任何“已修复”必须同时有机器断言与评审记录。

---

## 0. 不变量（每批都必须成立）

1. `node ai/validate.mjs . --exclude ai/selfcheck/fixtures` 退出码 0。
2. `node --test` 全绿，测试数只增不减。
3. `tokens.css ↔ tokens.json` parity 测试保持绿（新增语义色必须双边同步）。
4. 非 primitive 新 token 必须有消费者，否则进 `orphans.test.mjs` 白名单（附理由）。
5. 不删除、不改名既有 token（避免 MAJOR 迁移债）。

---

## 1. Batch 1 — P0 止血（A-01 / A-02）

| 步骤 | 文件 | 变更 | 验证 |
|---|---|---|---|
| 1.1 | `ai/meridian-ui.css` | `.m-switch { min-height: 44px }`；隐藏 input `inset:0; width/height:100%` | conformance 新断言 |
| 1.2 | `ai/tokens.css` | 末尾 `@media (max-width:767px)` 覆盖 `--m-input-font: 1rem`、`--m-input-h: 2.75rem` | audit-regressions 断言 |
| 1.3 | `components/18` / `docs/04` | 触达契约写清“输入框移动端 44 / 16px” | 文档断言 |
| 1.4 | 原型 | 375px 手测聚焦、Switch 点击区 | 视觉复评 R2 |

**风险**：移动端输入变高会影响紧凑表单密度 → 以 767px 为界，桌面不变。
**回滚**：仅两处声明，可单点回退。

---

## 2. Batch 2 — P1 自洽（A-03…A-11）

| 步骤 | 内容 | 关键文件 | 验证 |
|---|---|---|---|
| 2.1 | Undo Toast 时长 token 化 | tokens.css / 16 / 17 / 08 | 断言 token + 三处文案一致 |
| 2.2 | 表面阶梯修正：storefront `primary-tint → ink-3`；文档补“非白底 hover 用状态层” | tokens.css / json / 02 / 09 | 亮度单调断言 |
| 2.3 | 时间性内容章节（2.2.2 / 1.2.x / 1.3.5 / 2.3.1） | 06 / 11 / 13 | 文案断言 + 视觉复评 |
| 2.4 | 补 `--m-chart-grid` / `--m-z-cover`；清理文档 primitive 与 `z-nav+`（宣告条改用既有 `--m-announce-bg/-fg`） | tokens.css / json / 09 / 17 / 18 / 10 / 11 | 文档负向断言 |
| 2.5 | 密度旋钮四类覆盖 | tokens.css / 01 / 14 | 块存在断言 |
| 2.6 | 深色 hover 规则改写（远离端点） | 02 / AGENTS / 18 | 亮度断言 |
| 2.7 | 触达 8px 规则与 toolbar 4px 对齐 | 04 / 18 | 文档断言 |
| 2.8 | 光学行高 token 化 + **R16 新规则** | tokens.css / site.css / admin.css / 08-home / 10-pdp / 03 / checks/r16 + fixtures | `--only=R16` 0 违规；新规则 fixture 真阳/真阴 |
| 2.9 | reduced-motion 表述修正 | 05 | 文案断言 |

**风险**：R16 是新增门禁，会暴露历史裸值 → 先一次清干净（已枚举），再开门。
**回滚**：R16 单独文件，可摘除注册表而不影响样式。

---

## 3. Batch 3 — P2 打磨（A-12…A-18 / A-21…A-23）

| 步骤 | 内容 | 验证 |
|---|---|---|
| 3.1 | 02 条款误引修正（1.4.11 / 2.4.13） | 文案断言 |
| 3.2 | 链接 hover 不变浅 + 下划线加重 | 亮度断言 |
| 3.3 | `typography.roles` 镜像（无单位行高） | json↔CSS 断言 |
| 3.4 | 模态圆角口径对齐（xl 16） | 文档断言 |
| 3.5 | `.m-tool` 12 → 13px | conformance |
| 3.6 | 无货 swatch 仅淡化色层 | 断言无 `opacity:.4` |
| 3.7 | success/info/emphasis solid hover-active | json/CSS parity |
| 3.8 | `100dvh` + 视口单位规则 | 断言 |
| 3.9 | 56px 轨道口径对齐实现 + O10 登记 | 文档断言 |
| 3.10 | ProgressBar / Timer ARIA 契约 | 文案断言 |

---

## 4. Batch 4 — P3 卫生 + 发版（A-25…A-28 / A-31）

| 步骤 | 内容 |
|---|---|
| 4.1 | `docs/01` 去章节版本戳，改为指向 `$version` |
| 4.2 | README / AGENTS / tokens.css 统一“事实来源”三句话 |
| 4.3 | README 治理条款区分“可校验 / review-only” |
| 4.4 | README 文件地图根目录修正 |
| 4.5 | 版本升 **1.5.0**：README / tokens.json / tokens.css / meridian-ui.css / design-system.html / package.json / CHANGELOG |
| 4.6 | 验收测试扩到 7 源；CHANGELOG 写“修复了什么 + 为什么 + 迁移影响” |

---

## 5. 门禁与评审节奏

| 批次完成后 | 动作 |
|---|---|
| 每批末 | 跑 G1（lint + 全量测试）→ 必须先绿再进入下一批 |
| 每批末 | 跑 G2（audit-regressions 新增断言） |
| Batch 1 / 2 / 3 末 | 调用 `frontend-design` 插件做视觉复评（G4），要求至少 1 条改进意见 |
| Batch 2 / 4 末 | 独立 subagent 评审 diff（G5），只给验收标准、不给实现理由 |
| 全部完成 | 回填 AUDIT §六 + 更新 CHANGELOG + 输出验收矩阵勾选 |

---

## 6. 完成定义（DoD）

- [ ] 30 条 A-xx 全部落在 Fixed / Accepted / Deferred 之一，且 Deferred 有排期与理由。
- [ ] 新增断言覆盖全部 Fixed 项（删除实现即红）。
- [ ] `npm run lint` 0 violations，测试数 ≥ 191 + 新增。
- [ ] 视觉复评与独立评审结论已写入 `AUDIT-1.4.0.md §五/§六`。
- [ ] 版本 7 源一致为 1.5.0。
- [ ] 无 MAJOR 级破坏（无 token 删除/改名）。
