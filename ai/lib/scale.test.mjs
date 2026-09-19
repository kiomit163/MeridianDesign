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
