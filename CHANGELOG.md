# Changelog

本项目遵循"任何视觉可见的值变更 ≥ MINOR；语义重指向 / 删 token / 改变默认舞台 = MAJOR + 迁移说明"。

- v1.3 — breakpoints & app shell increment section (5-breakpoint scale + .m-shell/.m-topbar/.m-container/.m-grid-kpi utilities; pure append, zero changes to existing rules) — for Locust 2026-10-21-meridian-shell.

## 1.2.0 — 2026-09-19

### Fixed
- 校验引擎两处缺陷：① doc 层不再收集 `meridian-allow`（O8 治本，文档示例 marker 不再误报 stale）；② marker 消耗改为"未消耗优先、行距最近"，相邻违规不再被远端 marker 抢先吸收（v1.1 遗留的 `meridian-ui.css` shimmer stale 由此根除）
- `--m-accent-11` `#96660A` → `#8A5E09`：修复 emphasis 族 `*-fg/*-bg` 实测 4.41 < 4.5 的对比度破约（accent-2 上现为 5.0:1，白底 5.7:1；色相不变，图表色板不受影响）
- docs/02 §六 `border/bg-surface` 契约值 ≥1.6:1 → 实测 ≈1.3:1（装饰性基线，非语义边界无 WCAG 义务）
- components/18 合规小字 11px → 12px（补齐 v1.1 迁移说明声称但漏改的口径）
- design-system.html 版本/计数统一（v1.2.0 · 22 契约 / 87 演示）；README 治理条款将演示页纳入版本一致性清单
- `.m-btn--destructive:active` 改用 `--m-critical-solid-active`（原先误用 hover 值，深色主题下 active/hover 无区分）

### Added
- `ai/selfcheck/contrast.test.mjs`：对比契约永久回归（浅色 §六 全表 + 状态族五件套 + 深色语义块，tokens.json↔css 同步断言）
- `ai/selfcheck/orphans.test.mjs`：非 primitive token 零孤儿守卫（业务 API 面白名单制，含逐条理由）
- `.m-combobox` 参考实现接入 c10 演示；components/18-component-contracts.md 指认 CommandPalette 参考实现 = `.m-palette`
- `.m-badge--promo` 促销徽章变体（默认与 emphasis 同值，品牌可经 `--m-badge-promo-*` 独立覆盖）
- 孤儿 token 消费：`--m-input-placeholder`（placeholder）、`--m-state-selected`（host-selected 态层）、`--m-critical-solid-active`（destructive :active）；`--m-state-dragged` 声明为 M3 公式完备集成员
- GitHub Actions CI（npm test + 校验门禁双闸）与 `.gitattributes eol=lf`

### Changed
- 版本纪律执行：primitive 改值 → MINOR（1.1.0 → 1.2.0）
- `engine.test.mjs` 的全仓 CLI 断言改为真实契约（全仓扫描命中 fixtures 植红 → 退出 1），套件首次 143/143 全绿

## 1.1.0 — 2026-09-19

### Added
- 校验规则 R01–R15（合计 14 条，全部 error 级，`R06` 空缺保留序号）+ `ai/selfcheck/` 精确集合回归（manifest 61 项）
- 语义 token：`--m-body-fs`、`--m-critical-solid-hover/-active`、`--m-control-off-bg`、`--m-tooltip-bg/-fg`、`--m-neutral-solid`
- `.m-toast` 参考实现、`[data-density="productive"]` 切换
- `docs/00-open-decisions.md`、本 `MIGRATION-1.1.md`、行级 `meridian-allow` 机制
- `--exclude <seg>` CLI（区别于 `cfg.ignore`，给 fixture 提供临时跳过）

### Changed
- **`:root` 默认舞台由后台语义改为前台**（主操作近黑、正文 16px、`fg-link` 中性、卡片 e1/16px、overlay-blur 4px）；后台必须显式 `.stage-admin`，组件 API 与 `m-btn--primary` 类名均不变
- 焦点环由 `box-shadow` 改为 `outline`，声明点收敛到 `ai/tokens.css` 一处；admin 后台保持贴边框内侧的环
- 密度默认统一为 comfortable 48px；`--m-table-row-h-productive` 通过 `[data-density="productive"]` 切换为 36px
- 头像底色 `brand-3` → `--m-primary-tint`、文字 `brand-12` → `--m-primary-text`（已声明的唯一可见色差）
- 31 行脱 4 网格间距（`6/10/14/1px`）归位为 `--m-space-{2,3,4,05}` token；间隙略微放宽

### Fixed
- 复选框 / 单选 / 开关的键盘焦点不可见（WCAG 2.4.7）：在 `.m-check/.m-radio/.m-switch` 的可见部件（`.box/.track`）上新增 `:focus-visible` outline
- `validate.mjs --json` 恒退出 0 造成的 CI 假绿（v1 的 `--json` 假绿彻底修死）
- 49 处 primitive 越权 → 0（meridian-ui.css 14 处 + design-system.html 35 处分别由 demo `offInDemo` 与新语义 token 解决）
- 33 处低于 12px 字号 → 0（meridian-ui.css 5 处 + design-system.html 28 处全部改 `var(--m-text-xs)`）
- 16 处物理方向属性 → 0（`margin/padding-{left,right}` 全部改 `margin/padding-inline-*`）
- 5 处裸色值、2 处越界圆角、3 处动画时长得 `meridian-allow` 行级豁免
- 跨目录裸章节引用全部改带文件名形式（同目录裸引用与"第N节"作为已知局限留给 S2 的锚点系统）
- `.theme-dark` 与 `.stage-*` 不得同元素的限制取消——现在 `.stage-x.theme-dark` 复合选择器两类同元素可用

## 1.0.1 — 2026-09-15

### Fixed
- `.m-tool` 基础规则不得声明 `border-radius`（同优先级靠后会覆盖形状族圆角）——见 `components/18-component-contracts.md` §Toolbar

## 1.0.0 — 2026-09-13

### Added
- Meridian v1.0.0：三层 token（primitive → semantic → component）、双舞台规范、22 个组件契约、`ai/` 机器层
