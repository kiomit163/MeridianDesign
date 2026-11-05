import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// v1.6 · 深色主题的对比度与派生守卫。
//
// 为什么需要这条：v1.5 的 CI 跑 axe / CDP / AX 快照，但 `PAGES` 从不设 `.theme-dark`，
// 于是整个深色块（tokens.css 的 dark / admin-dark）没有任何自动对比度覆盖。
// 实测已出厂一个缺陷：--m-success-bg 曾是 rgb(23 131 86 / .16)，而 --m-success-9 是
// #178229（rgb 23 130 41）—— 蓝通道差 45，深色下成功徽章偏青，且门禁全绿。
//
// 本文件只做两件事：
//   1) 派生一致性：深色 `*-bg` 的半透明字面量必须与同族 9 阶同 RGB（不得手抄）
//   2) 对比度地板与上限：深色正文/次要文本不得低于契约值，也不得高到眩光

const css = readFileSync("ai/tokens.css", "utf8");

function blockFrom(marker) {
  const i = css.indexOf(marker);
  assert.ok(i >= 0, `tokens.css 找不到块标记: ${marker}`);
  const s = css.indexOf("{", i);
  const e = css.indexOf("}", s);
  return css.slice(s + 1, e);
}
const decls = (text) => new Map(
  [...text.matchAll(/--m-([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

const prim = decls(blockFrom(":root {"));
const light = new Map([...prim, ...decls(blockFrom(":root, .stage-storefront {"))]);
const darkBlock = decls(blockFrom("SEMANTIC · Dark"));
const adminDarkBlock = decls(blockFrom(".stage-admin.theme-dark,"));
const dark = new Map([...light, ...darkBlock]);
const adminDark = new Map([...light, ...decls(blockFrom("\n.stage-admin {")), ...darkBlock, ...adminDarkBlock]);

function resolve(value, map, depth = 0, theme = "dark") {
  assert.ok(depth < 8, `token 解析循环: ${value}`);
  const raw = String(value).trim();
  // v1.6 · light-dark(浅, 深)：本文件只关心深色，故默认取深支
  const ld = raw.match(/^light-dark\(\s*([\s\S]+?)\s*,\s*([\s\S]+)\)$/);
  if (ld) return resolve(theme === "dark" ? ld[2] : ld[1], map, depth + 1, theme);
  const m = raw.match(/^var\(--m-([\w-]+)\)$/);
  if (!m) return raw;
  assert.ok(map.has(m[1]), `引用了不存在的 --m-${m[1]}`);
  return resolve(map.get(m[1]), map, depth + 1, theme);
}
const get = (map, name) => resolve(`var(--m-${name})`, map);

const hexToRgb = (h) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(h).trim());
  assert.ok(m, `期望 6 位 hex，实际: ${h}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
};
const lin = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

const STATUS = ["success", "info", "warning", "danger", "emphasis", "mystic", "brand"];

test("深色 *-bg 的 RGB 必须与同族 9 阶一致（禁止手抄漂移）", () => {
  for (const family of STATUS) {
    const bgKey = `${family}-bg`;
    const nineKey = `${family}-9`;
    if (!dark.has(bgKey) || !dark.has(nineKey)) continue;
    const bg = get(dark, bgKey);
    const m = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*[\d.]+\s*\)$/.exec(bg);
    if (!m) continue; // 指向语义别名（如 var(--m-x-2)）时由 tokens-sync 的 parity 测试负责
    const nine = hexToRgb(get(dark, nineKey));
    assert.deepEqual(
      [Number(m[1]), Number(m[2]), Number(m[3])],
      nine,
      `深色 --m-${bgKey} 的 RGB 与 --m-${nineKey} 不一致（bg=${bg} / 9 阶=${nine.join(",")}）`
    );
  }
});

test("深色对比度地板：正文 ≥7、次要文本 ≥4.5", () => {
  const page = hexToRgb(get(dark, "bg-page"));
  assert.ok(ratio(hexToRgb(get(dark, "fg")), page) >= 7, "深色正文对比 < 7:1");
  assert.ok(ratio(hexToRgb(get(dark, "fg-muted")), page) >= 4.5, "深色次要文本对比 < 4.5:1");
});

test("深色对比度上限：正文不得刺眼（CJK 密笔画下 >16:1 产生眩光）", () => {
  const r = ratio(hexToRgb(get(dark, "fg")), hexToRgb(get(dark, "bg-page")));
  assert.ok(
    r <= 16,
    `深色正文对比 ${r}:1 超过 16:1 —— 近白压近黑在中文密笔画下会眩光，应压低到 12–15:1`
  );
});

test("后台深色与暗色基础语义同值（不得各自漂移）", () => {
  // bg-surface 刻意不同：后台台面比暗色画布高一档（rank 0 vs rank −1），不属漂移。
  // border 也不同：后台边框比页面边框深一档，属于既定设计，不属漂移。
  for (const key of ["fg", "fg-muted"]) {
    if (!adminDark.has(key)) continue;
    assert.equal(
      get(adminDark, key),
      get(dark, key),
      `--m-${key} 在 admin-dark 与 dark 分叉`
    );
  }
});
