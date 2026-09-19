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
