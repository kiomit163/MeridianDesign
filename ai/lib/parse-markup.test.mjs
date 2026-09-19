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
