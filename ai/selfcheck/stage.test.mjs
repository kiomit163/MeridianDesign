import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

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
test("主题类挂在祖先元素时前台也必须变深", () => {
  assert.match(css, /\.theme-dark \.stage-storefront/);
  assert.match(css, /\[data-theme="dark"\] \.stage-storefront/);
});
test("LAYER 3 不得反覆盖前台卡片语义", () => {
  const start = css.indexOf("LAYER 3 — COMPONENT");
  const layer3 = css.slice(start, css.indexOf("STOREFRONT STAGE", start));
  assert.doesNotMatch(layer3, /--m-card-shadow:/);
  assert.doesNotMatch(layer3, /--m-card-radius:/);
  assert.doesNotMatch(layer3, /--m-overlay-blur:/);
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
test("原型必须加载对应的组合层（site.css / admin.css）", () => {
  for (const f of readdirSync("prototypes").filter((n) => n.endsWith(".html"))) {
    const src = readFileSync(`prototypes/${f}`, "utf8");
    assert.match(src, /tokens\.css/, `${f} 缺 tokens.css`);
    assert.match(src, /meridian-ui\.css/, `${f} 缺 meridian-ui.css`);
    if (/<body class="stage-storefront/.test(src)) assert.match(src, /site\.css/, `${f} 缺 site.css`);
    else assert.match(src, /admin\.css/, `${f} 缺 admin.css`);
  }
});
