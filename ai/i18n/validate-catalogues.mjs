#!/usr/bin/env node
/**
 * 语言包门禁（零依赖）：把「翻译语义」中可自动判定的部分穷举掉。
 * 规则来源：i18n/qa-rules.json + i18n/glossary.csv（TMS 与本地共用同一份规则）。
 * 检查项：
 *   1. key 对齐（缺 key / 多 key / 空值）
 *   2. ICU 占位符一致（含 {count, plural, …} 的变量名）
 *   3. 复数类别合法且含 other（按语言的 CLDR 允许集合）
 *   4. 控件文案长度预算（相对英文的膨胀上限）
 *   5. 禁用片段 / 首尾空白
 *   6. 不译术语（glossary translate=false）保持原文
 * 用法：node ai/i18n/validate-catalogues.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const DIR = resolve(ROOT, "i18n");
const SOURCE = "en";

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const rules = readJson(resolve(DIR, "qa-rules.json"));
const source = readJson(resolve(DIR, `${SOURCE}.json`));
const locales = readdirSync(DIR)
  .filter((f) => f.endsWith(".json") && !["qa-rules.json"].includes(f))
  .map((f) => f.replace(/\.json$/, ""))
  .filter((l) => l !== SOURCE);

const IGNORE = new Set(rules.ignoreKeys || []);
const keys = Object.keys(source).filter((k) => !IGNORE.has(k));

function matchBrace(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

function parseMessage(msg) {
  const vars = [];
  const plurals = [];
  for (let i = 0; i < msg.length; i++) {
    if (msg[i] !== "{") continue;
    const end = matchBrace(msg, i);
    if (end < 0) break;
    const inner = msg.slice(i + 1, end);
    const name = inner.split(",")[0].trim();
    vars.push(name);
    if (/^\s*[\w.]+\s*,\s*plural\s*,/.test(inner)) plurals.push({ name, categories: pluralCategories(inner) });
    i = end;
  }
  return { vars, plurals };
}

function pluralCategories(inner) {
  const at = inner.toLowerCase().indexOf("plural");
  let i = inner.indexOf(",", at) + 1;
  const cats = [];
  let depth = 0;
  while (i < inner.length) {
    if (inner[i] === "{") { depth++; i++; continue; }
    if (inner[i] === "}") { depth--; i++; continue; }
    if (depth === 0) {
      const m = inner.slice(i).match(/^\s*([a-zA-Z]+)\s*\{/);
      if (m) { cats.push(m[1]); i += m[0].length; depth++; continue; }
    }
    i++;
  }
  return cats;
}

const glossary = readFileSync(resolve(DIR, "glossary.csv"), "utf8")
  .split(/\r?\n/).slice(1).filter(Boolean)
  .map((line) => line.split(","))
  .filter(([term, translate]) => term && translate === "false")
  .map(([term]) => term);

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`); };

for (const locale of locales) {
  const target = readJson(resolve(DIR, `${locale}.json`));
  const label = `${locale}.json`;
  if (target.$locale !== locale) fail(`${label} $locale 应为 ${locale}`);

  const targetKeys = Object.keys(target).filter((k) => !IGNORE.has(k));
  for (const k of keys) if (!(k in target)) fail(`${label} 缺 key: ${k}`);
  for (const k of targetKeys) if (!(k in source)) fail(`${label} 多出 key: ${k}`);
  for (const k of targetKeys) {
    if (typeof target[k] !== "string" || !target[k].trim()) fail(`${label} ${k} 为空`);
  }

  const allowed = rules.allowedPluralCategories[locale];
  for (const k of keys) {
    const src = source[k];
    const dst = target[k];
    if (typeof dst !== "string") continue;

    const a = parseMessage(src), b = parseMessage(dst);
    const av = [...new Set(a.vars)].sort().join(",");
    const bv = [...new Set(b.vars)].sort().join(",");
    if (av !== bv) fail(`${label} ${k} 占位符不一致：源 {${av || "-"}} / 译 {${bv || "-"}}`);

    if (a.plurals.length !== b.plurals.length) {
      fail(`${label} ${k} 复数结构不一致（源 ${a.plurals.length} / 译 ${b.plurals.length}）`);
    } else {
      for (let i = 0; i < a.plurals.length; i++) {
        const cats = b.plurals[i].categories;
        if (!cats.includes("other")) fail(`${label} ${k} 复数缺 other`);
        for (const c of cats) if (!allowed.includes(c)) fail(`${label} ${k} 复数类别 ${c} 不属于 ${locale}（允许 ${allowed.join("/")}）`);
      }
    }

    if (/^\s|\s$/.test(dst)) fail(`${label} ${k} 首尾有空白`);
    for (const bad of rules.forbidden || []) if (dst.includes(bad)) fail(`${label} ${k} 含禁用片段 ${JSON.stringify(bad)}`);

    const budget = rules.lengthBudgets[locale];
    /* 复数消息的长度随 CLDR 类别数变化（阿拉伯语 6 类），不参与膨胀预算 */
    if (budget && a.plurals.length === 0) {
      const srcLen = [...src].length;
      const max = Math.ceil(srcLen * budget.ratio) + budget.slack;
      if ([...dst].length > max) fail(`${label} ${k} 超长：${[...dst].length} > ${max}（源 ${srcLen}）`);
    }

    for (const term of glossary) if (src.includes(term) && !dst.includes(term)) fail(`${label} ${k} 丢失不译术语「${term}」`);
  }
  console.log(`PASS  ${label}（${targetKeys.length} keys）`);
}

if (failures) {
  console.log(`\ni18n: FAIL (${failures} problems)`);
  process.exit(1);
}
console.log(`\ni18n: PASS (${locales.length} locales × ${keys.length} keys)`);
