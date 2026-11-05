/**
 * R18 结构门（Batch 2 · 2.3）：内联 style 预算只减不增。
 *
 * 账本 = ai/selfcheck/r18-baseline.json（键 `<file>|R18`，值为该文件带 style 属性的标签数）。
 * 与 G-231 同一套棘轮纪律：账本必须与实测全等——新增即红，清偿后不同步下调也红。
 * 为什么不是"新声明才红"的白名单：白名单会替存量做永久背书；账本每批必须变薄。
 *
 * 注意：validate 的 `--baseline` 只在 `npm run lint` 里显式传入，不写进 meridian.config.json——
 * 否则单文件扫描会把其余文件的额度当成"记账过剩"刷屏。单独跑 `--only=R18` 看到的是原始债。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { run } from "../lib/engine.mjs";
import { factsFor } from "../lib/facts.mjs";
import { rule } from "../checks/r18-inline-style.mjs";
import { rules } from "../checks/index.mjs";

const LEDGER = "ai/selfcheck/r18-baseline.json";
const BUDGET = 616;   // 2.3 开工 764 → O16/O17 清偿 758 → 2.7 真实影像并入 697 → 3.1 展示字三档接线 694 → O25 购买箱 692 → 页脚接线 616
const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
const counts = Object.fromEntries(Object.entries(ledger).filter(([k]) => !k.startsWith("_")));

const files = readdirSync("prototypes").filter((f) => f.endsWith(".html")).sort().map((f) => "prototypes/" + f);
const measured = {};
let layout = 0;
for (const rel of files) {
  const facts = factsFor(rel, { ignore: [] });
  const hits = run({ files: [facts], rules: [rule], cfg: {} }).violations;
  if (hits.length) measured[`${rel}|R18`] = hits.length;
  layout += hits.filter((v) => v.message.includes("内联布局声明")).length;
}
const total = Object.values(measured).reduce((a, b) => a + b, 0);

test("R18 已注册进规则表（摘掉规则 = 结构门消失，账本还在也没用）", () => {
  assert.ok(rules.some((r) => r.id === "R18"), "ai/checks/index.mjs 缺 R18");
});

test("R18 账本与实测全等：新增内联 style 即红，清偿后必须同步下调", () => {
  const fresh = Object.keys(measured).filter((k) => !(k in counts));
  const cleared = Object.keys(counts).filter((k) => !(k in measured));
  const drift = Object.keys(counts).filter((k) => k in measured && counts[k] !== measured[k])
    .map((k) => `${k} ${counts[k]}→${measured[k]}`);
  assert.deepEqual(measured, counts,
    `内联样式数与账本不符（实测 ${total}，其中布局 ${layout}）。\n` +
    `新增：${fresh.join(", ") || "无"}\n` +
    `已清偿（下调账本）：${cleared.join(", ") || "无"}\n` +
    `额度漂移：${drift.join(", ") || "无"}`);
});

test("R18 总量不超过当前基线 758", () => {
  assert.ok(total <= BUDGET, `内联 style ${total} > 预算 ${BUDGET}：布局先迁组合层，不要扩预算`);
  console.log(`R18 结构债｜${total} 条内联 style（其中布局 ${layout}）`);
});

test("R18 消息区分布局声明（清偿顺序不是另一套阈值）", () => {
  const hit = (style) => rule.check({ name: "div", attrs: { style }, line: 1 })[0];
  assert.match(hit("display:grid;gap:8px").message, /内联布局声明/);
  assert.match(hit("color:var(--m-fg)").message, /内联样式/);
});

test("R18 可单独执行：fail 退出 1，pass 退出 0", () => {
  const cli = (target) => {
    try { execFileSync(process.execPath, ["ai/validate.mjs", target, "--only=R18"], { stdio: "pipe" }); return 0; }
    catch (e) { return e.status; }
  };
  assert.equal(cli("ai/selfcheck/fixtures/R18/fail/Layout.html"), 1);
  assert.equal(cli("ai/selfcheck/fixtures/R18/pass/Clean.html"), 0);
});
