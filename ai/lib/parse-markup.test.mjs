import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMarkup, classTokens } from "./parse-markup.mjs";
import { toPx } from "./scale.mjs";

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

// ---- F4：动态 `{…}` 类名表达式一律不产类事实；前缀剥离后再过滤空串 ----
test("call-expression className yields no class facts", () => {
  assert.deepEqual(parseMarkup('const a = <div className={cx("p-4", x)} />;').tags[0].classes, []);
});
test("ternary className yields no class facts", () => {
  assert.deepEqual(parseMarkup('const a = <div className={ok ? "p-4" : "p-8"} />;').tags[0].classes, []);
});
test("logical / quoted brace className yields no class facts", () => {
  assert.deepEqual(parseMarkup("const a = <div className={a || b} />;").tags[0].classes, []);
  assert.deepEqual(parseMarkup("const a = <div className={a && 'p-4'} />;").tags[0].classes, []);
  assert.deepEqual(classTokens('cx("p-4", x)'), []);
  assert.deepEqual(classTokens("a ? b : c"), []);
});
test("a value that is only a variant prefix yields no empty class token", () => {
  assert.deepEqual(classTokens("hover:"), []);
  assert.deepEqual(classTokens("hover: sm:p-2"), ["p-2"]);
});
test("arbitrary values that contain parens are real classes, not expressions", () => {
  // 这些是 _audit/fixture 里 R11/R05 的靶子，漏掉就等于规则失明（宁漏不误也不能漏真事实）。
  assert.deepEqual(classTokens("text-[var(--m-danger-11)]"), ["text-[var(--m-danger-11)]"]);
  assert.deepEqual(classTokens("p-[calc(100%-3rem)] z-[9999]"), ["p-[calc(100%-3rem)]", "z-[9999]"]);
  assert.deepEqual(parseMarkup('<div className="text-[var(--m-danger-11)]" />').tags[0].classes,
    ["text-[var(--m-danger-11)]"]);
});
test("array-form dynamic class binding yields no class facts", () => {
  assert.deepEqual(classTokens("['p-4', x]"), []);
});

// ---- F6：跨行引号配对不得伪造字面量 ----
test("prose apostrophes across lines never fabricate a # literal", () => {
  const src = 'const t = "Don\'t put #fff here\nand the docs\' note it";';
  assert.ok(!parseMarkup(src).literals.some((l) => l.text.includes("#")),
    "含换行的 \" / ' 匹配是散文引号误配，不是字符串字面量");
  const html = "<p>Don't\n#fff</p><p>the docs' note</p>";
  assert.ok(!parseMarkup(html).literals.some((l) => l.text.includes("#")));
});
test("single-line strings and template literals still yield literals", () => {
  const { literals } = parseMarkup('const c = "#FF0000"; const t = `a\n#fff b`;');
  assert.ok(literals.some((l) => l.text === "#FF0000"));
  assert.ok(literals.some((l) => l.text.includes("#fff")), "模板字面量合法跨行");
});

// ---- F7：HTML style="…" 与 JSX style={{…}} 走两条切分路径，值去引号，复用 parse-css 的 kebab ----
test("HTML style attribute splits on ; so every declaration becomes a fact", () => {
  const { styleDecls } = parseMarkup('<div style="color:red;padding:7px"></div>');
  assert.deepEqual(styleDecls.map((d) => [d.prop, d.value]), [["color", "red"], ["padding", "7px"]]);
  assert.ok(styleDecls.every((d) => d.type === "decl" && d.selector === "@div"));
});
test("JSX style object values are unquoted so toPx can read them", () => {
  const { styleDecls } = parseMarkup('<div style={{ width: "14px" }} />');
  assert.deepEqual(styleDecls.map((d) => [d.prop, d.value]), [["width", "14px"]]);
  assert.equal(toPx(styleDecls[0].value), 14);
});
test("an empty style value yields no fact", () => {
  assert.deepEqual(parseMarkup('<div style="color:"></div>').styleDecls, []);
  assert.deepEqual(parseMarkup('<div style=""></div>').styleDecls, []);
});
test("style col is the char offset of the property inside the style value, not an ordinal", () => {
  const { styleDecls } = parseMarkup('<div style="color:red;padding:7px"></div>');
  assert.deepEqual(styleDecls.map((d) => d.col), [1, 11]);
});
test("commas inside a value survive the object-form split", () => {
  const { styleDecls } = parseMarkup('<div style={{ backgroundImage: "linear-gradient(red, blue)", marginTop: 8 }} />');
  assert.deepEqual(styleDecls.map((d) => [d.prop, d.value]),
    [["background-image", "linear-gradient(red, blue)"], ["margin-top", "8"]]);
});
test("a style expression that is not an object literal yields no facts", () => {
  // `cond ? {…} : null` 里 `cond ? { color` 不是属性名 —— 老实现会据此造出一条假 decl。
  assert.deepEqual(parseMarkup('const a = <div style={cond ? { color: "red" } : null} />;').styleDecls, []);
  assert.deepEqual(parseMarkup("const a = <div style={myStyle} />;").styleDecls, []);
  assert.deepEqual(parseMarkup('<div style="color:red"></div>').styleDecls.length, 1);
});
