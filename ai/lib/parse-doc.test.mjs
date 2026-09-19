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
