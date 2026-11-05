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
test("后台内嵌环按填充取色；前台外环保持 border-focus（v1.4 P0 回归）", () => {
  const ui = readFileSync("ai/meridian-ui.css", "utf8");
  // 只有后台（outline-offset 为负、环压在填充上）允许改成 *-fg
  for (const sel of [
    ".stage-admin .m-btn--primary:focus-visible",
    ".stage-admin .m-btn--destructive:focus-visible",
    ".stage-admin .m-tool--send:focus-visible",
    ".stage-admin .m-page.is-active:focus-visible",
  ]) assert.ok(ui.includes(sel), `缺少后台内嵌环覆盖: ${sel}`);
  // 前台外环不得出现无作用域的 *-fg 覆盖（白环白底 1.00:1）
  for (const sel of [".m-btn--primary:focus-visible", ".m-btn--destructive:focus-visible", ".m-tool--send:focus-visible", ".m-page.is-active:focus-visible"])
    assert.doesNotMatch(ui, new RegExp(`(^|\\n)\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"), `前台外环不得覆盖环色: ${sel}`);
  // Checkbox / Switch 的环画在可见部件外侧，选中态也不得改成 primary-fg
  const hidden = ui.slice(ui.indexOf(".m-check input:focus-visible + .box"), ui.indexOf(".m-seg"));
  assert.match(hidden, /var\(--m-focus-ring-color\)/, "隐藏控件的环必须用 border-focus");
  assert.doesNotMatch(hidden, /outline-color:\s*var\(--m-primary-fg\)/, "选中态白环会落在白底上");
});
test("不再用 border-radius:inherit 配合焦点环", () => {
  assert.doesNotMatch(readFileSync("ai/tokens.css", "utf8"), /border-radius:\s*inherit/);
});
