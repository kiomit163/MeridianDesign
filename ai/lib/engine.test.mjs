import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, applyBaseline, format } from "./engine.mjs";
import { factsFor, buildFs } from "./facts.mjs";
import { classify } from "./classify.mjs";
import { collectAllows } from "../checks/allow.mjs";
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
  const out = execFileSync(process.execPath, ["ai/validate.mjs", "--json"], { encoding: "utf8" });
  assert.equal(JSON.parse(out).ok, true);
});
test("CLI：仓库外目标判错退出，而不是扫 0 个文件报 ok", () => {
  assert.throws(() => execFileSync(process.execPath, ["ai/validate.mjs", "..", "--json"], { stdio: "pipe" }),
    (e) => e.status === 1 && /仓库内/.test(String(e.stderr)));
});
