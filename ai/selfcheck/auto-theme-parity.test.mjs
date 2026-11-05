import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// v1.7 · [data-theme="auto"] 的深色镜像必须与 [data-theme="dark"] 逐项相等。
//
// 为什么需要这条：auto 是"在媒体查询里把同一组深色变量再声明一遍"，
// 两份字面量一旦漂移，OS 深色与手动深色就会呈现两种品牌。测试比较声明表，
// 不比较选择器写法（auto 的选择器必然多出 .theme-auto / 舞台变体）。

const css = readFileSync("ai/tokens.css", "utf8");

function blockFrom(marker) {
  const i = css.indexOf(marker);
  assert.ok(i >= 0, `tokens.css 找不到块标记: ${marker}`);
  const s = css.indexOf("{", i);
  const e = css.indexOf("}", s);
  assert.ok(s >= 0 && e > s, `块标记后没有完整声明块: ${marker}`);
  return css.slice(s + 1, e);
}

const decls = (text) => new Map(
  [...text.matchAll(/--m-([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
const auto = (marker) => decls(blockFrom(marker));

test("auto 深色镜像与手动深色逐项相等", () => {
  const pairs = [
    ["SEMANTIC · Dark", "AUTO-DARK-PARITY · main"],
    [".stage-admin.theme-dark,", "AUTO-DARK-PARITY · admin"],
    ["Chart palette · dark-surface override", "AUTO-DARK-PARITY · chart"],
    ["深色主题下的语法色板", "AUTO-DARK-PARITY · code"],
  ];
  for (const [darkMarker, autoMarker] of pairs) {
    const dark = decls(blockFrom(darkMarker));
    const mirror = auto(autoMarker);
    assert.ok(dark.size > 0, `${darkMarker} 解析为空`);
    assert.deepEqual(
      [...mirror.entries()].sort(),
      [...dark.entries()].sort(),
      `${autoMarker} 与 ${darkMarker} 漂移`
    );
  }
});

test("auto 用 color-scheme: light dark 跟随系统，不锁定 dark", () => {
  const i = css.indexOf("AUTO THEME");
  assert.ok(i >= 0, "找不到 AUTO THEME 段");
  const head = css.slice(i, css.indexOf("@media", i));
  assert.match(head, /color-scheme:\s*light dark/, "auto 必须声明 color-scheme: light dark");
  const media = css.slice(css.indexOf("@media", i), css.indexOf("STOREFRONT STAGE", i));
  assert.doesNotMatch(media, /color-scheme:\s*dark\s*;/, "auto 的媒体查询不得把 color-scheme 锁成 dark");
});

test("默认舞台仍是浅色，auto 不是缺省", () => {
  const root = blockFrom(":root {");
  assert.match(root, /color-scheme:\s*light\s*;/, ":root 必须保持 color-scheme: light");
});
