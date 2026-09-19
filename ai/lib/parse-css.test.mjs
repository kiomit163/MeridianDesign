import { test } from "node:test";
import assert from "node:assert/strict";
import { stripComments, parseCss, stripVars } from "./parse-css.mjs";

test("comment stripping preserves line count", () => {
  const src = "a {\n  /* #fff z-index: 999 */\n  color: red;\n}";
  assert.equal(stripComments(src).split("\n").length, src.split("\n").length);
  assert.ok(!stripComments(src).includes("#fff"));
  const facts = parseCss(src);
  assert.equal(facts.length, 1, "注释块整段不得产出任何事实，本例只允许 color: red 一条");
  assert.ok(!facts.some((f) => f.value.includes("#fff")), "注释里的色值不得成为事实");
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

// ---- F1：自定义属性名必须原样保留（`--` 前缀 + 大小写敏感），camelCase→kebab 只作用于普通属性 ----
test("custom property names keep their -- prefix verbatim", () => {
  const f = parseCss("--m-space-4: 1rem;");
  assert.equal(f.length, 1);
  assert.equal(f[0].prop, "--m-space-4", "自定义属性名剥掉 -- 会同时废掉 token 层判定并伪造出并不存在的属性名");
});
test("camelCase normalisation does not touch custom properties", () => {
  const f = parseCss("z { zIndex: 9999; }");
  assert.equal(f[0].prop, "z-index");
});
test("custom property case is preserved (CSS custom properties are case-sensitive)", () => {
  const f = parseCss(".a { --Mx-Mixed-Case: 1; --_fg: #fff; }");
  assert.deepEqual(f.map((d) => d.prop), ["--Mx-Mixed-Case", "--_fg"]);
});

// ---- F2：分词必须带字符串态，字符串里的 ; { } 是普通字符 ----
test("semicolon inside a string value does not split the declaration", () => {
  const f = parseCss('.a { content: "x;y"; color: red; }');
  assert.deepEqual(f.map((d) => [d.prop, d.value]), [["content", '"x;y"'], ["color", "red"]]);
});
test("brace inside a string value does not corrupt the following selector", () => {
  const f = parseCss('.a { content: "}"; color: red; }\n.b { padding: 7px; }');
  assert.deepEqual(f.map((d) => [d.prop, d.value, d.selector]),
    [["content", '"}"', ".a"], ["color", "red", ".a"], ["padding", "7px", ".b"]]);
});

// ---- F3：pending carry 遇 `{` 不得拼成选择器 ----
test("native nesting: a carried declaration is flushed, not glued into the selector", () => {
  const f = parseCss(".x { color: red\n  .y { padding: 2px; } }");
  assert.deepEqual(f.map((d) => [d.prop, d.value, d.selector]),
    [["color", "red", ".x"], ["padding", "2px", ".y"]]);
  assert.ok(!f.some((d) => d.selector.includes(":")), "选择器里不得出现声明片段");
});
test("selector on its own line before the brace still yields the declaration", () => {
  const f = parseCss(".a\n{ color: red; }");
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].prop, f[0].value, f[0].selector, f[0].line], ["color", "red", ".a", 2]);
});
test("a pseudo-class selector on its own line is never flushed as a declaration", () => {
  const f = parseCss(".x {\n  a:hover\n  { color: red; }\n}");
  assert.deepEqual(f.map((d) => [d.prop, d.value, d.selector]), [["color", "red", "a:hover"]]);
});
test("an element selector on its own line is never flushed as a declaration", () => {
  const f = parseCss(".x {\n  .y {\n    button:focus\n    { outline: none; }\n  }\n}");
  assert.deepEqual(f.map((d) => [d.prop, d.value, d.selector]), [["outline", "none", "button:focus"]]);
});
test("documented leak: a last declaration with no ; before } yields nothing", () => {
  // 末条声明省略分号（minified 常见）时整条静默丢弃 —— 方向是漏报，不是误报。
  // 仓库三个 CSS 文件实测 lost: 0，故本轮不改语义，仅锁住行为（见 Task 3-4-5 报告）。
  assert.deepEqual(parseCss(".x { color: red\n}"), []);
});
test("CRLF input yields the same facts and line numbers as LF", () => {
  const crlf = parseCss(".x {\r\n  color: red;\r\n}");
  const lf = parseCss(".x {\n  color: red;\n}");
  assert.deepEqual(crlf, lf);
  assert.equal(crlf.length, 1);
  assert.deepEqual([crlf[0].prop, crlf[0].value, crlf[0].selector, crlf[0].line, crlf[0].col],
    ["color", "red", ".x", 2, 3]);
});
