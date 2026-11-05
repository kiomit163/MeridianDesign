#!/usr/bin/env node
/**
 * AX 树快照门禁（Chrome CDP Accessibility.getFullAXTree，零 Playwright）。
 * 读屏软件读的是浏览器的 accessibility tree；这里把「可朗读输入」冻结成基线：
 *   role / name / 状态（checked/selected/expanded/disabled/level）/ 朗读属性（live/atomic/relevant）
 * 任何名称或角色变化都会让 diff 变红，必须显式更新基线并说明原因。
 * 用法：
 *   node ai/selfcheck/runtime-ax.mjs           比对基线（CI）
 *   node ai/selfcheck/runtime-ax.mjs --update  重建基线
 * 注意：AX 树随 Chrome 版本演化；基线以 CI 使用的 Chrome 为准，跨版本升级时重跑 --update 并审阅 diff。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { launch, root } from "./lib/cdp.mjs";

const DIR = resolve(root, "ai/selfcheck/ax");
const UPDATE = process.argv.includes("--update");

const SCENARIOS = [
  { page: "design-system.html", name: "default" },
  {
    page: "design-system.html", name: "drawer",
    setup: `(() => { const b = document.querySelector('[data-overlay-open="drawer"]'); b.focus(); b.click(); })()`,
    wait: 120,
  },
  {
    page: "design-system.html", name: "dialog",
    setup: `(() => { const b = [...document.querySelectorAll('button')].find(x => /dlg2/.test(x.getAttribute('onclick') || '')); b.focus(); b.click(); })()`,
    wait: 120,
  },
  {
    page: "design-system.html", name: "combobox",
    scope: "[data-combobox]",
    setup: `(() => { const i = document.querySelector('[data-combobox] input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); })()`,
    wait: 80,
  },
  {
    page: "design-system.html", name: "live-regions",
    roles: ["status", "alert"],
    setup: `(() => { showToast('已保存'); })()`,
    wait: 250,
  },
  { page: "prototypes/09-plp.html", name: "default" },
  { page: "prototypes/10-pdp.html", name: "default" },
  { page: "prototypes/11-checkout.html", name: "default" },
  { page: "prototypes/02-dashboard.html", name: "default" },
];

const ROLES = new Set([
  "banner", "main", "contentinfo", "navigation", "complementary", "region", "form", "search",
  "heading", "button", "link", "textbox", "combobox", "listbox", "option",
  "checkbox", "radio", "switch", "tab", "tablist", "dialog", "menu", "menuitem",
  "status", "alert", "alertdialog", "table", "row", "columnheader",
]);

const STATES = ["checked", "selected", "expanded", "disabled", "required", "level", "live", "atomic", "relevant", "busy"];

function normalize(nodes, all = nodes) {
  const byId = new Map(all.map((n) => [n.nodeId, n]));
  /* live region 的可朗读内容在子树文本里，不在 name 上（role=status 的 name 通常为空） */
  const textOf = (n) => {
    const parts = [];
    const seen = new Set();
    const walk = (x, depth) => {
      if (!x || seen.has(x.nodeId) || depth > 12) return;
      seen.add(x.nodeId);
      const role = x.role && x.role.value;
      /* 只取 StaticText：同一段文字还会以 InlineTextBox / 链接名称重复出现 */
      if (!x.ignored && role === "StaticText" && x.name && x.name.value) parts.push(x.name.value);
      for (const id of x.childIds || []) walk(byId.get(id), depth + 1);
    };
    walk(n, 0);
    return parts.join(" ").replace(/\s+/g, " ").trim();
  };
  const out = [];
  for (const n of nodes) {
    if (n.ignored) continue;
    const role = n.role && n.role.value;
    if (!ROLES.has(role)) continue;
    const name = String((n.name && n.name.value) || "").replace(/\s+/g, " ").trim();
    const landmark = ["banner", "main", "contentinfo", "navigation", "region", "form", "search", "dialog"].includes(role);
    const live = role === "status" || role === "alert";
    const node = { role, name };
    if (live) {
      const text = textOf(n);
      if (text) node.text = text;
    }
    if (!name && !node.text && !landmark && role !== "combobox" && role !== "textbox") continue;
    for (const p of n.properties || []) {
      if (!STATES.includes(p.name)) continue;
      const v = p.value && p.value.value;
      if (v === undefined || v === false || v === "") continue;
      node[p.name] = v;
    }
    out.push(node);
    if (out.length >= 1000) break;
  }
  return out;
}

function diff(expected, actual) {
  const diffs = [];
  const max = Math.max(expected.length, actual.length);
  for (let i = 0; i < max && diffs.length < 8; i++) {
    const a = expected[i], b = actual[i];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diffs.push({ i, expected: a ?? null, actual: b ?? null });
    }
  }
  return diffs;
}

const cdp = await launch({ port: 9340 });
let failures = 0;
try {
  await cdp.send("Accessibility.enable");
  await cdp.send("DOM.enable");
  for (const sc of SCENARIOS) {
    const file = resolve(root, sc.page);
    await cdp.navigate(sc.page);
    if (sc.setup) {
      await cdp.evaluate(sc.setup);
      await cdp.evaluate(`new Promise(r => setTimeout(r, ${sc.wait || 80}))`, true);
    }
    const tree = sc.scope
      ? await (async () => {
          const { root: doc } = await cdp.send("DOM.getDocument", { depth: 0 });
          const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: doc.nodeId, selector: sc.scope });
          if (!nodeId) throw new Error(`scope not found: ${sc.scope}`);
          const { node } = await cdp.send("DOM.describeNode", { nodeId });
          const full = await cdp.send("Accessibility.getFullAXTree");
          const kids = new Map();
          for (const n of full.nodes) {
            if (!n.parentId) continue;
            if (!kids.has(n.parentId)) kids.set(n.parentId, []);
            kids.get(n.parentId).push(n);
          }
          const seen = new Set();
          const picked = [];
          const walk = (n) => {
            if (!n || seen.has(n.nodeId)) return;
            seen.add(n.nodeId);
            picked.push(n);
            for (const c of kids.get(n.nodeId) || []) walk(c);
          };
          full.nodes.filter((n) => n.backendDOMNodeId === node.backendNodeId).forEach(walk);
          return { nodes: picked, all: full.nodes };
        })()
      : await cdp.send("Accessibility.getFullAXTree");
    if (sc.roles) {
      tree.scoped = tree.nodes.filter((n) => sc.roles.includes(n.role && n.role.value));
    }
    const nodes = normalize(tree.scoped || tree.nodes, tree.all || tree.nodes);
    const key = `${sc.page.replace(/\.html$/, "").replace(/\//g, "__")}--${sc.name}`;
    const filePath = resolve(DIR, `${key}.json`);
    const snapshot = { page: sc.page, scenario: sc.name, count: nodes.length, nodes };

    if (UPDATE || !existsSync(filePath)) {
      mkdirSync(DIR, { recursive: true });
      writeFileSync(filePath, JSON.stringify(snapshot, null, 2) + "\n");
      console.log(`WROTE  ${key}.json (${nodes.length} nodes)`);
      continue;
    }
    const expected = JSON.parse(readFileSync(filePath, "utf8"));
    const d = diff(expected.nodes, nodes);
    if (d.length || expected.count !== nodes.length) {
      failures++;
      console.log(`FAIL   ${key} — 基线 ${expected.count} 节点 / 当前 ${nodes.length} 节点`);
      for (const item of d) {
        console.log(`       #${item.i} 期望 ${JSON.stringify(item.expected)}`);
        console.log(`       #${item.i} 实际 ${JSON.stringify(item.actual)}`);
      }
    } else {
      console.log(`PASS   ${key} (${nodes.length} nodes)`);
    }
  }
} finally {
  await cdp.close();
}

if (!UPDATE && failures) {
  console.log(`\nax: FAIL (${failures} scenarios drifted) — 审阅后运行 node ai/selfcheck/runtime-ax.mjs --update 更新基线`);
  process.exit(1);
}
console.log(UPDATE ? "\nax: baseline updated" : "\nax: PASS (all snapshots match)");
process.exit(0);
