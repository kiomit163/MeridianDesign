import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, applyBaseline, format } from "./engine.mjs";
import { factsFor, buildFs } from "./facts.mjs";
import { classify } from "./classify.mjs";
import { collectAllows } from "../checks/allow.mjs";
import { rules } from "../checks/index.mjs";
import { parseCss } from "./parse-css.mjs";
import { walk, excludePaths, parseArgs } from "../validate.mjs";

const fake = { id: "R99", title: "t", layers: ["feature"], facts: ["decl"],
  check: (f) => (f.value === "bad" ? [{ line: f.line, message: "bad value" }] : []) };
const file = (path, layer, facts, text = "") => ({ path, layer, text, facts });
const cfg = () => JSON.parse(readFileSync("meridian.config.json", "utf8"));

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

// 去重的契约：同一规则、同一文件、同一行、同一条 message（无论来自 class token / literal / decl 哪条事实通道）只记一次。
// 这是 R01/R11 等 prop-agnostic 规则多事实通道双计的根治点；dedupe 仅作用于单次 run() 调用。
test("同一规则在同一行从不同事实通道触发 → 只记一次（去重 key: rule|file|line|message）", () => {
  const r11Like = { id: "R11", title: "t", layers: ["feature"], facts: ["decl", "class", "literal"],
    check: (f) => f.type === "decl" && /ink-12/.test(f.value) ? [{ line: f.line, message: "引用 primitive：--m-ink-12" }]
              : f.type === "class" && /ink-12/.test(f.token) ? [{ line: f.line, message: "引用 primitive：--m-ink-12" }]
              : f.type === "literal" && /ink-12/.test(f.text) ? [{ line: f.line, message: "引用 primitive：--m-ink-12" }]
              : [] };
  const facts = [
    { type: "decl", value: "var(--m-ink-12)", line: 10 },
    { type: "class", token: "text-ink-12", line: 10 },
    { type: "literal", text: "var(--m-ink-12)", line: 10 },
  ];
  const out = run({ rules: [r11Like], cfg: {}, files: [file("a.tsx", "feature", facts, "...")] });
  assert.equal(out.violations.length, 1, `同 key 三触发应去重为 1，实际 ${out.violations.length}`);
  assert.equal(out.violations[0].rule, "R11");
  assert.equal(out.violations[0].line, 10);
  assert.equal(out.violations[0].message, "引用 primitive：--m-ink-12");
});
test("同一规则在不同行触发 → 不去重", () => {
  const r11Like = { id: "R11", title: "t", layers: ["feature"], facts: ["decl", "class"],
    check: (f) => f.type === "decl" && /ink-12/.test(f.value) ? [{ line: f.line, message: "引用 primitive：--m-ink-12" }]
              : f.type === "class" && /ink-12/.test(f.token) ? [{ line: f.line, message: "引用 primitive：--m-ink-12" }] : [] };
  const out = run({ rules: [r11Like], cfg: {}, files: [file("a.css", "feature", [
    { type: "decl", value: "var(--m-ink-12)", line: 5 },
    { type: "class", token: "ink-12", line: 9 },
  ])] });
  assert.equal(out.violations.length, 2);
  assert.deepEqual(out.violations.map((v) => v.line).sort((a, b) => a - b), [5, 9]);
});
test("同一规则同一行不同 message（如多 primitive 命中）→ 不去重", () => {
  const r11Like = { id: "R11", title: "t", layers: ["feature"], facts: ["decl"],
    check: (f) => /--(m-ink-12|m-ink-3)/.test(f.value) ? [{ line: f.line, message: `引用 primitive：${f.value.includes("ink-12") ? "--m-ink-12" : "--m-ink-3"}` }] : [] };
  const out = run({ rules: [r11Like], cfg: {}, files: [file("a.css", "feature", [
    { type: "decl", value: "var(--m-ink-12)", line: 7 },
    { type: "decl", value: "var(--m-ink-3)", line: 7 },
  ])] });
  assert.equal(out.violations.length, 2, `不同 message 不应去重，实际 ${out.violations.length}`);
});

// ---------- 引擎契约 ----------

test("规则不认识 id：demo 层豁免只来自规则自身的 offInDemo", () => {
  const rule = { ...fake, layers: ["feature", "component", "demo"], offInDemo: true };
  const out = run({ rules: [rule], cfg: {}, files: [
    file("design-system.html", "demo", [{ type: "decl", value: "bad", line: 1 }]),
    file("a.css", "feature", [{ type: "decl", value: "bad", line: 1 }]),
    file("ai/meridian-ui.css", "component", [{ type: "decl", value: "bad", line: 1 }]),
  ] });
  assert.deepEqual(out.violations.map((v) => v.file).sort(), ["a.css", "ai/meridian-ui.css"]);
});
test("区段标记只被记录：既不豁免也不判 stale", () => {
  const src = "/* meridian-begin: ramp-demo */\na { color: bad; }\n/* meridian-end: ramp-demo */";
  const out = run({ rules: [{ ...fake, layers: ["demo"] }], cfg: {}, files: [file("design-system.html", "demo",
    [{ type: "decl", value: "bad", line: 2 }], src)] });
  assert.equal(out.violations.length, 1, "豁免机制是 offInDemo，区段标记不得自动放行");
  assert.deepEqual(out.staleAllows, []);
  assert.deepEqual(collectAllows(src).regions, [{ name: "ramp-demo", from: 1, to: 3 }]);
});
test("跨行声明由 ±2 行的 allow 覆盖", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.css", "feature",
    [{ type: "decl", value: "bad", line: 2 }], "a {\n  color: bad;\n} /* meridian-allow: wrapped-decl */")] });
  assert.equal(out.violations.length, 0);
  assert.deepEqual(out.staleAllows, []);
});
test("4 行外的 allow 覆盖不到，判 stale", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.css", "feature",
    [{ type: "decl", value: "bad", line: 1 }],
    "a { color: bad; }\nb{}\nc{}\nd{}\n/* meridian-allow: too-far */")] });
  assert.deepEqual(out.violations.map((v) => `${v.file}:${v.line}`), ["a.css:1"]);
  assert.deepEqual(out.staleAllows, [{ file: "a.css", line: 5, reason: "too-far" }]);
});
test("行注释形式的 meridian-allow 生效（计划 §例外机制：`//` 是合法写法）", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.tsx", "feature",
    [{ type: "decl", value: "bad", line: 1 }], "// meridian-allow: legacy-import\nconst x = 1;\n")] });
  assert.equal(out.violations.length, 0);
  assert.deepEqual(out.staleAllows, []);
});
test("违规与 stale 的路径统一为正斜杠（Windows walk / join 混合形态）", () => {
  const win = "ai\\selfcheck\\fixtures\\R01\\fail\\x.css";
  const out = run({ rules: [fake], cfg: {}, files: [file(win, "feature",
    [{ type: "decl", value: "bad", line: 1 }], "a { color: bad; }\nb{}\nc{}\nd{}\n/* meridian-allow: unused-marker */")] });
  assert.deepEqual(out.violations.map((v) => v.file), [win.replace(/\\/g, "/")]);
  assert.deepEqual(out.staleAllows.map((s) => s.file), [win.replace(/\\/g, "/")]);
});
test("check 收到文档化的 ctx：cfg / file / fs / allows", () => {
  let seen = null;
  const probe = { id: "R98", title: "t", layers: ["feature"], facts: ["decl"], check: (f, ctx) => { seen = ctx; return []; } };
  run({ files: [file("a.css", "feature", [{ type: "decl", value: "x", line: 1 }], "/* meridian-begin: r */")],
    rules: [probe], cfg: { componentAliases: { Price: [] } }, fs: { changelog: null } });
  assert.deepEqual(seen.cfg.componentAliases, { Price: [] });
  assert.equal(seen.file.path, "a.css");
  assert.equal(seen.fs.changelog, null);
  assert.ok(seen.allows.byLine instanceof Map);
  assert.deepEqual(seen.allows.regions, [], "未闭合的 meridian-begin 不得凭空造区段");
});
test("baseline 记账过剩时报警（否则 baseline 会静默吞掉未来的违规）", () => {
  const seen = [];
  const orig = console.error;
  console.error = (m) => seen.push(String(m));
  try {
    assert.deepEqual(applyBaseline([{ rule: "R99", file: "a.css", line: 1 }], { "a.css|R99": 5 }).violations, []);
  } finally { console.error = orig; }
  assert.match(seen.join("\n"), /a\.css\|R99 剩余 4/);
});
test("staleAllows 也参与失败位（json 模式不得假绿）", () => {
  const out = run({ rules: [fake], cfg: {}, files: [file("a.css", "feature",
    [{ type: "decl", value: "ok", line: 1 }], "a { color: ok } /* meridian-allow: gone */")] });
  const json = JSON.parse(format(out.violations, "json", out.staleAllows));
  assert.equal(json.ok, false);
  assert.equal(json.count, 0);
  assert.deepEqual(json.staleAllows, [{ file: "a.css", line: 1, reason: "gone" }]);
});

// ---------- 遍历 / 事实装配 ----------

test("walk() 产出满足 classify 的仓库相对契约", () => {
  const c = cfg();
  const paths = walk("ai", c);
  assert.ok(paths.length > 0, "ai/ 下什么都没遍历到");
  for (const p of paths) {
    assert.ok(!p.startsWith("./") && !p.startsWith("/"), `越界路径形式：${p}`);
    assert.ok(!p.startsWith(".."), `仓库外路径：${p}`);
    assert.ok(!p.includes("\\"), `反斜杠路径：${p}`);
  }
  assert.ok(paths.includes("ai/tokens.css"), "define 层文件缺失");
  assert.ok(paths.includes("ai/meridian-ui.css"), "component 层文件缺失");
  const layers = new Set(paths.map((p) => classify(p, c)));
  assert.ok(layers.has("define"), "tokens.css 降级：路径形式不合契约");
  assert.ok(layers.has("component"), "meridian-ui.css 降级：路径形式不合契约");
});
test("walk() 按 cfg.ignore 剪枝，且区分两种 ignore 语义", () => {
  const paths = walk(".", cfg());
  assert.ok(paths.length > 20, "全仓遍历结果异常");
  assert.ok(!paths.some((p) => p.startsWith("docs/superpowers/")), "路径前缀型 ignore 未生效");
  assert.ok(paths.some((p) => p.startsWith("docs/")), "docs/ 本体不得被连带剪掉");
  assert.ok(!paths.some((p) => p.split("/").includes("_audit")), "段名型 ignore 未生效");
  assert.ok(!paths.some((p) => p.startsWith(".superpowers/")), "点目录未剪枝");
});
test("excludePaths 只服务 --exclude，不触碰 ignore 语义", () => {
  const paths = walk("ai", cfg());
  assert.ok(paths.some((p) => p.startsWith("ai/selfcheck/")), "不传 --exclude 时 selfcheck 必须在结果里（T10 manifest 依赖）");
  assert.ok(!excludePaths(paths, ["ai/selfcheck"]).some((p) => p.startsWith("ai/selfcheck/")));
});
test("factsFor 对 CLI 会遍历到的每个文件都不抛", () => {
  const c = cfg();
  for (const p of walk(".", c)) {
    const f = factsFor(p, c);
    assert.equal(typeof f.layer, "string", p);
    assert.ok(Array.isArray(f.facts), `${p} 事实流不是数组`);
    if (f.layer === "ignore") continue;
    assert.equal(typeof f.text, "string", p);
    assert.ok(f.facts.every((x) => typeof x.type === "string"), p);
  }
});
test("doc 层在读不到 parse-doc（Task 9）时保守放行而不是崩溃", () => {
  for (const p of ["ai/AGENTS.md", "docs/02-color-system.md", "README.md"]) {
    const f = factsFor(p, { ignore: [] });
    assert.equal(f.layer, "doc", p);
    assert.ok(Array.isArray(f.facts), p);
  }
});
test("buildFs 以归一后的路径建索引", () => {
  const files = [{ path: "docs\\02-color-system.md", layer: "doc", text: "色阶", facts: [] }];
  const view = buildFs(files);
  assert.equal(view.byPath.get("docs/02-color-system.md"), "色阶");
  assert.equal(view.chapters.get("02"), "docs/02-color-system.md");
  assert.ok("changelog" in view);
});
test("buildFs 从真实仓库文档里取得章节索引", () => {
  const c = cfg();
  const files = walk(".", c).map((p) => factsFor(p, c)).filter((f) => f.layer !== "ignore");
  const view = buildFs(files);
  assert.equal(view.chapters.get("02"), "docs/02-color-system.md");
  assert.match(view.byPath.get("ai/AGENTS.md"), /Meridian/);
});

// ---------- CLI 冒烟 ----------

test("参数解析：标志的值不会被当成目标目录，缺标志时也不回落到 argv[0]", () => {
  assert.deepEqual(parseArgs(["ai"]).targets, ["ai"]);
  assert.deepEqual(parseArgs([]).targets, ["."], "无位置参数时默认仓库根");
  assert.deepEqual(parseArgs(["--exclude", "ai/selfcheck/fixtures"]).targets, ["."],
    "--exclude 的值被当成目标 → 扫描范围整体跑偏（PREV_TAKES_VALUE 漏项）");
  assert.deepEqual(parseArgs(["--ignore", "_audit", "ai", "--only=R01"]).targets, ["ai"]);
  assert.deepEqual(parseArgs(["ai/tokens.css", "ai/tokens.json"]).targets, ["ai/tokens.css", "ai/tokens.json"],
    "多目标必须全部参与，否则没扫的文件被当成扫过了");
  assert.equal(parseArgs(["ai/lib"]).baseline, undefined, "缺 --baseline 时不得把目标当成 baseline 文件");
  assert.equal(parseArgs(["ai/lib", "--json"]).mode, "json");
  assert.equal(parseArgs(["ai/lib", "--sarif"]).mode, "sarif");
  assert.deepEqual(parseArgs(["--only", "R01,r14"]).only, ["R01", "R14"]);
  assert.deepEqual(parseArgs(["--ignore", "a", "--ignore=b"]).ignores, ["a", "b"]);
  assert.deepEqual(parseArgs(["--exclude", "x", "--exclude", "y"]).excludes, ["x", "y"]);
});

test("CLI：干净目标在三种模式下都退出 0，json/sarif 可解析", () => {
  const cases = [["", (o) => assert.match(o, /通过/)], ["--json", (o) => assert.equal(JSON.parse(o).ok, true)],
    ["--sarif", (o) => assert.equal(JSON.parse(o).version, "2.1.0")]];
  for (const [mode, verify] of cases) {
    const out = execFileSync(process.execPath, ["ai/validate.mjs", "ai/lib", ...(mode ? [mode] : [])], { encoding: "utf8" });
    try { verify(out); } catch (e) { e.message = `${mode || "text"} → ${e.message}`; throw e; }
  }
});
test("CLI：--only 与 --emit-manifest 的取值形式（空格与 =）都可用", () => {
  const manifest = join(tmpdir(), `meridian-manifest-${process.pid}.json`);
  execFileSync(process.execPath, ["ai/validate.mjs", "ai/lib", "--only=R99", "--emit-manifest", manifest], { encoding: "utf8" });
  assert.deepEqual(JSON.parse(readFileSync(manifest, "utf8")), []);
  execFileSync(process.execPath, ["ai/validate.mjs", "ai/lib", "--only", "R99", `--emit-manifest=${manifest}`], { encoding: "utf8" });
  assert.deepEqual(JSON.parse(readFileSync(manifest, "utf8")), []);
});
test("CLI：位置参数缺失时目标为仓库根（`node ai/validate.mjs` 仍可跑）", () => {
  // T17 判定 + S2 R-28：默认目标=仓库根时 14 条规则全开，必然命中 selfcheck fixtures 植红 → 退出 1。
  // 旧断言期望 ok=true 是"仓库曾全绿"时代的残留期望，与本仓恒有植红 fixture 的现状矛盾。
  let e;
  try {
    execFileSync(process.execPath, ["ai/validate.mjs", "--json"], { encoding: "utf8" });
  } catch (err) { e = err; }
  assert.ok(e, "全仓扫描命中植红 fixture 应退出 1，实际退出 0（fixtures 丢失或被排除？）");
  assert.equal(e.status, 1);
  const json = JSON.parse(e.stdout);
  assert.equal(json.ok, false);
  assert.ok(json.count > 0, "全仓扫描应报出 fixtures 植红");
});
test("CLI：仓库外目标判错退出，而不是扫 0 个文件报 ok", () => {
  assert.throws(() => execFileSync(process.execPath, ["ai/validate.mjs", "..", "--json"], { stdio: "pipe" }),
    (e) => e.status === 1 && /仓库内/.test(String(e.stderr)));
});

// ---------- CLI 端到端负载不变量：退出码 ⟂ 输出模式 + --exclude 真的临时跳过 ----------

test("CLI 端到端：有违规时 text / json / sarif 三种模式都退出 1（退出码 ⟂ 输出模式）", () => {
  // 规则表当前为空（checks/index.mjs），唯一能在 e2e 触发出 1 的路径是引擎的 stale-allow 检测；
  // 一旦 T7-T9 注册了任何会消费 value:"bad" 的规则，该 fixture 同样会被判红（value 字段、meridian-allow
  // 标记双覆盖）。fixture 名带 pid 防止并发运行相互污染。
  const dir = join("ai", "selfcheck", "fixtures", `exit-code-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "x.css"),
    ".x { color: bad; } /* meridian-allow: exit-code-probe */\n");
  try {
    for (const mode of [[], ["--json"], ["--sarif"]]) {
      let e;
      try {
        execFileSync(process.execPath, ["ai/validate.mjs", dir, ...mode], { stdio: "pipe" });
      } catch (err) { e = err; }
      assert.ok(e, `mode=${JSON.stringify(mode)}：期望退出码 1，实际 0（v1 的 --json 假绿复辟？）`);
      assert.equal(e.status, 1, `mode=${JSON.stringify(mode)}：期望 status 1，实际 ${e.status}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI 端到端：--exclude 临时跳过 fixture 目录（与 cfg.ignore 不同的语义）", () => {
  // 用独立命名的 fixture 目录，让 --exclude 只命中它自身；这样 0 vs 1 的差值就是该 flag 的证据。
  const fixtureRel = `ai/selfcheck/fixtures/exclude-flag-${process.pid}`;
  const fixtureAbs = join("ai", "selfcheck", "fixtures", `exclude-flag-${process.pid}`);
  mkdirSync(fixtureAbs, { recursive: true });
  writeFileSync(join(fixtureAbs, "x.css"),
    ".x { color: bad; } /* meridian-allow: exclude-probe */\n");
  try {
    // 不传 --exclude：fixture 里的 stale allow 命中引擎 → 退出 1，1 个 stale allow
    let eNo;
    try {
      execFileSync(process.execPath, ["ai/validate.mjs", fixtureRel, "--json"], { stdio: "pipe" });
    } catch (err) { eNo = err; }
    assert.equal(eNo.status, 1, "不传 --exclude 时扫描 fixture 应判红");
    const noJson = JSON.parse(eNo.stdout.toString());
    assert.equal(noJson.ok, false);
    assert.equal(noJson.count, 0);
    assert.equal(noJson.staleAllows.length, 1,
      `不传 --exclude 时应恰好 1 个 stale allow（来自 fixture），实际 ${noJson.staleAllows.length}`);

    // 传 --exclude fixture：fixture 被 excludePaths 过滤 → 0 个文件 → 退出 0，0 个 stale allow
    const outYes = execFileSync(process.execPath,
      ["ai/validate.mjs", fixtureRel, "--exclude", fixtureRel, "--json"], { encoding: "utf8" });
    const yesJson = JSON.parse(outYes);
    assert.equal(yesJson.ok, true);
    assert.equal(yesJson.count, 0);
    assert.equal(yesJson.staleAllows.length, 0,
      `传 --exclude 后 stale allow 必须归零，实际 ${yesJson.staleAllows.length}`);

    // 不对称：without --exclude → 1；with --exclude → 0。这一对差值即 --exclude 真生效的证据。
  } finally {
    rmSync(fixtureAbs, { recursive: true, force: true });
  }
});

// ---------- S2 加固：D3 marker 消耗 / D2 doc 层豁免 ----------

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

test("doc 层不收集 meridian-allow（O8 治本）：文档示例 marker 不再误报 stale", () => {
  const md = "# 示例\n\n| 写法 | 说明 |\n|---|---|\n| `/* meridian-allow: 示例 */` | 无理由不生效 |";
  // 偏差说明（对 brief 的唯一改动）：brief 原文此处为 `facts: []`，但引擎契约是 check 按 fact×rule 调用，
  // 空 facts 意味着 check 永不执行 → `violations.length === 1`（"doc 层违规照报"）在任何实现下都不可能成立。
  // 补一条与 fakeRule.facts 匹配的 doc-ref 事实，让该断言真正守卫"O8 修复不得顺带吞掉 doc 层违规"。
  const file = { path: "docs/x.md", layer: "doc", text: md, facts: [{ type: "doc-ref", line: 4 }] };
  const fakeRule = {
    id: "R98", title: "test-doc", layers: ["doc"], facts: ["doc-ref"], offInDemo: false,
    check: () => [{ line: 4, message: "ref" }],
  };
  const { violations, staleAllows } = run({ files: [file], rules: [fakeRule] });
  assert.equal(violations.length, 1, "doc 层违规照报");
  assert.equal(staleAllows.length, 0, "doc 层不是被审计代码，marker 文本不判 stale");
});
