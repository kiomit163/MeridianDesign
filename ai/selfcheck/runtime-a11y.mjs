#!/usr/bin/env node
/**
 * O4 runtime a11y harness（axe-core + Chrome CDP，零 Playwright 依赖）。
 * 用法：npm run a11y  （需要本机 Chrome/Chromium；CI 用 setup-chrome）
 * 覆盖：design-system + 5 个关键原型；WCAG 2.0/2.1/2.2 A/AA；320px 无横向滚动；dir=rtl 镜像。
 * 键盘路径与焦点管理见 runtime-behavior.mjs；本地化膨胀见 runtime-l10n.mjs。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { launch, root, sleep } from "./lib/cdp.mjs";

const axeSource = readFileSync(resolve(root, "node_modules/axe-core/axe.min.js"), "utf8");

const PAGES = [
  "design-system.html",
  "prototypes/08-home.html",
  "prototypes/09-plp.html",
  "prototypes/10-pdp.html",
  "prototypes/11-checkout.html",
  "prototypes/02-dashboard.html",
];

let failed = false;
const summary = [];
const cdp = await launch({ port: 9336 });
try {
  for (const rel of PAGES) {
    await cdp.navigate(rel);
    await cdp.evaluate(axeSource);
    const results = await cdp.evaluate(`axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"] },
      resultTypes: ["violations"]
    }).then(r => r.violations.map(v => ({
      id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help,
      targets: v.nodes.slice(0, 12).map(n => n.target.join(" ")),
      detail: v.nodes.slice(0, 3).map(n => n.failureSummary)
    })))`, true);
    const blocking = results.filter((v) => v.impact === "serious" || v.impact === "critical");
    if (blocking.length) failed = true;
    summary.push({ page: rel, violations: results.map(({ id, impact, nodes, help }) => ({ id, impact, nodes, help })), blocking: blocking.length });
    console.log(`\n${rel}: ${blocking.length ? "FAIL" : "PASS"}`);
    for (const v of results) {
      console.log(`  [${v.impact}] ${v.id} ×${v.nodes} — ${v.help}`);
      if (v.impact === "serious" || v.impact === "critical") {
        for (const t of v.targets) console.log(`      ${t}`);
      }
    }

    /* 购买箱同排基线（O25）：步进器外框必须与 52px CTA 等高，且 −/输入/+
       三段必须填满外框内容区。只拉伸外框会让内部控件停在 44px，形成 4px 空带。 */
    if (rel === "prototypes/10-pdp.html") {
      const buyrow = await cdp.evaluate(`(() => {
        const row = document.querySelector('.sf-buyrow');
        if (!row) return null;
        const stepper = row.querySelector('.m-stepper');
        const cta = row.querySelector('.m-btn--cta');
        if (!stepper || !cta) return { incomplete: true };
        const h = (el) => Math.round(el.getBoundingClientRect().height * 100) / 100;
        const cs = getComputedStyle(stepper);
        const inner = Math.round((h(stepper) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth)) * 100) / 100;
        return { frame: h(stepper), cta: h(cta), inner, kids: [...stepper.querySelectorAll('button, input')].map(h) };
      })()`);
      const bad = !buyrow || buyrow.incomplete
        || Math.abs(buyrow.frame - buyrow.cta) > 0.5
        || buyrow.kids.some((k) => Math.abs(k - buyrow.inner) > 0.5);
      if (bad) {
        failed = true;
        console.log(`  [buyrow] FAIL ${JSON.stringify(buyrow)}`);
      } else {
        console.log(`  [buyrow] PASS frame=${buyrow.frame} cta=${buyrow.cta} segments=${buyrow.kids.join("/")}`);
      }
    }

    /* 移动端输入地板（V-10）：≤767px 下输入族实高必须 ≥44px、字号必须 ≥16px。
       这两条都在 tokens.css 的 MOBILE FORM FLOOR 里定义，页面若用内联 style 顶掉
       --m-input-h / --m-input-font（静态稿里发生过），只有计算样式能发现。 */
    await cdp.viewport(375, 800);
    await sleep(150);
    const floor = await cdp.evaluate(`(() => {
      const els = [...document.querySelectorAll('.m-input, .m-textarea, .m-select-wrap select')]
        .filter(el => el.getClientRects().length);
      return {
        n: els.length,
        tokenH: getComputedStyle(document.documentElement).getPropertyValue('--m-input-h').trim(),
        bad: els.map(el => {
          const h = Math.round(el.getBoundingClientRect().height);
          const fs = Math.round(parseFloat(getComputedStyle(el).fontSize) * 100) / 100;
          return (h < 44 || fs < 16) ? el.tagName + '.' + String(el.className).slice(0, 22) + ' h=' + h + ' fs=' + fs : null;
        }).filter(Boolean)
      };
    })()`);
    if (floor.bad.length) {
      failed = true;
      console.log(`  [mobile-floor] FAIL n=${floor.n} token=${floor.tokenH} 违规=${floor.bad.join(" | ")}`);
    } else {
      console.log(`  [mobile-floor] PASS ${floor.n} 个输入件 ≥44px/16px（--m-input-h=${floor.tokenH}）`);
    }

    /* 触控地板（O16）：`.m-size-pill` 承诺 44×44（docs/04 行内可点项）。09 与 design-system
       曾用内联 height:36px 顶掉——axe 的 2.5.8 只保 24px 底线，比自我承诺低 20px。 */
    const pills = await cdp.evaluate(`(() => {
      const els = [...document.querySelectorAll('.m-size-pill')].filter(el => el.getClientRects().length);
      return {
        n: els.length,
        bad: els.map(el => {
          const r = el.getBoundingClientRect();
          return (r.width < 44 || r.height < 44) ? Math.round(r.width) + '×' + Math.round(r.height) : null;
        }).filter(Boolean)
      };
    })()`);
    if (pills.bad.length) {
      failed = true;
      console.log(`  [touch-target] FAIL n=${pills.n} 违规=${pills.bad.join(" | ")}`);
    } else if (pills.n) {
      console.log(`  [touch-target] PASS ${pills.n} 个尺码胶囊 ≥44×44`);
    }

    // 320px reflow（axe 不覆盖 1.4.10）
    await cdp.viewport(320, 800);
    await sleep(120);
    const reflow = await cdp.evaluate(`(() => {
      const offenders = [...document.querySelectorAll('body *')]
        .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 8)
        .map(el => el.tagName + '.' + String(el.className).slice(0, 48));
      return { vw: innerWidth, sw: document.documentElement.scrollWidth, offenders };
    })()`);
    if (reflow.sw > reflow.vw + 1) {
      failed = true;
      console.log(`  [reflow] FAIL ${reflow.sw} > ${reflow.vw} ${reflow.offenders.join(" | ")}`);
    } else {
      console.log(`  [reflow] PASS ${reflow.sw} <= ${reflow.vw}`);
    }

    // RTL 镜像（原型内容仍为 LTR，但组合层必须能在 dir=rtl 下翻转）
    await cdp.evaluate(`document.documentElement.setAttribute('dir', 'rtl')`);
    await sleep(120);
    const rtl = await cdp.evaluate(`(() => {
      const tips = [...document.querySelectorAll('.m-tooltip')].map((t) => {
        const tip = t.querySelector('.tip');
        const a = t.getBoundingClientRect(), b = tip.getBoundingClientRect();
        return Math.abs((a.left + a.right) - (b.left + b.right)) / 2;
      });
      const navOrigin = [...document.querySelectorAll('.sf-nav a')].slice(0, 1)
        .map((a) => getComputedStyle(a, '::after').transformOrigin.split(' ')[0]);
      const offenders = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().left < -1)
        .slice(0, 6)
        .map((el) => el.tagName + '.' + String(el.className).slice(0, 40) + '@' + Math.round(el.getBoundingClientRect().left));
      return { sw: document.documentElement.scrollWidth, vw: innerWidth, tips, navOrigin, offenders };
    })()`);
    const rtlOverflow = rtl.sw > rtl.vw + 1;
    const tipOff = rtl.tips.filter((d) => d > 1);
    const navBad = rtl.navOrigin.filter((o) => o !== "100%");
    if (rtlOverflow || tipOff.length || navBad.length) {
      failed = true;
      console.log(`  [rtl] FAIL overflow=${rtlOverflow ? rtl.sw : 0} tooltipOff=${tipOff.map((d) => d.toFixed(1)).join(",") || "-"} navOrigin=${rtl.navOrigin.join(",") || "-"} ${rtl.offenders.join(" | ")}`);
    } else {
      console.log(`  [rtl] PASS ${rtl.sw} <= ${rtl.vw} tooltip=${rtl.tips.length} nav=${rtl.navOrigin.length}`);
    }
    await cdp.evaluate(`document.documentElement.removeAttribute('dir')`);
    await cdp.viewport(null);
  }
  console.log(`\na11y: ${failed ? "FAIL" : "PASS"} (${PAGES.length} pages)`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await cdp.close();
}
process.exit(failed ? 1 : 0);
