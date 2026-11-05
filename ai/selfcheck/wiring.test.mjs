/**
 * G-231 反向接线门（Batch 2 · 2.1）。
 *
 * 立门的理由（评审 C1 / 根因 A）：本仓的 CI 过去只有正向门——"用到的类必须存在"。
 * 于是"声明了却没有任何屏幕调用"的类可以无限增长，而且 CI 还会替它守护属性写法
 * （`.rv` 动画族就是实例：prototypes-gate 有专门的 reduced-motion 守卫，页面却一处没挂）。
 * 计划 §12 的交付判据正是这一条："ai/ 层里是否还存在没有任何屏幕调用、却被 CI 断言守护的声明？"
 *
 * 门的强度（与"一次性把 252 条报成红、然后大家把门关掉"相反的取舍）：
 *   存量债逐名登记进 `wiring-baseline.json` 的 ticket（附理由 + 目标批次）；
 *   新增一条死类 = 红（不变量 #7：新类必须与消费者同批出厂）；
 *   清偿一条 = 账本必须同步变薄、deadMax 必须下调（棘轮只减不增，不变量 #6）；
 *   删类"销债" = 红（defsFloor 只准上调；删 token/类是本仓 MAJOR 红线）。
 *
 * 已知的可绕过处（不当它不存在）：消费判定是字符串级的，占位式假接线由 2.2 的 CDP
 * 真实计算样式断言兜（计划 2.2 验收列），不在本门内伪称已验证。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CSS_LAYER, OWN, measure, root } from "./lib/wiring.mjs";

const ledger = JSON.parse(readFileSync(`${root}/ai/selfcheck/wiring-baseline.json`, "utf8"));
const { layers, deadEntries } = measure();
const ticketed = ledger.tickets.flatMap((t) => t.classes);

test("G-231 死类账本与实测全等：新增未记账即红，清偿了必须同步销账", () => {
  assert.deepEqual(
    [...new Set(ticketed)].sort(),
    deadEntries,
    deadEntries.length > ticketed.length
      ? `出现未记账的死类（先接线，接线不了才开 ticket 写理由）：\n` +
        deadEntries.filter((e) => !ticketed.includes(e)).join("\n")
      : `账本里登记的死类已经有消费者了（从 ticket 删掉，并把 deadMax 下调）：\n` +
        [...new Set(ticketed)].filter((e) => !deadEntries.includes(e)).join("\n")
  );
});

test("G-231 棘轮：deadMax 只准下调，且必须等于当前债量", () => {
  assert.ok(
    deadEntries.length <= ledger.deadMax,
    `死类 ${deadEntries.length} > deadMax ${ledger.deadMax}：净增债。计划禁删类，正解是把类接上屏幕。`
  );
  assert.equal(
    deadEntries.length,
    ledger.deadMax,
    `已清偿 ${ledger.deadMax - deadEntries.length} 笔债但 deadMax 未下调——棘轮的基线必须就是当前值，否则下一次回归无症状。`
  );
});

test("G-231 每笔债都有归属、理由与目标批次（无理由的豁免等于没有门）", () => {
  const ids = ledger.tickets.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "ticket id 重复");
  for (const t of ledger.tickets) {
    assert.ok(t.classes.length > 0, `${t.id} 是空 ticket：债已清偿就删掉这条，别留着当摆设`);
    assert.ok(String(t.reason ?? "").length >= 20, `${t.id} 缺理由（理由须能独立读懂，≥20 字）`);
    assert.ok(String(t.plan ?? "").length >= 6, `${t.id} 缺目标批次/处置`);
    assert.ok(!/TODO|待补|略$/u.test(t.reason), `${t.id} 的理由是占位文本`);
  }
});

test("G-231 度量口径不可悄悄改变：五层扫描面与正向门同源，自有前缀闭合", () => {
  // 两面门（G-228 正向 / G-231 反向）必须共用同一个类宇宙，否则债可以藏在扫描面差里。
  const gate = readFileSync(`${root}/ai/checks/prototypes-gate.mjs`, "utf8");
  const forward = [...gate.matchAll(/"([a-z-]+)\.css"/g)].map((m) => `ai/${m[1]}.css`);
  const same = CSS_LAYER.filter((f) => forward.includes(f));
  assert.equal(same.length, CSS_LAYER.length, `反向门的扫描面有文件不在 prototypes-gate 的 CSS 层里：${CSS_LAYER.filter((f) => !same.includes(f)).join(", ")}`);
  const prefixes = Object.keys(OWN).sort();
  assert.deepEqual(prefixes, [...CSS_LAYER].sort(), "每层的自有命名空间必须逐层给出（brand-tokens 无类也要显式空匹配）");
});

test("G-231 三层接线率入账并可复核：删类不能销债（defsFloor 只准上调）", () => {
  for (const l of layers) {
    const rec = ledger.layers[l.file];
    assert.ok(rec, `${l.file} 未记账（新增 CSS 层要同时写自有命名空间与理由）`);
    assert.ok(
      l.defs >= rec.defsFloor,
      `${l.file} defs ${l.defs} < defsFloor ${rec.defsFloor}：删类不是销债——本仓红线是删除 = MAJOR + 迁移说明，接线或记账才是出路。`
    );
    assert.deepEqual(l.own, rec.own, `${l.file} 自有接线度量与账本不符（改口径要显式改账）`);
    assert.ok(l.own.rate >= (rec.rateFloor ?? 0), `${l.file} 自有接线率回退：${(l.own.rate * 100).toFixed(1)}% < 地板 ${(rec.rateFloor * 100).toFixed(1)}%`);
  }
  const line = layers.map((l) => `${l.file} ${(l.own.rate * 100).toFixed(1)}% (${l.own.wired}/${l.own.defs})`).join("  ");
  console.log(`G-231 接线率｜${line}｜死类 ${deadEntries.length} 笔（deadMax ${ledger.deadMax}）`);
});

test("G-231 计划 §12 判据的当前实例：CI 不得守护零消费者的动画", () => {
  // prototypes-gate 的动效守卫守护 .rv；一旦 .rv 族接线，这条债必须从 W-06 销账，
  // 而不是留在账本里当"已登记 = 已解决"。
  const guarded = /\\\.rv\\b/.test(readFileSync(`${root}/ai/checks/prototypes-gate.mjs`, "utf8"));
  const rvDebt = ledger.tickets.find((t) => t.id === "W-06");
  if (guarded && !rvDebt) assert.fail("prototypes-gate 仍在守护 .rv 动画，但 W-06 债目不见了——守卫要么接线、要么撤掉");
  if (!guarded && rvDebt) assert.fail("W-06 还挂着 .rv 债，但 prototypes-gate 的动效守卫已撤——账本要同步删除该 ticket");
});
