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
function resolveValue(value, defs, theme = "light", depth = 0) {
  if (depth > 8) return undefined;
  const raw = String(value ?? "").trim();
  // v1.6 · light-dark(浅, 深)：按 color-scheme 取支后继续解引用
  const ld = raw.match(/^light-dark\(\s*([\s\S]+?)\s*,\s*([\s\S]+)\)$/);
  if (ld) return resolveValue(theme === "dark" ? ld[2] : ld[1], defs, theme, depth + 1);
  const ref = raw.match(/^var\(--m-([\w-]+)\)$/);
  if (ref) return resolveValue(defs.get(ref[1]), defs, theme, depth + 1);
  return raw;
}
function resolve(name, defs, seen = new Set(), theme = "light") {
  if (seen.has(name)) return undefined;
  const v = defs.get(name);
  if (v === undefined) return undefined;
  seen.add(name);
  return resolveValue(v, defs, theme);
}
const hex = (v) => (/^#[0-9a-fA-F]{6}$/.test(v ?? "") ? v : undefined);

const L = declsOf(css.slice(0, css.indexOf("ADMIN DARK")));
// 深色块：从 Dark 注释头切到 LAYER 3 组件层
const darkSlice = css.slice(css.indexOf("SEMANTIC · Dark"), css.indexOf("LAYER 3 — COMPONENT"));
const D = declsOf(darkSlice);
// 深色解析：D（深色覆盖）叠加在 L（primitive + 未覆写语义）之上合并解析——
// 深色值 var(--m-ink-2) 的 primitive 链条在 L 里，逐调用回落会让链断裂成浅色值
const DL = new Map([...L, ...D]);
const resolveD = (name) => resolve(name, DL, new Set(), "dark");

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
  ["warning-solid-fg", "warning-solid", 7], ["emphasis-solid-fg", "emphasis-solid", 4.5],
  ["border", "bg-surface", 1.3],                   // 装饰基线（docs/02 §六 修正后的口径）
];
const DARK = [
  ["fg", "bg-surface", 4.5], ["fg-muted", "bg-surface", 4.5], ["fg-subtle", "bg-surface", 4.5],
  ["fg-link", "bg-surface", 4.5], ["price-sale", "bg-surface", 4.5],
  ["success-fg", "bg-surface", 4.5], ["warning-fg", "bg-surface", 4.5],
  ["critical-fg", "bg-surface", 4.5], ["info-fg", "bg-surface", 4.5],
  ["emphasis-fg", "bg-surface", 4.5],
];

// 文本 token × 常见表面（v1.4 P0）：文本不只落在 bg-page，
// band/inset 是 ink-2、admin inset 是 ink-3；只测白底会放过 4.27:1 这类真实破约。
const TEXT_SURFACES_LIGHT = [
  ["fg-subtle", "bg-page", 4.5], ["fg-subtle", "bg-surface", 4.5],
  ["fg-subtle", "bg-surface-hover", 4.5], ["fg-subtle", "bg-surface-selected", 4.5],
  ["fg-muted", "bg-surface-hover", 4.5], ["fg-muted", "bg-surface-selected", 4.5],
];
const TEXT_SURFACES_DARK = [
  ["fg-subtle", "bg-page", 4.5], ["fg-subtle", "bg-surface", 4.5],
  ["fg-subtle", "bg-surface-hover", 4.5], ["fg-subtle", "bg-surface-selected", 4.5],
  ["fg-subtle", "bg-inset", 4.5],
  ["fg-muted", "bg-page", 4.5], ["fg-muted", "bg-inset", 4.5],
];

// 非文本对比（WCAG 1.4.11 / 2.4.11）：控件边界、状态描边、焦点环。
// 浅色边界必须在三种常见表面上都成立：page/surface(白)、band/inset(ink-2)、admin inset(ink-3)。
const UI_LIGHT = [
  ["border-strong", "bg-page", 3], ["border-strong", "bg-surface-hover", 3], ["border-strong", "bg-surface-selected", 3],
  ["border-focus", "bg-page", 3], ["border-focus", "bg-surface", 3],
  ["border-focus", "bg-surface-hover", 3], ["border-focus", "bg-surface-selected", 3],
  ["success-border", "success-bg", 3], ["warning-border", "warning-bg", 3],
  ["critical-border", "critical-bg", 3], ["info-border", "info-bg", 3],
  ["emphasis-border", "emphasis-bg", 3],
];
const UI_DARK = [
  ["border-strong", "bg-surface", 3],
  ["border-focus", "bg-page", 3], ["border-focus", "bg-surface", 3],
  ["border-focus", "bg-surface-hover", 3], ["border-focus", "bg-surface-selected", 3],
  ["border-focus", "bg-inset", 3],
  ["success-border", "bg-surface", 3], ["warning-border", "bg-surface", 3],
  ["critical-border", "bg-surface", 3], ["info-border", "bg-surface", 3],
  ["emphasis-border", "bg-surface", 3],
];
// 后台内嵌环取该变体的 *-fg（环压在填充上），必须对填充 ≥3:1。
// 前台外环落在页面底，不适用此表——它由 UI_LIGHT/UI_DARK 的 border-focus 行守护。
const FOCUS_ON_SOLID = [
  ["primary-fg", "primary"], ["critical-solid-fg", "critical-solid"],
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
test("非文本对比：浅色控件边界 / 状态描边 ≥3:1", () => {
  for (const [fg, bg, min] of UI_LIGHT) {
    const f = hex(resolve(fg, L)), b = hex(resolve(bg, L));
    assert.ok(f && b, `token 可解析: ${fg}=${f} ${bg}=${b}`);
    const r = ratio(f, b);
    assert.ok(r >= min, `${fg}/${bg} = ${r.toFixed(2)} < ${min}（${f} on ${b}）`);
  }
});
test("非文本对比：深色控件边界 / 状态描边 ≥3:1", () => {
  for (const [fg, bg, min] of UI_DARK) {
    const f = hex(resolveD(fg)), b = hex(resolveD(bg));
    assert.ok(f && b, `深色 token 可解析: ${fg}=${f} ${bg}=${b}`);
    const r = ratio(f, b);
    assert.ok(r >= min, `dark ${fg}/${bg} = ${r.toFixed(2)} < ${min}`);
  }
});
test("文本 token × 常见表面（浅色，v1.4 P0 回归）", () => {
  for (const [fg, bg, min] of TEXT_SURFACES_LIGHT) {
    const f = hex(resolve(fg, L)), b = hex(resolve(bg, L));
    assert.ok(f && b, `token 可解析: ${fg}=${f} ${bg}=${b}`);
    const r = ratio(f, b);
    assert.ok(r >= min, `${fg}/${bg} = ${r.toFixed(2)} < ${min}（${f} on ${b}）`);
  }
});
test("文本 token × 常见表面（深色，v1.4 P0 回归）", () => {
  for (const [fg, bg, min] of TEXT_SURFACES_DARK) {
    const f = hex(resolveD(fg)), b = hex(resolveD(bg));
    assert.ok(f && b, `深色 token 可解析: ${fg}=${f} ${bg}=${b}`);
    const r = ratio(f, b);
    assert.ok(r >= min, `dark ${fg}/${bg} = ${r.toFixed(2)} < ${min}（${f} on ${b}）`);
  }
});
test("前台外环 border-focus 对相邻背景 ≥3:1（v1.4 P0 回归）", () => {
  // 外环落在页面/表面，不在控件填充上；v1.3 误用 *-fg 造成 1.00/1.22:1。
  for (const [theme, get] of [["light", (n) => hex(resolve(n, L))], ["dark", (n) => hex(resolveD(n))]]) {
    const f = get("border-focus");
    for (const bg of ["bg-page", "bg-surface", "bg-surface-hover", "bg-surface-selected", "bg-inset"]) {
      const b = get(bg);
      assert.ok(f && b, `${theme} focus token 可解析: ${f} / ${bg}=${b}`);
      const r = ratio(f, b);
      assert.ok(r >= 3, `${theme} outer focus vs ${bg} = ${r.toFixed(2)} < 3`);
    }
  }
});
test("后台内嵌环（取 *-fg）对控件填充 ≥3:1", () => {
  for (const [fg, bg] of FOCUS_ON_SOLID) {
    const lf = hex(resolve(fg, L)), lb = hex(resolve(bg, L));
    assert.ok(ratio(lf, lb) >= 3, `light ${fg}/${bg} = ${ratio(lf, lb).toFixed(2)} < 3`);
    const df = hex(resolveD(fg)), db = hex(resolveD(bg));
    assert.ok(ratio(df, db) >= 3, `dark ${fg}/${bg} = ${ratio(df, db).toFixed(2)} < 3`);
  }
  // 后台主按钮（brand-9 + 白字）也必须过线
  const adminPrimary = hex(resolve("brand-9", L));
  assert.ok(ratio("#FFFFFF", adminPrimary) >= 3, "admin primary 焦点环 < 3");
});
test("tokens.json 与 tokens.css 的 accent-11 同步", () => {
  const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));
  assert.equal(json.color.primitive.accent["11"], resolve("accent-11", L));
});

// P2：色带单调性（ink-9 → 12 亮度递减）与深色表面阶梯（inset 必须比 chrome 暗）
test("P2 ink 色带 9→12 亮度单调递减", () => {
  const l = (n) => lum(hex(resolve(n, L)));
  assert.ok(l("ink-9") > l("ink-10"), `ink-9 ${l("ink-9")} <= ink-10 ${l("ink-10")}`);
  assert.ok(l("ink-10") > l("ink-11"), `ink-10 ${l("ink-10")} <= ink-11 ${l("ink-11")}`);
  assert.ok(l("ink-11") > l("ink-12"), `ink-11 ${l("ink-11")} <= ink-12 ${l("ink-12")}`);
});

test("P2 深色表面阶梯：inset 比 chrome 暗一档", () => {
  assert.ok(lum(hex(resolveD("bg-inset"))) < lum(hex(resolveD("bg-chrome"))), "storefront dark inset 未比 chrome 暗");
  // v1.6 · 深色 admin 值已并入 .stage-admin 的 light-dark()，不再从 ADMIN DARK 段刮 hex
  const adminSlice = css.slice(css.indexOf(".stage-admin {"), css.indexOf("ADMIN DARK"));
  const ADMIN = new Map([...L, ...declsOf(adminSlice)]);
  const ai = hex(resolve("bg-inset", ADMIN, new Set(), "dark"));
  const ac = hex(resolve("bg-chrome", ADMIN, new Set(), "dark"));
  assert.ok(ai && ac, `admin dark 可解析: inset=${ai} chrome=${ac}`);
  assert.ok(lum(ai) < lum(ac), `admin dark inset ${ai} 未比 chrome ${ac} 暗`);
});

test("P2 outline badge 边框对表面 ≥3:1", () => {
  const pairs = [
    ["warning-border", "bg-surface"], ["success-border", "bg-surface"], ["critical-border", "bg-surface"],
    ["info-border", "bg-surface"], ["emphasis-border", "bg-surface"],
    ["border-strong", "bg-surface"], ["ai-fg", "bg-surface"],
  ];
  for (const [fg, bg] of pairs) {
    const lf = hex(resolve(fg, L)), lb = hex(resolve(bg, L));
    assert.ok(ratio(lf, lb) >= 3, `light ${fg}/${bg} = ${ratio(lf, lb).toFixed(2)} < 3`);
    const df = hex(resolveD(fg)), db = hex(resolveD(bg));
    assert.ok(ratio(df, db) >= 3, `dark ${fg}/${bg} = ${ratio(df, db).toFixed(2)} < 3`);
  }
});

test("P2 图表 8 色对白底 ≥3:1（tokens.css 浅色定义）", () => {
  const colors = [...css.matchAll(/--m-chart-(\d):\s*(#[0-9A-Fa-f]{6})/g)].slice(0, 8).map((m) => m[2]);
  assert.equal(colors.length, 8, "图表色板应为 8 色");
  for (const c of colors) assert.ok(ratio(c, "#FFFFFF") >= 3, `${c} on white = ${ratio(c, "#FFFFFF").toFixed(2)} < 3`);
});

// v1.6 · docs/02 §十 的不变量：实底必须落在"对比死区"之外。
// 死区 = 白字(<4.5:1) 与深字 #2B1F02(<4.5:1) 都不达标的亮度区间 (0.183, 0.241)。
// 旧配方固定 L33，会让鲜艳品牌色被迫压成深棕；本断言把"配白字还是深字"变成显式选择。
test("P3 实底 9 阶必须落在对比死区之外，且配对文字色 ≥4.5:1", () => {
  const SOLIDS = [
    ["brand-9", "primary-fg"],
    ["info-9", "info-solid-fg"],
    ["success-9", "success-solid-fg"],
    ["warning-9", "warning-solid-fg"],
    ["danger-9", "critical-solid-fg"],
    ["accent-9", "emphasis-solid-fg"],
  ];
  for (const [solid, fg] of SOLIDS) {
    const sh = hex(resolve(solid, L));
    assert.ok(sh, `9 阶可解析: ${solid}`);
    const sl = lum(sh);
    assert.ok(
      sl <= 0.183 || sl >= 0.241,
      `${solid} ${sh} L=${sl.toFixed(3)} 落在死区 (0.183, 0.241)：白字与深字均不达标`
    );
    const fh = hex(resolve(fg, L));
    assert.ok(fh, `配对文字色可解析: ${fg}`);
    const r = ratio(fh, sh);
    assert.ok(r >= 4.5, `${solid}/${fg} = ${r.toFixed(2)}:1 < 4.5（白字门 L≤0.183 / 深字门 L≥0.241）`);
  }
});

// v1.6 · 卡片分隔线是装饰线，必须轻于语义边界。
// 依据对照：Arco 的卡片描边 1.25:1 且 `bordered` 是可选变体；Meridian 曾直接复用 --m-border
// （1.52:1）当默认，于是"画布 1.06 + 描边 1.52"的双弱边缘读起来像一个硬框，而不是一块浮起的面。
test("卡片分隔线：落在装饰带 1.2–1.4，且严格轻于语义边界", () => {
  const ALL = declsOf(css);
  const surface = hex(resolve("bg-surface", ALL));
  const cardEdge = hex(resolve("card-border", ALL));
  const semantic = hex(resolve("border", ALL));
  assert.ok(surface && cardEdge && semantic, `三方可解析: ${surface}/${cardEdge}/${semantic}`);
  const de = ratio(cardEdge, surface);
  const ds = ratio(semantic, surface);
  assert.ok(de >= 1.2 && de <= 1.4, `卡片描边 ${cardEdge} = ${de.toFixed(2)}:1，应落在装饰带 1.2–1.4`);
  assert.ok(de < ds, `卡片描边 ${de.toFixed(2)}:1 不得重于语义边界 ${ds.toFixed(2)}:1`);
});

// v1.6 · docs/02 §二 的唯一禁止组合。
// 暖色带的 8 阶（深）与 9 阶（亮）分属两条边缘策略；只要不同处一个元素就是合法变体。
// 一旦叠加 —— 深描边 + 亮实底 —— "实底"看起来比边界更浅，层级反转。
test("P4 禁止同一规则内叠加 *-border 描边与 *-solid 实底", () => {
  const files = ["ai/meridian-ui.css", "ai/site.css", "ai/admin.css"];
  const FAMILIES = ["success", "warning", "critical", "info", "emphasis"];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const block of src.split("}")) {
      for (const fam of FAMILIES) {
        const solidBg = new RegExp(`background[^;]*var\\(--m-${fam}-solid\\)`).test(block);
        const hasBorder = new RegExp(`border[^;]*var\\(--m-${fam}-border\\)`).test(block);
        assert.ok(
          !(solidBg && hasBorder),
          `${f}: 同一规则同时把 --m-${fam}-solid 当背景、把 --m-${fam}-border 当描边（docs/02 §二 禁止）`
        );
      }
    }
  }
});
