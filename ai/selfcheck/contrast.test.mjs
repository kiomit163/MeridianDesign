import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 对比契约永久回归（spec S2 R-26 / D4）：
// 解析 ai/tokens.css 的 primitive + 语义块，断言 docs/02 §六 与状态族五件套的每一对配比。
// 断言值即文档声明值；任何 token 改值若破坏契约，此处先红。

// ---- 从 tokens.css 解析：块感知的"首定义 = 浅色基准"策略（覆盖块在后，不影响首定义） ----
const css = readFileSync("ai/tokens.css", "utf8");

function declsOf(text) {
  const map = new Map();
  for (const m of text.matchAll(/--m-([\w-]+)\s*:\s*([^;]+);/g)) {
    if (!map.has(m[1])) map.set(m[1], m[2].trim()); // 首定义 = 浅色基准
  }
  return map;
}
function resolve(name, defs, seen = new Set()) {
  const v = defs.get(name);
  if (v === undefined || seen.has(name)) return undefined;
  const ref = v.match(/^var\(--m-([\w-]+)\)$/);
  if (ref) { seen.add(name); return resolve(ref[1], defs, seen); }
  return v;
}
const hex = (v) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? v : undefined);

const L = declsOf(css.slice(0, css.indexOf("ADMIN DARK")));
// 深色块：从 Dark 注释头切到 LAYER 3 组件层
const darkSlice = css.slice(css.indexOf("SEMANTIC · Dark"), css.indexOf("LAYER 3 — COMPONENT"));
const D = declsOf(darkSlice);
// 深色解析：D（深色覆盖）叠加在 L（primitive + 未覆写语义）之上合并解析——
// 深色值 var(--m-ink-2) 的 primitive 链条在 L 里，逐调用回落会让链断裂成浅色值
const DL = new Map([...L, ...D]);
const resolveD = (name) => resolve(name, DL);

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    let c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// docs/02 §六 + 状态族五件套的浅色契约（fg, bg, min）——fg/bg 均为 tokens.css 的 token 名（不带 --m-）
const LIGHT = [
  ["fg", "bg-page", 14], ["fg-muted", "bg-page", 4.5], ["fg-subtle", "bg-page", 4.5],
  ["fg-link", "bg-page", 4.5], ["price-sale", "bg-page", 4.5],
  ["success-fg", "success-bg", 4.5], ["warning-fg", "warning-bg", 4.5],
  ["critical-fg", "critical-bg", 4.5], ["info-fg", "info-bg", 4.5],
  ["emphasis-fg", "emphasis-bg", 4.5],            // D4 修复目标（v1.1 实测 4.41）
  ["critical-solid-fg", "critical-solid", 4.5], ["info-solid-fg", "info-solid", 4.5],
  ["success-solid-fg", "success-solid", 4.5],
  ["warning-solid-fg", "warning-solid", 7], ["emphasis-solid-fg", "emphasis-solid", 7],
  ["border", "bg-surface", 1.3],                   // 装饰基线（docs/02 §六 修正后的口径）
];
const DARK = [
  ["fg", "bg-surface", 4.5], ["fg-muted", "bg-surface", 4.5], ["fg-subtle", "bg-surface", 4.5],
  ["fg-link", "bg-surface", 4.5], ["price-sale", "bg-surface", 4.5],
  ["success-fg", "bg-surface", 4.5], ["warning-fg", "bg-surface", 4.5],
  ["critical-fg", "bg-surface", 4.5], ["info-fg", "bg-surface", 4.5],
  ["emphasis-fg", "bg-surface", 4.5],
];

test("对比契约回归（docs/02 §六 + 状态族五件套，浅色）", () => {
  for (const [fg, bg, min] of LIGHT) {
    const f = hex(resolve(fg, L)), b = hex(resolve(bg, L));
    assert.ok(f && b, `token 可解析为 hex: ${fg}=${f} ${bg}=${b}`);
    const r = ratio(f, b);
    assert.ok(r >= min, `${fg}/${bg} = ${r.toFixed(2)} < ${min}（${f} on ${b}）`);
  }
});
test("主实底白字（admin primary = brand-9）", () => {
  const r = ratio("#FFFFFF", hex(resolve("brand-9", L)));
  assert.ok(r >= 4.5, `brand-9 白字 = ${r.toFixed(2)} < 4.5`);
});
test("对比契约回归（深色语义块）", () => {
  for (const [fg, bg, min] of DARK) {
    const f = hex(resolveD(fg)), b = hex(resolveD(bg));
    assert.ok(f && b, `深色 token 可解析: ${fg}=${f} ${bg}=${b}`);
    assert.ok(ratio(f, b) >= min, `dark ${fg}/${bg} = ${ratio(f, b).toFixed(2)} < ${min}`);
  }
});
test("tokens.json 与 tokens.css 的 accent-11 同步", () => {
  const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));
  assert.equal(json.color.primitive.accent["11"], resolve("accent-11", L));
});
