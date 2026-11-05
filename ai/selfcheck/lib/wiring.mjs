/**
 * G-231 反向接线门的度量内核（CSS 声明 → 屏幕消费）。
 *
 * 与 `ai/checks/prototypes-gate.mjs` 的 G-228 互为两面：
 *   正向（已有）：原型里写的每个 class token 必须在 `ai/` CSS 层有定义，否则红——防"用不存在的类"。
 *   反向（本文件）：`ai/` CSS 层声明的每个类必须被某个屏幕消费，否则记为**死类**——防"声明了没人调用"。
 * 正向门只挡新增，反向门才计量存量；两者缺一，"契约规模"就还是自述数字（评审 C1 类缺陷）。
 *
 * 解析一律复用 `lib/parse-css`（全仓唯一的 CSS 解析）与 `lib/parse-markup` 的 `classTokens`，
 * 不在此重实现选择器切分——否则门的判定与规则引擎的判定会各算一套（v1 假绿的成因）。
 *
 * 已知边界（诚实登记，不作扩大解释）：
 * - 消费判定是**字符串级**的：`class="sf-hero"` 出现在任意签署屏源码里即算消费。占位式的假接线
 *   （隐藏节点里挂个类名）由 `runtime-behavior.mjs` 的真实 DOM/计算样式断言承担（计划 2.2 的验收列）。
 * - 模板拼接的类名（`` class={`ad-cell--${kind}`} ``）按 `ai/AGENTS.md §8` 的零依赖定价**不解析**，
 *   因此这类类会落在死类里——账本必须逐名登记，就是为了让人看见并纠正这种误判，而不是让它自动放行。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCss } from "../../lib/parse-css.mjs";
import { classTokens } from "../../lib/parse-markup.mjs";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rd = (rel) => readFileSync(join(root, rel), "utf8");

/** CSS 层扫描面 = 单一源闭合五件（与 G-229 同一集合，两面门共用一个类宇宙）。 */
export const CSS_LAYER = ["ai/tokens.css", "ai/brand-tokens.css", "ai/meridian-ui.css", "ai/admin.css", "ai/site.css"];

/** 每层的自有命名空间：层"拥有"的类。跨层引用的类（如 admin.css 里覆写 `.m-container--wide`）
 *  仍按声明所在文件计入该层的 defs，但不计入该层的自有接线率——否则组合层可以靠覆写组件层刷接线率。 */
export const OWN = {
  "ai/tokens.css": /^(?:stage-|theme-)/,
  "ai/brand-tokens.css": /^(?:brand-)/,
  "ai/meridian-ui.css": /^m-/,
  "ai/admin.css": /^ad-/,
  "ai/site.css": /^sf-/,
};

/** 消费侧：13 张签署屏 + 演示页 + 出厂的行为层。
 *  `ai/meridian-behavior.js` 计入消费是刻意的：它是随系统出厂的 headless 行为层，
 *  08/09/10 三屏真实引用，`is-open` / `is-active` / `is-stuck` 这些状态类由它挂载——
 *  不把它算进来会把每个状态类都误判成死类（假债）。
 *  `ai/selfcheck/runtime-*.mjs` 不算消费者：门禁脚本自己用某类不等于有屏幕调用它。 */
export function consumerFiles() {
  return [
    ...readdirSync(join(root, "prototypes")).filter((f) => f.endsWith(".html")).sort().map((f) => "prototypes/" + f),
    "design-system.html",
    "ai/meridian-behavior.js",
  ];
}

const CLASS_ATTR = /(?:\bclass|\bclassName)\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{\s*"([^"]*)"\s*\})/g;
const JS_CLASS = /classList\.(?:add|remove|toggle|contains)\(\s*["'`]([^"'`]+)["'`]|setAttribute\(\s*["']class["']\s*,\s*["'`]([^"'`]+)["'`]/g;

/** 选择器里的类名（只取 parse-css 认出的选择器，注释与属性值里的 `.foo` 不算声明）。 */
export function definedClasses(cssText) {
  const out = new Set();
  for (const sel of new Set(parseCss(cssText).map((d) => d.selector).filter(Boolean))) {
    for (const m of String(sel).matchAll(/\.([a-z][a-z0-9_-]*)/g)) out.add(m[1]);
  }
  return out;
}

export function consumedClasses(files = consumerFiles()) {
  const used = new Map();
  const bump = (c, where) => {
    if (!c) return;
    if (!used.has(c)) used.set(c, new Set());
    used.get(c).add(where);
  };
  for (const rel of files) {
    const src = rd(rel);
    for (const m of src.matchAll(CLASS_ATTR)) {
      const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
      for (const tok of classTokens(value)) bump(tok, rel);
    }
    for (const m of src.matchAll(JS_CLASS)) {
      for (const tok of classTokens(m[1] ?? m[2] ?? "")) bump(tok, rel);
    }
  }
  return used;
}

/** 一次性量出五层的 defs / 自有层接线率 / 死类清单（`file#class` 形态，跨层同名各记一笔）。 */
export function measure() {
  const used = consumedClasses();
  const layers = CSS_LAYER.map((file) => {
    const defs = definedClasses(rd(file));
    const dead = [...defs].filter((c) => !used.has(c)).sort();
    const own = [...defs].filter((c) => (OWN[file] ?? /^$/).test(c));
    const ownDead = own.filter((c) => !used.has(c));
    const rate = own.length ? (own.length - ownDead.length) / own.length : 1;
    return {
      file,
      defs: defs.size,
      dead,
      own: { defs: own.length, wired: own.length - ownDead.length, rate: Number(rate.toFixed(4)) },
      shared: [...defs].filter((c) => !(OWN[file] ?? /^$/).test(c)).length,
    };
  });
  const deadEntries = layers.flatMap((l) => l.dead.map((c) => `${l.file}#${c}`)).sort();
  return { used, layers, deadEntries };
}

/** 首次归类规则（细化后由账本里的名单说话，本函数只负责把新增死类放进候选 ticket）。 */
function pickTicket(entry) {
  const [file, cls] = entry.split("#");
  if (file === "ai/site.css" && /^rv(?:--?[a-z0-9]+)?$/.test(cls)) return "W-06";
  if (file === "ai/admin.css" && cls.startsWith("m-")) return "W-03";
  if (file === "ai/admin.css") return "W-01";
  if (file === "ai/site.css") return "W-02";
  if (file === "ai/meridian-ui.css" && cls.startsWith("sf-")) return "W-05";
  if (file === "ai/meridian-ui.css") return "W-03";
  return null; // 其余层（tokens / brand-tokens）出现死类 = 新债主，必须先开 ticket 再登记
}

export function renderLedger(ledger, tickets, readme) {
  const layers = Object.fromEntries(
    ledger.layers.map((l) => [l.file, { defsFloor: l.defsFloor, rateFloor: l.rateFloor, own: l.own }])
  );
  return JSON.stringify(
    {
      _readme: readme,
      deadMax: ledger.deadMax,
      layers,
      tickets: tickets.map((t) => ({ id: t.id, reason: t.reason, plan: t.plan, classes: [...t.classes].sort() })),
    },
    null,
    2
  ) + "\n";
}

export function writeLedger(text) {
  writeFileSync(join(root, "ai", "selfcheck", "wiring-baseline.json"), text);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { layers, deadEntries } = measure();
  if (process.argv[2] === "--emit") {
    const path = join(root, "ai", "selfcheck", "wiring-baseline.json");
    const prev = JSON.parse(readFileSync(path, "utf8"));
    const owners = new Map(prev.tickets.flatMap((t) => t.classes.map((c) => [c, t.id])));
    const stale = [...owners.keys()].filter((e) => !deadEntries.includes(e));
    const fresh = deadEntries.filter((e) => !owners.has(e));
    const unassigned = fresh.filter((e) => !pickTicket(e));
    if (unassigned.length) {
      console.error("以下死类不在任何候选 ticket 的归类规则里，先在 wiring-baseline.json 开一条带理由的 ticket：\n" + unassigned.join("\n"));
      process.exit(1);
    }
    const byId = new Map(prev.tickets.map((t) => [t.id, { ...t, classes: deadEntries.filter((e) => owners.get(e) === t.id) }]));
    for (const e of fresh) byId.get(pickTicket(e)).classes.push(e);
    const ledger = {
      deadMax: Math.max(prev.deadMax, deadEntries.length),
      layers: layers.map((l) => {
        const prevLayer = prev.layers[l.file] ?? {};
        return {
          file: l.file,
          defsFloor: Math.max(prevLayer.defsFloor ?? 0, l.defs),
          // 接线率地板只准上升：回退（新写的类没接线 / 消费点被删）不会被 --emit 抹平，
          // 因为取 max 后仍低于旧地板时，测试第 5 条会继续红。
          rateFloor: Math.max(prevLayer.rateFloor ?? 0, l.own.rate),
          own: l.own,
        };
      }),
    };
    writeLedger(renderLedger(ledger, [...byId.values()], prev._readme));
    console.log(`emitted ${deadEntries.length} 条死类（新增 ${fresh.length}｜清偿 ${stale.length}${stale.length ? " → 清偿后把 deadMax 下调" : ""}）`);
  } else {
    for (const l of layers) {
      console.log(`${l.file}: defs=${l.defs} 自有接线=${l.own.wired}/${l.own.defs} (${(l.own.rate * 100).toFixed(1)}%) 跨层引用类=${l.shared} 死类=${l.dead.length}`);
    }
    const used = consumedClasses();
    console.log(`合计死类条目 ${deadEntries.length}｜消费侧 ${consumerFiles().length} 个文件｜已消费类名 ${used.size}`);
  }
}
