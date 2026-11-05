#!/usr/bin/env node
/**
 * 本地化内容门禁（真实语言包灌稿，Chrome CDP 实测）。
 * 与 runtime-a11y 的 [rtl] 区别：那里只翻转 dir（版面镜像），这里替换 UI 文案本身，
 * 检查「内容变长 / 连写文字」后是否仍在 320/375px 内不溢出、不截断、字距不拆连写。
 * 文案来自 i18n/*.json（TMS 同步的真实语言包），并额外跑伪本地化 en-XA（+35% 膨胀）。
 * 用法：npm run l10n
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildPseudo } from "../i18n/pseudo.mjs";
import { launch, root } from "./lib/cdp.mjs";

const PAGES = [
  "design-system.html",
  "prototypes/09-plp.html",
  "prototypes/10-pdp.html",
  "prototypes/11-checkout.html",
  "prototypes/02-dashboard.html",
];
const WIDTHS = [320, 375];

function matchBrace(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/* ICU 占位符替换成示例数字，保留周围的自然语言长度 */
function fillIcu(message) {
  let out = "";
  for (let i = 0; i < message.length; i++) {
    if (message[i] === "{") {
      const end = matchBrace(message, i);
      if (end > i) { out += "3"; i = end; continue; }
    }
    out += message[i];
  }
  return out;
}

const readCatalogue = (file) => JSON.parse(readFileSync(resolve(root, "i18n", file), "utf8"));
const stringsOf = (catalogue) => Object.entries(catalogue)
  .filter(([k, v]) => !k.startsWith("$") && typeof v === "string")
  .map(([, v]) => fillIcu(v));

const LOCALES = [
  { lang: "ar", dir: "rtl", label: "阿拉伯语 RTL（i18n/ar.json）", strings: stringsOf(readCatalogue("ar.json")) },
  { lang: "de", dir: "ltr", label: "德语 LTR（i18n/de.json）", strings: stringsOf(readCatalogue("de.json")) },
  { lang: "en-XA", dir: "ltr", label: "伪本地化 en-XA（+35% 膨胀）", strings: stringsOf(buildPseudo(readCatalogue("en.json"))) },
];

const injectSource = (words) => `(() => {
  const SEL = 'header, footer, nav, button, .m-topbar, .m-sidenav, .m-badge, .m-chip, .m-tab, .m-seg, .m-crumb, .m-crumbs, .m-card__header, .m-table thead, .m-pagehead, .m-toast';
  const words = ${JSON.stringify(words)};
  let n = 0, i = 0;
  for (const host of document.querySelectorAll(SEL)) {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const p = node.parentElement;
      if (!p || p.closest('svg, script, style, .m-skip-link')) continue;
      if (node.nodeValue.trim().length < 2) continue;
      node.nodeValue = words[i++ % words.length];
      n++;
    }
  }
  return n;
})()`;

const MEASURE = `(() => {
  const vw = innerWidth, sw = document.documentElement.scrollWidth;
  const clipped = [...document.querySelectorAll('a, button, .m-badge, .m-chip, .m-tab, .m-seg button, .m-topbar *, .sf-nav a')]
    .filter((el) => {
      if (!el.getClientRects().length) return false;
      if (el.scrollWidth <= el.clientWidth + 1) return false;
      const cs = getComputedStyle(el);
      return cs.overflowX === 'visible' && cs.whiteSpace === 'nowrap';
    })
    .slice(0, 8)
    .map((el) => el.tagName + '.' + String(el.className).slice(0, 28) + ' ' + el.scrollWidth + '>' + el.clientWidth);
  const spacing = [...document.querySelectorAll('header *, footer *, nav *, button')]
    .filter((el) => { const ls = getComputedStyle(el).letterSpacing; return ls !== 'normal' && parseFloat(ls) !== 0; })
    .slice(0, 5)
    .map((el) => String(el.className).slice(0, 24) + ':' + getComputedStyle(el).letterSpacing);
  const scrollable = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  const dir = getComputedStyle(document.body).direction;
  const spill = [...document.querySelectorAll('body *')]
    .filter((el) => {
      if (!el.getClientRects().length || scrollable(el)) return false;
      const r = el.getBoundingClientRect();
      return dir === 'rtl' ? (r.left < -1 || r.right > innerWidth + 1) : r.right > innerWidth + 1;
    })
    .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)
    .slice(0, 5)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return el.tagName + '.' + String(el.className).slice(0, 22) + '@' + Math.round(r.left) + '+' + Math.round(r.width) + '→' + Math.round(r.right) +
        '‹' + String(el.parentElement && el.parentElement.className).slice(0, 18);
    });
  return { vw, sw, clipped, spacing, dir, spill };
})()`;

const cdp = await launch({ port: 9338 });
let failures = 0;
let checks = 0;
function check(name, ok, detail = "") {
  checks++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
}

try {
  for (const page of PAGES) {
    console.log(`\n${page}`);
    for (const run of LOCALES) {
      await cdp.navigate(page);
      await cdp.evaluate(`document.documentElement.lang = ${JSON.stringify(run.lang)}; document.documentElement.dir = ${JSON.stringify(run.dir)};`);
      const injected = await cdp.evaluate(injectSource(run.strings));
      check(`${run.label} · 注入真实文案`, injected > 15, `${injected} 个文本节点 / ${run.strings.length} 条语言包`);

      for (const w of WIDTHS) {
        await cdp.viewport(w, 800);
        const m = await cdp.evaluate(MEASURE);
        check(`${run.label} · ${w}px 无横向溢出`, m.sw <= m.vw + 1, `${m.sw} vs ${m.vw} ${m.spill.join(" | ")}`);
        check(`${run.label} · ${w}px 控件文字不被截断`, m.clipped.length === 0, m.clipped.join(" | "));
        if (run.lang === "ar") {
          check(`${run.label} · ${w}px 方向翻转`, m.dir === "rtl", m.dir);
          check(`${run.label} · ${w}px 无字距破坏连写`, m.spacing.length === 0, m.spacing.join(" | "));
        }
      }
      await cdp.viewport(null);
    }
  }
} finally {
  await cdp.close();
}

console.log(`\nl10n: ${failures ? "FAIL" : "PASS"} (${checks} checks, ${failures} failing)`);
process.exit(failures ? 1 : 0);
