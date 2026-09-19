import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("ai/tokens.css", "utf8");
const block = (sel) => {
  const i = css.indexOf(sel + " {");
  return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
};

test(":root 已经给出前台近黑主操作", () => {
  assert.match(block(":root, .stage-storefront"), /--m-primary:\s*var\(--m-ink-12\)/);
  assert.match(block(":root, .stage-storefront"), /--m-fg-link:\s*var\(--m-ink-12\)/);
  assert.match(block(":root, .stage-storefront"), /--m-card-shadow:\s*var\(--m-shadow-e1\)/);
  assert.match(block(":root, .stage-storefront"), /--m-body-fs:\s*var\(--m-text-lg\)/);
});
test("后台才是必须显式声明的那一侧", () => {
  assert.match(block(".stage-admin"), /--m-primary:\s*var\(--m-brand-9\)/);
  assert.match(block(".stage-admin"), /--m-fg-link:\s*var\(--m-brand-11\)/);
  assert.match(block(".stage-admin"), /--m-card-shadow:\s*none/);
  assert.match(block(".stage-admin"), /--m-body-fs:\s*var\(--m-text-md\)/);
});
test("主题类可与舞台类同元素", () => {
  assert.ok(/\.stage-storefront\.theme-dark/.test(css), "前台深色缺同元素写法");
  assert.ok(/\.stage-admin\.theme-dark/.test(css), "后台深色缺同元素写法");
});
test("没有同值死代码", () => {
  assert.doesNotMatch(block(".stage-admin"), /--m-text-md:/);
  assert.doesNotMatch(block(".stage-admin"), /--m-radius-md:/);
});
test("入口文档都提到舞台类", () => {
  assert.match(readFileSync("README.md", "utf8"), /stage-admin/);
  assert.match(readFileSync("ai/AGENTS.md", "utf8"), /`\.stage-admin` 必写/);
  const prompts = readFileSync("ai/prompts.md", "utf8");
  assert.equal((prompts.match(/\.stage-admin/g) ?? []).length >= 3, true);
});
