import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { rules } from "../checks/index.mjs";
import { run } from "../lib/engine.mjs";
import { factsFor, buildFs } from "../lib/facts.mjs";

const manifest = JSON.parse(readFileSync("ai/selfcheck/manifest.json", "utf8"));
const root = "ai/selfcheck/fixtures";
const key = (v) => `${v.rule}|${v.file.replace(/\\/g, "/")}|${v.line}`;
const walkAll = (dir) => !statSync(dir, { throwIfNoEntry: false })?.isDirectory() ? []
  : readdirSync(dir).flatMap((n) => { const p = join(dir, n).replace(/\\/g, "/"); return statSync(p).isDirectory() ? walkAll(p) : [p]; });

function scan(files) {
  const scanned = files.map((p) => factsFor(p, { ignore: [] }));
  return run({ files: scanned, rules, cfg: { componentAliases: {} }, fs: buildFs(scanned) }).violations;
}
const all = walkAll(root);

test("fail/ 命中集合与 manifest 完全相等（漏报与误报同样红）", () => {
  const want = manifest.map(key).sort();
  const got = scan(all.filter((p) => p.includes("fail"))).map(key).sort();
  assert.deepEqual(got, want, "集合漂移：\n" + got.filter((g) => !want.includes(g)) + " / " + want.filter((w) => !got.includes(w)));
});

test("pass/ 零违规（常驻反例保护）", () => {
  const out = scan(all.filter((p) => p.includes("pass")));
  assert.deepEqual(out.map(key), [], "真阴性被误报：" + out.map((v) => `${v.rule} ${v.file}:${v.line}`).join(", "));
});

test("每条规则至少 1 真阳性 + 1 真阴性 fixture", () => {
  for (const r of rules) {
    assert.ok(all.some((p) => p.includes(`/${r.id}/fail/`)), `${r.id} 缺真阳性`);
    assert.ok(all.some((p) => p.includes(`/${r.id}/pass/`)), `${r.id} 缺真阴性`);
  }
});

test("审计植入样本：15 命中、0 误报", () => {
  const dir = `${root}/R00-audit-sample`;
  // R18 不计入这 15 条基线：样本先于 R18 落地，其中 5 个标签本就带内联样式，
  // 属于 R18 的真实新增命中而非植红样本扩容（R18 自己的 fail/pass 另测）。
  const hits = scan(walkAll(dir)).filter((v) => !v.file.includes("manifest") && v.rule !== "R18");
  assert.equal(hits.filter((v) => v.file.includes("fail")).length, 15);
  assert.equal(hits.filter((v) => v.file.includes("pass")).length, 0);
});

test("三种输出模式在存在违规时一律退出码 1", () => {
  const bad = `${root}/R01/fail/Feature.tsx`;
  for (const mode of [[], ["--json"], ["--sarif"]])
    assert.throws(() => execFileSync(process.execPath, ["ai/validate.mjs", bad, ...mode], { stdio: "pipe" }), (e) => e.status === 1);
});

test("CLI 向后兼容：位置目录参数仍可用", () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ["ai/validate.mjs", "ai/lib"], { stdio: "pipe" }));
});
