# Meridian S1 机器层修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `ai/AGENTS.md:3` 的"非合规 = 构建失败"成为可执行事实——校验器从 6 条行正则升级为 14 条事实级规则（零依赖、精确集合断言的 fixture 回归），并把规范自身洗到 0 违规。

**Architecture:** 三段内核 `classify(path) → scan(file) → rule.on(fact)`。CSS 逐声明、标记逐标签/逐类名、文档逐引用，规则只消费归一化事实流，不再对整行跑正则。JSX 内联 `style={{zIndex:9999}}` 在扫描阶段归一为 CSS 声明（camelCase→kebab），于是 R02/R03/R05/R07/R08/R15 共用一条判定路径。例外从文件级白名单改为行级 `meridian-allow: <reason>` + 失效检测。

**Tech Stack:** Node 24（内置 `node:test` / `node:assert`）、ESM、零第三方依赖、纯 JS。产物全为 `.mjs` + `.md` + `.css` + `.json`。

**Spec:** `docs/superpowers/specs/2026-09-19-meridian-s1-machine-layer-design.md`（论证以该文件为准；git 基线 `143edd0`）

## Global Constraints

每个任务的隐含要求，逐条取自 spec，值原样抄录：

- 零第三方依赖。不得引入 `npm install`；`ai/` 整目录拷进项目必须仍可运行。
- 测试只用 Node 内置：`node --test`；`package.json` 仅含 `"type":"module"` 与 scripts。
- CLI 向后兼容：`node ai/validate.mjs <dir>` 的入口路径与首个位置参数语义不变（README:63、AGENTS.md:98、prompts.md 三处引用不改写）。
- 规则 ID：`R01 R02 R03 R04 R05 R07 R08 R09 R10 R11 R12 R13 R14 R15`（`R06` 由 `R10` 取代，编号保留空缺不复用）。共 14 条，全部 `error` 级。
- 不变量 A：每条 error 级规则必须当场存在合规写法；无合规写法的规则一律不得添加。
- 不变量 B：每条规则至少 1 个真阳性 + 1 个真阴性 fixture；断言为命中集合相等（漏报与误报同样红）。
- 不变量 C：`manifest.json` 由 `--emit-manifest` 生成后人工审阅，禁止手写行号。
- 字号地板：**12px，零例外**（`--m-text-xs` 即最小级）。
- 舞台默认：`:root` = Storefront 浅色；后台必须显式 `.stage-admin`。
- 新增语义 token 必须**同时**写入 `ai/tokens.json`（6 个，见 Task 13）。
- token 前缀 `--m-`；feature/component 层禁止出现 primitive `--m-(ink|brand|accent|info|success|warning|danger|mystic)-N`。
- 换行：一律 `split(/\r?\n/)`、值 `trim()`（Windows 工作区 CRLF）。
- 不得故意写入"待删冗余"或占位实现；每个 code step 的内容就是最终内容。
- 每任务结束时 `node --test` 与 `node ai/validate.mjs .` 必须可运行，并提交一次。
- 本仓库未配置 git 身份；提交统一用 `git -c user.name="Meridian DS" -c user.email="meridian-ds@local"`（不改持久配置）。

---

## 文件结构

```
package.json              零依赖：type=module + test/lint scripts（T1）
meridian.config.json      ignore / componentAliases / demoRegions / baseline（T1）
ai/
├── validate.mjs          入口：参数、遍历、事实装配、报告/退出码（T6 重写）
├── checks/
│   ├── index.mjs         规则注册表（T6）
│   ├── allow.mjs         meridian-allow / 区段解析（T6）
│   └── r01-raw-color.mjs … r15-rtl-logical.mjs   一规则一文件（T7–T9）
├── lib/
│   ├── classify.mjs      路径 → layer（T2）
│   ├── parse-css.mjs     剥注释 + 逐声明（T3）
│   ├── parse-markup.mjs  标签/属性/类名/style→decl（T4）
│   ├── parse-doc.mjs     章节与版本引用 → docref（T9）
│   ├── scale.mjs         px 归一、4 网格、字阶/圆角/时长菜单（T5）
│   ├── facts.mjs         按 layer 装配事实流（T6）
│   └── engine.mjs        run/applyBaseline/format（T6）
├── selfcheck/
│   ├── fixtures/<Rxx>/{pass,fail}/<file>          反例与正例（T7–T10）
│   ├── manifest.json     生成后审阅的期望命中集（T10）
│   ├── rules.test.mjs    集合相等断言（T10）
│   ├── focus-ring.test.mjs（T11）· stage.test.mjs（T12）· tokens-sync.test.mjs（T13）
│   └── orphans.test.mjs（T15）· docs-consistency.test.mjs（T16）· acceptance.test.mjs（T17）
├── tokens.css            焦点环单点(T11) + 舞台重排(T12) + 6 新 token(T13) + 阶位表指向(T16) + 版本(T17)
├── tailwind-theme.css    删重复焦点环(T11)、body 走 --m-body-fs(T12)
├── meridian-ui.css       焦点/舞台/越权/字号/方向清零(T11–T13) + 间距归位(T14) + .m-toast 与密度(T15)
├── tokens.json           同步 6 新 token(T13) + $version(T17)
├── AGENTS.md             规则↔条款映射与局限(T10)、Root class 行(T12)、密度口径(T15)
└── prompts.md            stage 类写入 5 个模板（T12）
CHANGELOG.md              1.0.0 / 1.0.1 / 1.1.0（T16）
MIGRATION-1.1.md          迁移说明（T17）
docs/00-open-decisions.md 8 项待决 + 校验器局限（T16）
docs/01,02,07 · README · components/18 · admin/*   文档一致性批次（T13、T15–T17）
```

设计要点：`facts.mjs` 从 `validate.mjs` 抽出，使 CLI 与测试共用同一事实装配（否则测试通过≠CLI 通过，正是 v1 假绿的成因）。

---

## Phase 1 · 内核

### Task 1: 工程基线与配置骨架

**Files:**
- Create: `package.json`
- Create: `meridian.config.json`
- Create: `ai/selfcheck/config.test.mjs`

**Interfaces:**
- Consumes: 无
- Produces: `npm test` → `node --test ai/selfcheck ai/lib`；`npm run lint` → `node ai/validate.mjs . && npm test`；配置形状 `{ignore:string[], componentAliases:Record<string,string[]>, demoRegions:Record<string,string[]>, baseline:string|null}`

- [ ] **Step 1: 写 `package.json`**

```json
{
  "name": "meridian-design-system",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test ai/selfcheck ai/lib",
    "lint": "node ai/validate.mjs . && npm test"
  }
}
```

- [ ] **Step 2: 写 `meridian.config.json`**

```json
{
  "ignore": ["node_modules", ".git", "_audit", ".mimosa", "docs/superpowers"],
  "componentAliases": { "Urgency": [], "Price": [], "ReviewItem": [] },
  "demoRegions": { "design-system.html": ["ramp-demo"] },
  "baseline": null
}
```

- [ ] **Step 3: 写配置自述测试 `ai/selfcheck/config.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("config exposes every key the engine will read", () => {
  const cfg = JSON.parse(readFileSync("meridian.config.json", "utf8"));
  for (const k of ["ignore", "componentAliases", "demoRegions", "baseline"])
    assert.ok(k in cfg, `missing key: ${k}`);
  assert.ok(cfg.ignore.includes("_audit"));
  assert.deepEqual(cfg.demoRegions["design-system.html"], ["ramp-demo"]);
});

test("package.json is ESM with test and lint scripts", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.type, "module");
  assert.match(pkg.scripts.test, /node --test/);
  assert.match(pkg.scripts.lint, /validate\.mjs/);
});
```

- [ ] **Step 4: 跑测试**

Run: `npm test` → Expected: `pass 2`（此任务的测试是配置自述，写完即绿；无红→绿阶段）

- [ ] **Step 5: 提交**

```bash
git add package.json meridian.config.json ai/selfcheck/config.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "chore: S1 工程基线（零依赖 node:test + 校验器配置骨架）"
```

---

### Task 2: 文件分层 `lib/classify.mjs`

**Files:**
- Create: `ai/lib/classify.mjs`
- Create: `ai/lib/classify.test.mjs`

**Interfaces:**
- Consumes: `cfg.ignore`
- Produces: `classify(path: string, cfg?: {ignore:string[]}) → "define"|"component"|"demo"|"doc"|"feature"|"ignore"`；`CODE_EXT: Set<string>`

- [ ] **Step 1: 写失败测试 `ai/lib/classify.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "./classify.mjs";
const cfg = { ignore: ["_audit", ".mimosa", "node_modules"] };

test("declaration layer", () => {
  for (const p of ["ai/tokens.css", "ai/tokens.json", "ai/tailwind-theme.css", "src/styles/app-tokens.css"])
    assert.equal(classify(p, cfg), "define", p);
});
test("component layer", () => assert.equal(classify("ai/meridian-ui.css", cfg), "component"));
test("demo layer", () => assert.equal(classify("design-system.html", cfg), "demo"));
test("doc layer", () => {
  assert.equal(classify("docs/02-color-system.md", cfg), "doc");
  assert.equal(classify("README.md", cfg), "doc");
});
test("feature layer", () => {
  for (const p of ["src/App.tsx", "src/legacy.js", "packages/ui/x.vue", "src/s.css", "app/page.html"])
    assert.equal(classify(p, cfg), "feature", p);
});
test("ignored paths win over everything", () => {
  assert.equal(classify("_audit/contrast.mjs", cfg), "ignore");
  assert.equal(classify(".mimosa/reports/x.json", cfg), "ignore");
  assert.equal(classify("node_modules/x/y.tsx", cfg), "ignore");
});
test("unknown extension is ignore, not feature", () =>
  assert.equal(classify("assets/photo.avif", cfg), "ignore"));
test("dot dirs are ignored even when not listed", () =>
  assert.equal(classify(".cache/tmp/x.css", { ignore: [] }), "ignore"));
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/lib/classify.test.mjs` → Expected: `Cannot find module './classify.mjs'`

- [ ] **Step 3: 实现 `ai/lib/classify.mjs`**

```js
const DEFINE_RE = /(^|\/)([\w.-]*tokens\.(css|json)|tailwind-theme\.css)$/;
const COMPONENT = new Set(["ai/meridian-ui.css"]);
const DEMO = new Set(["design-system.html"]);
export const CODE_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".vue", ".svelte", ".html", ".css"]);

export function classify(path, cfg = { ignore: [] }) {
  const p = path.replace(/\\/g, "/");
  const parts = p.split("/");
  const listed = cfg.ignore ?? [];
  if (listed.some((ig) => parts.includes(ig) || p.startsWith(ig + "/"))) return "ignore";
  if (parts.some((seg) => seg !== "." && seg.startsWith("."))) return "ignore";
  if (COMPONENT.has(p)) return "component";
  if (DEMO.has(p)) return "demo";
  if (DEFINE_RE.test(p)) return "define";
  const dot = p.lastIndexOf(".");
  const ext = dot < 0 ? "" : p.slice(dot);
  if (ext === ".md") return "doc";
  if (CODE_EXT.has(ext)) return "feature";
  return "ignore";
}
```

分层取代了 v1 的路径白名单：R01/R11 的豁免由 `layer === "define"` 决定，而不是由文件名子串匹配决定——这消除了"`src/**/tokens.css` 被整体豁免、连自造 z-index 都不查"的自我失明。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test ai/lib/classify.test.mjs` → Expected: `pass 8`

- [ ] **Step 5: 提交**

```bash
git add ai/lib/classify.mjs ai/lib/classify.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): 文件分层 classify（define/component/demo/doc/feature）"
```

---

### Task 3: CSS 事实流 `lib/parse-css.mjs`

**Files:**
- Create: `ai/lib/parse-css.mjs`
- Create: `ai/lib/parse-css.test.mjs`

**Interfaces:**
- Consumes: 原始 CSS 文本
- Produces: `stripComments(src) → string`（等长、保行数、保留字符串字面量）；`parseCss(src) → Array<{type:"decl", prop:string, value:string, selector:string, line:number, col:number}>`；`stripVars(value) → string`（把 `var(...)` 与 `calc(...)` 替换为占位 `TOK`，供后续数值判定）

- [ ] **Step 1: 写失败测试 `ai/lib/parse-css.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { stripComments, parseCss, stripVars } from "./parse-css.mjs";

test("comment stripping preserves line count", () => {
  const src = "a {\n  /* #fff z-index: 999 */\n  color: red;\n}";
  assert.equal(stripComments(src).split("\n").length, src.split("\n").length);
  assert.ok(!stripComments(src).includes("#fff"));
  assert.ok(!parseCss(src).some((f) => f.value.includes("#fff")), "注释里的色值不得成为事实");
});
test("string literals inside css survive stripping", () => {
  const facts = parseCss('.a { content: "/* not a comment */"; }');
  assert.equal(facts[0].value, '"/* not a comment */"');
});
test("single-line declaration", () => {
  const f = parseCss(".x { color: #FFF; }");
  assert.deepEqual(f.map((d) => [d.prop, d.value, d.line, d.selector]), [["color", "#FFF", 1, ".x"]]);
});
test("multi-line declaration attributed to its first line", () => {
  const f = parseCss(".x {\n  box-shadow: 0 0 0 2px #fff,\n    0 0 0 4px #000;\n}");
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 2);
  assert.ok(f[0].value.includes("4px"));
});
test("at-rule nesting keeps inner selector", () => {
  const f = parseCss("@media (min-width: 480px) {\n  .y { padding: 7px; }\n}");
  assert.equal(f.find((d) => d.prop === "padding").selector, ".y");
});
test("@layer blocks yield declarations only", () => {
  const f = parseCss("@layer base {\n  * { border-color: var(--color-line); }\n  body { margin: 0; }\n}");
  assert.deepEqual(f.map((d) => d.prop), ["border-color", "margin"]);
});
test("camelCase properties normalise to kebab", () => {
  const f = parseCss("z { zIndex: 9999; borderTopLeftRadius: 6px; }");
  assert.deepEqual(f.map((d) => d.prop), ["z-index", "border-top-left-radius"]);
});
test("empty declarations and stray braces yield nothing", () => {
  assert.deepEqual(parseCss("a { ; ; color: ; } "), []);
});
test("stripVars neutralises token references", () => {
  assert.equal(stripVars("0 0 0 2px var(--m-z-modal)"), "0 0 0 2px TOK");
  assert.equal(stripVars("clamp(3rem, 2rem + 4vw, 6rem)"), "TOK");
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/lib/parse-css.test.mjs` → Expected: `Cannot find module './parse-css.mjs'`

- [ ] **Step 3: 实现 `ai/lib/parse-css.mjs`**

```js
export function stripComments(src) {
  let out = "", i = 0;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "*") {
      let j = src.indexOf("*/", i + 2);
      j = j < 0 ? src.length : j + 2;
      for (; i < j; i++) out += src[i] === "\n" ? "\n" : " ";
      continue;
    }
    if (c === '"' || c === "'") {
      out += c; i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") { out += src[i]; i++; }
        out += src[i]; i++;
      }
      out += src[i] ?? ""; i++;
      continue;
    }
    out += c; i++;
  }
  return out;
}

const kebab = (p) => p.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

function splitDecl(text) {
  const i = text.indexOf(":");
  if (i < 0) return null;
  const prop = kebab(text.slice(0, i).trim().toLowerCase());
  const value = text.slice(i + 1).trim();
  if (!prop || !value) return null;
  return { prop, value };
}

export function stripVars(value) {
  let out = String(value), depth, guard = 0;
  do {
    depth = 0; guard++;
    out = out.replace(/\b(?:var|calc|clamp|min|max|color-mix)\([^()]*\)/g, "TOK");
  } while (/TOK[^)]*\(/.test(out) && guard < 8);
  return out;
}

export function parseCss(src) {
  const lines = stripComments(src).split(/\r?\n/);
  const facts = [];
  const stack = [];
  let carry = null;                       // 跨行续接 { text, line, col }
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let seg = "", segCol = -1;
    const emit = (text, line_, col_, ch) => {
      const joined = (carry ? carry.text + " " : "") + text;
      const at = carry ?? { line: line_, col: col_ };
      carry = null;
      if (ch === "{") { stack.push(joined.trim()); return; }
      if (ch === "}") { stack.pop(); return; }
      const d = splitDecl(joined.trim());
      if (d) facts.push({ type: "decl", ...d, selector: stack[stack.length - 1] ?? "", line: at.line, col: at.col });
    };
    for (let ci = 0; ci <= line.length; ci++) {
      const ch = ci === line.length ? "\n" : line[ci];
      if (ch === "{" || ch === "}" || ch === ";" || ch === "\n") {
        const text = seg.trim();
        const col = segCol >= 0 ? segCol + 1 : 1;
        seg = ""; segCol = -1;
        if (text) emit(text, li + 1, col, ch);
        else if (ch === "}") stack.pop();
        continue;
      }
      if (segCol < 0 && ch !== " " && ch !== "\t") segCol = ci;
      seg += ch;
    }
    const tail = seg.trim();
    if (tail) carry = carry ? { ...carry, text: carry.text + " " + tail } : { text: tail, line: li + 1, col: segCol + 1 };
  }
  return facts;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test ai/lib/parse-css.test.mjs && npm test` → Expected: `pass 9` + 全绿

- [ ] **Step 5: 提交**

```bash
git add ai/lib/parse-css.mjs ai/lib/parse-css.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): CSS 事实流（剥注释、跨行声明、camelCase 归一、stripVars）"
```

### Task 4: 标记与 JSX 事实流 `lib/parse-markup.mjs`

**Files:**
- Create: `ai/lib/parse-markup.mjs`
- Create: `ai/lib/parse-markup.test.mjs`

**Interfaces:**
- Consumes: `.html/.vue/.svelte/.tsx/.jsx` 源码
- Produces: `parseMarkup(src) → { tags: Tag[], styleDecls: Decl[], literals: Literal[] }`
  - `Tag = { name:string, attrs:Record<string,string>, classes:string[], inner:string, hasText:boolean, line:number }`
  - `styleDecls` 复用 Task 3 的 `decl` 形状（`selector` 为 `"@" + tagName`），**这是 JSX 内联样式与 CSS 共用判定路径的地方**
  - `Literal = { type:"literal", text:string, line:number }`
  - `classTokens(value:string) → string[]`

- [ ] **Step 1: 写失败测试 `ai/lib/parse-markup.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMarkup, classTokens } from "./parse-markup.mjs";

test("tag with class and aria attrs", () => {
  const [t] = parseMarkup('<button class="p-4 z-[9999]" aria-label="Close">x</button>').tags;
  assert.equal(t.name, "button");
  assert.deepEqual(t.classes, ["p-4", "z-[9999]"]);
  assert.equal(t.attrs["aria-label"], "Close");
});
test("classTokens strips variant prefixes", () => {
  assert.deepEqual(classTokens("hover:bg-surface sm:p-2 group-hover:z-[9999] dark:text-critical"),
    ["bg-surface", "p-2", "z-[9999]", "text-critical"]);
});
test("className (JSX) is read too", () => {
  const [t] = parseMarkup('<div className="mt-[0.55rem]" />').tags;
  assert.deepEqual(t.classes, ["mt-[0.55rem]"]);
});
test("JSX style object normalises to css declarations", () => {
  const { styleDecls } = parseMarkup('const a = <div style={{ zIndex: 9999, marginLeft: 8 }} />;');
  assert.deepEqual(styleDecls.map((d) => [d.prop, d.value]), [["z-index", "9999"], ["margin-left", "8"]]);
  assert.equal(styleDecls[0].selector, "@div");
});
test("template-literal className does not crash and claims no classes", () => {
  const [t] = parseMarkup("const a = <div className={`p-${n}`} />;").tags;
  assert.equal(t.name, "div");
  assert.deepEqual(t.classes, []);
});
test("inner text decides hasText", () => {
  const svgOnly = parseMarkup('<button class="icon-btn"><svg aria-hidden="true"></svg></button>').tags[0];
  assert.equal(svgOnly.hasText, false);
  assert.ok(svgOnly.inner.includes("<svg"));
  assert.equal(parseMarkup("<button><svg /><span>Save</span></button>").tags[0].hasText, true);
  assert.equal(parseMarkup("<button>{label}<svg /></button>").tags[0].hasText, true, "表达式按可能有文本处理 → 不报");
});
test("<style> blocks are not tags but are still reported as styleDecls source", () => {
  const { tags } = parseMarkup("<style>.a{color:red}</style><p>hi</p>");
  assert.deepEqual(tags.map((t) => t.name), ["p"]);
});
test("string literals collected for R01/R11", () => {
  const { literals } = parseMarkup('const c = "#FF0000"; use("var(--m-ink-9)");');
  assert.ok(literals.some((l) => l.text === "#FF0000"));
  assert.ok(literals.some((l) => l.text.includes("--m-ink-9")));
});
test("CRLF and LF produce identical line numbers", () => {
  const lf = parseMarkup('a\n<div class="z-[9]">\n').tags[0].line;
  const crlf = parseMarkup('a\r\n<div class="z-[9]">\r\n').tags[0].line;
  assert.equal(lf, crlf);
  assert.equal(lf, 2);
});
test("void elements have empty inner", () => {
  assert.equal(parseMarkup('<img src="/p.avif" alt="x" loading="lazy">').tags[0].inner, "");
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/lib/parse-markup.test.mjs` → Expected: `Cannot find module`

- [ ] **Step 3: 实现 `ai/lib/parse-markup.mjs`**

```js
const VOID = new Set(["img", "br", "hr", "input", "meta", "link", "source", "area", "col", "embed", "track", "wbr"]);
const TAG_RE = /<([A-Za-z][\w.:-]*)((?:"[^"]*"|'[^']*'|`[^`]*`|\{[^}]*(?:\{[^}]*\}[^}]*)*\}|[^>"'`])*?)(\/?)\s*>/g;
const ATTR_RE = /([A-Za-z_:][\w.:-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|\{((?:[^{}]|\{[^{}]*\})*)\}))?|([A-Za-z_:][\w.:-]*)/g;

export function classTokens(value) {
  return String(value).split(/[\s,]+/).filter(Boolean)
    .map((c) => c.replace(/^(?:[a-zA-Z][\w-]*:)+/, ""));
}

function parseAttrs(raw) {
  const attrs = {};
  for (const m of raw.matchAll(ATTR_RE)) {
    if (m[5]) { attrs[m[5]] = ""; continue; }
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

const lineOf = (src, idx) => src.slice(0, idx).split(/\r?\n/).length;

function innerOf(src, from, name) {
  if (VOID.has(name.toLowerCase())) return "";
  const openRe = new RegExp(`<${name}(?=[\\s/>])`, "gi");
  const closeRe = new RegExp(`</${name}\\s*>`, "gi");
  let depth = 1, i = from;
  while (i < src.length) {
    openRe.lastIndex = closeRe.lastIndex = i;
    const o = openRe.exec(src), c = closeRe.exec(src);
    if (!c) return "";
    if (o && o.index < c.index) { depth++; i = o.index + o[0].length; continue; }
    depth--;
    if (depth === 0) return src.slice(i, c.index);
    i = c.index + c[0].length;
  }
  return "";
}

const hasVisibleText = (inner) => /\S/.test(inner.replace(/<[^>]*>/g, " "));

function styleToObject(v) {
  const m = String(v).match(/^\s*\{?([\s\S]*?)\}?\s*$/);
  return m ? m[1] : null;
}

export function parseMarkup(src) {
  const blanked = src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (b) => b.replace(/[^\n]/g, " "));
  const tags = [], styleDecls = [], literals = [];
  for (const m of blanked.matchAll(TAG_RE)) {
    const name = m[1], rawAttrs = m[2] ?? "", selfClosed = m[3] === "/";
    if (/^(?:style|script)$/i.test(name)) continue;
    const line = lineOf(blanked, m.index);
    const attrs = parseAttrs(rawAttrs);
    const inner = selfClosed ? "" : innerOf(blanked, m.index + m[0].length, name);
    const classes = classTokens(attrs.class ?? attrs.className ?? "");
    tags.push({ name, attrs, classes, inner, hasText: hasVisibleText(inner), line });
    const obj = "style" in attrs ? styleToObject(attrs.style) : null;
    if (obj) {
      let col = 0;
      for (const pair of obj.split(",")) {
        const kv = pair.split(":");
        if (kv.length < 2) continue;
        styleDecls.push({
          type: "decl",
          prop: kv[0].trim().replace(/[A-Z]/g, (x) => "-" + x.toLowerCase()),
          value: kv.slice(1).join(":").trim(),
          selector: "@" + name, line, col: ++col,
        });
      }
    }
  }
  for (const m of blanked.matchAll(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g))
    literals.push({ type: "literal", text: m[0].slice(1, -1), line: lineOf(blanked, m.index) });
  return { tags, styleDecls, literals };
}
```

> 已知边界（写入 Task 10 的 AGENTS 局限清单，原文照录）：`` `z-[${n}]` `` 类模板拼接不解析（`classTokens` 拿不到内容，保守放行）；SFC 的 `:class` 动态绑定不解析；嵌套超过两层的 `style={{a:{b:1}}}` 不解析。三者均为"宁漏不误"方向。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test ai/lib/parse-markup.test.mjs` → Expected: `pass 10`

- [ ] **Step 5: 提交**

```bash
git add ai/lib/parse-markup.mjs ai/lib/parse-markup.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): 标记/JSX 事实流，style→decl 与 CSS 共用判定路径"
```

---

### Task 5: 刻度与菜单 `lib/scale.mjs`

**Files:**
- Create: `ai/lib/scale.mjs`
- Create: `ai/lib/scale.test.mjs`

**Interfaces:**
- Consumes: 无（菜单常量为唯一真相，Task 16 用 acceptance 测试核对与 `tokens.json` 一致）
- Produces: `toPx(v) → number|null`；`onSpacingGrid(px) → boolean`；`TEXT_MENU`、`RADIUS_MENU`、`DURATION_MENU`、`Z_LADDER`；`SPACING_STANDARD_PX: Record<string, number>`；`isTokenRef(v) → boolean`

- [ ] **Step 1: 写失败测试 `ai/lib/scale.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { toPx, onSpacingGrid, isTokenRef, TEXT_MENU, RADIUS_MENU, SPACING_STANDARD_PX } from "./scale.mjs";

test("unit normalisation", () => {
  assert.equal(toPx("16px"), 16);
  assert.equal(toPx("1rem"), 16);
  assert.equal(toPx("0.6rem"), 9.6);
  assert.equal(toPx(" 24PX "), 24);
  assert.equal(toPx("3"), 3, "无单位按 px 处理（React 内联样式语义）");
  assert.equal(toPx("auto"), null);
  assert.equal(toPx("100%"), null);
});
test("4px grid with the 2px control-internal exception", () => {
  for (const v of [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]) assert.ok(onSpacingGrid(v), `${v} 应通过`);
  for (const v of [6, 7, 9.6, 10, 13, 14, 18]) assert.ok(!onSpacingGrid(v), `${v} 应违规`);
});
test("Tailwind standard steps map to real px (p-3.5 is 14px = off-grid)", () => {
  assert.equal(SPACING_STANDARD_PX["3.5"], 14);
  assert.equal(SPACING_STANDARD_PX["4"], 16);
  assert.equal(SPACING_STANDARD_PX["0.5"], 2);
  assert.ok(!onSpacingGrid(SPACING_STANDARD_PX["3.5"]));
  assert.ok(onSpacingGrid(SPACING_STANDARD_PX["0.5"]));
});
test("token references are never violations", () => {
  assert.ok(isTokenRef("var(--m-space-4)"));
  assert.ok(isTokenRef("var(--m-duration-150)"));
  assert.ok(isTokenRef("clamp(var(--m-space-8), 4vw, var(--m-space-16))"));
  assert.ok(!isTokenRef("14px"));
});
test("menus expose the legal vocabulary", () => {
  assert.ok(TEXT_MENU.includes("xs") && TEXT_MENU.includes("display"));
  assert.ok(!TEXT_MENU.includes("2xs"), "12px 以下没有合法级（决策 D3）");
  assert.ok(RADIUS_MENU.includes("md") && RADIUS_MENU.includes("full"));
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/lib/scale.test.mjs` → Expected: `Cannot find module`

- [ ] **Step 3: 实现 `ai/lib/scale.mjs`**

```js
export const TEXT_MENU = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "display"];
export const RADIUS_MENU = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full", "pill"];
export const DURATION_MENU = ["100", "150", "200", "300", "450", "600"];
export const Z_LADDER = ["raised", "nav", "drawer", "modal", "toast", "tooltip"];

export const SPACING_STANDARD_PX = {
  0: 0, "0.5": 2, 1: 4, "1.5": 6, 2: 8, "2.5": 10, 3: 12, "3.5": 14, 4: 16,
  5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
};

export function toPx(v) {
  const s = String(v).trim().toLowerCase();
  const m = s.match(/^(-?[\d.]+)(px|rem)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === "rem" ? n * 16 : n;
}

export const onSpacingGrid = (px) => px === 2 || px === 0 || Math.abs(px % 4) < 1e-9;

export const isTokenRef = (v) => /var\(\s*--(?:m|color|radius|shadow|ease|font|text)-[\w-]+\s*\)/.test(String(v));
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test ai/lib/scale.test.mjs && npm test` → Expected: 全绿

- [ ] **Step 5: 提交**

```bash
git add ai/lib/scale.mjs ai/lib/scale.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): 刻度归一与合法菜单（px/rem、4 网格、字阶/圆角/时长）"
```

---

### Task 6: 规则引擎、例外机制与 CLI 入口

**Files:**
- Create: `ai/lib/engine.mjs`
- Create: `ai/lib/facts.mjs`
- Create: `ai/checks/allow.mjs`
- Create: `ai/checks/index.mjs`
- Modify: `ai/validate.mjs`（整体重写为入口，CLI 形态向后兼容）
- Create: `ai/lib/engine.test.mjs`

**Interfaces:**
- Consumes: Task 2–5
- Produces:
  - `Rule = { id:string, title:string, layers:string[], facts:string[], check(fact, ctx) → Array<{line:number, message:string, fix?:string}> }`
  - `Violation = { rule, file, line, message, fix? }`
  - `collectAllows(text) → { byLine:Map<number,string>, regions:{name,from,to}[] }`
  - `run({ files, rules, cfg, fs }) → { violations: Violation[], staleAllows: {file,line,reason}[] }`
  - `applyBaseline(violations, baseline|null) → { violations, suppressed }`
  - `format(violations, mode:"text"|"json"|"sarif", staleAllows) → string`
  - `factsFor(path, cfg) → { layer, text, facts[] }`
  - CLI：`node ai/validate.mjs <target> [--json|--sarif] [--only=R11,R13] [--ignore <seg>] [--exclude <seg>] [--baseline <file>] [--emit-manifest <file>]`；退出码 = 有效违规或失效 allow 存在 ? 1 : 0，**与输出模式无关**

> `--exclude <seg>`（可重复）与 `cfg.ignore` 的区别：`ignore` 是"这些目录不属于被审代码"，`exclude` 是"本次扫描临时跳过"。T17 的全仓验收必须 `--exclude ai/selfcheck/fixtures`，否则会被故意植入的 `fail/` 样本永久判红；而 T10 生成 manifest 时不传 `--exclude`，才能把 fixtures 扫出来。实现在 `walk()` 之后加一行 `files = files.filter(f => !excludes.some(x => f.path.includes(x)))`。

- [ ] **Step 1: 写失败测试 `ai/lib/engine.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, applyBaseline, format } from "./engine.mjs";
import { collectAllows } from "../checks/allow.mjs";

const fake = { id: "R99", title: "t", layers: ["feature"], facts: ["decl"],
  check: (f) => (f.value === "bad" ? [{ line: f.line, message: "bad value" }] : []) };
const file = (path, layer, facts, text = "") => ({ path, layer, text, facts });

test("layer filtering: define is not checked by feature rules", () => {
  const out = run({ files: [file("a.css", "define", [{ type: "decl", value: "bad", line: 1 }])], rules: [fake], cfg: {} });
  assert.equal(out.violations.length, 0);
});
test("allow marker without a reason does not suppress", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.css", "feature",
    [{ type: "decl", value: "bad", line: 1 }], "a { color: bad; } /* meridian-allow */")] });
  assert.equal(out.violations.length, 1);
});
test("allow marker with a reason suppresses and is not stale", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.css", "feature",
    [{ type: "decl", value: "bad", line: 1 }], "a { color: bad; } /* meridian-allow: legacy-import */")] });
  assert.equal(out.violations.length, 0);
  assert.deepEqual(out.staleAllows, []);
});
test("unused allow is reported as stale", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.css", "feature",
    [{ type: "decl", value: "ok", line: 1 }], "a { color: ok } /* meridian-allow: nothing-here */")] });
  assert.deepEqual(out.staleAllows, [{ file: "a.css", line: 1, reason: "nothing-here" }]);
});
test("collectAllows records region markers", () => {
  const a = collectAllows("/* meridian-begin: ramp-demo */\nx\n/* meridian-end: ramp-demo */");
  assert.deepEqual(a.regions, [{ name: "ramp-demo", from: 1, to: 3 }]);
});
test("baseline suppresses recorded counts only", () => {
  const vs = [{ rule: "R99", file: "a.css", line: 3 }, { rule: "R99", file: "a.css", line: 9 }];
  const { violations, suppressed } = applyBaseline(vs, { "a.css|R99": 1 });
  assert.equal(suppressed, 1);
  assert.equal(violations.length, 1);
});
test("all three output modes agree on the failure bit", () => {
  const vs = [{ rule: "R99", file: "a.css", line: 1, message: "x" }];
  assert.match(format(vs, "text"), /R99/);
  assert.equal(JSON.parse(format(vs, "json")).ok, false);
  assert.equal(JSON.parse(format(vs, "sarif")).runs[0].results.length, 1);
});
test("violations are sorted deterministically", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("b.css", "feature", [{ type: "decl", value: "bad", line: 2 }, { type: "decl", value: "bad", line: 1 }]),
    file("a.css", "feature", [{ type: "decl", value: "bad", line: 5 }])] });
  assert.deepEqual(out.violations.map((v) => `${v.file}:${v.line}`), ["a.css:5", "b.css:1", "b.css:2"]);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/lib/engine.test.mjs` → Expected: `Cannot find module`

- [ ] **Step 3: 实现 `ai/checks/allow.mjs`**

```js
const ALLOW_RE = /meridian-allow\s*(?::\s*([^*\/\n]+?))?\s*(?:\*\/|$)/g;
const BEGIN_RE = /meridian-begin:\s*([\w-]+)/g;
const END_RE = /meridian-end:\s*([\w-]+)/g;
const at = (text, idx) => text.slice(0, idx).split(/\r?\n/).length;

export function collectAllows(text) {
  const byLine = new Map();
  for (const m of String(text).matchAll(ALLOW_RE)) {
    const reason = (m[1] ?? "").trim();
    if (reason) byLine.set(at(text, m.index), reason);
  }
  const regions = [];
  const open = new Map();
  for (const m of text.matchAll(BEGIN_RE)) open.set(m[1], at(text, m.index));
  for (const m of text.matchAll(END_RE)) { const from = open.get(m[1]); if (from) regions.push({ name: m[1], from, to: at(text, m.index) }); }
  return { byLine, regions };
}
```

- [ ] **Step 4: 实现 `ai/lib/engine.mjs`**

> **Windows 前提**：`f.path` 在 Git Bash 下可能是反斜杠形式。`run()` 里生成违规条目时必须统一 `file: f.path.replace(/\\/g, "/")`，否则 `--emit-manifest` 写出的路径与 `rules.test.mjs` 里 `key()` 归一后的路径不一致，会造成整表假红。

```js
import { collectAllows } from "../checks/allow.mjs";

const near = (a, b) => Math.abs(a - b) <= 2;

export function run({ files, rules, cfg = {}, fs = null }) {
  const violations = [], staleAllows = [];
  for (const f of files) {
    const allows = collectAllows(f.text ?? "");
    const used = new Set();
    for (const fact of f.facts) {
      for (const rule of rules) {
        if (!rule.layers.includes(f.layer)) continue;
        if (!rule.facts.includes(fact.type)) continue;
        if (f.layer === "demo" && rule.offInDemo) continue;
        for (const raw of rule.check(fact, { cfg, file: f, fs, allows }) ?? []) {
          const line = raw.line ?? fact.line;
          const marker = [...allows.byLine.keys()].find((l) => near(l, line));
          if (marker !== undefined) { used.add(marker); continue; }
          violations.push({ rule: rule.id, file: f.path, line, message: raw.message, fix: raw.fix });
        }
      }
    }
    for (const [line, reason] of allows.byLine) if (!used.has(line)) staleAllows.push({ file: f.path, line, reason });
  }
  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  staleAllows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { violations, staleAllows };
}

export function applyBaseline(violations, baseline) {
  if (!baseline) return { violations, suppressed: 0 };
  const left = { ...baseline };
  const out = [];
  let suppressed = 0;
  for (const v of violations) {
    const key = `${v.file}|${v.rule}`;
    if ((left[key] ?? 0) > 0) { left[key]--; suppressed++; continue; }
    out.push(v);
  }
  for (const [key, n] of Object.entries(left)) if (n > 0) console.error(`baseline 记账过剩：${key} 剩余 ${n}，请收紧 baseline 文件`);
  return { violations: out, suppressed };
}

export function format(violations, mode, staleAllows = []) {
  const fail = violations.length > 0 || staleAllows.length > 0;
  if (mode === "json")
    return JSON.stringify({ ok: !fail, count: violations.length, staleAllows, violations }, null, 2);
  if (mode === "sarif")
    return JSON.stringify({ version: "2.1.0", runs: [{ tool: { driver: { name: "meridian-validate", version: "2.0.0",
      rules: [...new Set(violations.map((v) => v.rule))].map((id) => ({ id })) } },
      results: violations.map((v) => ({ ruleId: v.rule, message: { text: v.message },
        locations: [{ physicalLocation: { artifactLocation: { uri: v.file }, region: { startLine: v.line } } }] })) }] }, null, 2);
  if (!fail) return "✓ Meridian 设计合规校验通过（0 violations）";
  const head = `✗ ${violations.length} 处设计违规：\n`;
  const body = violations.map((v) => `  [${v.rule}] ${v.file}:${v.line} — ${v.message}${v.fix ? `\n           → ${v.fix}` : ""}`).join("\n");
  const tail = staleAllows.length ? `\n\n⚠ ${staleAllows.length} 条 meridian-allow 已失效（删除标记或恢复违规代码）：\n`
    + staleAllows.map((s) => `  ${s.file}:${s.line} — ${s.reason}`).join("\n") : "";
  return head + body + tail;
}
```

> `rule.offInDemo`（布尔）由 R01/R11 自行声明（Task 7、Task 9）：demo 层豁免下放到规则自身，引擎里不再有任何隐式白名单。

- [ ] **Step 5: 实现 `ai/lib/facts.mjs`**

```js
import { readFileSync, existsSync } from "node:fs";
import { classify } from "./classify.mjs";
import { parseCss } from "./parse-css.mjs";
import { parseMarkup } from "./parse-markup.mjs";
import { parseDoc } from "./parse-doc.mjs";

export function factsFor(path, cfg = { ignore: [] }) {
  const layer = classify(path, cfg);
  if (layer === "ignore") return { path, layer, text: "", facts: [] };
  const text = readFileSync(path, "utf8");
  const ext = path.slice(path.lastIndexOf("."));
  let facts = [];
  if (layer === "doc") facts = parseDoc(text, path);
  else if (ext === ".css" || ext === ".json") facts = parseCss(text);
  else {
    const m = parseMarkup(text);
    facts = [...m.tags.map((t) => ({ type: "tag", ...t })), ...m.styleDecls,
      ...m.tags.flatMap((t) => t.classes.map((token) => ({ type: "class", token, line: t.line, tag: t.name }))),
      ...m.literals];
    if (ext === ".html" || ext === ".vue" || ext === ".svelte") facts.push(...parseCss(text).map((d) => ({ ...d, fromStyleBlock: true })));
  }
  return { path, layer, text, facts };
}

/** CLI 与测试共用的文档视图（避免"测试通过但 CLI 判定不同"——v1 假绿的成因）。 */
export function buildFs(files) {
  const md = files.filter((f) => f.layer === "doc");
  return {
    changelog: existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : null,
    byPath: new Map(md.map((f) => [f.path.replace(/^\.\//, ""), f.text])),
    chapters: new Map(md.flatMap((f) => { const m = f.path.match(/(\d{2})-[\w-]+\.md$/); return m ? [[m[1], f.path.replace(/^\.\//, "")]] : []; })),
  };
}
```

- [ ] **Step 6: 建 `ai/checks/index.mjs` 空注册表**

```js
export const rules = [];
```

- [ ] **Step 7: 重写 `ai/validate.mjs`**

保留 `#!/usr/bin/env node` 与递归 `walk()`（改为按 `classify(...) === "ignore"` 跳过）。参数解析：

```js
const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith("--") && !PREV_TAKES_VALUE.has(prev(a))) ?? ".";
const flag = (n) => argv.includes(n);
const val = (n) => argv[argv.indexOf(n) + 1];
const mode = flag("--sarif") ? "sarif" : flag("--json") ? "json" : "text";
const only = val("--only")?.split(",").map((s) => s.trim().toUpperCase());
const cfg = existsSync("meridian.config.json") ? JSON.parse(readFileSync("meridian.config.json", "utf8")) : { ignore: [] };
const baselinePath = val("--baseline") ?? cfg.baseline;
const baseline = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : null;
const activeRules = only ? rules.filter((r) => only.includes(r.id)) : rules;
const files = walk(target).map((p) => factsFor(p, cfg)).filter((f) => f.layer !== "ignore");
const fsView = buildFs(files);
const raw = run({ files, rules: activeRules, cfg, fs: fsView });
const { violations, suppressed } = applyBaseline(raw.violations, baseline);
if (flag("--emit-manifest")) {
  writeFileSync(val("--emit-manifest"), JSON.stringify(violations.map(({ rule, file, line }) => ({ rule, file, line })), null, 2));
  console.log(`manifest written: ${violations.length} expected hits`);
  process.exit(0);
}
process.stdout.write(format(violations, mode, raw.staleAllows) + "\n");
process.exit(violations.length || raw.staleAllows.length ? 1 : 0);
```

`PREV_TAKES_VALUE = new Set(["--only", "--baseline", "--ignore", "--emit-manifest"])`。
**退出码判定只看 `violations.length || staleAllows.length`，与 mode 完全无关**——这是 v1 `--json` 假绿的正面修复。

- [ ] **Step 8: 跑测试并确认 CLI 仍可用**

Run: `node --test ai/lib/engine.test.mjs && npm test` → Expected: `pass 8` + 全绿
Run: `node ai/validate.mjs ai/lib --json; echo "exit=$?"` → Expected: `{"ok":true,...}`，`exit=0`（规则表为空，故 0 违规）

- [ ] **Step 9: 提交**

```bash
git add ai/validate.mjs ai/lib/engine.mjs ai/lib/facts.mjs ai/lib/engine.test.mjs ai/checks/
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): 规则引擎 + 行级 allow/失效检测 + baseline + json/sarif 一致退出码"
```

---

## Phase 2 · 14 条规则

### Task 7: R01–R04（色值 / z 阶梯 / 动效 / important）

**Files:**
- Create: `ai/checks/r01-raw-color.mjs`, `ai/checks/r02-zindex.mjs`, `ai/checks/r03-motion.mjs`, `ai/checks/r04-important.mjs`
- Modify: `ai/checks/index.mjs`, `ai/tokens.css`（reduced-motion 块加 allow 标记）
- Create: `ai/selfcheck/fixtures/R0{1,2,3,4}/{pass,fail}/…`

**Interfaces:**
- Consumes: `decl`/`class`/`literal` 事实；`isTokenRef`、`stripVars`
- Produces: 四个 `rule` 对象，`id` 分别 `R01 R02 R03 R04`；`R01.offInDemo = true`（`R11.offInDemo = true` 见 Task 9）

- [ ] **Step 1: 写真阴性 fixture（合规，必须 0 命中）**

`ai/selfcheck/fixtures/R01/pass/Feature.tsx`
```tsx
export const a = <div style={{ color: "var(--m-fg)" }} />;
export const b = "#1042";
export const c = "Order #A1B2";
export const d = "#FB";
export const e = <div className="bg-surface text-critical border-line" />;
```
`ai/selfcheck/fixtures/R01/pass/tokens.css`（文件名命中 `DEFINE_RE` → define 层，天然豁免）
```css
:root { --m-ink-12: #1F2530; --m-bg-scrim: rgb(15 18 24 / 0.48); }
```
`ai/selfcheck/fixtures/R02/pass/Feature.tsx`
```tsx
export const a = <div className="z-[var(--m-z-modal)] fixed" style={{ zIndex: 0 }} />;
export const b = <span className="z-auto" />;
export const c = <span className="z-0" />;
```
`ai/selfcheck/fixtures/R03/pass/x.css`
```css
.a { transition: background-color var(--m-duration-150) var(--m-ease-standard); }
.b { transition-duration: 0s; }
.c { animation: none; }
.d { animation: m-toast-in var(--m-duration-200) var(--m-ease-enter); }
```
`ai/selfcheck/fixtures/R04/pass/x.css`（同时验证 allow 生效且不被判 stale）
```css
.a { color: var(--m-fg) !important; } /* meridian-allow: reduced-motion-contract */
.b { color: var(--m-fg); }
```

- [ ] **Step 2: 写真阳性 fixture**

`ai/selfcheck/fixtures/R01/fail/Feature.tsx`（4 处）
```tsx
export const a = <div style={{ color: "#fff" }} />;
export const b = <div fill="#FF0000" />;
export const c = "background: rgba(0,0,0,.5)";
export const d = <div className="text-[#0f6b57]" />;
```
`ai/selfcheck/fixtures/R02/fail/Feature.tsx`（3 处）+ `ai/selfcheck/fixtures/R02/fail/x.css`（1 处）
```tsx
export const a = <div className="z-[9999] fixed" />;
export const b = <div style={{ zIndex: 9999 }} />;
export const c = <div className="z-50" />;
```
```css
.a { z-index: 999; }
```
`ai/selfcheck/fixtures/R03/fail/x.css`（3 处）+ `ai/selfcheck/fixtures/R03/fail/Feature.tsx`（2 处）
```css
.a { transition: all 700ms ease-in-out; }
.b { animation: m-spin 2s linear infinite; }
.c { transition-duration: 0.4s; }
```
```tsx
export const a = <div className="duration-[900ms]" />;
export const b = <div className="duration-200" />;
```
`ai/selfcheck/fixtures/R04/fail/x.css`（1 处）
```css
.a { color: var(--m-fg) !important; }
```

- [ ] **Step 3: 实现四条规则**

`ai/checks/r01-raw-color.mjs`
```js
import { isTokenRef } from "../lib/scale.mjs";
const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/;
const FN = /\b(?:rgba?|hsla?|oklch|oklab|hwb|lch)\s*\(/;
const COLOR_CTX = /(?:^|[;{\s])(?:color|background|background-color|border-color|fill|stroke|outline-color)\s*[:=]/;
const NAMED = /^\s*(?:black|white|red|blue|green|gray|grey|yellow|orange|purple|pink)\s*$/;

function hit(text, { declMode }) {
  const t = String(text ?? "").replace(/["']/g, "");
  if (!t || isTokenRef(t)) return false;
  if (FN.test(t) && declMode) return true;
  if (HEX.test(t) && (declMode || COLOR_CTX.test(text))) return true;
  if (declMode && NAMED.test(t)) return true;
  return false;
}

export const rule = {
  id: "R01", title: "raw-color", layers: ["component", "feature"], facts: ["decl", "literal", "class"],
  offInDemo: true,
  check(f) {
    if (f.type === "class") {
      return /^(?:text|bg|border|fill|stroke|ring|outline|shadow)-\[#[0-9a-fA-F]{3,8}\]$/.test(f.token)
        ? [{ line: f.line, message: "Tailwind 任意值裸色值", fix: "bg-surface / text-critical" }] : [];
    }
    const raw = f.type === "decl" ? f.value : f.text;
    return hit(raw, { declMode: f.type === "decl" })
      ? [{ line: f.line, message: "裸色值", fix: "var(--m-fg) / bg-primary / text-critical" }] : [];
  },
};
```

`ai/checks/r02-zindex.mjs`
```js
import { isTokenRef } from "../lib/scale.mjs";
export const rule = {
  id: "R02", title: "raw-zindex", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (f.prop !== "z-index") return [];
      if (isTokenRef(f.value) || /^\s*(?:auto|0|-1|1)\s*$/.test(f.value)) return [];
      return [{ line: f.line, message: `自造 z-index: ${f.value}`, fix: "var(--m-z-modal) 等六档之一" }];
    }
    const arb = f.token.match(/^z-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1])) return [{ line: f.line, message: `自造 z-index：${f.token}`, fix: "z-[var(--m-z-modal)]" }];
    if (/^z-(?:10|20|30|40|50)$/.test(f.token))
      return [{ line: f.line, message: `Tailwind ${f.token} 不在 z 阶梯上`, fix: "z-[var(--m-z-nav)]" }];
    return [];
  },
};
```

`ai/checks/r03-motion.mjs`
```js
import { stripVars } from "../lib/parse-css.mjs";
import { isTokenRef } from "../lib/scale.mjs";
const DUR = /(?<![\w.-])\d+(?:\.\d+)?(?:ms|s)\b/g;
const ZERO = /^0(?:\.0+)?(?:ms|s)$/;
const hasBadDuration = (text) => [...String(text).matchAll(DUR)].filter((m) => !ZERO.test(m[0]));

export const rule = {
  id: "R03", title: "raw-motion", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (!/^(?:transition|animation)(?:-duration)?$/.test(f.prop)) return [];
      const bad = hasBadDuration(stripVars(f.value));
      return bad.length
        ? [{ line: f.line, message: `自造时长 ${bad[0][0]}`, fix: "var(--m-duration-100|150|200|300|450|600)" }] : [];
    }
    const arb = f.token.match(/^duration-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1])) return [{ line: f.line, message: `自造时长：${f.token}`, fix: "duration-[var(--m-duration-150)]" }];
    if (/^duration-\d+$/.test(f.token))
      return [{ line: f.line, message: `Tailwind ${f.token} 未走时长 token`, fix: "duration-[var(--m-duration-150)]" }];
    if (/^ease-(?:linear|in|out|in-out)$/.test(f.token) || (/^ease-\[/.test(f.token) && !isTokenRef(f.token)))
      return [{ line: f.line, message: `自造缓动：${f.token}`, fix: "ease-[var(--m-ease-standard)]" }];
    return [];
  },
};
```

`ai/checks/r04-important.mjs`
```js
export const rule = {
  id: "R04", title: "no-important", layers: ["define", "component", "feature", "demo"], facts: ["decl"],
  check(f) {
    return /!\s*important/.test(f.value)
      ? [{ line: f.line, message: "!important 禁止（唯一例外须行级标注理由）", fix: "/* meridian-allow: reduced-motion-contract */" }] : [];
  },
};
```

- [ ] **Step 4: R04 覆盖 define 层 → 给 tokens.css 的 reduced-motion 块加标记**

`ai/tokens.css` 末尾块整体替换为（4 条声明各带标记）：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important; /* meridian-allow: reduced-motion-contract */
    animation-iteration-count: 1 !important; /* meridian-allow: reduced-motion-contract */
    transition-duration: 0.01ms !important; /* meridian-allow: reduced-motion-contract */
    scroll-behavior: auto !important; /* meridian-allow: reduced-motion-contract */
  }
}
```

- [ ] **Step 5: 注册并验证**

`ai/checks/index.mjs`
```js
import { rule as r01 } from "./r01-raw-color.mjs";
import { rule as r02 } from "./r02-zindex.mjs";
import { rule as r03 } from "./r03-motion.mjs";
import { rule as r04 } from "./r04-important.mjs";
export const rules = [r01, r02, r03, r04];
```

Run: `node ai/validate.mjs ai/selfcheck/fixtures --json`
Expected: 退出码 1；`ok:false`。逐条核对 `fail/` 命中：R01=4、R02=4、R03=5、R04=1；`pass/` 中 R01/R02/R03 均 0 命中且 `staleAllows: []`（R04/pass 的标记必须被消耗，否则说明 allow 匹配窗口失效）。
Run: `node ai/validate.mjs ai/tokens.css --only=R04 --json` → Expected: `ok:true`（4 条标记全部消耗，无 stale）

- [ ] **Step 6: 提交**

```bash
git add ai/checks ai/selfcheck/fixtures ai/tokens.css
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): R01-R04 色值/z 阶梯/动效/important + tokens.css reduced-motion 行级豁免标记"
```

---

### Task 8: R05 / R07 / R08 / R09 / R15（刻度、地板、焦点、方向）

**Files:**
- Create: `ai/checks/r05-spacing-grid.mjs`, `r07-radius.mjs`, `r08-text-floor.mjs`, `r09-focus-outline.mjs`, `r15-rtl-logical.mjs`
- Modify: `ai/checks/index.mjs`
- Create: `ai/selfcheck/fixtures/R0{5,7,8,9}/…`、`R15/…`

**Interfaces:**
- Consumes: `toPx`、`onSpacingGrid`、`SPACING_STANDARD_PX`、`isTokenRef`、`stripVars`
- Produces: 五个 `rule` 对象

- [ ] **Step 1: 写真阴性 fixture（旧版全部误报过，新版必须 0 命中）**

`ai/selfcheck/fixtures/R05/pass/Feature.tsx`
```tsx
export const a = <div className="p-[16px] mt-[12px] gap-[24px]" />;
export const b = <div className="p-4 mt-3 gap-2 px-6" />;
export const c = <div className="p-[var(--m-space-4)] m-[var(--m-space-2)]" />;
export const d = <div style={{ padding: 16, marginTop: "12px", gap: "1.5rem" }} />;
export const e = <div className="px-[2px] py-0.5" />;
```
`ai/selfcheck/fixtures/R05/pass/x.css`
```css
.a { padding: var(--m-space-4); margin: 0 auto; gap: 8px; }
.b { padding-inline: calc(var(--m-space-2) + 2px); }
.c { top: 7px; left: 13px; width: 6px; }
```
`ai/selfcheck/fixtures/R07/pass/x.css`
```css
.a { border-radius: var(--m-radius-md); border-radius: 9999px; border-radius: 0; border-radius: 50%; border-radius: inherit; border-radius: none; }
```
`ai/selfcheck/fixtures/R08/pass/x.css`
```css
.a { font-size: var(--m-text-xs); font-size: 0.75rem; font-size: 1em; font-size: 90%; font-size: inherit; }
```
`ai/selfcheck/fixtures/R09/pass/x.css`
```css
.a:focus-within { outline: 2px solid var(--m-border-focus); }
.b { outline-color: var(--m-border-focus); outline-style: solid; }
.c { outline: none; } /* meridian-allow: container-expresses-focus */
```
`ai/selfcheck/fixtures/R15/pass/x.css`
```css
.a { margin-inline-start: 8px; padding-inline: var(--m-space-2); border-left: 1px solid var(--m-border); }
.b { position: absolute; left: 50%; inset-inline: 0; }
```

- [ ] **Step 2: 写真阳性 fixture**

`ai/selfcheck/fixtures/R05/fail/Feature.tsx`（4 处：`p-[7px]`、`mt-[0.55rem]`、`gap-[0.6rem]`、`p-3.5`）
```tsx
export const a = <div className="p-[7px] mt-[0.55rem] gap-[0.6rem] p-3.5" />;
export const b = <div style={{ padding: 7 }} />;
```
`ai/selfcheck/fixtures/R05/fail/x.css`（2 处）
```css
.a { padding: 7px; }
.b { margin-inline-start: 13px; gap: 6px; }
```
`ai/selfcheck/fixtures/R07/fail/x.css`（1 处）+ `R07/fail/Feature.tsx`（1 处）
```css
.a { border-radius: 6px; }
```
```tsx
export const a = <div className="rounded-[6px]" />;
```
`ai/selfcheck/fixtures/R08/fail/x.css`（2 处）+ `R08/fail/Feature.tsx`（1 处）
```css
.a { font-size: 11px; }
.b { font-size: 9px; }
```
```tsx
export const a = <div className="text-[11px]" />;
```
`ai/selfcheck/fixtures/R09/fail/x.css`（2 处）
```css
.a:focus { outline: none; }
.b { outline: 0; }
```
`ai/selfcheck/fixtures/R15/fail/x.css`（2 处）
```css
.a { margin-left: 8px; }
.b { padding-right: var(--m-space-2); }
```

- [ ] **Step 3: 实现五条规则**

`ai/checks/r05-spacing-grid.mjs`
```js
import { toPx, onSpacingGrid, SPACING_STANDARD_PX } from "../lib/scale.mjs";
import { stripVars } from "../lib/parse-css.mjs";
const PROPS = /^(?:margin|padding|gap|row-gap|column-gap|grid-gap|inset-block-size)$/;
const CLASS = /^(?:-)?([pm][trblxy]?|gap|space[xy]?)-\[([^\]]+)\)$/;
const CLASS_STD = /^(?:-)?(?:[pm][trblxy]?|gap)-([\d.]+)$/;

export const rule = {
  id: "R05", title: "offgrid-spacing", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    const offenders = (text) => stripVars(text).split(/\s+/)
      .map((tok) => toPx(tok)).filter((px) => px !== null && !onSpacingGrid(px));
    if (f.type === "decl") {
      if (!PROPS.test(f.prop)) return [];
      const bad = offenders(f.value);
      return bad.length ? [{ line: f.line, message: `脱 4px 网格：${bad.map((p) => p + "px").join(", ")}`, fix: "p-4 / var(--m-space-4)" }] : [];
    }
    const arb = f.token.match(CLASS);
    if (arb) {
      const px = toPx(arb[2]);
      if (px !== null && !onSpacingGrid(px)) return [{ line: f.line, message: `脱 4px 网格：${f.token} = ${px}px`, fix: "p-4 / p-[var(--m-space-4)]" }];
      return [];
    }
    const std = f.token.match(CLASS_STD);
    if (std && std[1] in SPACING_STANDARD_PX) {
      const px = SPACING_STANDARD_PX[std[1]];
      if (!onSpacingGrid(px)) return [{ line: f.line, message: `${f.token} = ${px}px 脱 4px 网格`, fix: "取标准步（2/4/8/12/16…）" }];
    }
    return [];
  },
};
```

`ai/checks/r07-radius.mjs`
```js
import { isTokenRef } from "../lib/scale.mjs";
const OK = /^\s*(?:0|9999px|50%|inherit|none|var\(|calc\(var\()/;
export const rule = {
  id: "R07", title: "raw-radius", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (!/^border-radius(?:-[a-z-]+)*$/.test(f.prop) || OK.test(f.value) || isTokenRef(f.value)) return [];
      return [{ line: f.line, message: `自造圆角 ${f.value}`, fix: "var(--m-radius-md) 等菜单值" }];
    }
    const arb = f.token.match(/^rounded(?:-[trblxy]{1,4})?-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1]) && !OK.test(arb[1])) return [{ line: f.line, message: `自造圆角：${f.token}`, fix: "rounded-md" }];
    return [];
  },
};
```

`ai/checks/r08-text-floor.mjs`
```js
import { toPx, isTokenRef } from "../lib/scale.mjs";
const OK = /^\s*(?:inherit|large|small|medium|unset|initial)/;
export const rule = {
  id: "R08", title: "font-size-floor", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (f.prop !== "font-size" || isTokenRef(f.value) || OK.test(f.value)) return [];
      const px = toPx(f.value);
      if (px === null || /%|em$/.test(f.value.trim())) return [];
      return px < 12 ? [{ line: f.line, message: `字号 ${px}px 低于 12px 地板（零例外）`, fix: "var(--m-text-xs) = 12px" }] : [];
    }
    const arb = f.token.match(/^text-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1])) {
      const px = toPx(arb[1]);
      if (px !== null && px < 12) return [{ line: f.line, message: `字号 ${px}px 低于 12px 地板`, fix: "text-xs" }];
    }
    return [];
  },
};
```

> **命名级字阶（`text-base`、`text-hero` 之类）不在本规则范围内**：无法在没有生成物时判定其是否在菜单内，硬判会造成误报。该检查随 S2 的 `tokens.api.md` 一起落地，届时原文记入 `docs/00-open-decisions.md`。

`ai/checks/r09-focus-outline.mjs`
```js
export const rule = {
  id: "R09", title: "focus-outline-removed", layers: ["component", "feature", "demo"], facts: ["decl"],
  check(f) {
    if (f.prop !== "outline" || f.selector?.includes("focus-within")) return [];
    return /^\s*(?:none|0|0px)\s*$/.test(f.value)
      ? [{ line: f.line, message: "移除 outline 且焦点指示不在本选择器上", fix: "依赖 tokens.css 的 outline 焦点环；确需移除请加 meridian-allow 理由" }] : [];
  },
};
```

`ai/checks/r15-rtl-logical.mjs`
```js
export const rule = {
  id: "R15", title: "physical-direction", layers: ["component", "feature", "demo"], facts: ["decl"],
  check(f) {
    return /^(?:margin|padding)-(?:left|right)$/.test(f.prop)
      ? [{ line: f.line, message: `${f.prop} 为物理方向属性`, fix: "margin-inline-start / padding-inline-end" }] : [];
  },
};
```

- [ ] **Step 4: 注册并验证（含旧版误报转正）**

`ai/checks/index.mjs` 追加五条 import 与 `export const rules = [r01…r09,r15]`（保持 ID 升序）。
Run: `node ai/validate.mjs ai/selfcheck/fixtures/R05/pass --only=R05 --json`
Expected: `{"ok":true,"count":0}` —— **这是 D2 路线的关键验收点**：`p-[16px]`、`mt-[12px]`、`gap-[24px]`、`p-4` 一律不报。
Run: `node ai/validate.mjs ai/selfcheck/fixtures --json`
Expected: `fail/` 命中 R05=6、R07=2、R08=3、R09=2、R15=2；`pass/` 全 0。

- [ ] **Step 5: 提交**

```bash
git add ai/checks ai/selfcheck/fixtures
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): R05/R07/R08/R09/R15 刻度与地板；旧版 3 处误报转为常驻反例"
```

### Task 9: R10–R14（可访问名称 / primitive 禁令 / 图像尺寸 / 合规结构 / 引用完整性）

**Files:**
- Create: `ai/lib/parse-doc.mjs`, `ai/checks/r10-icon-name.mjs`, `r11-primitive.mjs`, `r12-img-dims.mjs`, `r13-compliance.mjs`, `r14-doc-refs.mjs`
- Modify: `ai/checks/index.mjs`
- Create: `ai/selfcheck/fixtures/R1{0,1,2,3,4}/{pass,fail}/…`

**Interfaces:**
- Consumes: `tag`/`decl`/`class`/`literal` 事实；`ctx.fs = { changelog, byPath:Map, chapters:Map }`
- Produces: `parseDoc(src, path) → Docref[]`，`Docref = { type:"docref", kind:"section"|"chapter"|"version", file?, section?, target?, line }`；`CN_NUM`；`headingsOf(src)`；五个 `rule` 对象

- [ ] **Step 1: 写 `ai/lib/parse-doc.mjs` 的失败测试**

`ai/lib/parse-doc.test.mjs`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDoc, headingsOf, CN_NUM } from "./parse-doc.mjs";

test("qualified section reference", () => {
  const refs = parseDoc("见 docs/02-color-system.md §六 与 storefront/12-storefront-cart-checkout.md §五。");
  assert.deepEqual(refs.map((r) => [r.kind, r.file, r.section]), [["section", "02", "六"], ["section", "12", "五"]]);
});
test("chapter reference", () => {
  assert.deepEqual(parseDoc("文案规则（08 章）适用").map((r) => [r.kind, r.file]), [["chapter", "08"]]);
});
test("version reference", () => {
  assert.deepEqual(parseDoc("见 v1.0.1 修复记录").map((r) => [r.kind, r.target]), [["version", "1.0.1"]]);
});
test("headingsOf reads chinese numerals", () => {
  const h = headingsOf("# t\n## 一、甲\n## 六、契约\n## Components\n");
  assert.deepEqual(h.map((x) => x.numeral), [1, 6, null]);
});
test("line numbers tracked", () => {
  const refs = parseDoc("a\nb docs/02-color-system.md §三\nc");
  assert.equal(refs.length, 1);
  assert.equal(refs[0].line, 2);
});
```

- [ ] **Step 2: 实现 `ai/lib/parse-doc.mjs`**

```js
export const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };

export function parseDoc(src, path = "") {
  const out = [];
  src.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(/(?:docs|storefront|admin|components)\/(\d{2})[\w-]*\.md\s*§([一二三四五六七八九十]+)/g))
      out.push({ type: "docref", kind: "section", file: m[1], section: m[2], line: i + 1 });
    for (const m of line.matchAll(/(?:第\s*)?(\d{2})\s*章/g))
      out.push({ type: "docref", kind: "chapter", file: m[1], line: i + 1 });
    for (const m of line.matchAll(/\bv(\d+\.\d+\.\d+)\b/g))
      out.push({ type: "docref", kind: "version", target: m[1], line: i + 1 });
  });
  return out;
}

export function headingsOf(src) {
  return [...src.matchAll(/^##\s+(?:([一二三四五六七八九十]+)、)?(.*)$/gm)]
    .map((m) => ({ numeral: CN_NUM[m[1]] ?? null, title: m[2].trim() }));
}
```

`parseDoc(src, path)` 的 `path` 参数仅用于未来区分自我引用，当前实现不消费它（测试不依赖）。

- [ ] **Step 3: 写 fixture**

`ai/selfcheck/fixtures/R10/pass/Feature.tsx`
```tsx
export const a = <IconOnlyButton aria-label="Close"><svg /></IconOnlyButton>;
export const b = <button aria-label="Zoom" className="m-icon-btn"><svg /></button>;
export const c = <button><svg /><span>Save</span></button>;
export const d = <button>{label}<svg /></button>;
export const e = <span><svg /></span>;
```
`ai/selfcheck/fixtures/R10/fail/Feature.tsx`（2 处）
```tsx
export const a = <button className="icon-button"><svg aria-hidden="true" /></button>;
export const b = <a href="/x"><svg /></a>;
```
`ai/selfcheck/fixtures/R11/pass/x.css`
```css
.a { color: var(--m-fg); background: var(--m-critical-solid); box-shadow: 0 0 0 2px rgb(0 0 0 / 0.12); }
```
`ai/selfcheck/fixtures/R11/pass/tokens.css`（define 层，primitive 合法）
```css
:root { --m-border: var(--m-ink-5); --m-primary: var(--m-brand-9); }
```
`ai/selfcheck/fixtures/R11/fail/x.css`（1 处，含两个 primitive）
```css
.a { color: var(--m-brand-9); background: var(--m-ink-12); }
```
`ai/selfcheck/fixtures/R11/fail/Feature.tsx`（2 处）
```tsx
export const a = <div className="text-[var(--m-danger-11)]" style={{ color: "var(--m-ink-9)" }} />;
export const b = "#14664F";
```
`ai/selfcheck/fixtures/R12/pass/x.html`
```html
<img src="/p.avif" alt="x" width="800" height="1000">
<img src="/q.avif" alt="x" class="aspect-[4/5]">
```
`ai/selfcheck/fixtures/R12/fail/x.html`（2 处）
```html
<img src="/p.avif" alt="product" loading="lazy">
<img src="/q.avif" width="80">
```
`ai/selfcheck/fixtures/R13/pass/Feature.tsx`
```tsx
export const a = <Urgency verified={true} label={`Only ${n} left`} />;
export const b = <Price amount={x} compareAt={y} compareAtVerified market="DE" />;
export const c = <ReviewItem item={r} />;
```
`ai/selfcheck/fixtures/R13/fail/Feature.tsx`（4 处）
```tsx
export const a = <Urgency label="Only 3 left" />;
export const b = <Price amount={x} />;
export const c = <Price amount={x} compareAt={y} market="US" />;
export const d = <ReviewItem onlyPositive item={r} />;
```
`ai/selfcheck/fixtures/R14/pass/good-doc.md`
```markdown
见 docs/02-color-system.md §六。文案规则见 docs/08-copywriting.md §一。
```
`ai/selfcheck/fixtures/R14/fail/bad-doc.md`（4 处）
```markdown
见 docs/02-color-system.md §九十九。
见 docs/99-nope.md §一。
见 storefront/13-storefront-trust-conversion.md §七 与 v9.9.9。
信任系统见 13 章。
```

> R14 的 `fail` 期望 4 处：不存在的 `§九十九`、不存在的目标文件、CHANGELOG 里没有的 `v9.9.9`、跨目录裸章节引用「13 章」。`§七` 存在故不报。同目录裸章节引用（如 docs/11 里写「见 13 章」）刻意不判——判定需要读散文语义，写了会造误报，此局限登记在 Task 10 的 AGENTS 局限节。

- [ ] **Step 4: 实现五条规则**

`ai/checks/r10-icon-name.mjs`
```js
const INTERACTIVE = new Set(["button", "a", "summary"]);
export const rule = {
  id: "R10", title: "icon-only-needs-name", layers: ["feature"], facts: ["tag"],
  check(f) {
    if (!INTERACTIVE.has(f.name.toLowerCase())) return [];
    if (!/<svg[\s/>]/i.test(f.inner)) return [];
    if (f.attrs["aria-label"] || f.attrs["aria-labelledby"] || f.attrs.title) return [];
    if (f.attrs.role === "img") return [];
    return f.hasText ? [] : [{ line: f.line, message: `${f.name} 内只有图标且无可访问名称`, fix: 'aria-label="Close"' }];
  },
};
```

`ai/checks/r11-primitive.mjs`
```js
const PRIM = /--m-(?:ink|brand|accent|info|success|warning|danger|mystic)-\d+\b/g;
export const rule = {
  id: "R11", title: "primitive-forbidden", layers: ["component", "feature"], facts: ["decl", "class", "literal"],
  offInDemo: true,
  check(f) {
    const hay = f.type === "decl" ? f.value : f.type === "class" ? f.token : f.text;
    const hits = String(hay ?? "").match(PRIM);
    return hits ? [{ line: f.line, message: `feature/component 层引用 primitive：${[...new Set(hits)].join(", ")}`, fix: "改用语义 token（docs/02 §三）" }] : [];
  },
};
```

`ai/checks/r12-img-dims.mjs`
```js
export const rule = {
  id: "R12", title: "img-needs-intrinsic-size", layers: ["feature", "demo"], facts: ["tag"],
  check(f) {
    if (f.name.toLowerCase() !== "img") return [];
    const { width, height, class: cls, className } = f.attrs;
    if (width && height) return [];
    if (/(^|\s)aspect-(\[[^\]]+\]|square|video|auto)/.test(String(cls ?? className ?? ""))) return [];
    return [{ line: f.line, message: "<img> 未同时声明 width+height，也无 aspect 类（CLS 预算）", fix: 'width="800" height="1000"' }];
  },
};
```

`ai/checks/r13-compliance.mjs`
```js
const DENY = new Set(["onlyPositive", "hideNegative", "filterNegative", "suppressUnfavorable"]);
export const rule = {
  id: "R13", title: "commerce-compliance-props", layers: ["feature"], facts: ["tag"],
  check(f, ctx) {
    const aliases = ctx.cfg?.componentAliases ?? {};
    const groups = { Urgency: ["Urgency"], Price: ["Price"], ReviewItem: ["ReviewItem"] };
    const as = (g) => [...(groups[g] ?? []), ...(aliases[g] ?? [])];
    const n = f.name, a = f.attrs, one = (message, fix) => [{ line: f.line, message, fix }];
    if (as("Urgency").includes(n) && !("verified" in a))
      return one("Urgency 缺 verified —— 无 verified 必须渲染为空（假紧迫感禁令）", "verified={true}");
    if (as("Price").includes(n)) {
      if (!("market" in a)) return one("Price 缺 market —— 税制/千分位/符号位置由市场决定", 'market="US"');
      if ("compareAt" in a && !("compareAtVerified" in a))
        return one("compareAt 未与 compareAtVerified 成对（Omnibus 30 天最低价须后端校验）", "compareAtVerified");
    }
    if (as("ReviewItem").includes(n)) {
      const bad = Object.keys(a).filter((k) => DENY.has(k));
      if (bad.length) return one(`ReviewItem 不接受压制差评的参数：${bad.join(", ")}`, "删除该参数");
    }
    return [];
  },
};
```

`ai/checks/r14-doc-refs.mjs`
```js
import { CN_NUM } from "../lib/parse-doc.mjs";
export const rule = {
  id: "R14", title: "doc-reference-integrity", layers: ["doc"], facts: ["docref"],
  check(f, ctx) {
    const fs = ctx.fs ?? { changelog: null, byPath: new Map(), chapters: new Map() };
    if (f.kind === "version")
      return fs.changelog === null
        ? [{ line: f.line, message: `引用 v${f.target} 但 CHANGELOG.md 不存在（fail-closed）`, fix: "创建 CHANGELOG.md" }]
        : fs.changelog.includes(f.target) ? [] :
          [{ line: f.line, message: `引用 v${f.target} 但 CHANGELOG.md 无此条目`, fix: "补 CHANGELOG 条目或删除引用" }];
    if (f.kind === "chapter") {
      const target = fs.chapters.get(f.file);
      if (!target) return [{ line: f.line, message: `引用「${f.file} 章」但没有编号为 ${f.file} 的文档`, fix: "核对编号" }];
      const dirOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : ".");
      if (dirOf(target) === dirOf(ctx.file.path)) return [];       // 同目录裸引用：语义需读散文，不判（见局限）
      return [{ line: f.line, message: `跨目录裸章节引用「${f.file} 章」实为 ${target}`, fix: `改写成 ${target} §N 形式` }];
    }
    const src = fs.byPath.get(`docs/${f.file}`) ?? [...fs.byPath.entries()].find(([p]) => p.includes(`/${f.file}-`))?.[1];
    if (!src) return [{ line: f.line, message: `引用目标 ${f.file} 不存在`, fix: "" }];
    const numerals = new Set([...src.matchAll(/^##\s+([一二三四五六七八九十]+)、/gm)].map((m) => CN_NUM[m[1]]));
    return numerals.has(CN_NUM[f.section]) ? [] : [{ line: f.line, message: `docs/${f.file} 无 §${f.section}`, fix: "核对目标小节号" }];
  },
};
```

- [ ] **Step 5: 注册全部 14 条并验证**

`ai/checks/index.mjs` 最终为 14 条按 ID 升序的数组。
Run: `node ai/validate.mjs ai/selfcheck/fixtures --json`
Expected: `fail/` 命中 R10=2、R11=3、R12=2、R13=4、R14=4；`pass/` 全 0；`staleAllows` 为空。

- [ ] **Step 6: 提交**

```bash
git add ai/lib/parse-doc.mjs ai/lib/parse-doc.test.mjs ai/checks ai/selfcheck/fixtures
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(validate): R10-R14 可访问名称/primitive 禁令/图像尺寸/合规结构/引用完整性"
```

---

### Task 10: manifest 锁死、植入样本回归、AGENTS 规则映射

**Files:**
- Create: `ai/selfcheck/manifest.json`（`--emit-manifest` 生成后人工审阅）
- Create: `ai/selfcheck/rules.test.mjs`
- Create: `ai/selfcheck/fixtures/R00-audit-sample/{pass,fail}/…`
- Modify: `ai/AGENTS.md`

**Interfaces:**
- Consumes: Task 6–9 全部
- Produces: 不变量 B 的执法者；`npm test` 覆盖规则集；AGENTS 的"规则↔条款映射"表

- [ ] **Step 1: 搬入审计样本**

把本次审计的植入样本原样写入 `ai/selfcheck/fixtures/R00-audit-sample/fail/Feature.tsx`（15 处真违规：`z-[9999]`、`style={{zIndex:9999}}`、`duration-[900ms]`、`animation:"m-spin 2s linear infinite"`、`p-[0.6rem]`、`mt-[0.55rem]`、`var(--m-brand-9)`、`var(--m-ink-12)`、`text-[var(--m-danger-11)]`、`outline:none`、`rounded-[6px]`、无宽高的 `<img>`、`<Urgency>` 缺 verified、`marginLeft`、缺 aria-label 的 `icon-button`），并把 4 处合规代码（`p-[16px] mt-[12px] gap-[24px]`、`IconOnlyButton aria-label`）写入同目录 `pass/Feature.tsx`。

- [ ] **Step 2: 生成 manifest 并审阅**

```bash
node ai/validate.mjs ai/selfcheck/fixtures --emit-manifest ai/selfcheck/manifest.json
```
Expected: `manifest written: N expected hits`。**逐条人工核对**：`fail/` 每个文件的命中行数 = 该文件里故意的违规行数；`pass/` 一条不缺（即 manifest 里没有 `pass/` 路径）。审阅后提交，此后 manifest 只能随规则意图变化而改。

- [ ] **Step 3: 写集合相等断言测试**

`ai/selfcheck/rules.test.mjs`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { rules } from "../checks/index.mjs";
import { run } from "../lib/engine.mjs";
import { factsFor, buildFs } from "../lib/facts.mjs";

const manifest = JSON.parse(readFileSync("ai/selfcheck/manifest.json", "utf8"));
const root = "ai/selfcheck/fixtures";
const key = (v) => `${v.rule}|${v.file.replace(/\\/g, "/")}|${v.line}`;
const walkAll = (dir) => !statSync(dir, { throwIfNoEntry: false })?.isDirectory() ? []
  : readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walkAll(p) : [p]; });

function scan(files) {
  const scanned = files.map((p) => factsFor(p, { ignore: [] }));
  return run({ files: scanned, rules, cfg: { componentAliases: {} }, fs: buildFs(scanned) }).violations;
}
const all = walkAll(root);

test("fail/ 命中集合与 manifest 完全相等（漏报与误报同样红）", () => {
  const want = manifest.map(key).sort();
  const got = scan(all.filter((p) => p.includes("fail"))).map(key).sort();
  assert.deepEqual(got, want, "集合漂移：\n" + got.filter((g) => !want.includes(g)) + " / " + want.filter((w) => !got.includes(w)));
});

test("pass/ 零违规（常驻反例保护）", () => {
  const out = scan(all.filter((p) => p.includes("pass")));
  assert.deepEqual(out.map(key), [], "真阴性被误报：" + out.map((v) => `${v.rule} ${v.file}:${v.line}`).join(", "));
});

test("每条规则至少 1 真阳性 + 1 真阴性 fixture", () => {
  for (const r of rules) {
    assert.ok(all.some((p) => p.includes(`/${r.id}/fail/`)), `${r.id} 缺真阳性`);
    assert.ok(all.some((p) => p.includes(`/${r.id}/pass/`)), `${r.id} 缺真阴性`);
  }
});

test("审计植入样本：15 命中、0 误报", () => {
  const dir = `${root}/R00-audit-sample`;
  const hits = scan(walkAll(dir)).filter((v) => !v.file.includes("manifest"));
  assert.equal(hits.filter((v) => v.file.includes("fail")).length, 15);
  assert.equal(hits.filter((v) => v.file.includes("pass")).length, 0);
});

test("三种输出模式在存在违规时一律退出码 1", () => {
  const bad = `${root}/R01/fail/Feature.tsx`;
  for (const mode of [[], ["--json"], ["--sarif"]])
    assert.throws(() => execFileSync(process.execPath, ["ai/validate.mjs", bad, ...mode], { stdio: "pipe" }), (e) => e.status === 1);
});

test("CLI 向后兼容：位置目录参数仍可用", () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ["ai/validate.mjs", "ai/lib"], { stdio: "pipe" }));
});
```

- [ ] **Step 4: 跑测试**

Run: `npm test` → Expected: 全绿。**若 `pass/` 出现误报，一律改规则而不是改 fixture**（fixture 是合同，规则是被审方）。

- [ ] **Step 5: AGENTS.md 增补两节**

在 `## 1. Hard rules (validator-enforced)` 标题下、第 1 条规则之前插入映射表；在文件末尾（`## 7. Before you finish` 之后）插入局限节。映射表内容照抄 spec §4.3 的 14 行规则表并加两列语义级说明：

```markdown
### Rule ↔ clause map（十条硬规则必须 10/10 有守卫）

| AGENTS 条款 | 规则 | 合规写法 |
|---|---|---|
| §0 primitive 禁用 | R11 | 语义 token |
| 1 无裸色值 | R01 | `var(--m-fg)` / `bg-surface` |
| 2 不自造 z-index | R02 | `z-[var(--m-z-modal)]` |
| 3 不自造时长/缓动 | R03 | `duration-[var(--m-duration-150)]` |
| 4 无 !important | R04 | 行级 `meridian-allow: <reason>` |
| 5 间距走 4px 网格 | R05 | `p-4` / `p-[var(--m-space-4)]` |
| 6 图标元素需名称 | R10 | `aria-label="Close"` |
| 7 圆角只用菜单值 | R07 | `rounded-md` |
| 8 焦点必须可见 | R09（+ tokens.css 单一焦点环） | 不写 `outline:none` |
| 9 复合容器用 tool 族 | 语义级靠 review；数值面由 R05/R07 覆盖 | `.m-tool` |
| 10 表面 rank | 语义级靠 review | `--m-bg-*` 阶梯 |
| — 12px 字号地板 | R08 | `text-xs` 起 |
| — img 声明宽高 | R12 | `width` + `height` |
| — 合规结构 prop | R13 | `verified` / `market` / `compareAtVerified` |
| — 引用完整性 | R14 | `docs/02 §六` 带文件名 |
| — RTL 逻辑属性 | R15 | `margin-inline-start` |

豁免只有一种写法：`/* meridian-allow: <原因> */`（或 `// meridian-allow: <原因>`）。无理由的标记不生效；未被消耗的标记会以 `stale-allow` 失败。文件级白名单已废除。
```

```markdown
## 8. 校验器已知局限（零依赖路线的定价）

- 模板字符串拼接的类名（`` `z-[${n}]` ``）不解析 → 保守放行。
- Sass/Less 嵌套与 mixin 不支持；SFC 的 `:class`/`:style` 动态绑定不解析。
- 命名级字阶（如 `text-base`）是否越界无法在当前判定，随 S2 的 `tokens.api.md` 落地。
- R13 依赖组件标签名；业务侧 wrapper 必须登记进 `meridian.config.json` 的 `componentAliases`。
- R14 只判三种形式：`<dir>/NN-*.md §X`、跨目录裸「NN 章」、`vX.Y.Z`。**同目录裸章节引用与「（第N节）」不判**——判定需读散文语义，硬判会造误报。本轮手工归位一次（Task 15），残留由 S2 的锚点系统接管。
- demo 层（`design-system.html`）整体关闭 R01/R11（色板浏览器必须直接引用 ramp），区段级收窄待 S2。
- 运行时事实（焦点是否真的可见、ARIA 是否真的正确）由 S4 的 axe / Playwright 接管。
```

- [ ] **Step 6: 提交**

```bash
git add ai/selfcheck ai/AGENTS.md
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "test(validate): manifest 精确集合断言 + 15 处植入样本回归 + AGENTS 规则映射与局限"
```

## Phase 3 · 规范与实现层

> 本阶段的清洗量是实测出来的，不是估的：`ai/meridian-ui.css` 现有 R01×5、R03×3、R07×2、R08×5、R09×2、R11×14、R15×4、R05×31 行。Task 13 处理前七类，Task 14 单独处理 31 处脱网格间距（它是最大宗且会带来轻微视觉位移，必须可单独回滚）。

### Task 11: 焦点环收敛为 `outline` 单点

**Files:**
- Modify: `ai/tokens.css`（`/* ---- Focus ring */` 段之后新增块）
- Modify: `ai/meridian-ui.css:22-30`（删除）、`:109`、`:121`（补可见焦点）
- Modify: `ai/tailwind-theme.css:143-152`（删除两个 `:focus-visible` 块）
- Create: `ai/selfcheck/focus-ring.test.mjs`

**Interfaces:**
- Consumes: `--m-focus-ring-width/-offset/-color`（tokens.css 已存在）
- Produces: 全仓库唯一焦点环声明点；隐藏原生控件的可见焦点规则；后续 R09/R10 修复的前提

- [ ] **Step 1: 写失败测试**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = ["ai/tokens.css", "ai/meridian-ui.css", "ai/tailwind-theme.css"];
const ringHits = (p) => (readFileSync(p, "utf8").match(/:focus-visible/g) ?? []).length;

test("焦点环只在一个文件声明", () => {
  assert.deepEqual(files.filter((p) => ringHits(p) > 0), ["ai/tokens.css"]);
});
test("焦点环用 outline，不用 box-shadow", () => {
  const css = readFileSync("ai/tokens.css", "utf8");
  const block = css.slice(css.indexOf(":focus-visible"), css.indexOf(":focus-visible") + 900);
  assert.match(block, /outline:\s*var\(--m-focus-ring-width\)\s+solid\s+var\(--m-focus-ring-color\)/);
  assert.doesNotMatch(block, /box-shadow/);
});
test("隐藏的原生控件在可见部件上给焦点", () => {
  const ui = readFileSync("ai/meridian-ui.css", "utf8");
  for (const sel of [".m-check input:focus-visible + .box", ".m-radio input:focus-visible + .box", ".m-switch input:focus-visible + .track"])
    assert.ok(ui.includes(sel), `缺少 ${sel}`);
});
test("不再用 border-radius:inherit 配合焦点环", () => {
  assert.doesNotMatch(readFileSync("ai/tokens.css", "utf8"), /border-radius:\s*inherit/);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/selfcheck/focus-ring.test.mjs` → Expected: 三条失败（声明点在 meridian-ui.css 与 tailwind-theme.css，tokens.css 为 0；缺 `+ .box` 规则；存在 `border-radius: inherit`）

- [ ] **Step 3: 在 `ai/tokens.css` 的 `/* ---- Focus ring */` 变量块之后新增唯一声明点**

```css
/* ============================================================================
   FOCUS RING — 全系统唯一声明点。用 outline 而非 box-shadow：组件层的阴影与
   选中态都用 box-shadow，同优先级靠后会把焦点环吃掉（v1.0.0 的真实缺陷）。
   组件层禁止再声明焦点环；确需抑制 outline 必须加 meridian-allow 并给替代指示。
   ============================================================================ */
:where(button, a, input, select, textarea, summary, [tabindex], .m-tool, .m-size-pill, .m-page, .m-swatch):focus-visible {
  outline: var(--m-focus-ring-width) solid var(--m-focus-ring-color);
  outline-offset: var(--m-focus-ring-offset);
}
/* 后台：环贴控件边框内侧（Polaris 式），不挤占布局 */
.stage-admin :where(button, a, input, select, textarea, summary, [tabindex], .m-tool, .m-size-pill, .m-page, .m-swatch):focus-visible {
  outline-offset: calc(-1 * (var(--m-focus-ring-width) + 1px));
}
```

- [ ] **Step 4: 删除旧实现并给隐藏控件补焦点**

- 删 `ai/tailwind-theme.css:143-152` 两个 `:focus-visible` 块（含其中的 `outline: none` 与 `border-radius: inherit`）
- 删 `ai/meridian-ui.css:22-30` 两个 `:where(...):focus-visible` 块
- 在 `ai/meridian-ui.css` 的 `.m-switch input:checked + .track::after` 之后插入：

```css
/* 原生 input 被 opacity:0 隐藏，焦点必须画在可见部件上（WCAG 2.4.7） */
.m-check input:focus-visible + .box,
.m-radio input:focus-visible + .box,
.m-switch input:focus-visible + .track {
  outline: var(--m-focus-ring-width) solid var(--m-focus-ring-color);
  outline-offset: var(--m-focus-ring-offset);
}
```

- [ ] **Step 5: 跑测试 + 人工键盘走查**

Run: `node --test ai/selfcheck/focus-ring.test.mjs && npm test` → Expected: 全绿
浏览器打开 `design-system.html`，Tab 走查并在三种主题下各走一遍（前台浅色 / 后台浅色 / `.theme-dark`）：复选框、单选、开关、tabs、侧栏激活项、选中色号、分页按钮 全部出现可见环；后台的环贴边框内侧。

- [ ] **Step 6: 提交**

```bash
git add ai/tokens.css ai/meridian-ui.css ai/tailwind-theme.css ai/selfcheck/focus-ring.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "fix(a11y): 焦点环改 outline 并收敛到 tokens.css 单点；隐藏控件在可见部件上给焦点"
```

---

### Task 12: 舞台默认值翻转 + `--m-body-fs` + 入口文档

**Files:**
- Modify: `ai/tokens.css`（`:root` 语义块、`.stage-admin`、`.stage-storefront`、两个深色块）
- Modify: `ai/tailwind-theme.css:139`、`ai/meridian-ui.css:12`
- Modify: `README.md`（方式 A 第 2 步）、`ai/prompts.md`（5 个模板）
- Modify: `ai/AGENTS.md:42`（舞台表 Root class 行）
- Create: `ai/selfcheck/stage.test.mjs`

**Interfaces:**
- Consumes: Task 11 的焦点块（同一文件，注意编辑顺序）
- Produces: `:root` = Storefront 浅色；`.stage-admin` 自足且必须显式声明；`--m-body-fs` 舞台 token；`.theme-dark` 与 `.stage-*` 同元素可用

- [ ] **Step 1: 写失败测试**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("ai/tokens.css", "utf8");
const block = (sel) => {
  const i = css.indexOf(sel + " {");
  return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
};

test(":root 已经给出前台近黑主操作", () => {
  assert.match(block(":root, .stage-storefront"), /--m-primary:\s*var\(--m-ink-12\)/);
  assert.match(block(":root, .stage-storefront"), /--m-fg-link:\s*var\(--m-ink-12\)/);
  assert.match(block(":root, .stage-storefront"), /--m-card-shadow:\s*var\(--m-shadow-e1\)/);
  assert.match(block(":root, .stage-storefront"), /--m-body-fs:\s*var\(--m-text-lg\)/);
});
test("后台才是必须显式声明的那一侧", () => {
  assert.match(block(".stage-admin"), /--m-primary:\s*var\(--m-brand-9\)/);
  assert.match(block(".stage-admin"), /--m-fg-link:\s*var\(--m-brand-11\)/);
  assert.match(block(".stage-admin"), /--m-card-shadow:\s*none/);
  assert.match(block(".stage-admin"), /--m-body-fs:\s*var\(--m-text-md\)/);
});
test("主题类可与舞台类同元素", () => {
  assert.ok(/\.stage-storefront\.theme-dark/.test(css), "前台深色缺同元素写法");
  assert.ok(/\.stage-admin\.theme-dark/.test(css), "后台深色缺同元素写法");
});
test("没有同值死代码", () => {
  assert.doesNotMatch(block(".stage-admin"), /--m-text-md:/);
  assert.doesNotMatch(block(".stage-admin"), /--m-radius-md:/);
});
test("入口文档都提到舞台类", () => {
  assert.match(readFileSync("README.md", "utf8"), /stage-admin/);
  assert.match(readFileSync("ai/AGENTS.md", "utf8"), /`\.stage-admin` 必写/);
  const prompts = readFileSync("ai/prompts.md", "utf8");
  assert.equal((prompts.match(/\.stage-admin/g) ?? []).length >= 3, true);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test ai/selfcheck/stage.test.mjs` → Expected: 五条全红

- [ ] **Step 3: 重排 `ai/tokens.css` 语义块**

`:root` 的语义块选择器改为 `:root, .stage-storefront`，并把原 `.stage-storefront` 的 11 行整体移入（**`:root` 内的品牌绿 7 行同时删除**）：

```css
:root, .stage-storefront {
  /* …原 :root 的 surfaces / content / border / state layers / commerce 全部保留… */
  /* 主操作：画廊舞台原则 = 中性近黑（黑已是端点，hover 方向例外为提亮） */
  --m-primary: var(--m-ink-12);
  --m-primary-hover: color-mix(in oklab, var(--m-ink-12) 86%, #FFFFFF);  /* meridian-allow: endpoint-black-not-darker */
  --m-primary-active: color-mix(in oklab, var(--m-ink-12) 94%, #FFFFFF); /* meridian-allow: endpoint-black-not-darker */
  --m-primary-fg: #FFFFFF;
  --m-primary-text: var(--m-ink-12);
  --m-primary-tint: var(--m-ink-2);
  --m-primary-border: var(--m-ink-7);
  --m-fg-link: var(--m-ink-12);
  --m-fg-link-hover: var(--m-ink-9);
  --m-card-shadow: var(--m-shadow-e1);
  --m-card-radius: var(--m-radius-xl);
  --m-overlay-blur: 4px;
  --m-body-fs: var(--m-text-lg);
}
```

`.stage-admin` 补齐后台自足的一套（**注意 `--m-bg-chrome` 三行已在，勿重复**）：

```css
.stage-admin {
  /* …原有 bg-page/bg-inset/chrome 三档/两条 shadow/text-md 处理见 Step 4… */
  --m-primary: var(--m-brand-9);
  --m-primary-hover: var(--m-brand-10);
  --m-primary-active: var(--m-brand-10);
  --m-primary-fg: #FFFFFF;
  --m-primary-text: var(--m-brand-11);
  --m-primary-tint: var(--m-brand-2);
  --m-primary-border: var(--m-brand-7);
  --m-fg-link: var(--m-brand-11);
  --m-fg-link-hover: var(--m-brand-12);
  --m-card-shadow: none;
  --m-card-radius: var(--m-radius-lg);
  --m-overlay-blur: 0px;
  --m-body-fs: var(--m-text-md);
}
```

深色：把现有 `[data-theme="dark"], .theme-dark` 块里的品牌绿 primary 一套**移入** `.theme-dark .stage-admin, .stage-admin.theme-dark, .stage-admin[data-theme="dark"]`；`:root`/`.theme-dark` 深色块本身保留前台一套（`--m-primary: var(--m-ink-2)`、`--m-primary-fg: var(--m-ink-12)`、`--m-primary-text: var(--m-ink-2)`、`--m-fg-link: var(--m-ink-2)`、`--m-fg-link-hover: #FFFFFF`、`--m-primary-tint: rgb(255 255 255 / 0.08)`、`--m-primary-border: var(--m-border-strong)`）。末尾原 `.stage-storefront` 与其深色块整体删除（内容已并入上述两处）。

- [ ] **Step 4: 正文尺寸走舞台 token**

- `ai/tokens.css` 的 `.stage-admin` 中删除 `--m-text-md: 0.875rem;` 与 `--m-radius-md: calc(...)` 两行（同值死代码）
- `ai/tailwind-theme.css:139` 的 `font-size: var(--m-text-lg)` → `font-size: var(--m-body-fs)`
- `ai/meridian-ui.css:12` 的 `font-size: var(--m-text-lg)` → `font-size: var(--m-body-fs)`

- [ ] **Step 5: 入口文档三处**

`README.md` 方式 A 第 2 步替换为：
```markdown
2. 引入样式：`@import "ai/tokens.css"; @import "ai/tailwind-theme.css";`
   舞台：`:root` 已是**前台浅色**（主操作近黑）；**后台必须在 `<html>` 或 `<body>` 加 `.stage-admin`**，否则会拿到前台的按钮色与 16px 正文。深色加 `.theme-dark` 或 `data-theme="dark"`，可与舞台类同元素。
```
`ai/AGENTS.md:42` 舞台表 `Root class` 行替换为：
```markdown
| Root class | 默认（`:root` 即前台）；`.stage-storefront` 可选显式声明 | **`.stage-admin` 必写**（+ `.theme-dark`，可与舞台类同元素或置于根元素） |
```
`ai/prompts.md`：模板 2（后台）Requirements 首行加 `Root element carries .stage-admin (and .theme-dark when the dark theme is on).`；模板 1/3/4/5 的 Requirements 或 Rules 首行加 `Storefront stage needs no class (:root is storefront); never add .stage-admin to storefront pages.`

- [ ] **Step 6: 跑测试 + 样张目视**

Run: `node --test ai/selfcheck/stage.test.mjs && npm test` → Expected: 全绿
Run: `node ai/validate.mjs ai/tokens.css --only=R01,R02,R03,R04,R07 --json` → Expected: `ok:true`（两条 `meridian-allow` 被消耗，无 stale）

- [ ] **Step 7: 提交**

```bash
git add ai/tokens.css ai/tailwind-theme.css ai/meridian-ui.css README.md ai/prompts.md ai/AGENTS.md ai/selfcheck/stage.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "fix(tokens): :root 默认改为前台舞台，后台必须显式 .stage-admin；补 --m-body-fs 与主题同元素写法"
```

---

### Task 13: 参考实现清零（R01/R03/R07/R08/R09/R11/R15 + 6 个新语义 token）

**Files:**
- Modify: `ai/tokens.css`（6 个新语义 token，浅/深两处）
- Modify: `ai/tokens.json`（同名 6 项）
- Modify: `ai/meridian-ui.css`（实测 35 行）
- Modify: `design-system.html`（28 处 <12px、`:53` z-index、`ramp-demo` 标记、1 处圆角）
- Modify: `components/18-component-contracts.md:159`
- Create: `ai/selfcheck/tokens-sync.test.mjs`

**Interfaces:**
- Consumes: Task 12 的语义块结构；R01/R07/R08/R09/R11/R15/R02
- Produces: `--m-critical-solid-hover`、`--m-critical-solid-active`、`--m-control-off-bg`、`--m-tooltip-bg`、`--m-tooltip-fg`、`--m-neutral-solid`

- [ ] **Step 1: 加 6 个语义 token 并同步 tokens.json**

`ai/tokens.css` 的 `:root, .stage-storefront` 内、状态族之后插入（浅色值）：
```css
  --m-critical-solid-hover: var(--m-danger-10);
  --m-critical-solid-active: var(--m-danger-10);
  --m-control-off-bg: var(--m-ink-8);
  --m-tooltip-bg: var(--m-ink-12);
  --m-tooltip-fg: #FFFFFF;
  --m-neutral-solid: var(--m-ink-9);
```
`.theme-dark`（含 `[data-theme="dark"]`）同一位置插入深色值：
```css
  --m-critical-solid-hover: var(--m-danger-8);
  --m-critical-solid-active: var(--m-danger-7);
  --m-control-off-bg: #5C6675;
  --m-tooltip-bg: var(--m-ink-6);
  --m-tooltip-fg: var(--m-ink-12);
  --m-neutral-solid: var(--m-ink-9);
```
`ai/tokens.json` 的 `color.semantic.light` 与 `color.semantic.dark` 各加同名 6 项，值沿用文件内既有写法（`"danger-10"`、`"ink-8"`、`"#5C6675"`）。

一致性测试 `ai/selfcheck/tokens-sync.test.mjs`：
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const NEW = ["--m-critical-solid-hover", "--m-critical-solid-active", "--m-control-off-bg",
             "--m-tooltip-bg", "--m-tooltip-fg", "--m-neutral-solid", "--m-body-fs"];

test("新增语义 token 同时存在于 tokens.css 与 tokens.json", () => {
  const css = readFileSync("ai/tokens.css", "utf8");
  const json = readFileSync("ai/tokens.json", "utf8");
  for (const t of NEW) {
    assert.ok(css.includes(`${t}:`), `${t} 未在 tokens.css 声明`);
    assert.ok(json.includes(`"${t.replace(/^--m-/, "")}"`) || json.includes(t.replace(/^--m-/, "")), `${t} 未同步进 tokens.json`);
  }
});
```

- [ ] **Step 2: `ai/meridian-ui.css` 逐行替换（实测清单）**

| 行 | 现状片段 | 替换为 |
|---|---|---|
| 69 | `animation: m-spin 0.7s linear infinite` | 保持 + 行尾 `/* meridian-allow: continuous-spinner-cycle */` |
| 123 | `background: #fff` / `box-shadow: 0 1px 2px rgb(0 0 0 / 0.2)` | `background: var(--m-fg-on-solid)` / `box-shadow: var(--m-shadow-e1)` |
| 148 | `--_solid: var(--m-ink-9); --_solid-fg: #fff` | `var(--m-neutral-solid)` / `var(--m-fg-on-solid)` |
| 163 | `animation: m-spin 0.8s linear infinite` | 同 69 的 allow 标记 |
| 165 | `animation: m-shimmer 1.5s infinite` | 同 allow 标记，reason `shimmer-cycle-by-spec` |
| 192 | `background: var(--m-ink-12); color: #fff` | `var(--m-tooltip-bg)` / `var(--m-tooltip-fg)` |
| 193 | `[data-theme="dark"] .m-tooltip .tip … var(--m-ink-6) … var(--m-ink-12)` | 整行删除（深色由 `--m-tooltip-*` 自动给） |
| 200/204 | `font-size: 11px` ×2、`border-radius: 4px` ×2 | `var(--m-text-xs)`、`var(--m-radius-sm)` |
| 284 | `background: var(--m-brand-3); color: var(--m-brand-12)` | `var(--m-primary-tint)` / `var(--m-primary-text)`（登记为唯一可见色差项） |
| 311 | `border: 1px solid rgb(0 0 0 / 0.12)` | `1px solid var(--m-border)` |
| 317 | `background: var(--m-ink-12); color: var(--m-ink-1); border-color: var(--m-ink-12)` | `var(--m-primary)` / `var(--m-primary-fg)` / `var(--m-primary)` |
| 318 | `[data-theme="dark"] .m-size-pill.is-selected … var(--m-ink-3)/var(--m-ink-12)` | 整行删除（舞台深色层已给 `--m-primary`） |
| 345 | `color: #fff` | `var(--m-fg-on-solid)` |
| 348 | `font-size: 11px` | `var(--m-text-xs)` |
| 411 | `outline: none` | 保持 + `/* meridian-allow: container-expresses-focus */`（容器 `:focus-within` 转 border-focus 色即替代指示） |
| 418/429 | `font-size: 11px` ×2 | `var(--m-text-xs)` |
| 101/105 | `padding-right: 36px` / `padding-left: 36px` | `padding-inline-end` / `padding-inline-start` |
| 231/387 | `margin-left: auto` / `margin-left: var(--m-tool-gap-loose)` | `margin-inline-start` |

- [ ] **Step 3: `design-system.html` 清洗**

- `:53` 的自造 `z-index` 数值 → `var(--m-z-tooltip)`
- 28 处 `font-size:9px|10px|11px`（内联 style 与 `<style>` 内）→ `font-size:var(--m-text-xs)`
- 色板浏览器与 ramp 演示区前后加 `<!-- meridian-begin: ramp-demo -->` / `<!-- meridian-end: ramp-demo -->`（若该区的 45 处 hex 与 35 处 ramp 引用已被 demo 层的 `offInDemo` 覆盖，则标记可省；以 `--only=R01,R11` 的实跑结果为准，只有仍报的位置才加标记）
- `:1128` 的 `border-radius:10px` → `var(--m-radius-md)`

- [ ] **Step 4: `components/18` 的 11px 规格改口径**

`components/18-component-contracts.md:159`：
```markdown
| 合规小字 | 固定 12px（`--m-text-xs`）+ `fg-subtle`；位于容器**外部**下方（不属于工具栏基线） |
```

- [ ] **Step 5: 验证（对应验收 A4/A5/A6）**

```bash
node ai/validate.mjs ai/meridian-ui.css --only=R01,R03,R07,R08,R09,R11,R15 --json   # ok:true
node ai/validate.mjs ai/tokens.css ai/tokens.json --only=R04 --json                   # ok:true
node --test ai/selfcheck/tokens-sync.test.mjs                                         # pass 1
node ai/validate.mjs design-system.html --only=R08,R02,R07 --json                     # ok:true
```
Run: `npm test` → Expected: 全绿（`pass/` 无误报、`fail/` 命中不变）

- [ ] **Step 6: 提交**

```bash
git add ai/tokens.css ai/tokens.json ai/meridian-ui.css design-system.html components/18-component-contracts.md ai/selfcheck/tokens-sync.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "fix: 参考实现消除 primitive 越权/裸色值/越界圆角/低于地板字号/物理方向属性，补 6 个语义 token"
```

### Task 14: 31 行脱网格间距归位

**Files:**
- Modify: `ai/meridian-ui.css`（实测 31 行含 padding/margin/gap 脱网格值）
- Modify: `design-system.html`（内联 style 中的 `padding:6px`/`gap:6px` 等同类值）

**Interfaces:**
- Consumes: R05、`--m-space-*`
- Produces: component/demo 层 R05 清零

- [ ] **Step 1: 先跑一次，取得权威清单**

Run: `node ai/validate.mjs ai --only=R05 --json > _audit/r05.json`
Expected: 列出 `ai/meridian-ui.css` 与 `design-system.html` 的脱网格行。**以这份输出为唯一工作清单**（不要凭 grep 猜测），逐行记录 offending px 值集合。

- [ ] **Step 2: 按值映射替换（就近取 4 的倍数，中点上取；同时换成 token）**

| 现值 | 替换为 |
|---|---|
| `1px` | `var(--m-space-05)`（2px） |
| `5px` | `var(--m-space-1)`（4px） |
| `6px` | `var(--m-space-2)`（8px） |
| `10px` | `var(--m-space-3)`（12px） |
| `14px` | `var(--m-space-4)`（16px） |

规则：只替换 `padding` / `margin` / `gap` / `row-gap` / `column-gap` 声明内的值分量；`0` 保持；已经是 `var(--m-space-*)` 的不动；`width` / `height` / `min-height` / `top` / `left` 等非间距属性一律不动（它们不在 R05 范围，改成 token 反而会掩盖真实尺寸意图）。
典型改写：
```css
.m-palette li   { padding: 8px 10px; }   →  padding: var(--m-space-2) var(--m-space-3);
.m-tag          { padding: 2px 10px; }   →  padding: var(--m-space-05) var(--m-space-3);
kbd             { padding: 1px 6px; }    →  padding: var(--m-space-05) var(--m-space-2);
.m-product-card .info { padding: 10px 12px 14px; } →  padding: var(--m-space-3) var(--m-space-3) var(--m-space-4);
.m-rating .stars { gap: 1px; }           →  gap: var(--m-space-05);
.m-code pre     { padding: 12px 14px; }  →  padding: var(--m-space-3) var(--m-space-4);
```

- [ ] **Step 3: 验证**

Run: `node ai/validate.mjs ai design-system.html --only=R05 --json` → Expected: `ok:true`
Run: `npm test` → Expected: 全绿（fixture 不受影响）
目视 `design-system.html`：徽章/标签/代码块/分页的间隙略微变松（6→8、10→12、14→16），无破版、无换行异常。该位移在 Task 17 的 MIGRATION 里作为已声明变更登记。

- [ ] **Step 4: 提交**

```bash
git add ai/meridian-ui.css design-system.html
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "fix(ui): 31 行脱 4px 网格间距归位为 --m-space-* token"
```

---

### Task 15: `.m-toast` 参考实现 + 密度切换 + 三处口径统一

**Files:**
- Modify: `ai/meridian-ui.css`（新增 toast 块 + `[data-density]`）
- Modify: `ai/AGENTS.md:46`、`admin/15-admin-data-tables.md`、`docs/17-admin-feedback-dashboard.md`
- Create: `ai/selfcheck/orphans.test.mjs`

**Interfaces:**
- Consumes: `--m-toast-bg/fg/radius/duration`、`--m-z-toast`、`--m-table-row-h-productive`（当前全为零消费者孤儿）
- Produces: `.m-toast` / `.m-toast-stack` 类族、`[data-density="productive"]` 开关

- [ ] **Step 1: 写孤儿收敛测试（先失败）**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const impl = ["ai/meridian-ui.css", "ai/tailwind-theme.css", "design-system.html"]
  .map((p) => readFileSync(p, "utf8")).join("\n");

test("toast 与密度 token 有真实 CSS 消费者", () => {
  for (const t of ["--m-toast-bg", "--m-toast-fg", "--m-toast-radius", "--m-z-toast", "--m-table-row-h-productive"])
    assert.ok(impl.includes(`var(${t})`), `${t} 仍是零消费者孤儿`);
});
test("--m-toast-duration 被声明为 JS 读取，不做假消费", () => {
  assert.match(readFileSync("ai/meridian-ui.css", "utf8"), /--m-toast-duration[^\n]*由 JS 读取/);
});
```

Run: `node --test ai/selfcheck/orphans.test.mjs` → Expected: 两条 FAIL（5 个孤儿 + 缺 JS 读取声明）

- [ ] **Step 2: 实现 toast 与密度**

`--m-toast-duration`（5000ms）表达的是"通知存活多久"，属于计时语义而非样式语义 —— 强行写进 CSS 就是假消费。**它由 JS 读取，本任务只做声明，孤儿测试对它单列。**

```css
/* ---------- 11 Toast（docs/17 §一 规格的参考实现） ----------
   --m-toast-duration 由 JS 读取：setTimeout(…, parseInt(getComputedStyle(el).getPropertyValue('--m-toast-duration')))
   hover 暂停 = 清除 animation 并记剩余时间；退场由 JS 置 data-state="closed" 触发。 */
.m-toast-stack { position: fixed; z-index: var(--m-z-toast); display: flex; flex-direction: column;
  gap: var(--m-space-2); inset-inline-end: var(--m-space-4); bottom: var(--m-space-4); }
.stage-storefront .m-toast-stack { inset-inline: 0; align-items: center; }
.m-toast { display: flex; align-items: center; gap: var(--m-space-3); max-inline-size: 24rem;
  padding: var(--m-space-2) var(--m-space-3); border-radius: var(--m-toast-radius);
  background: var(--m-toast-bg); color: var(--m-toast-fg); font-size: var(--m-text-sm);
  box-shadow: var(--m-shadow-e4);
  animation: m-toast-in var(--m-duration-200) var(--m-ease-enter); }
.m-toast[data-state="closed"] { animation: m-toast-out var(--m-duration-150) var(--m-ease-exit) forwards; }
.m-toast .act { color: inherit; text-decoration: underline; background: none; border: none; cursor: pointer; font: inherit; }
@keyframes m-toast-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes m-toast-out { from { opacity: 1; } to { opacity: 0; transform: translateY(4px); } }

/* 密度：默认 comfortable 48px，可切 productive 36px（docs/15-admin-data-tables.md §三） */
[data-density="productive"] .m-table td { height: var(--m-table-row-h-productive); }
[data-density="productive"] .m-table th { padding-block: var(--m-space-1); }
```

- [ ] **Step 3: 三处密度口径统一为"48 默认 / 36 可切换"**

- `ai/AGENTS.md:46` 的 `| Density | airy, sections --m-space-section | productive, row 36px default |` → `| Density | airy, sections \`--m-space-section\` | **row 48px comfortable 默认**；\`[data-density="productive"]\` 切 36px |`
- `admin/15-admin-data-tables.md` 三、密度表下加一行：`默认 = Comfortable；切换入口在页头设置，不进 URL、不入 Saved Views。`
- `docs/17-admin-feedback-dashboard.md` Toast 小节末尾加：`参考实现见 ai/meridian-ui.css §11（.m-toast-stack / .m-toast）。`

- [ ] **Step 4: 验证**

Run: `node --test ai/selfcheck/orphans.test.mjs && node ai/validate.mjs ai --only=R03,R05,R02 --json && npm test` → Expected: 全绿、`ok:true`
目视：`design-system.html` 的 Toast 演示（若无，则在 `components/18` 的 Banner/Toast 小节补一段最小 markup 示例）能自动淡出。

- [ ] **Step 5: 提交**

```bash
git add ai/meridian-ui.css ai/AGENTS.md admin/15-admin-data-tables.md docs/17-admin-feedback-dashboard.md ai/selfcheck/orphans.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "feat(ui): 补 .m-toast 参考实现与 data-density 切换，消灭 6 个孤儿 token；密度口径统一"
```

---

### Task 16: 阶位表单点化、品牌配方两分支、引用修正、开放决策与 CHANGELOG

**Files:**
- Modify: `docs/02-color-system.md`（§一 表加两列、§十 配方拆分支、§十 内的"第四节"改 §六）
- Modify: `ai/tokens.css:13-20`（删重复阶位表，改为指向）
- Modify: `docs/01-design-philosophy.md`、`docs/07-localization.md`、`README.md`、`components/18-component-contracts.md`、`admin/*.md`（跨目录裸章节引用）
- Create: `docs/00-open-decisions.md`、`CHANGELOG.md`
- Create: `ai/selfcheck/docs-consistency.test.mjs`

**Interfaces:**
- Consumes: R14
- Produces: 阶位表唯一定义；`--only=R14` 全仓 0 违规

- [ ] **Step 1: 阶位表加两列并声明倒挂为契约**

`docs/02-color-system.md` §一 表格改为四列（阶 / 用途 / 比前一阶更深？ / 典型消费者），其中：
```markdown
| 8 | 边框 hover | ✓ | `--m-border-strong` hover |
| 9 | **实底填充（彩度峰值）** | 深色族 ✓ ／ 黄橙族 ✗（比 8 更亮） | `--m-primary`、`*-solid` |
| 10 | 实底 hover / pressed | 深色族 ✓ ／ 黄橙族 ✗ | `--m-primary-hover` |
| 11 | 低对比文本 | 深色族 ✗（比 10 略亮）／ 黄橙族 ✓ | `*-fg`、`--m-fg-link` |
```
表下紧接一段：
```markdown
> **阶位编号代表用途，不代表亮度顺序。** 黄橙族（hue≈45–75°：`accent`/`warning`）的 9/10 阶是**亮实底**，必须配深字 `#2B1F02`（已由 `--m-*-solid-fg` 钉住）；深色族（`ink`/`brand`/`info`/`success`/`danger`/`mystic`）的 9 阶是**深实底**，配白字。
> 因此**不得用"阶越大越深"做任何推断**——这也正是 feature 层禁止引用 primitive 的原因：唯一安全的写法是用语义 token。
> 本表是全系统阶位用途的唯一定义；`ai/tokens.css` 不再重复此表。
```
`ai/tokens.css:13-20` 的重复表整段替换为：`阶位用途唯一定义见 docs/02-color-system.md §一（含黄橙族倒挂说明）。`

- [ ] **Step 2: 品牌配方拆两分支**

`docs/02` §十 的"生成后必须重跑对比契约表（第四节）"改为：
```markdown
生成后先按 9 阶分支判定：`contrast(9阶, #FFFFFF) ≥ 4.5` → **深实底分支**（`*-solid-fg: #FFFFFF`，沿用上面 L 阶梯，9 比 8 更深）；
否则 → **亮实底分支**（9 阶取 `L70 S85`、10 阶 `L62 S85`，`*-solid-fg: #2B1F02`）。
`accent`/`warning` 恒落在亮实底分支（不接受白字）。
两支都必须重跑 `docs/02-color-system.md §六` 的对比契约表，失败先调 9/11 阶。
```

- [ ] **Step 3: 跨目录裸章节引用改为带文件名形式**

至少处理这些实测位置：`docs/01-design-philosophy.md`（"文案规范第 09 章" → `docs/08-copywriting.md §一`）、`docs/07-localization.md`（"文案规则（09 章）" → `docs/08-copywriting.md §一`；"第二节的字段矩阵" → `docs/07-localization.md §三`；"方法排序（第三节）" → `storefront/12-storefront-cart-checkout.md §五`）、`docs/02`（"第四节" → `§六`）、`README.md`（"13 章检查单与 18 章契约" → `storefront/13-storefront-trust-conversion.md §七` 与 `components/18-component-contracts.md`）、`storefront/12`（"14 章第七节" → `admin/14-admin-foundations.md §七`；"07 矩阵" → `docs/07-localization.md §三`）、`components/18`（"16 章" → `admin/16-admin-forms-settings.md`，"17 章" → `admin/17-admin-feedback-dashboard.md`，"15 章" → `admin/15-admin-data-tables.md`，"11 章" → `storefront/11-storefront-pdp.md`，"12/13 章" → 对应文件名），以及 `--only=R14` 实跑报出的其余位置。

- [ ] **Step 4: 新建 `docs/00-open-decisions.md`**

内容 = spec §7 的 7 项待决表（O1 主题可覆盖层级 / O2 深色前台 opt-in 边界 / O3 阶位单调性 / O4 是否提供带行为参考实现 / O5 图表独立色板 / O6 87 演示 vs 22 契约 / O7 包边界）+ 逐条抄录 Task 10 的 AGENTS 局限清单 + 新增一条 `O8：命名级字阶是否越界（依赖 S2 的 tokens.api.md）`。

- [ ] **Step 5: 新建 `CHANGELOG.md`（含基线条目，R14 才会放行版本号引用）**

```markdown
# Changelog
本项目遵循"视觉可见变更 ≥ MINOR；语义重指向 / 删 token / 改默认舞台 = MAJOR + 迁移说明"。

## 1.1.0 — 2026-09-19
### Added
- 校验规则 R05/R07/R08/R09/R11/R12/R13/R14/R15（合计 14 条，全部 error 级）+ `ai/selfcheck` 精确集合回归
- 语义 token：`--m-body-fs`、`--m-critical-solid-hover`、`--m-critical-solid-active`、`--m-control-off-bg`、`--m-tooltip-bg`、`--m-tooltip-fg`、`--m-neutral-solid`
- `.m-toast` 参考实现、`[data-density="productive"]`
- `docs/00-open-decisions.md`、`MIGRATION-1.1.md`、行级 `meridian-allow` 机制
### Changed
- **`:root` 默认舞台由后台语义改为前台**（主操作近黑、正文 16px）；后台必须显式 `.stage-admin`
- 焦点环由 `box-shadow` 改为 `outline`，声明点收敛到 `ai/tokens.css` 一处
- 密度默认统一为 comfortable 48px；间距 31 行归位到 4px 网格（间隙略微放宽）
- 头像底色 `brand-3` → `--m-primary-tint`、文字 `brand-12` → `--m-primary-text`（已声明的色差项）
### Fixed
- 复选框/单选/开关键盘焦点不可见（WCAG 2.4.7）
- `validate.mjs --json` 恒退出 0 造成的 CI 假绿
- 49 处 primitive 越权、33 处低于 12px 字号、16 处物理方向属性、5 处裸色值、2 处越界圆角
- 6 处跨目录引用指向错误目标

## 1.0.1 — 2026-09-15
### Fixed
- `.m-tool` 基础规则不得声明 `border-radius`（同优先级靠后会覆盖形状族圆角）——见 `components/18-component-contracts.md` §Toolbar

## 1.0.0 — 2026-09-13
### Added
- Meridian v1.0.0：三层 token、双舞台规范、22 个组件契约、`ai/` 机器层
```

- [ ] **Step 6: 文档一致性测试 + 验证**

`ai/selfcheck/docs-consistency.test.mjs`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

test("阶位表只在 docs/02 定义一次", () => {
  assert.doesNotMatch(readFileSync("ai/tokens.css", "utf8"), /5\s+选中组件背景/);
  assert.match(readFileSync("docs/02-color-system.md", "utf8"), /比前一阶更深/);
});
test("品牌配方两分支存在", () => {
  const doc = readFileSync("docs/02-color-system.md", "utf8");
  assert.match(doc, /深实底分支/);
  assert.match(doc, /亮实底分支/);
});
test("治理口径已修", () => {
  assert.match(readFileSync("README.md", "utf8"), /视觉可见的值变更\s*≥\s*MINOR/);
});
test("开放决策文件存在", () => {
  assert.ok(existsSync("docs/00-open-decisions.md"));
});
```
Run: `node ai/validate.mjs . --only=R14 --json && npm test` → Expected: `ok:true` + 全绿

- [ ] **Step 7: 提交**

```bash
git add docs CHANGELOG.md ai/tokens.css README.md components admin storefront ai/selfcheck/docs-consistency.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "docs: 阶位表单点化+品牌配方两分支+跨目录引用修正+开放决策登记+CHANGELOG"
```

---

### Task 17: 版本、迁移说明与总验收

**Files:**
- Modify: `README.md`（版本行、文件地图、治理第 1 条、目录名）
- Modify: `ai/tokens.css:2`、`ai/meridian-ui.css:2`、`ai/tokens.json` `$version`
- Create: `MIGRATION-1.1.md`
- Create: `ai/selfcheck/acceptance.test.mjs`

**Interfaces:**
- Consumes: 全部前序任务
- Produces: spec §5 的 A1–A11 一条命令可复核

- [ ] **Step 1: 写验收测试（先失败）**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const run = (args) => { try { return { code: 0, out: execFileSync(process.execPath, ["ai/validate.mjs", ...args], { encoding: "utf8" }) }; }
  catch (e) { return { code: e.status, out: e.stdout ?? "" }; } };
const count = (args) => JSON.parse(run([...args, "--json"]).out || '{"violations":[]}').violations.length;
const REPO = [".", "--exclude", "ai/selfcheck/fixtures"];   // 故意植入的 fail/ 样本不参与全仓验收

for (const rule of ["R11", "R08", "R15", "R14", "R02", "R05", "R01", "R07", "R09"])
  test(`A4-A7：${rule} 全仓 0 违规`, () => assert.equal(count([...REPO, "--only=" + rule]), 0, `${rule} 仍有违规`));

test("A3：三种输出模式一致非零退出", () => {
  const bad = "ai/selfcheck/fixtures/R01/fail/Feature.tsx";
  for (const mode of [[], ["--json"], ["--sarif"]]) assert.equal(run([bad, ...mode]).code, 1);
});
test("A11：版本戳四处一致", () => {
  const ver = "1.1.0";
  assert.ok(readFileSync("README.md", "utf8").includes(`v${ver}`));
  assert.equal(JSON.parse(readFileSync("ai/tokens.json", "utf8")).$version, ver);
  assert.match(readFileSync("ai/tokens.css", "utf8"), /Design Tokens v1\.1\.0/);
  assert.match(readFileSync("ai/meridian-ui.css", "utf8"), /参考组件库 v1\.1\.0/);
  assert.ok(readFileSync("CHANGELOG.md", "utf8").includes(`## ${ver}`));
});
test("字阶与圆角菜单与 tokens.json 一致", async () => {
  const { TEXT_MENU, RADIUS_MENU } = await import("../lib/scale.mjs");
  const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));
  for (const size of Object.keys(json.typography["sizes-px"]))
    assert.ok(TEXT_MENU.includes(size), `tokens.json 有字阶 ${size} 但 TEXT_MENU 没有`);
  for (const r of Object.keys(json.radius["scale-px"]))
    assert.ok(RADIUS_MENU.includes(r), `tokens.json 有 radius.${r} 但 RADIUS_MENU 没有`);
  assert.ok(TEXT_MENU.includes("display"), "tokens.json 的 display-clamp 对应菜单项 display");
});
```

> `RADIUS_MENU` 含 `pill`（`tokens.json` 用 `pill: 9999`），Tailwind 侧对应 `full`；两者都在菜单内，因此该断言只要求 JSON 侧的键都被菜单覆盖。

Run: `node --test ai/selfcheck/acceptance.test.mjs` → Expected: FAIL（版本未 bump、部分规则仍 >0）

- [ ] **Step 2: bump 版本三处 + README 更新**

`ai/tokens.css:2` 与 `ai/meridian-ui.css:2` → `v1.1.0`；`ai/tokens.json` `"$version": "1.1.0"`；`README.md:3` → `**面向欧美市场的企业级电商视觉设计规范** · v1.1.0 · 2026-09-19`。
README 文件地图：目录名 `设计规范0913/` → `设计规范0919/`；删掉 `│   ├── 09-storefront-foundations.md*  （放 storefront/ 目录）` 伪条目；补 `ai/checks/`、`ai/selfcheck/`、`CHANGELOG.md`、`MIGRATION-1.1.md`、`docs/00-open-decisions.md`、`meridian.config.json`、`package.json`。
README 方式 A 第 4 步 → `提交前跑 node ai/validate.mjs src && npm test`。

- [ ] **Step 3: 治理口径改写**

README 治理第 1 条替换为：
```markdown
- 语义变更走 SemVer：**任何视觉可见的值变更 ≥ MINOR**（含 primitive 改值——它是整张对比契约的输入）；加 token = MINOR；
  改语义指向、删 token 或改变默认舞台 = MAJOR + 迁移说明 + codemod。版本以 `ai/tokens.json` 的 `$version` 为唯一声明，
  README / tokens.css / meridian-ui.css / CHANGELOG 必须一致（`npm test` 断言）。
```

- [ ] **Step 4: 写 `MIGRATION-1.1.md`**

八条，逐条含"受影响代码怎么改"：① 默认舞台翻转（前台无需动作 / 后台必须加 `.stage-admin` / ⚠ 未加 `.stage-storefront` 的存量前台按钮会由绿变黑）② 主题类可与舞台类同元素 ③ 焦点环改 `outline`，删除自补的 `box-shadow` 环与 `outline:none` ④ `body{font-size}` 改读 `--m-body-fs` ⑤ 7 个新语义 token 及其替代的原写值 ⑥ 字号地板（11/10/9px → `--m-text-xs`）⑦ 密度默认 48px ⑧ 31 处间距归位导致的间隙放宽（6→8、10→12、14→16）与头像色差项。

- [ ] **Step 5: 全判据复核（spec §5 的 A1–A11）**

```bash
npm test                                              # A1 A2 A3 A11
node ai/validate.mjs . --only=R11,R08,R15,R14,R02,R05,R01,R07,R09 --json   # A4 A5 A6 A7
```
手工清单（A8、A9、A10）：键盘走查 6 类控件 × 3 主题；裸前台样张 = 近黑 CTA、`.stage-admin` 样张 = 品牌绿 + 14px 正文；`git diff --stat 143edd0` 逐文件核对变更均在 MIGRATION 与 spec §3.1 范围内。

- [ ] **Step 6: 提交**

```bash
git add README.md MIGRATION-1.1.md ai/tokens.css ai/tokens.json ai/meridian-ui.css ai/selfcheck/acceptance.test.mjs
git -c user.name="Meridian DS" -c user.email="meridian-ds@local" commit -m "chore(release): v1.1.0 + 迁移说明 + S1 全判据验收测试"
```

---

## 判据 ↔ 任务覆盖

| 判据 | 由哪个任务交付 |
|---|---|
| A1 植入样本 15/15、0 误报 | T10（Step 1/3） |
| A2 每规则真阳性+真阴性 | T7–T10（`rules.test.mjs` 断言） |
| A3 三模式一致退出码 | T6（Step 7）+ T10（断言） |
| A4 primitive 49→0 | T13 |
| A5 <12px 33→0 | T13 |
| A6 物理方向 16→0 | T13 |
| A7 引用错误 0 | T16 |
| A8 键盘走查 | T11 Step 5 + T17 Step 5 |
| A9 舞台默认值行为 | T12 |
| A10 基线 diff 可证 | T17 Step 5 |
| A11 `npm run lint` 全绿 + 10/10 有守卫 | T10（映射表）+ T17 |

