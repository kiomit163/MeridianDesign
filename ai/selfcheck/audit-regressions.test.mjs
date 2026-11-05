import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// AUDIT-1.4.0 修复的永久回归（每条 A-xx 一个断言）。
// 原则：断言"结果可观测"，不复制实现；删掉修复代码 → 此文件先红。

const css = readFileSync("ai/tokens.css", "utf8");
const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));
const ui = readFileSync("ai/meridian-ui.css", "utf8");
const site = readFileSync("ai/site.css", "utf8");
const admin = readFileSync("ai/admin.css", "utf8");
const agents = readFileSync("ai/AGENTS.md", "utf8");
const readme = readFileSync("README.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");
const doc01 = readFileSync("docs/01-design-philosophy.md", "utf8");
const doc02 = readFileSync("docs/02-color-system.md", "utf8");
const doc03 = readFileSync("docs/03-typography.md", "utf8");
const doc04 = readFileSync("docs/04-spacing-layout-elevation.md", "utf8");
const doc05 = readFileSync("docs/05-motion-iconography.md", "utf8");
const doc06 = readFileSync("docs/06-accessibility-compliance.md", "utf8");
const doc09 = readFileSync("storefront/09-storefront-foundations.md", "utf8");
const doc14 = readFileSync("admin/14-admin-foundations.md", "utf8");
const doc16 = readFileSync("admin/16-admin-forms-settings.md", "utf8");
const doc17 = readFileSync("admin/17-admin-feedback-dashboard.md", "utf8");
const contracts = readFileSync("components/18-component-contracts.md", "utf8");
const home = readFileSync("prototypes/08-home.html", "utf8");

const defs = new Map();
for (const m of css.matchAll(/--m-([\w-]+)\s*:\s*([^;]+);/g)) if (!defs.has(m[1])) defs.set(m[1], m[2].trim());
const resolveValue = (value, seen = new Set(), depth = 0) => {
  assert.ok(depth < 8, `token 解析过深: ${value}`);
  const raw = String(value ?? "").trim();
  // v1.6 · light-dark(浅, 深)：本文件断言浅色语义，取浅支后继续解引用
  const ld = raw.match(/^light-dark\(\s*([\s\S]+?)\s*,\s*([\s\S]+)\)$/);
  if (ld) return resolveValue(ld[1], seen, depth + 1);
  const ref = raw.match(/^var\(--m-([\w-]+)\)$/);
  if (!ref) return raw;
  assert.ok(defs.has(ref[1]), `tokens.css 缺 --m-${ref[1]}`);
  if (seen.has(ref[1])) throw new Error(`循环: --m-${ref[1]}`);
  seen.add(ref[1]);
  return resolveValue(defs.get(ref[1]), seen, depth + 1);
};
const resolve = (name, seen = new Set()) => {
  assert.ok(defs.has(name), `tokens.css 缺 --m-${name}`);
  return resolveValue(defs.get(name), seen);
};
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const L = (name) => lum(resolve(name));

test("A-01 Switch 热区 ≥44（WCAG 2.5.8）", () => {
  assert.match(ui, /\.m-switch\s*\{[^}]*min-height:\s*44px/, "Switch 必须 min-height:44px");
  assert.match(ui, /\.m-switch input\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%/, "隐藏 input 必须铺满 label");
  assert.match(contracts, /热区 44×44（`min-height:44px`/, "契约必须与实现一致");
});

test("A-02 移动端表单地板：16px / 44px", () => {
  const block = css.slice(css.indexOf("@media (max-width: 767px)"));
  assert.match(block, /--m-input-font:\s*1rem/, "移动端输入字号必须 16px");
  assert.match(block, /--m-input-h:\s*2\.75rem/, "移动端输入高度必须 44px");
  assert.match(doc09, /移动端表单控件统一 44px 高 \/ 16px 字号/, "09 章必须写明移动端地板");
});

test("A-03 带动作 Toast 驻留 10s，常规仍 5s", () => {
  assert.equal(resolve("toast-duration"), "5000ms");
  assert.equal(resolve("toast-duration-action"), "10000ms");
  assert.match(doc16, /--m-toast-duration-action/, "16 章 Undo 必须引用 token");
  assert.match(doc17, /--m-toast-duration-action/, "17 章必须写带动作 Toast 的口径");
  assert.match(doc17, /带动作 10s/, "17 章决策树必须写 10s");
  assert.match(readFileSync("docs/08-copywriting.md", "utf8"), /--m-toast-duration-action/, "08 章 Toast 规格必须写 10s");
});

test("A-04 表面阶梯：选中底必须比 hover 深一档", () => {
  assert.equal(resolve("primary-tint"), resolve("ink-3"));
  assert.ok(L("primary-tint") < L("bg-surface-hover"), "primary-tint 亮度必须低于 surface-hover");
  assert.match(doc02, /v1\.5 阶梯修正/, "02 章必须登记该修正");
  // 组件真实 hover 必须用 surface-hover（否则与 selected 同色，语义反转仍在）
  assert.match(ui, /\.m-combobox__opt:hover[^{]*\{[^}]*var\(--m-bg-surface-hover\)/, "combobox hover 必须用 surface-hover");
  assert.match(ui, /\.m-combobox__opt\[aria-selected="true"\]\s*\{[^}]*var\(--m-primary-tint\)/, "combobox selected 必须用 primary-tint");
});

test("A-05 时间性内容与进度语义进入 WCAG 映射", () => {
  for (const clause of ["2.2.2", "1.2.2", "1.2.3", "1.2.5", "1.3.5", "2.3.1"])
    assert.ok(doc06.includes(clause), `06 章缺 ${clause}`);
  assert.match(doc06, /role="progressbar"/, "进度条语义");
  assert.match(doc06, /role="timer"/, "倒计时语义");
  assert.match(readFileSync("storefront/13-storefront-trust-conversion.md", "utf8"), /role="timer"/, "13 章倒计时必须带 timer 语义");
  assert.match(readFileSync("storefront/13-storefront-trust-conversion.md", "utf8"), /role="progressbar"/, "13 章进度条必须带 progressbar 语义");
});

test("A-06 文档不再指导 primitive / 越级 z", () => {
  for (const [name, text] of [["09", doc09], ["17", doc17], ["18", contracts]]) {
    assert.doesNotMatch(text, /bg-brand-\d/, `${name} 仍在使用 primitive 背景`);
    assert.doesNotMatch(text, /z-nav\+/, `${name} 仍引用不存在的阶梯档位`);
  }
  assert.ok(css.includes("--m-chart-grid"), "缺 --m-chart-grid");
  assert.match(admin, /--m-chart-grid/, "图表网格线必须消费 token");
  assert.match(home, /--m-announce-bg/, "原型宣告条必须使用品牌插槽");
  assert.match(home, /brand-tokens\.css/, "原型必须加载品牌插槽（否则 announce token 未定义）");
  assert.match(site, /\.sf-announce\s*\{[^}]*var\(--m-announce-bg\)/, ".sf-announce 必须消费品牌插槽");
  assert.doesNotMatch(site, /\.sf-announce\s*\{[^}]*var\(--m-primary\)/, ".sf-announce 不得使用前台 primary");
  assert.doesNotMatch(home, /background:var\(--m-primary\);color:var\(--m-primary-fg\);text-align:center/, "宣告条不得再借用前台 primary");
});

test("A-07 密度旋钮覆盖四类值", () => {
  const block = css.slice(css.indexOf('.stage-admin[data-density="productive"]'));
  for (const token of ["--m-card-padding", "--m-field-gap", "--m-body-leading", "--m-table-row-h-comfortable"])
    assert.ok(block.slice(0, 400).includes(token), `密度块缺 ${token}`);
  assert.match(doc14, /密度旋钮的作用域/, "14 章必须写明作用域");
});

test("A-08 深色主操作 hover 必须压暗（远离端点）", () => {
  const dark = css.slice(css.indexOf("SEMANTIC · Dark"), css.indexOf("LAYER 3 — COMPONENT"));
  const pick = (n) => {
    const m = dark.match(new RegExp(`--m-${n}:\\s*([^;]+);`));
    return m[1].trim();
  };
  const res = (v, seen = new Set()) => {
    const ref = v.match(/^var\(--m-([\w-]+)\)$/);
    return ref && !seen.has(ref[1]) ? res(defs.get(ref[1]), new Set([...seen, ref[1]])) : v;
  };
  const p = res(pick("primary"));
  const h = res(pick("primary-hover"));
  assert.ok(lum(h) < lum(p), "深色 hover 必须比 primary 更暗");
  assert.match(doc02, /远离当前端点/, "02 章方向规则必须是端点表述");
});

test("A-09 触达规则与 toolbar 4px 对齐", () => {
  assert.match(doc04, /toolbar 例外/, "04 章必须写明 tool 族例外");
  assert.match(doc04, /达标目标（≥24px）可 4px 并列/, "8px 规则必须有条件");
});

test("A-10 行高只允许 token（R16）+ 组合层已清干净", () => {
  const files = ["ai/site.css", "ai/admin.css", "design-system.html", ...readdirSync("prototypes").filter((f) => f.endsWith(".html")).map((f) => join("prototypes", f))];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /line-height:\s*[0-9]/, `${f} 仍有裸行高`);
  }
  assert.match(doc03, /R16/, "03 章必须登记 R16");
  const roles = Object.keys(json.typography.roles).filter((k) => k !== "$note");
  assert.equal(roles.length, 9);
  for (const role of roles) {
    assert.equal(String(json.typography.roles[role]), resolve(`leading-${role}`), `typography.roles.${role} 与 CSS 分叉`);
  }
});

test("A-11 reduced-motion 表述与实现一致", () => {
  assert.doesNotMatch(doc05, /进度类（骨架 shimmer、加载环）保留/, "不得再承诺保留进度动画");
  assert.match(doc05, /静态占位块/, "必须写明静态降级");
});

test("A-12 焦点环对比引对条款", () => {
  assert.doesNotMatch(doc02, /1\.4\.11 \/ 2\.4\.11/, "不得把 2.4.11 当对比条款");
  assert.match(doc02, /2\.4\.13/, "必须引 2.4.13（AAA 焦点外观）");
});

test("A-13 链接 hover 不得降低对比", () => {
  assert.ok(L("fg-link-hover") >= L("fg-link"), "hover 不得变浅");
  assert.match(ui, /text-decoration-thickness:\s*2px/, "hover 反馈必须由下划线加重承担");
  assert.match(ui, /:where\(p, \.m-prose\) a:not\(\.m-btn\):hover\s*\{[^}]*text-decoration-thickness:\s*2px/, "正文链接 hover 必须有更高特异性的加重规则");
  // 店面长文链接由 site.css 自持：组件层不得出现 sf-* 前缀（G-229 / W-05 层泄漏裁定）
  assert.match(site, /\.sf-prose a:not\(\.m-btn\):hover\s*\{[^}]*text-decoration-thickness:\s*2px/, "店面长文链接 hover 加重不得随层归位丢失");
});

test("A-15 大模态圆角口径与 token 一致", () => {
  assert.doesNotMatch(doc04, /2xl 24（前台大模态）/, "旧口径必须移除");
  assert.match(doc04, /xl 16（前台卡片、媒体、模态）/, "文档必须与 --m-modal-radius 对齐");
  assert.equal(resolve("modal-radius"), resolve("radius-xl"));
});

test("A-16 工具族标签 13px", () => {
  assert.match(ui, /\.m-tool\s*\{[^}]*font-size:\s*var\(--m-text-sm\)/, "tool 标签必须 13px");
});

test("A-17 无货 swatch 不再整体降透明", () => {
  assert.doesNotMatch(ui, /\.m-swatch\.is-oos\s*\{[^}]*opacity/, "不得用元素级 opacity");
  assert.match(ui, /\.m-swatch\.is-oos::before\s*\{[^}]*color-mix/, "只淡化色层");
  assert.match(ui, /\.m-swatch::before\s*\{[^}]*border:\s*1px solid var\(--m-border-strong\)/, "边框必须保持 border-strong 全强度");
});

test("A-18 状态族实底 hover/active 齐备", () => {
  for (const family of ["success", "info", "emphasis", "critical"]) {
    for (const state of ["hover", "active"]) {
      assert.ok(css.includes(`--m-${family}-solid-${state}:`), `缺 --m-${family}-solid-${state}`);
      const key = `${family}-solid-${state}`;
      assert.ok(json.color.semantic.light[key], `tokens.json light 缺 ${key}`);
      assert.ok(json.color.semantic.dark[key], `tokens.json dark 缺 ${key}`);
    }
  }
});

test("A-21 App Shell 使用 dvh", () => {
  assert.match(admin, /height:\s*100dvh/, "外壳必须声明 100dvh");
  assert.match(doc04, /100dvh/, "04 章必须有视口单位规则");
});

test("A-22 后台侧栏折叠口径：≤1024 统一 56px 图标轨", () => {
  assert.match(doc14, /≤1024px\*\*：56px 图标轨/, "14 章必须写 ≤1024 收 56px");
  assert.match(doc04, /≤1024 折叠为 56px 图标栏/, "04 章必须同口径");
  assert.match(admin, /@media \(max-width: 1023px\)\s*\{[^}]*\.ad-sidenav\s*\{\s*width:\s*56px/, "实现必须在 ≤1023 收 56px");
  assert.match(readFileSync("ai/meridian-ui.css", "utf8"), /\.m-shell__sidenav\s*\{\s*width:\s*56px/, ".m-shell 必须同口径");
  assert.doesNotMatch(doc14, /768–1023[^\n]*240px/, "不得再写 768–1023 保留 240px");
});

test("A-25…A-28 文档卫生", () => {
  assert.doesNotMatch(doc01, /Design System v1\.0/, "01 章不得再写版本戳");
  assert.match(doc01, /版本唯一来源：`ai\/tokens\.json`/, "必须指向唯一来源");
  assert.match(agents, /运行时唯一事实来源/, "AGENTS 必须统一事实来源");
  assert.doesNotMatch(agents, /tokens\.json` \(source of truth\)/, "不得再称 json 为 source of truth");
  assert.match(readme, /review-only/, "治理条款必须区分 review-only");
  assert.doesNotMatch(readme, /设计规范0913/, "文件地图根目录必须修正");
});

test("A-31 版本七源一致", () => {
  const v = json.$version;
  assert.equal(v, JSON.parse(readFileSync("package.json", "utf8")).version);
  assert.equal(JSON.parse(readFileSync("package-lock.json", "utf8")).version, v);
  assert.ok(readme.includes(`v${v}`));
  assert.match(css, new RegExp(`Design Tokens v${v.replace(/\./g, "\\.")}`));
  assert.match(ui, new RegExp(`参考组件库 v${v.replace(/\./g, "\\.")}`));
  assert.ok(readFileSync("design-system.html", "utf8").includes(`Design System v${v}`));
  assert.ok(changelog.includes(`## ${v}`));
});
