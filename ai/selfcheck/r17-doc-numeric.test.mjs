import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rule } from "../checks/r17-doc-numeric.mjs";
import { rules } from "../checks/index.mjs";

const hit = (text, { heading = "", path = "docs/03-typography.md" } = {}) =>
  rule.check({ type: "numeric", text, heading, line: 1 }, { file: { path }, cfg: {}, fs: {} });

test("R17 已注册进规则表", () => {
  assert.ok(rules.some((r) => r.id === "R17"));
});

test("R17 真阳性：裸字重与声明式字号各报一条", () => {
  assert.equal(hit("卡片标题字重 650。").length, 1);
  assert.equal(hit("正文 `font-size: 14px`。").length, 1);
  assert.equal(hit("字号：16px。").length, 1);
  assert.equal(hit("字重 650，font-size: 14px。").length, 2, "同一行两类问题不能被去重吞掉");
});

test("R17 真阴性：时长、禁令语境、反例小节、历史文档", () => {
  assert.deepEqual(hit("动效 450–600ms，长过渡 --m-duration-450。"), []);
  assert.deepEqual(hit("反例：450/550/650 在 Windows 会塌陷。"), []);
  assert.deepEqual(hit("| 450 | 400 | 400 |", { heading: "2.1 为什么放弃 450 / 550 / 650" }), []);
  assert.deepEqual(hit("字重 650。", { path: "CHANGELOG.md" }), []);
  assert.deepEqual(hit("字重 650。", { path: "docs/superpowers/plans/x.md" }), []);
});

test("R17 可单独执行：fail 退出 1，pass 退出 0", () => {
  const cli = (target) => {
    try { execFileSync(process.execPath, ["ai/validate.mjs", target, "--only=R17"], { stdio: "pipe" }); return 0; }
    catch (e) { return e.status; }
  };
  assert.equal(cli("ai/selfcheck/fixtures/R17/fail/Numeric.md"), 1);
  assert.equal(cli("ai/selfcheck/fixtures/R17/pass/Clean.md"), 0);
});
