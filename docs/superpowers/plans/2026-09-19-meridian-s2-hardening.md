# Meridian S2 Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 v1.1.0 审计发现的 D1–D10 全部缺陷，让校验门禁、对比契约、版本口径、token 卫生全部"说到做到"，并用永久回归测试钉住。

**Architecture:** 引擎层两处缺陷修复（doc 层豁免 allows + nearest-unused marker 消耗）→ token 层 accent-11 对比度修复（1.2.0 MINOR）→ 文档三处口径修正 → 孤儿 token 消费与 Combobox 参考实现 → 演示页版本/计数统一 → CI 接线 → 发布收尾。每类修复配套回归测试。

**Tech Stack:** Node 内置 `node:test`（零依赖）、纯 CSS 变量、GitHub Actions。

**Spec:** `docs/superpowers/specs/2026-09-19-meridian-s2-hardening-design.md`（问题证据 D1–D10 与裁决 R-20–R-28 在此，执行者必读）

## Global Constraints

- 零运行时依赖：不得引入任何 npm 包（测试只用 `node:test` + `node:assert/strict`）。
- 色值只允许出现在 `ai/tokens.css` / `ai/tokens.json`（R01/R11 契约）；测试文件里的十六进制断言值属测试数据，允许。
- 版本纪律：本轮升 **1.2.0**；`ai/tokens.json` 的 `$version` 是唯一声明，README / tokens.css 头 / meridian-ui.css 头 / design-system.html / CHANGELOG 必须一致。
- 不要重写 `ai/selfcheck/acceptance.test.mjs` 的 14 条规则断言（它们是 S1 的合同）。
- 每个任务收尾必须跑 `npm test` 确认无新增失败后才能 commit。
- 提交信息格式沿用仓库惯例：`fix(design-system): …` / `feat(ui): …` / `docs: …` / `test: …` / `chore(release): …`。
- Windows + Git Bash 环境：路径统一正斜杠；编辑用 Edit 工具按 grep 输出精确匹配，不赌 sed。

---

### Task 1: 引擎缺陷修复（D2 O8 + D3 marker 匹配）

**Files:**
- Modify: `ai/lib/engine.mjs`（run() 两处）
- Modify: `ai/lib/engine.test.mjs`（追加 2 条测试；**不要动 ：270 已有测试**，Task 7 处理它）
- Modify: `docs/00-open-decisions.md`（O8 段落收尾）

**Interfaces:**
- Produces: `run({ files, rules, cfg, fs })` 行为不变式 —— doc 层永不产 staleAllows；marker 消耗取"最近且未消耗"的行。后续任务依赖退出码为 0。

- [ ] **Step 1: 读现有测试摸清模式**

读 `ai/lib/engine.test.mjs` 全文，确认 `run` 的 import 方式与既有断言风格（该文件约 270+ 行；270 行附近的 `CLI: 位置参数缺失时目标为仓库根` 测试原样保留）。

- [ ] **Step 2: 写失败测试（D3：marker 取最近未用行）**

在 `ai/lib/engine.test.mjs` 末尾追加（`parseCss` 若该文件未引入则从 `./parse-css.mjs` import）：

```js
test("marker 消耗取最近未用行：相邻违规各消耗各自 marker，不再抢先（D3 回归）", () => {
  const css = [
    ".a { animation: x 0.7s linear infinite; /* meridian-allow: spin-a */ }",
    "",
    ".b { animation: y 0.9s linear infinite; /* meridian-allow: spin-b */ }",
  ].join("\n");
  const file = { path: "src/x.css", layer: "feature", text: css, facts: parseCss(css) };
  const { violations, staleAllows } = run({ files: [file], rules });
  assert.equal(staleAllows.length, 0, `不应有 stale: ${JSON.stringify(staleAllows)}`);
  assert.equal(violations.length, 0, `两处违规都应被各自 marker 吸收: ${JSON.stringify(violations)}`);
});
```

（修复前行为：行 3 的违规被行 1 的 marker 抢先消耗（`|1-3|=2` 仍命中 near），行 3 marker 判 stale → 测试红。）

- [ ] **Step 3: 写失败测试（D2：doc 层不收集 allows）**

```js
test("doc 层不收集 meridian-allow（O8 治本）：文档示例 marker 不再误报 stale", () => {
  const md = "# 示例\n\n| 写法 | 说明 |\n|---|---|\n| `/* meridian-allow: 示例 */` | 无理由不生效 |";
  const file = { path: "docs/x.md", layer: "doc", text: md, facts: [] };
  const fakeRule = {
    id: "R98", title: "test-doc", layers: ["doc"], facts: ["doc-ref"], offInDemo: false,
    check: () => [{ line: 4, message: "ref" }],
  };
  const { violations, staleAllows } = run({ files: [file], rules: [fakeRule] });
  assert.equal(violations.length, 1, "doc 层违规照报");
  assert.equal(staleAllows.length, 0, "doc 层不是被审计代码，marker 文本不判 stale");
});
```

- [ ] **Step 4: 跑测试确认两条新测试失败**

Run: `node --test ai/lib/engine.test.mjs`
Expected: 恰好 2 条新测试 FAIL（D3 那条 staleAllows=1；D2 那条 staleAllows=1），其余保持原状。

- [ ] **Step 5: 修 `ai/lib/engine.mjs`**

两处最小改动：

```js
// ① run() 内，collectAllows 调用处改为（O8：文档不是被审计代码）：
const allows = file.layer === "doc"
  ? { byLine: new Map(), regions: [] }
  : collectAllows(file.text ?? "");
```

```js
// ② marker 消耗改为"未消耗者优先、行距最近者胜"（D3）：
const marker = [...allows.byLine.keys()]
  .filter((l) => !used.has(l) && near(l, line))
  .sort((a, b) => Math.abs(a - line) - Math.abs(b - line))[0];
```

文件头注释补一行：`// doc 层不收集 allows（O8，S2）：文档里的 marker 语法示例不是被审计代码。`

- [ ] **Step 6: 跑测试确认全过 + 全套不回归**

Run: `node --test ai/lib/engine.test.mjs && npm test`
Expected: engine.test 全过；全套除 `engine.test.mjs:270` 那条**已知失败**外全过（135+2 pass / 1 fail）。

- [ ] **Step 7: 跑门禁确认 stale 只剩 meridian-ui.css:163 一条**

Run: `node ai/validate.mjs . --exclude ai/selfcheck/fixtures --json`
Expected: staleAllows 收敛为 1 条（`ai/meridian-ui.css:163 shimmer-cycle-by-spec`——D3 根因修复后该 marker 应被正确消耗；若仍 stale，用 systematic-debugging 查 R03 对该行违规的实际行号，**禁止**用"挪 marker 行"绕行）。

- [ ] **Step 8: 收尾 O8 记录**

`docs/00-open-decisions.md` 的 `## O8（新增）` 段落标题改为 `## O8（已解决 · S2）`，段末追加一行：

```markdown
**S2 处置**：`engine.run()` 对 `layer === "doc"` 跳过 `collectAllows`（文档不是被审计代码），回归测试钉在 `ai/lib/engine.test.mjs`。
```

- [ ] **Step 9: Commit**

```bash
git add ai/lib/engine.mjs ai/lib/engine.test.mjs docs/00-open-decisions.md
git commit -m "fix(engine): O8 doc 层豁免 allows + marker 最近未用行消耗（D2/D3）"
```

---

### Task 2: accent-11 对比度修复 + 对比契约永久回归 + 版本 1.2.0（D4 + R-22/R-26）

**Files:**
- Modify: `ai/tokens.json`（accent.primitive."11"、$version）
- Modify: `ai/tokens.css`（--m-accent-11、文件头版本号）
- Modify: `ai/meridian-ui.css`（文件头版本号）
- Modify: `README.md`（第 3 行版本号）
- Create: `ai/selfcheck/contrast.test.mjs`

**Interfaces:**
- Produces: `--m-accent-11: #8A5E09`（accent-2 上 ≥4.5、白底 ≥5.5）；版本 1.2.0 遍布 5 处（design-system.html 归 Task 6）。contrast.test.mjs 导出内部函数不要求，测试自足。

- [ ] **Step 1: 写失败测试 `ai/selfcheck/contrast.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// ---- 从 tokens.css 解析：块感知的首定义浅色表 + 深色块切取 ----
const css = readFileSync("ai/tokens.css", "utf8");

function declsOf(text) {
  const map = new Map();
  for (const m of text.matchAll(/--m-([\w-]+)\s*:\s*([^;]+);/g)) {
    if (!map.has(m[1])) map.set(m[1], m[2].trim()); // 首定义 = 浅色基准（覆盖块在后）
  }
  return map;
}
function resolve(name, defs, seen = new Set()) {
  const v = defs.get(name);
  if (v === undefined || seen.has(name)) return undefined;
  const ref = v.match(/^var\(--m-([\w-]+)\)$/);
  if (ref) { seen.add(name); return resolve(ref[1], defs, seen); }
  return v;
}
const hex = (v) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? v : undefined);

const L = declsOf(css.slice(0, css.indexOf("ADMIN DARK")));
// 深色块：从 Dark 注释头切到 LAYER 3 组件层
const darkSlice = css.slice(css.indexOf("SEMANTIC · Dark"), css.indexOf("LAYER 3 — COMPONENT"));
const D = declsOf(darkSlice);

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    let c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// docs/02 §六 + 状态族五件套的浅色契约（fg, bg, min）——fg/bg 均为 tokens.css 的 token 名（不带 --m-）
const LIGHT = [
  ["fg", "bg-page", 14], ["fg-muted", "bg-page", 4.5], ["fg-subtle", "bg-page", 4.5],
  ["fg-link", "bg-page", 4.5], ["price-sale", "bg-page", 4.5],
  ["success-fg", "success-bg", 4.5], ["warning-fg", "warning-bg", 4.5],
  ["critical-fg", "critical-bg", 4.5], ["info-fg", "info-bg", 4.5],
  ["emphasis-fg", "emphasis-bg", 4.5],            // D4 修复目标（v1.1 实测 4.41）
  ["critical-solid-fg", "critical-solid", 4.5], ["info-solid-fg", "info-solid", 4.5],
  ["success-solid-fg", "success-solid", 4.5],
  ["warning-solid-fg", "warning-solid", 7], ["emphasis-solid-fg", "emphasis-solid", 7],
  ["border", "bg-surface", 1.3],                   // 装饰基线（docs/02 §六 修正后的口径）
];
// 实底白字对（primary 在 admin 舞台 = brand-9，直接用 primitive 断言）
const LIGHT_PRIM = [
  ["#FFFFFF", resolve("primary", { ...L, primary: "var(--m-brand-9)" }), 4.5],
];
const DARK = [
  ["fg", "bg-surface", 4.5], ["fg-muted", "bg-surface", 4.5], ["fg-subtle", "bg-surface", 4.5],
  ["fg-link", "bg-surface", 4.5], ["price-sale", "bg-surface", 4.5],
  ["success-fg", "bg-surface", 4.5], ["warning-fg", "bg-surface", 4.5],
  ["critical-fg", "bg-surface", 4.5], ["info-fg", "bg-surface", 4.5],
  ["emphasis-fg", "bg-surface", 4.5],
];

test("对比契约回归（docs/02 §六 + 状态族五件套，浅色）", () => {
  for (const [fg, bg, min] of LIGHT) {
    const f = hex(resolve(fg, L)), b = hex(resolve(bg, L));
    assert.ok(f && b, `token 可解析为 hex: ${fg}=${f} ${bg}=${b}`);
    const r = ratio(f, b);
    assert.ok(r >= min, `${fg}/${bg} = ${r.toFixed(2)} < ${min}（${f} on ${b}）`);
  }
});
test("主实底白字（admin primary = brand-9）", () => {
  const [f, b, min] = LIGHT_PRIM[0];
  assert.ok(ratio(f, b) >= min, `brand-9 白字 = ${ratio(f, b).toFixed(2)}`);
});
test("对比契约回归（深色语义块）", () => {
  for (const [fg, bg, min] of DARK) {
    const f = hex(resolve(fg, D)), b = hex(resolve(bg, D));
    assert.ok(f && b, `深色 token 可解析: ${fg}=${f} ${bg}=${b}`);
    assert.ok(ratio(f, b) >= min, `dark ${fg}/${bg} = ${ratio(f, b).toFixed(2)} < ${min}`);
  }
});
test("tokens.json 与 tokens.css 的 accent-11 同步", () => {
  const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));
  assert.equal(json.color.primitive.accent["11"], resolve("accent-11", L));
});
```

注意：`declsOf` 的首定义策略对深色块内切片同样成立（dark 块内每个 token 只声明一次）。`ADMIN DARK` 切点之前 `.stage-admin` 浅色块会先声明部分 token——首定义即 :root 前台值，正是契约表的校准基准；若某 token 首定义被 admin 块抢先导致断言失败，改为按块解析并把本表锚定 `:root, .stage-storefront` 块（实现者可自行加强解析，但断言值不得放宽）。

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/selfcheck/contrast.test.mjs`
Expected: FAIL，报 `emphasis-fg/emphasis-bg = 4.41 < 4.5`。

- [ ] **Step 3: 修 accent-11**

`ai/tokens.css`：
```css
  --m-accent-11: #8A5E09;  /* 琥珀色文本（v1.2 加深：accent-2 上 5.0:1，修复 4.41 不达标） */
```
`ai/tokens.json` accent 色带：`"11": "#8A5E09"`。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test ai/selfcheck/contrast.test.mjs && npm test`
Expected: 全过（accent-11 加深只影响浅色 emphasis 文本对 tint 的对比，其余色带值未动）。

- [ ] **Step 5: 版本号 1.2.0（4 处；design-system.html 归 Task 6）**

- `ai/tokens.json`：`"$version": "1.2.0"`
- `ai/tokens.css` 头注释：`MERIDIAN DESIGN SYSTEM — Design Tokens v1.2.0`
- `ai/meridian-ui.css` 头注释：`MERIDIAN UI — 参考组件库 v1.2.0`
- `README.md` 第 3 行：`**面向欧美市场的企业级电商视觉设计规范** · v1.2.0 · 2026-09-19`

Run: `node --test ai/selfcheck/tokens-sync.test.mjs`（若该测试断言版本一致性，此刻必须过）
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ai/tokens.json ai/tokens.css ai/meridian-ui.css README.md ai/selfcheck/contrast.test.mjs
git commit -m "fix(tokens): accent-11 #96660A→#8A5E09 修复 emphasis 族 4.41 对比度；新增对比契约回归测试；v1.2.0"
```

---

### Task 3: 文档口径修正（D5 border 数字 + D6 11px）

**Files:**
- Modify: `docs/02-color-system.md`（§六 border 行）
- Modify: `components/18-component-contracts.md`（:159 合规小字行）

**Interfaces:** 无代码接口；产出的是与实测一致的契约文本。

- [ ] **Step 1: 修正 docs/02 §六 border 行**

定位（精确串）：
```
| `border` (ink-5) | `bg-surface` | ≥1.6:1 | 装饰边框（非语义）——语义边界用 `border-strong` |
```
替换为：
```
| `border` (ink-5) | `bg-surface` | ≈1.3:1 | 装饰边框基线（非语义、无 WCAG 义务；实测 1.33:1，v1.2 修正旧表 ≥1.6 的笔误）——语义边界用 `border-strong`（≥3:1） |
```

- [ ] **Step 2: 修正 18 章合规小字行**

定位 `components/18-component-contracts.md` 中：
```
| 合规小字 | 固定 11px + `fg-subtle`；位于容器**外部**下方（不属于工具栏基线） |
```
替换为：
```
| 合规小字 | 固定 12px（`--m-text-xs`）+ `fg-subtle`；位于容器**外部**下方（不属于工具栏基线）。v1.1 迁移说明曾声称已改 12px 但文档漏改，v1.2 补齐 |
```

- [ ] **Step 3: 全仓验证无残留**

Run: `grep -rn "1.6:1" docs/ components/ --include="*.md"; grep -rn "11px" components/ docs/ --include="*.md" | grep -v superpowers`
Expected: 均无输出（或仅剩与规格无关的历史记录）。

- [ ] **Step 4: Commit**

```bash
git add docs/02-color-system.md components/18-component-contracts.md
git commit -m "docs: border 契约值修正为实测 ≈1.3:1；18 章合规小字补齐 12px 口径（D5/D6）"
```

---

### Task 4: 孤儿 token 消费（D8 + R-24）

**Files:**
- Modify: `ai/meridian-ui.css`（3 处：placeholder、host-selected、新增 .m-badge--promo）
- Modify: `ai/tokens.css`（--m-state-dragged 注释）
- Modify: `components/18-component-contracts.md`（Badge tone 枚举 + promo 变体说明）
- Modify: `design-system.html`（c20 Badge 演示加 promo 例）
- Create: `ai/selfcheck/orphans.test.mjs`

**Interfaces:**
- Produces: `.m-badge--promo` 类（demo 与业务可用）；`ai/selfcheck/orphans.test.mjs` 白名单制孤儿守卫。

- [ ] **Step 1: meridian-ui.css 三处接线**

① 第 22 行附近（全局 placeholder）：
```css
::placeholder { color: var(--m-input-placeholder); }
```
② `.m-host-selected`（Surface helpers 区）：
```css
.m-host-selected { background: color-mix(in oklab, var(--m-fg) var(--m-state-selected), transparent); }
```
③ `.m-badge--emphasis` 之后新增：
```css
.m-badge--promo { --_fg: var(--m-badge-promo-fg); --_bg: var(--m-badge-promo-bg); --_border: var(--m-emphasis-border); --_solid: var(--m-emphasis-solid); --_solid-fg: var(--m-emphasis-solid-fg); }
```
（默认值与 emphasis 同值——promo 是品牌覆盖点：商家改 `--m-badge-promo-*` 即可整体换促销徽章配色，不必动 emphasis 语义。）

- [ ] **Step 2: tokens.css 注释声明 API 面**

`--m-state-dragged` 行尾注释改为：
```css
  --m-state-dragged: 16%;   /* M3 公式完备集成员；暂无组件消费者，供业务拖拽态使用 */
```

- [ ] **Step 3: 18 章 Badge 契约同步**

`components/18-component-contracts.md` Badge 代码块内 tone 行：
```
tone: success | warning | critical | info | emphasis | promo | neutral | ai
```
并在该代码块下方补一句：
```
`promo` 与 `emphasis` 默认同值，独立 `--m-badge-promo-*` token 供品牌整体覆盖促销徽章配色。
```

- [ ] **Step 4: 演示页 c20 Badge 加 promo 例**

读 `design-system.html` 的 c20 demo 块，在 badge 例组内追加：
```html
<span class="m-badge m-badge--tint m-badge--promo">Promo</span>
```

- [ ] **Step 5: 写孤儿守卫 `ai/selfcheck/orphans.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = ["ai/tokens.css", "ai/meridian-ui.css", "ai/tailwind-theme.css", "design-system.html"];
const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
const defined = [...text.matchAll(/^\s*(--m-[\w-]+)\s*:/gm)].map((m) => m[1]);
const used = new Set([...text.matchAll(/var\((--m-[\w-]+)/g)].map((m) => m[1]));
// primitive 色带是设计者的调色盘，允许无实现消费者（设计系统惯例）
const PRIM = /^--m-(ink|brand|accent|info|success|warning|danger|mystic)-\d+$/;
// 业务代码 API 面：实现层按定义不消费，由业务侧取用（含响应式 clamp、断点、M3 完备公式成员）
const API_SURFACE = new Set([
  "--m-space-16", "--m-space-20", "--m-space-24", "--m-space-section",
  "--m-bp-xs", "--m-bp-sm", "--m-bp-md", "--m-bp-lg", "--m-bp-xl",
  "--m-duration-600", "--m-state-dragged",
]);

test("非 primitive token 无孤儿（白名单制，D8 回归）", () => {
  const orphans = [...new Set(defined)].filter(
    (t) => !PRIM.test(t) && !API_SURFACE.has(t) && !used.has(t)
  );
  assert.deepEqual(orphans, [], `孤儿 token（消费或加白名单）: ${orphans.join(", ")}`);
});
```

- [ ] **Step 6: 跑测试与全套**

Run: `node --test ai/selfcheck/orphans.test.mjs && npm test`
Expected: 全过（若冒出白名单外的孤儿，先消费再考虑加白名单，不许删 token——删除 = MAJOR）。

- [ ] **Step 7: Commit**

```bash
git add ai/meridian-ui.css ai/tokens.css components/18-component-contracts.md design-system.html ai/selfcheck/orphans.test.mjs
git commit -m "feat(ui): 消费孤儿 token（promo 徽章变体/placeholder/selected 态层）+ 孤儿守卫测试（D8）"
```

---

### Task 5: Combobox 参考实现 + 契约指认（D9 + R-25）

**Files:**
- Modify: `ai/meridian-ui.css`（§02 表单控件区追加 .m-combobox）
- Modify: `components/18-component-contracts.md`（Input 区补参考实现指认）
- Modify: `design-system.html`（c10 演示改用 .m-combobox）

**Interfaces:**
- Produces: `.m-combobox`、`.m-combobox__list/__opt/__empty`、`.is-open` 开合类（与 .m-popover 同约定）。键盘路径归 S4 行为层。

- [ ] **Step 1: meridian-ui.css 追加参考实现**

在 `.m-search` 块之后（§02 Form controls 内）插入：

```css
/* Combobox（可搜索选择）样式参考：input + listbox 两段式。
   键盘路径（↑↓ Enter Esc）与 aria-combobox 组合由行为层实现（S4）；
   开合用 .is-open，与 .m-popover 同约定。 */
.m-combobox { position: relative; display: block; }
.m-combobox .m-input { padding-inline-end: 36px; }
.m-combobox__list { position: absolute; top: calc(100% + 4px); inset-inline: 0; z-index: var(--m-z-raised);
  background: var(--m-bg-surface); border: 1px solid var(--m-border); border-radius: var(--m-radius-md);
  box-shadow: var(--m-shadow-e2); padding: var(--m-space-1); display: none; max-height: 240px; overflow: auto; }
.m-combobox.is-open .m-combobox__list { display: block; }
.m-combobox__opt { display: flex; justify-content: space-between; align-items: center; gap: var(--m-space-2);
  padding: var(--m-space-2); border-radius: var(--m-radius-sm); font-size: var(--m-text-sm); cursor: pointer; }
.m-combobox__opt:hover, .m-combobox__opt.is-active { background: var(--m-bg-surface-selected); }
.m-combobox__opt[aria-selected="true"] { background: var(--m-primary-tint); color: var(--m-primary-text); font-weight: var(--m-weight-medium); }
.m-combobox__empty { padding: var(--m-space-2); font-size: var(--m-text-sm); color: var(--m-fg-subtle); }
```

- [ ] **Step 2: 18 章指认参考实现**

`components/18-component-contracts.md` 的 "Input / Select / Textarea / Combobox" 段末追加一句：

```
参考实现（ai/meridian-ui.css）：Input/Select/Textarea = §02 表单控件；Combobox = `.m-combobox`；CommandPalette = `.m-palette`（§04 Overlays）。
```

- [ ] **Step 3: c10 演示改用真实类**

读 `design-system.html` 的 c10 demo 块，将其 input+列表标记改写为：

```html
<div class="m-combobox is-open" style="max-width:280px">
  <input class="m-input" type="text" role="combobox" aria-expanded="true" aria-label="Search country"
         placeholder="Search country…" value="Ch">
  <div class="m-combobox__list" role="listbox">
    <div class="m-combobox__opt" aria-selected="true"><span>China</span><kbd>CN</kbd></div>
    <div class="m-combobox__opt"><span>Chile</span><kbd>CL</kbd></div>
    <div class="m-combobox__opt"><span>Colombia</span><kbd>CO</kbd></div>
  </div>
</div>
```

（保留原 demo 的交互脚本可点开合；若原块是纯静态展示则替换为上述静态结构。）

- [ ] **Step 4: 验证 + Commit**

Run: `node ai/validate.mjs ai/meridian-ui.css design-system.html --json && npm test`
Expected: 0 violations（新增 CSS 全部走 token）；测试全过。

```bash
git add ai/meridian-ui.css components/18-component-contracts.md design-system.html
git commit -m "feat(ui): .m-combobox 参考实现接入 c10 演示；18 章指认 CommandPalette=.m-palette（D9）"
```

---

### Task 6: 演示页版本/计数统一（D7 + R-27）

**Files:**
- Modify: `design-system.html`（版本串 ×4、计数 ×2、缓存戳）
- Modify: `README.md`（治理条款 1 行）

**Interfaces:** 无；产出为全仓版本口径 1.2.0 的最后两处。

- [ ] **Step 1: 逐处修正（用 Edit 按精确串匹配）**

| 位置 | 旧 | 新 |
|---|---|---|
| :6 `<title>` | `可视化设计规范 v1.0` | `可视化设计规范 v1.2.0` |
| :145 logo small | `Design System v1.0` | `Design System v1.2.0` |
| :176 hero 统计 | `<span><b>87</b> 个组件契约</span>` | `<span><b>22</b> 组件契约 · <b>87</b> 演示组件</span>` |
| :159 侧栏导航 | `组件 ×80 Components` | `组件 ×87 Components` |
| :839 footer | `Meridian Design System v1.0.0 · 2026-09-13` | `Meridian Design System v1.2.0 · 2026-09-19` |
| :7-8 样式引用 | `tokens.css?v=11` / `meridian-ui.css?v=11` | `?v=12` |

- [ ] **Step 2: README 治理条款纳入演示页**

定位 README.md 中：`版本以 \`ai/tokens.json\` 的 \`$version\` 为唯一声明，README / tokens.css / meridian-ui.css / CHANGELOG 必须一致。`
替换为：`版本以 \`ai/tokens.json\` 的 \`$version\` 为唯一声明，README / tokens.css / meridian-ui.css / design-system.html / CHANGELOG 必须一致。`

- [ ] **Step 3: 全仓版本串核验**

Run: `grep -rn "v1\.[012]" design-system.html README.md ai/tokens.json ai/tokens.css ai/meridian-ui.css CHANGELOG.md | grep -v "1\.0\.1"`
Expected: 除 CHANGELOG 历史条目与 18 章 "v1.0.1 新增"（历史事实，保留）外，全部为 1.2.0。

- [ ] **Step 4: Commit**

```bash
git add design-system.html README.md
git commit -m "docs: design-system.html 版本/计数统一（v1.2.0 · 22 契约/87 演示）；README 治理纳入演示页（D7）"
```

---

### Task 7: 已知失败测试修正 + CI 接线（R-28 + D10）

**Files:**
- Modify: `ai/lib/engine.test.mjs`（:270 一条断言，按 HANDOFF §3 配方）
- Create: `.gitattributes`
- Create: `.github/workflows/ci.yml`

**Interfaces:** 无；产出为可全绿的 `npm test` 与 CI 双闸（测试 + 校验器）。

- [ ] **Step 1: 修正 engine.test.mjs:270**

先跑 `node --test ai/lib/engine.test.mjs` 观察 `CLI: 位置参数缺失时目标为仓库根` 的实际断言（它断言了 T17 判定下不可能成立的期望）。按 HANDOFF §3 配方改为断言真实契约——全仓扫描必然命中 fixtures 植红，退出码 1：

```js
// T17 判定 + R-28：默认目标=仓库根时，14 条规则全开必然命中 fixtures 植红 → exit 1。
// 旧断言期望退出 0 是 v1 时代"仓库无违规"的残留期望，与本仓恒有 60 条植红相矛盾。
assert.equal(runCli(["."]).code, 1);
```

（以文件内实际的 CLI 调用辅助函数名为准；只改期望值与注释，不改测试结构。）

- [ ] **Step 2: 全套确认全绿**

Run: `npm test`
Expected: **0 fail**（历史首次全绿）。

- [ ] **Step 3: 写 `.gitattributes`**

```
* text=auto eol=lf
```

- [ ] **Step 4: 写 `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  push:
  pull_request:
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: 单元与回归测试
        run: npm test
      - name: 设计合规门禁
        run: node ai/validate.mjs . --exclude ai/selfcheck/fixtures
```

- [ ] **Step 5: 本地等效验证 + Commit**

Run: `node --test "ai/selfcheck/**/*.test.mjs" "ai/lib/**/*.test.mjs" && node ai/validate.mjs . --exclude ai/selfcheck/fixtures && echo GATE-GREEN`
Expected: 全绿，末行 `GATE-GREEN`。

```bash
git add ai/lib/engine.test.mjs .gitattributes .github/workflows/ci.yml
git commit -m "test+ci: engine.test:270 改断真实契约（R-28）；CI 双闸 + .gitattributes eol=lf（D10）"
```

---

### Task 8: 发布收尾（CHANGELOG + 全量验收）

**Files:**
- Modify: `CHANGELOG.md`（新增 1.2.0 条目）
- Modify: `.superpowers/sdd/2026-09-19-meridian-s2-hardening/progress.md`（ledger 收尾，gitignore 内不提交）

**Interfaces:** 无；最终状态 = spec §3 验收标准全绿。

- [ ] **Step 1: CHANGELOG 1.2.0 条目**

插入到 `## 1.1.0` 之前：

```markdown
## 1.2.0 — 2026-09-19

### Fixed
- 校验引擎两处缺陷：① doc 层不再收集 `meridian-allow`（O8 治本，文档示例 marker 不再误报 stale）；② marker 消耗改为"未消耗优先、行距最近"，相邻违规不再被远端 marker 抢先吸收（v1.1 遗留的 `meridian-ui.css` shimmer stale 由此根除）
- `--m-accent-11` `#96660A` → `#8A5E09`：修复 emphasis 族 `*-fg/*-bg` 实测 4.41 < 4.5 的对比度破约（accent-2 上现为 5.0:1，白底 5.7:1；色相不变，图表色板不受影响）
- docs/02 §六 `border/bg-surface` 契约值 ≥1.6:1 → 实测 ≈1.3:1（装饰性基线，非语义边界无 WCAG 义务）
- components/18 合规小字 11px → 12px（补齐 v1.1 迁移说明声称但漏改的口径）
- design-system.html 版本/计数统一（v1.2.0 · 22 契约 / 87 演示）；README 治理条款将演示页纳入版本一致性清单

### Added
- `ai/selfcheck/contrast.test.mjs`：对比契约永久回归（浅色 §六 全表 + 状态族五件套 + 深色语义块，tokens.json↔css 同步断言）
- `ai/selfcheck/orphans.test.mjs`：非 primitive token 零孤儿守卫（业务 API 面白名单制）
- `.m-combobox` 参考实现接入 c10 演示；18 章指认 CommandPalette 参考实现 = `.m-palette`
- `.m-badge--promo` 促销徽章变体（默认与 emphasis 同值，品牌可经 `--m-badge-promo-*` 独立覆盖）
- 孤儿 token 消费：`--m-input-placeholder`（placeholder）、`--m-state-selected`（host-selected 态层）；`--m-state-dragged` 声明为 M3 公式完备集成员
- GitHub Actions CI（npm test + 校验门禁双闸）与 `.gitattributes eol=lf`

### Changed
- 版本纪律执行：primitive 改值 → MINOR（1.1.0 → 1.2.0）
```

- [ ] **Step 2: 全量验收（spec §3 六条逐项）**

```bash
npm test
node ai/validate.mjs . --exclude ai/selfcheck/fixtures
node --test ai/selfcheck/contrast.test.mjs ai/selfcheck/orphans.test.mjs
grep -rn "11px" components/ docs/ --include="*.md" | grep -v superpowers
grep -rn "v1\.[012]" design-system.html README.md ai/tokens.json ai/tokens.css ai/meridian-ui.css CHANGELOG.md | grep -v "1\.0\.1"
```
Expected: 测试 0 fail；校验 `✓ … 0 violations` 且无 stale 段落、退出码 0；两个新测试全过；两条 grep 无规格性残留。

- [ ] **Step 3: ledger 收尾 + Commit**

更新工作区 `progress.md`（本任务的裁定与代价），然后：

```bash
git add CHANGELOG.md
git commit -m "chore(release): v1.2.0 — S2 hardening：门禁全绿 + 对比契约回归 + 口径统一"
```

---

## Self-Review 记录

- **Spec 覆盖**：D1(=D2+D3)→T1；D4→T2；D5/D6→T3；D7→T6；D8→T4；D9→T5；D10→T7；验收→T8。R-20（分支）已执行；R-21/R-22/R-23/R-24/R-25/R-26/R-27/R-28 分别落位 T1/T2/T3/T4/T5/T2+T4/T6/T7。无缺口。
- **占位符扫描**：T1 Step 7 与 T5 Step 3 含"以实际为准"的现场侦查指令（systematic-debugging / 读现有块后改写），均给出了判定标准与预期输出，不属于无内容步骤。
- **类型一致性**：`run({files,rules,cfg,fs})`、`declsOf/resolve/hex`（T2 内部自足）、`.m-combobox__*` 类名在 T5 两处一致；`.m-badge--promo` 在 T4 三处（css/契约/demo）一致。
