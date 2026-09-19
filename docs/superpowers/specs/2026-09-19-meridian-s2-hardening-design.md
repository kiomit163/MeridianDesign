# S2 Hardening · 设计规格（spec）

> 依据：v1.1.0 全仓审计（2026-09-19）发现的问题清单。目标：让"说到的一定做到"——门禁真正绿、对比契约无未披露缺口、文档-实现-版本三方一致。本轮是**加固轮**，不做新能力（行为层 / axe / codemod 仍归 S3+）。

## 1. 问题与证据

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| D1 | P0 | 校验门禁自身红灯：`node ai/validate.mjs . --exclude ai/selfcheck/fixtures` 报 0 违规但有 **5 条 stale-allow → 退出码 1**，`npm run lint` 必红 | 实跑输出；HANDOFF §4 已登记 3 条遗留 |
| D2 | P1 | **O8 引擎缺陷**：`collectAllows` 对 doc 层跑，AGENTS.md:32/45、HANDOFF.md:106、MIGRATION-1.1.md:62 的文档示例 marker 被误判 stale | docs/00-open-decisions.md O8（治本方向已裁定：doc 层跳过 collectAllows） |
| D3 | P1 | **引擎 marker 匹配缺陷**：`engine.run()` 消耗 marker 时 `find()` 不排除已消耗、不取最近行。meridian-ui.css 违规行 163（shimmer 1.5s）被行 161 的 marker（`|161-163|=2` 仍命中 near）抢先消耗，163 的 marker 永不消耗 → stale | `ai/lib/engine.mjs:37`；HANDOFF "allow 应在下一行" 是绕行描述，非根因 |
| D4 | P1 | **emphasis 族对比度破约**：`emphasis-fg`(accent-11 #96660A) 对 `emphasis-bg`(accent-2 #FAF0D9) 实测 **4.41 < 4.5**，未在 open-decisions 披露（O5 只披露图表 2 色） | 审计对比度脚本实测 |
| D5 | P1 | **契约表数字不实**：docs/02 §六 声明 `border(ink-5)/bg-surface ≥1.6:1`，实测 **1.33:1** | 同上 |
| D6 | P2 | **迁移文档声称已修但未修**：MIGRATION-1.1 ⑥ 称 18 章"合规小字 11px 已改为 12px"，`components/18-component-contracts.md:159` 仍是 11px；与 docs/03 的 12px 地板、meridian-ui.css 实现（text-xs=12px）三方矛盾 | grep "11px" components/ |
| D7 | P2 | **版本/计数漂移**：design-system.html 标题/侧栏/页脚 v1.0 / v1.0.0 / 2026-09-13（其余 4 处已 1.1.0）；组件计数 4 个口径（22 契约 / 80 导航 / 87 标题 / 87 hero"契约"） | grep 版本串 |
| D8 | P2 | **孤儿 token**：18 个非 primitive token 零实现消费者，其中 4 个是真孤儿（`--m-state-selected`、`--m-state-dragged`、`--m-input-placeholder`、`--m-badge-promo-bg/fg`）；CHANGELOG 1.1.0 曾声明"消灭 6 个孤儿"但无回归防护 | `_audit/coverage.mjs` |
| D9 | P2 | **契约-实现对不上**：Combobox 有契约无参考实现；CommandPalette 的参考实现存在但叫 `.m-palette`，契约未指认 | `_audit/coverage.mjs` |
| D10 | P2 | **无 CI 接线、无 .gitattributes**（S1 ledger cf3 已识别 CRLF 风险） | 仓库无 .github/ |

## 2. 范围与裁决

**本轮做**：D1–D10 全部修复 + 把"对比契约 / 无孤儿"变成永久回归测试 + CI。
**本轮不做**（留 S3+，open-decisions 已挂账）：行为参考层（焦点禁锢/Toast JS）、axe/Playwright 运行时验证、codemod、Figma 管线、tokens.json→css 派生器、O1–O7 深色决策。

### 关键设计裁决

| # | 裁决 | 理由与代价 |
|---|---|---|
| R-20 | 工作区沿用 R-0：就地分支 `feat/s2-hardening`，不建 worktree | 同 S1：中文路径 + Windows 摩擦；仓库无并行工作 |
| R-21 | D3 修引擎（nearest-unused 消耗），不采纳 HANDOFF 的"allow 挪下一行" | 挪行是绕行，同类错位会复发；引擎修正 + 回归测试才是治本 |
| R-22 | D4 修 accent-11：#96660A → **#8A5E09**（accent-2 上 5.02:1，白底 5.70:1，色相不变）；按治理规则升 **1.2.0**（primitive 改值 = MINOR） | accent-11 同时要保白底 ≥4.5（现 5.0→5.7 更优）；对比契约表与图表色板均不受影响（viz 用 accent-6） |
| R-23 | D5 改文档不改 token：契约行改为实测 ≈1.3:1 并标注"装饰性、无 WCAG 义务" | 改 ink-5 会全局改动边框视觉，代价远超收益 |
| R-24 | D8 消费而非删除孤儿（删除 = MAJOR）：`--m-state-selected`/`--m-input-placeholder`/`--m-badge-promo-*` 接入参考实现并新增 `.m-badge--promo`；`--m-state-dragged` 声明为 M3 公式完备集（保留无消费者）；space-16/20/24、bp-*、duration-600、space-section 声明为**业务代码 API 面**并用白名单固定 | 给品牌方保留 promo 徽章独立覆盖点正是这两个 token 的设计意图 |
| R-25 | D9 补 `.m-combobox` 参考实现（CSS-only，与"实现层=样式参考"的定位一致），接入**既有 c10 演示槽位**；CommandPalette 在 18 章指认 `.m-palette` | 行为层是 S4 范围；演示总数维持 87，不新增槽位 |
| R-26 | 永久回归：新增 `ai/selfcheck/contrast.test.mjs`（从 tokens.css 解析并断言契约表）与 `ai/selfcheck/orphans.test.mjs`（白名单制孤儿检查） | 防止同类问题复发——本轮教训是"声明了但没有机器守卫" |
| R-27 | D7 口径统一为"**22 份组件契约 / 87 个演示组件**"（Combobox 用既有 c10 槽位，不新增）；版本统一 **1.2.0 · 2026-09-19**；README 治理条款把 design-system.html 纳入版本一致性清单 | 一次到位，避免分任务改两遍计数 |
| R-28 | CI 要求全绿 → 修复 `engine.test.mjs:270` 已知失败断言：改为断言**真实契约**（全仓扫描命中 fixtures 植红 → 退出码 1 且 count>0），不改 14 条 acceptance 规则 | HANDOFF §3 自己给出了配方；T17 的判定是"仓库根必然有违规"，修正后的断言是把该判定**编码进测试**而不是违逆它 |

## 3. 验收标准（全绿才算收）

1. `npm test` —— **全绿 0 失败**（含修正后的 `engine.test.mjs:270`，见 R-28；14 条 acceptance 规则原样保持）。
2. `node ai/validate.mjs . --exclude ai/selfcheck/fixtures` —— **0 violations、0 staleAllows、退出码 0**。
3. 对比契约回归测试（新）全绿，emphasis-fg/bg ≥ 4.5。
4. `grep -rn "11px" components/ docs/ --include="*.md"`（docs/superpowers 除外）无残留规格性 11px。
5. 版本串：`grep -rn "v1\.[012]" design-system.html README.md ai/tokens.json ai/tokens.css ai/meridian-ui.css CHANGELOG.md` 全部指向 1.2.0（历史条目除外）。
6. CI 工作流文件存在且两步命令本地可跑通。
