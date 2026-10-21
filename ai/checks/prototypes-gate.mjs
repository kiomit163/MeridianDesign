#!/usr/bin/env node
// G-224 同源与零裸值 + G-225 契约完备（specs/2026-10-21-archetype-prototypes）
// 用法：node ai/checks/prototypes-gate.mjs   （在 Meridian Design/ 仓根运行）exit 0=绿
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
for (const f of files) {
  const html = readFileSync(join(dir, f), "utf8");
  if (f !== "index.html") {
    if (!html.includes('href="../ai/tokens.css"')) fail.push(`G-224 ${f} 未引用 ../ai/tokens.css`);
    if (!html.includes('href="../ai/meridian-ui.css"')) fail.push(`G-224 ${f} 未引用 ../ai/meridian-ui.css`);
    if (!html.includes("对标卡：")) fail.push(`G-225 ${f} 缺对标卡标记`);
    if (/href\s*=\s*"[^"]*\.css"/.test(html.replace(/href="\.\.\/ai\/(tokens|meridian-ui)\.css"/g, ""))) fail.push(`G-224 ${f} 引用了白名单外的 CSS`);
  }
  const inline = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
  for (const s of inline) if (/#[0-9a-fA-F]{3,8}\b|rgb\(/.test(s)) fail.push(`G-224 ${f} <style> 内联裸色值`);
  for (const m of html.matchAll(/style="([^"]*)"/g)) if (/#[0-9a-fA-F]{3,8}\b|rgb\(/.test(m[1])) fail.push(`G-224 ${f} style= 内联裸色值: ${m[1].slice(0,60)}`);
  if (/lorem ipsum/i.test(html)) fail.push(`G-224 ${f} lorem ipsum 样例数据`);
}
if (!files.includes("02-dashboard.html") || !readFileSync(join(dir,"02-dashboard.html"),"utf8").includes("双稿：英雄指标") || !readFileSync(join(dir,"02-dashboard.html"),"utf8").includes("双稿：等分栅格")) fail.push("G-225 02-dashboard 双稿标记缺失");
if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log(`prototypes-gate: OK (${files.length} html)`);
