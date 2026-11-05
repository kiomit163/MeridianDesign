import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// O5：独立分类色板必须同时满足
// 1) 对浅底/深底 ≥3:1；2) 在 protan / deutan / tritan 模拟下仍有足够色差。
// 这里用 Viénot 1999 线性 RGB 矩阵 + CIEDE2000；阈值 10 是"明显可辨"的保守下限。

const css = readFileSync("ai/tokens.css", "utf8");
const light = [...css.matchAll(/--m-chart-(\d):\s*(#[0-9A-Fa-f]{6})/g)].slice(0, 8).map((m) => m[2]);
const darkBlock = css.slice(css.indexOf("Chart palette · dark-surface override"), css.indexOf("深色主题下的语法色板"));
const dark = [...darkBlock.matchAll(/--m-chart-(\d):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => m[2]);

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const unlin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => { const x = lum(hex(a)), y = lum(hex(b)); const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };
const MAT = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};
const sim = (h, mode) => {
  const rgb = hex(h).map(lin), m = MAT[mode];
  return [0, 1, 2].map((r) => m[r * 3] * rgb[0] + m[r * 3 + 1] * rgb[1] + m[r * 3 + 2] * rgb[2]).map(unlin);
};
const xyz = (rgb) => {
  const [r, g, b] = rgb.map(lin);
  return [0.4124564 * r + 0.3575761 * g + 0.1804375 * b, 0.2126729 * r + 0.7151522 * g + 0.072175 * b, 0.0193339 * r + 0.119192 * g + 0.9503041 * b];
};
const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const lab = (rgb) => { const [x, y, z] = xyz(rgb).map((v, i) => v / [0.95047, 1, 1.08883][i]); return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]; };
const de2000 = (lab1, lab2) => {
  const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = a1 * (1 + G), ap2 = a2 * (1 + G);
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp1 = (Math.atan2(b1, ap1) * 180 / Math.PI + 360) % 360;
  const hp2 = (Math.atan2(b2, ap2) * 180 / Math.PI + 360) % 360;
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = hp2 - hp1;
  if (Cp1 * Cp2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh * Math.PI / 180) / 2);
  const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hb;
  if (Cp1 * Cp2 === 0) hb = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) > 180) hb = (hp1 + hp2 + 360) / 2; else hb = (hp1 + hp2) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hb * Math.PI / 180) + 0.32 * Math.cos((3 * hb + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hb - 63) * Math.PI / 180);
  const SL = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2);
  const SC = 1 + 0.045 * Cpb, SH = 1 + 0.015 * Cpb * T;
  const RT = -2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hb - 275) / 25) ** 2)) * Math.PI / 180);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
};
const minPair = (colors, mode) => {
  const arr = colors.map((c) => lab(sim(c, mode)));
  let min = Infinity, pair = "";
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
    const d = de2000(arr[i], arr[j]);
    if (d < min) { min = d; pair = `${colors[i]}/${colors[j]}`; }
  }
  return { min, pair };
};

test("O5 独立分类色板：浅色 8 色对白底 ≥3:1", () => {
  assert.equal(light.length, 8, "tokens.css 浅色 chart token 应为 8");
  for (const c of light) assert.ok(ratio(c, "#FFFFFF") >= 3, `${c} on white = ${ratio(c, "#FFFFFF").toFixed(2)}`);
});

test("O5 独立分类色板：深色 8 色对 #161A20 ≥3:1", () => {
  assert.equal(dark.length, 8, "tokens.css 深色 chart token 应为 8");
  for (const c of dark) assert.ok(ratio(c, "#161A20") >= 3, `${c} on dark = ${ratio(c, "#161A20").toFixed(2)}`);
});

test("O5 CVD 模拟：protan/deutan/tritan 最小 ΔE2000 ≥10", () => {
  for (const [name, colors, floor] of [["light", light, 12], ["dark", dark, 10]]) {
    for (const mode of Object.keys(MAT)) {
      const { min, pair } = minPair(colors, mode);
      assert.ok(min >= floor, `${name} ${mode} 最小 ΔE=${min.toFixed(1)} (${pair}) < ${floor}`);
    }
  }
});

test("O5 文档与 token 同步", () => {
  const docs = readFileSync("docs/02-color-system.md", "utf8");
  for (let i = 1; i <= 8; i++) assert.match(docs, new RegExp(`--m-chart-${i}`), `docs/02 缺 --m-chart-${i}`);
  assert.match(docs, /CVD 模拟/, "docs/02 必须写明 CVD 模拟");
});
