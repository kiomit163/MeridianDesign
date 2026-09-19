import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = ["ai/tokens.css", "ai/meridian-ui.css", "ai/tailwind-theme.css"];
const ringHits = (p) => (readFileSync(p, "utf8").match(/:where\(button, a, input, select, textarea, summary, \[tabindex\][^)]*\):focus-visible/g) ?? []).length;

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
