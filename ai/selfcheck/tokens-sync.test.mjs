import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// tokens.json ↔ tokens.css 全量 parity（spec S2 R-26 / D8，P0-3）：
// 运行时事实来源是 tokens.css；tokens.json 是 primitive + semantic 主题层的镜像。
// 旧测试只断言"token 名存在"，无法阻止两套主题语义分叉（前台/后台 primary 各说各话）。

const css = readFileSync("ai/tokens.css", "utf8");
const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));

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
const admin = new Map([...light, ...decls(blockFrom("\n.stage-admin {"))]);
const darkBlock = decls(blockFrom("SEMANTIC · Dark"));
const adminDarkBlock = decls(blockFrom(".stage-admin.theme-dark,"));
const dark = new Map([...light, ...darkBlock]);
const adminDark = new Map([...light, ...decls(blockFrom("\n.stage-admin {")), ...darkBlock, ...adminDarkBlock]);

const squash = (v) => v.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim().toLowerCase();

function resolveCss(value, map, depth = 0, theme = "light") {
  assert.ok(depth < 8, `token 解析循环: ${value}`);
  const raw = String(value).trim();
  // v1.6 · light-dark(浅, 深)：按主题取支后继续解引用
  const ld = raw.match(/^light-dark\(\s*([\s\S]+?)\s*,\s*([\s\S]+)\)$/);
  if (ld) return resolveCss(theme === "dark" ? ld[2] : ld[1], map, depth + 1, theme);
  const m = raw.match(/^var\(--m-([\w-]+)\)$/);
  if (!m) return squash(raw);
  assert.ok(map.has(m[1]), `CSS 引用了不存在的 --m-${m[1]}`);
  return resolveCss(map.get(m[1]), map, depth + 1, theme);
}
function resolveJson(value, map, theme = "light") {
  const v = String(value).trim();
  if (map.has(v)) return resolveCss(map.get(v), map, 0, theme);   // ink-12 / border-strong / fg-subtle 等别名
  if (/^var\(/.test(v) || /^light-dark\(/.test(v)) return resolveCss(v, map, 0, theme);
  return squash(v);
}

function assertStage(name, obj, map, theme = "light") {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "note") continue;
    assert.ok(map.has(k), `${name}: tokens.css 缺 --m-${k}`);
    assert.equal(
      resolveJson(v, map, theme),
      resolveCss(map.get(k), map, 0, theme),
      `${name}: --m-${k} 分叉（json=${v} / css=${map.get(k)}）`
    );
  }
}

test("primitive 色带全量一致", () => {
  for (const [family, steps] of Object.entries(json.color.primitive)) {
    for (const [step, hex] of Object.entries(steps)) {
      assert.equal(prim.get(`${family}-${step}`), hex, `${family}-${step} 分叉`);
    }
  }
});

test("light 主题语义全量一致（= :root / .stage-storefront）", () => {
  assertStage("light", json.color.semantic.light, light);
});

test("storefront 舞台覆盖一致", () => {
  assertStage("storefront", json.color.semantic["stage-overrides"].storefront, light);
});

test("admin 舞台语义全量一致", () => {
  assertStage("admin", json.color.semantic["stage-overrides"].admin, admin);
});

test("dark 主题语义全量一致", () => {
  assertStage("dark", json.color.semantic.dark, dark, "dark");
});

test("admin-dark 舞台语义全量一致", () => {
  assertStage("admin-dark", json.color.semantic["stage-overrides"]["admin-dark"], adminDark, "dark");
});

test("typography / radius / breakpoint 菜单与 CSS 同源", () => {
  assert.deepEqual(
    Object.keys(json.typography.leading),
    Object.keys(json.typography["sizes-px"]).concat("display")
  );
  for (const [step, rem] of Object.entries(json.typography.leading)) {
    const name = step === "display" ? "--m-leading-display" : `--m-leading-${step}`;
    assert.ok(css.includes(`${name}:`), `tokens.css 缺 ${name}`);
  }
  // V-01：字重是第一个"文档 / json / CSS 三方各说一套"的 token。
  // 镜像必须双向闭合（键与值都同源），否则 json 会再次漂移成一份没人执行的规格。
  const cssWeights = Object.fromEntries(
    [...css.matchAll(/--m-weight-([\w-]+)\s*:\s*(\d+)/g)].map(([, k, v]) => [k, Number(v)])
  );
  assert.deepEqual(cssWeights, { regular: 400, medium: 500, semibold: 600, bold: 700 },
    "字重阶梯必须是 400/500/600/700：不交付 @font-face 时 450/550/650 在 Windows 雅黑上塌陷成两档（docs/03 §2.1）");
  assert.deepEqual(json.typography.weights, cssWeights, "tokens.json typography.weights 必须与 tokens.css 的 --m-weight-* 同源");
});

// ---------------------------------------------------------------------------
// 2.5 · 镜像归属表
// tokens.json 是镜像，但"镜像"不等于"全比过"：颜色/字重/角色行高之外，
// 舞台四件套、字阶、间距、半径、层级、动效此前没有任何断言。
// 这里把每个叶子键登记为"已比对（where）"或"显式不比对（reason）"：
// 未归属 = 红，模式空转 = 红，排除项缺理由 = 红——表必须和值一起腐烂或一起更新。
// 顺序先到先得（同 CSS 层叠）：窄排除项写在宽比对项之前。
// ---------------------------------------------------------------------------
const uiCss = readFileSync("ai/meridian-ui.css", "utf8");

const OWNERSHIP = [
  { pattern: "$schema", status: "excluded", reason: "JSON Schema 指针，无运行时对应值" },
  { pattern: "$name", status: "excluded", reason: "镜像元数据，不参与运行时" },
  { pattern: "$version", status: "compared", where: "acceptance.test.mjs · A11 七源版本一致" },
  { pattern: "$description", status: "excluded", reason: "镜像宪章散文，执行面在 README 与 tokens.css 头注释" },

  { pattern: "color.surface-ranks-note", status: "excluded", reason: "色阶用途说明，不是 token" },
  { pattern: "color.semantic.stage-overrides.*.note", status: "excluded", reason: "舞台覆盖的说明文字；assertStage 亦跳过 note" },
  { pattern: "color.primitive.*.*", status: "compared", where: "本文件 · primitive 色带全量一致" },
  { pattern: "color.semantic.light.*", status: "compared", where: "本文件 · light 主题语义全量一致" },
  { pattern: "color.semantic.dark.*", status: "compared", where: "本文件 · dark 主题语义全量一致" },
  { pattern: "color.semantic.stage-overrides.storefront.*", status: "compared", where: "本文件 · storefront 舞台覆盖一致" },
  { pattern: "color.semantic.stage-overrides.admin.*", status: "compared", where: "本文件 · admin 舞台语义全量一致" },
  { pattern: "color.semantic.stage-overrides.admin-dark.*", status: "compared", where: "本文件 · admin-dark 舞台语义全量一致" },

  { pattern: "stage.*.*", status: "compared", where: "本文件 · 舞台四件套镜像一致" },

  { pattern: "typography.font-sans", status: "compared", where: "本文件 · 字体栈三方同源" },
  { pattern: "typography.font-display", status: "compared", where: "本文件 · 字体栈三方同源" },
  { pattern: "typography.font-mono", status: "compared", where: "本文件 · 字体栈三方同源" },
  { pattern: "typography.weights.*", status: "compared", where: "本文件 · typography 菜单与 CSS 同源" },
  { pattern: "typography.sizes-px.*", status: "compared", where: "本文件 · 字阶 px/行高双向一致" },
  { pattern: "typography.leading.*", status: "compared", where: "本文件 · 字阶 px/行高双向一致" },
  { pattern: "typography.body-leading.*", status: "compared", where: "本文件 · 舞台正文行高镜像一致" },
  { pattern: "typography.body-fs", status: "excluded", reason: "描述性散文；实际值在 stage.*（已比对）" },
  { pattern: "typography.display-clamp-sm", status: "compared", where: "本文件 · 展示标题 clamp 同源" },
  { pattern: "typography.display-clamp", status: "compared", where: "本文件 · 展示标题 clamp 同源" },
  { pattern: "typography.display-clamp-lg", status: "compared", where: "本文件 · 展示标题 clamp 同源" },
  { pattern: "typography.tracking.*", status: "compared", where: "本文件 · 字距镜像一致" },
  { pattern: "typography.roles.$note", status: "excluded", reason: "角色行高的注释；A-10 只比数值角色" },
  { pattern: "typography.roles.*", status: "compared", where: "audit-regressions.test.mjs · A-10 角色行高" },
  { pattern: "typography.rules", status: "excluded", reason: "字体规则散文，执行面是 docs/03 与 R16" },

  { pattern: "space.base-px", status: "compared", where: "本文件 · 间距刻度镜像一致" },
  { pattern: "space.scale.*", status: "compared", where: "本文件 · 间距刻度镜像一致" },
  { pattern: "space.section-clamp", status: "compared", where: "本文件 · 间距刻度镜像一致" },

  { pattern: "radius.knob", status: "compared", where: "本文件 · 半径派生镜像一致" },
  { pattern: "radius.scale-px.*", status: "compared", where: "本文件 · 半径派生镜像一致" },

  { pattern: "elevation.*", status: "excluded", reason: "e1–e4 是层级用途散文；数值契约在 z-ladder（已比对）" },
  { pattern: "elevation.z-ladder.*", status: "compared", where: "本文件 · z 阶梯镜像一致" },

  { pattern: "motion.duration-ms.*", status: "compared", where: "本文件 · 动效时长/缓动/状态层镜像一致" },
  { pattern: "motion.easing.*", status: "compared", where: "本文件 · 动效时长/缓动/状态层镜像一致" },
  { pattern: "motion.state-layer-opacity.*", status: "compared", where: "本文件 · 动效时长/缓动/状态层镜像一致" },

  { pattern: "breakpoints-px.*", status: "compared", where: "本文件 · 断点镜像一致（--m-bp-*）" },
  { pattern: "container.*", status: "compared", where: "本文件 · 容器宽度镜像一致" },

  { pattern: "a11y-contract.target-size-min-px", status: "excluded", reason: "平台地板（WCAG 2.5.8），由 axe target-size 运行时执行；无 CSS token" },
  { pattern: "a11y-contract.target-size-touch-px", status: "excluded", reason: "44px 自我承诺，由 runtime-a11y 尺码胶囊断言执行；无 CSS token" },
  { pattern: "a11y-contract.contrast.*", status: "excluded", reason: "比率契约由 contrast.test.mjs / dark-contrast.test.mjs 与 axe 执行；CSS 只有颜色" },
  { pattern: "a11y-contract.focus-ring.width", status: "compared", where: "本文件 · 焦点环契约镜像一致" },
  { pattern: "a11y-contract.focus-ring.offset", status: "compared", where: "本文件 · 焦点环契约镜像一致" },
  { pattern: "a11y-contract.focus-ring.offset-admin-inset", status: "compared", where: "本文件 · 焦点环契约镜像一致" },
  { pattern: "a11y-contract.focus-ring.note", status: "excluded", reason: "焦点环取色说明，不是 token" },
];

function leaves(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v !== null && typeof v === "object" && !Array.isArray(v) ? leaves(v, path) : [[path, v]];
  });
}
function pathHit(pattern, path) {
  const a = pattern.split("."), b = path.split(".");
  return a.length === b.length && a.every((seg, i) => seg === "*" || seg === b[i]);
}

test("tokens.json 每个叶子键都有镜像归属", () => {
  const all = leaves(json);
  const problems = [];
  for (const [path] of all) {
    if (!OWNERSHIP.some((o) => pathHit(o.pattern, path))) problems.push(`未归属: ${path}`);
  }
  for (const o of OWNERSHIP) {
    assert.ok(["compared", "excluded"].includes(o.status), `非法归属状态: ${o.pattern}`);
    if (!all.some(([path]) => pathHit(o.pattern, path))) problems.push(`空转模式: ${o.pattern}`);
    if (o.status === "compared" && !o.where) problems.push(`比对项缺出处: ${o.pattern}`);
    if (o.status === "excluded" && !o.reason) problems.push(`排除项缺理由: ${o.pattern}`);
  }
  assert.deepEqual(problems, [], "\n" + problems.join("\n"));
});

// ---- 长度求值：只认本仓 CSS 里实际出现的 px / rem / calc / max ----
const toPx = (value) => {
  const v = String(value).trim();
  if (v === "0") return 0;
  const m = v.match(/^(-?[\d.]+)(px|rem)$/);
  assert.ok(m, `无法解析长度: ${v}`);
  return Number(m[1]) * (m[2] === "rem" ? 16 : 1);
};
function evalLength(source, vars) {
  let s = String(source).trim();
  for (let i = 0; i < 12 && /var\(--m-([\w-]+)\)/.test(s); i++) {
    s = s.replace(/var\(--m-([\w-]+)\)/g, (_, name) => {
      assert.ok(vars.has(name), `长度表达式引用未知变量 --m-${name}`);
      return `(${vars.get(name)})`;
    });
  }
  s = s.replace(/([\d.]+)rem/g, (_, n) => `${Number(n) * 16}px`)
    .replace(/calc\(/g, "(")
    .replace(/([\d.]+)px/g, "$1")
    .replace(/\s+/g, "");
  let i = 0;
  const peek = () => s[i];
  function factor() {
    if (s.startsWith("max(", i)) {
      i += 4;
      const a = expr();
      assert.equal(peek(), ","); i++;
      const b = expr();
      assert.equal(peek(), ")"); i++;
      return Math.max(a, b);
    }
    if (peek() === "(") { i++; const v = expr(); assert.equal(peek(), ")"); i++; return v; }
    if (peek() === "-") { i++; return -factor(); }
    const m = s.slice(i).match(/^\d+(?:\.\d+)?/);
    assert.ok(m, `长度表达式无法解析: ${source} @${i}`);
    i += m[0].length;
    return Number(m[0]);
  }
  function term() {
    let v = factor();
    while (peek() === "*" || peek() === "/") { const op = s[i++]; const r = factor(); v = op === "*" ? v * r : v / r; }
    return v;
  }
  function expr() {
    let v = term();
    while (peek() === "+" || peek() === "-") { const op = s[i++]; const r = term(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  const v = expr();
  assert.equal(i, s.length, `长度表达式未解析完: ${source} @${i}`);
  return v;
}

test("字体栈三方同源（sans/display/mono）", () => {
  const unquote = (v) => squash(v).replace(/["']/g, "").replace(/\s*,\s*/g, ", ");
  for (const key of ["font-sans", "font-display", "font-mono"]) {
    assert.equal(
      unquote(resolveJson(json.typography[key], prim)),
      unquote(resolveCss(prim.get(key), prim)),
      `typography.${key} 分叉（json=${json.typography[key]}）`
    );
  }
});

test("字阶 px/行高与 CSS 双向一致", () => {
  assert.deepEqual(Object.keys(json.typography["sizes-px"]),
    ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"]);
  for (const [step, [sizePx, leadPx]] of Object.entries(json.typography["sizes-px"])) {
    assert.equal(toPx(prim.get(`text-${step}`)), sizePx, `--m-text-${step} 与 sizes-px 分叉`);
    assert.equal(toPx(prim.get(`leading-${step}`)), leadPx, `--m-leading-${step} 与 sizes-px 行高分叉`);
  }
  for (const [step, lead] of Object.entries(json.typography.leading)) {
    const cssLead = prim.get(`leading-${step}`);
    if (step === "display") assert.equal(Number(cssLead), Number(lead), "--m-leading-display 分叉");
    else assert.equal(toPx(cssLead), toPx(lead), `--m-leading-${step} 与 leading 菜单分叉`);
  }
});

test("舞台正文行高镜像一致", () => {
  assert.equal(Number(light.get("body-leading")), json.typography["body-leading"].storefront, "前台正文行高分叉");
  assert.equal(Number(admin.get("body-leading")), json.typography["body-leading"].admin, "后台正文行高分叉");
});

test("舞台四件套镜像一致（body-fs/card-shadow/card-radius/overlay-blur）", () => {
  const ref = (v) => (/^(?:none|[-\d.]+px)$/.test(v) ? v : `var(--m-${v})`);
  for (const [stageName, map] of [["storefront", light], ["admin", admin]]) {
    assert.deepEqual(Object.keys(json.stage[stageName]).sort(),
      ["body-fs", "card-radius", "card-shadow", "overlay-blur"], `stage.${stageName} 键集分叉`);
    for (const [key, value] of Object.entries(json.stage[stageName])) {
      assert.equal(
        resolveJson(ref(value), map),
        resolveCss(map.get(key), map),
        `stage.${stageName}.${key} 分叉（json=${value} / css=${map.get(key)}）`
      );
    }
  }
});

test("展示标题 clamp 与字距镜像一致", () => {
  for (const [key, token] of [
    ["display-clamp-sm", "text-display-sm"],
    ["display-clamp", "text-display"],
    ["display-clamp-lg", "text-display-lg"],
  ]) {
    assert.equal(squash(json.typography[key]), squash(prim.get(token)), `${key} 分叉`);
  }
  for (const [key, value] of Object.entries(json.typography.tracking)) {
    assert.equal(squash(prim.get(`tracking-${key}`)), squash(value), `--m-tracking-${key} 分叉`);
  }
});

test("间距刻度镜像一致且落在 4px 网格", () => {
  assert.equal(json.space["base-px"], 4, "space.base-px 必须是 4（sg 网格的锚）");
  for (const [step, value] of Object.entries(json.space.scale)) {
    assert.equal(toPx(prim.get(`space-${step}`)), value, `--m-space-${step} 分叉`);
    // 05 是唯一的半格（2px），只允许用在控件内部细节；其余必须落在 4px 网格。
    if (step === "05") assert.equal(value, 2, "space.05 必须是 2px 半格");
    else assert.equal(value % json.space["base-px"], 0, `space.${step}=${value} 不在 4px 网格`);
  }
  assert.equal(squash(json.space["section-clamp"]), squash(prim.get("space-section")), "space.section-clamp 分叉");
});

test("半径派生镜像一致（knob → calc → px）", () => {
  assert.equal(toPx(prim.get("radius")), json.radius.knob, "--m-radius 与 radius.knob 分叉");
  for (const [step, value] of Object.entries(json.radius["scale-px"])) {
    assert.equal(evalLength(prim.get(`radius-${step}`), prim), value, `--m-radius-${step} 派生值与 scale-px 分叉`);
  }
});

test("z 阶梯镜像一致", () => {
  for (const [name, value] of Object.entries(json.elevation["z-ladder"])) {
    assert.equal(Number(prim.get(`z-${name}`)), value, `--m-z-${name} 分叉`);
  }
});

test("动效时长/缓动/状态层镜像一致", () => {
  const cssDurations = Object.fromEntries(
    [...css.matchAll(/--m-duration-([\w-]+)\s*:\s*(\d+)ms/g)].map(([, k, v]) => [k, Number(v)])
  );
  assert.deepEqual(cssDurations,
    Object.fromEntries(Object.keys(json.motion["duration-ms"]).map((k) => [k, Number(k)])),
    "duration 键集/数值分叉");

  const cssEase = Object.fromEntries(
    [...css.matchAll(/--m-ease-([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, squash(v)])
  );
  assert.deepEqual(cssEase,
    Object.fromEntries(Object.entries(json.motion.easing).map(([k, v]) => [k, squash(v)])),
    "easing 键集/数值分叉");

  const cssState = Object.fromEntries(
    [...css.matchAll(/--m-state-([\w-]+)\s*:\s*(\d+%)/g)].map(([, k, v]) => [k, v])
  );
  assert.deepEqual(cssState, json.motion["state-layer-opacity"], "state-layer-opacity 分叉");
});

test("断点与容器镜像一致", () => {
  const bps = new Map(
    [...uiCss.matchAll(/--m-bp-([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()])
  );
  assert.deepEqual(Object.keys(json["breakpoints-px"]).sort(), [...bps.keys()].sort(), "断点键集分叉");
  for (const [key, value] of Object.entries(json["breakpoints-px"])) {
    assert.equal(toPx(bps.get(key)), value, `--m-bp-${key} 分叉`);
  }
  for (const [key, value] of Object.entries(json.container)) {
    assert.equal(toPx(prim.get(`container-${key}`)), value, `--m-container-${key} 分叉`);
  }
});

test("焦点环契约镜像一致（含后台 inset 求值）", () => {
  const ring = json["a11y-contract"]["focus-ring"];
  assert.equal(toPx(light.get("focus-ring-width")), toPx(ring.width), "focus-ring.width 分叉");
  assert.equal(toPx(light.get("focus-ring-offset")), toPx(ring.offset), "focus-ring.offset 分叉");
  const m = css.match(/\.stage-admin :where\([^)]*\):focus-visible\s*\{\s*outline-offset:\s*([^;]+);/);
  assert.ok(m, "tokens.css 找不到后台焦点环 inset 声明");
  assert.equal(evalLength(m[1], light), Number(String(ring["offset-admin-inset"]).replace("px", "")),
    "focus-ring.offset-admin-inset 与实际 outline-offset 表达式分叉");
});
