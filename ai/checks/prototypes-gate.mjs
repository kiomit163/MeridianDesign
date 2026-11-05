#!/usr/bin/env node
// G-224 同源与零裸值 + G-225 契约完备 + G-228 类允许清单与 role=alert 舞台政策
// + G-229 单一源 CSS 层扩面（specs/2026-10-21-archetype-prototypes / 2026-10-24-site-application）
// 用法：node ai/checks/prototypes-gate.mjs   （在 Meridian Design/ 仓根运行）exit 0=绿
//
// G-229 探针（site-application 片新增）：
// [扫描面] 类允许清单取 ai/ CSS 层闭合五件（tokens / brand-tokens / meridian-ui /
//   admin / site）的并集——三份新组合层因此在门内，缺任何一件即红。
// [前缀纪律] ad-* 只许后台原型 01-07 使用，sf-* 只许店面原型 08-11，互不引用。
// [动效守卫] site.css 的 .rv/.rv--fade 入场动画必须自带 prefers-reduced-motion 段。
//
// G-228 探针（prototype-application 片新增，机制在此定档）：
// [类允许清单] 每个原型的 class="..." token 必须能在 ai/meridian-ui.css 选择器里
//   找到定义（对 CSS 全文跑 \.([a-z][a-z0-9_-]*) 提取——本库类名全小写，够用；
//   注释里的 getPropertyValue 会被截成 get，只造成超集不会漏真类名），差集 > 0 即红。
//   CSS 无规则的原型本地结构类进显式允许清单 CLASS_ALLOW（登记须带来由注释）。
// [role=alert 舞台政策] 采用「per-file 白名单注释」机制（备选的「admin 也归零」被否：
//   01/03/05 的 alert 是签署契约里的合法 admin 反馈形态 m-banner--critical /
//   m-field__error，删改即动视觉契约）。规则：
//   - 店面原型 08-11：零 role="alert"（购物流程不打断）。
//   - admin 原型 01-07：允许，但文件内必须有 <!-- role-alert-allow: N --> 且 N 与
//     实际出现次数相等——有 alert 无注释、有注释无 alert、计数不符，三者均红。
//   - index.html（画廊）不参与本探针。
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = join(root, "prototypes");
const EXPECT = ["index.html","01-auth.html","02-dashboard.html","03-list.html","04-detail.html","05-form.html","06-builder.html","07-reports.html","08-home.html","09-plp.html","10-pdp.html","11-checkout.html"];
const fail = [];
for (const f of EXPECT) if (!existsSync(join(dir, f))) fail.push(`G-225 缺文件 ${f}`);
let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".html")); } catch { console.error("G-225 prototypes/ 目录不存在"); process.exit(1); }
// ---- G-228 探针基座 ----
// 类允许清单：ai/ CSS 层选择器类名全集 + 显式原型本地结构类。
// G-229 扩面：单一源的 CSS 层是闭合五件（tokens / brand-tokens / meridian-ui /
// admin / site）。舞台类在 tokens.css（.stage-admin / .stage-storefront），组件在
// meridian-ui.css（m-*），组合层分别持有 ad-* 与 sf-*。只扫 meridian-ui.css 会把
// 组合层与舞台类全判成"未定义"——纳管三份新文件的前提就是它们进门的扫描面。
const CSS_LAYER = ["tokens.css", "brand-tokens.css", "meridian-ui.css", "admin.css", "site.css"];
const cssClasses = new Set();
for (const name of CSS_LAYER) {
  const p = join(root, "ai", name);
  if (!existsSync(p)) { fail.push(`G-229 单一源缺 ai/${name}（CSS 层是闭合五件）`); continue; }
  for (const m of readFileSync(p, "utf8").matchAll(/\.([a-z][a-z0-9_-]*)/g)) cssClasses.add(m[1]);
}
const CLASS_ALLOW = new Set([
  // 组合层本地结构类的例外入口（当前为空）。登记必须带来由注释。
]);
const ALERT_FREE = new Set(["08-home.html","09-plp.html","10-pdp.html","11-checkout.html"]);
const ALERT_ADMIN = new Set(["01-auth.html","02-dashboard.html","03-list.html","04-detail.html","05-form.html","06-builder.html","07-reports.html"]);
for (const f of files) {
  const html = readFileSync(join(dir, f), "utf8");
  if (f !== "index.html") {
    // 白名单 = 闭合五件（G-229）：先剔除全部合法层，再查是否还有残留 CSS 引用。
    const deq = html.replace(/href\s*=\s*(["'])\.\.\/ai\/(tokens|brand-tokens|meridian-ui|admin|site)\.css\1/g, "");
    if (!/href\s*=\s*(["'])\.\.\/ai\/tokens\.css\1/.test(html)) fail.push(`G-224 ${f} 未引用 ../ai/tokens.css`);
    if (!/href\s*=\s*(["'])\.\.\/ai\/meridian-ui\.css\1/.test(html)) fail.push(`G-224 ${f} 未引用 ../ai/meridian-ui.css`);
    if (html.indexOf("对标卡：") > 400) fail.push(`G-225 ${f} 对标卡不在头部区（须在前 400 字符内）`);
    if (/href\s*=\s*("[^"]*\.css"|'[^']*\.css')/.test(deq)) fail.push(`G-224 ${f} 引用了白名单外的 CSS`);
  }
  const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|color-mix|oklch|lab)\(|\b(?:red|blue|green|white|black|gray|grey|orange|purple|pink|brown|cyan|magenta|silver|gold)\b(?=\s*[;,)])/;
  const inline = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
  for (const s of inline) if (COLOR.test(s)) fail.push(`G-224 ${f} <style> 内联裸色值`);
  for (const m of html.matchAll(/style\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const v = m[1] ?? m[2];
    if (COLOR.test(v)) fail.push(`G-224 ${f} style= 内联裸色值: ${v.slice(0,60)}`);
  }
  if (/lorem ipsum/i.test(html)) fail.push(`G-224 ${f} lorem ipsum 样例数据`);
  // G-228 探针 A：类允许清单（class token ∉ ai/ CSS 层且 ∉ CLASS_ALLOW 即红）
  // G-229 探针 A：命名前缀纪律（ad- 仅后台 01-07、sf- 仅店面 08-11，互不引用）
  const ADMIN_PROTO = /^0[1-7]-/, STORE_PROTO = /^(?:0[89]|1[01])-/;
  for (const m of html.matchAll(/class\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    for (const tok of (m[1] ?? m[2]).split(/\s+/)) {
      if (!tok) continue;
      if (!cssClasses.has(tok) && !CLASS_ALLOW.has(tok)) fail.push(`G-228 ${f} 类 .${tok} 未在 ai/ CSS 层定义且不在允许清单`);
      if (STORE_PROTO.test(f) && tok.startsWith("ad-")) fail.push(`G-229 ${f} 店面原型引用后台组合层类 .${tok}`);
      if (ADMIN_PROTO.test(f) && tok.startsWith("sf-")) fail.push(`G-229 ${f} 后台原型引用店面组合层类 .${tok}`);
    }
  }
  // G-228 探针 B：role="alert" 舞台政策（机制见文件头注释）
  if (ALERT_FREE.has(f) || ALERT_ADMIN.has(f)) {
    const n = (html.match(/role\s*=\s*(?:"alert"|'alert')/g) || []).length;
    const allow = html.match(/<!--\s*role-alert-allow:\s*(\d+)\s*-->/);
    if (ALERT_FREE.has(f) && n > 0) fail.push(`G-228 ${f} 店面原型含 ${n} 处 role="alert"（政策：店面零 alert）`);
    if (ALERT_ADMIN.has(f)) {
      if (n > 0 && !allow) fail.push(`G-228 ${f} 含 ${n} 处 role="alert" 但缺 <!-- role-alert-allow: N --> 白名单注释`);
      else if (n === 0 && allow) fail.push(`G-228 ${f} 白名单注释声明 ${allow[1]} 处但实际 0 处（删注释或补齐 alert）`);
      else if (allow && Number(allow[1]) !== n) fail.push(`G-228 ${f} 白名单注释声明 ${allow[1]} 处 ≠ 实际 ${n} 处`);
    }
  }
}
// G-230 探针（2.6）：店面影像存在性。R12 只判"已存在的 <img> 是否有内在尺寸"，
// 零 <img> 的店面页会让它空转报绿——缺图不是合规，而是影像契约整段未测。
// 图片是电商视觉的主体：08-11 每页至少一张真实 <img>（hero / 商品卡 / 图组 / 购物车行项）。
const STOREFRONT_MEDIA = ["08-home.html", "09-plp.html", "10-pdp.html", "11-checkout.html"];
for (const f of STOREFRONT_MEDIA) {
  if (!existsSync(join(dir, f))) continue; // G-225 已报缺文件
  const html = readFileSync(join(dir, f), "utf8");
  if (!/<img\b/i.test(html)) fail.push(`G-230 ${f} 零 <img>：R12 空转，店面影像契约未测`);
}

// G-229 探针 B：组合层自有入场动效的 reduced-motion 守卫
const siteCss = existsSync(join(root, "ai", "site.css")) ? readFileSync(join(root, "ai", "site.css"), "utf8") : "";
if (/\.rv\b/.test(siteCss) && !/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/.test(siteCss))
  fail.push("G-229 ai/site.css 的 .rv 入场动效缺 prefers-reduced-motion 守卫");
if (!files.includes("02-dashboard.html") || !readFileSync(join(dir,"02-dashboard.html"),"utf8").includes("双稿：英雄指标") || !readFileSync(join(dir,"02-dashboard.html"),"utf8").includes("双稿：等分栅格")) fail.push("G-225 02-dashboard 双稿标记缺失");
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log(`prototypes-gate: OK (${files.length} html)`);
