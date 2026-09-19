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
// cfg.ignore 混合两种语义：路径段（_audit / node_modules）vs 路径前缀（docs/superpowers）
test("ignore matches a path segment anywhere, not only the first", () => {
  assert.equal(classify("src/_audit/x.css", cfg), "ignore");
  assert.equal(classify("packages/node_modules/x.ts", cfg), "ignore");
});
test("ignore matches a multi-segment prefix but not a look-alike dir", () => {
  const c = { ignore: ["node_modules", ".git", "_audit", ".mimosa", "docs/superpowers"] };
  assert.equal(classify("docs/superpowers/plan.md", c), "ignore");
  assert.equal(classify("docs/superpowers-notes/x.md", c), "doc");
  assert.equal(classify("docs/superiors/x.md", c), "doc");
});
test("windows backslash paths are normalized before matching", () => {
  assert.equal(classify("src\\styles\\app-tokens.css", cfg), "define");
  assert.equal(classify("_audit\\contrast.mjs", cfg), "ignore");
  assert.equal(classify("src\\App.tsx", cfg), "feature");
});
test("leading ./ and / are stripped so component/demo never degrade", () => {
  assert.equal(classify("./ai/meridian-ui.css", cfg), "component");
  assert.equal(classify("./design-system.html", cfg), "demo");
  assert.equal(classify("./src/styles/app-tokens.css", cfg), "define");
  // 契约：单个前导 `/` 也被剥除；绝对路径由调用方（Task 6 遍历器）先 path.relative
  assert.equal(classify("/ai/meridian-ui.css", cfg), "component");
});
