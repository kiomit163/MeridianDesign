import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const run = (args) => { try { return { code: 0, out: execFileSync(process.execPath, ["ai/validate.mjs", ...args], { encoding: "utf8" }) }; }
  catch (e) { return { code: e.status, out: e.stdout ?? "" }; } };
const count = (args) => JSON.parse(run([...args, "--json"]).out || '{"violations":[]}').violations.length;

// A4–A7: 17 rules repo-wide = 0（fixtures 排除）。R18 的存量内联 style 由账本吸收，
// 但账本只记账不是豁免：新增仍然红（见 r18-inline-style.test.mjs 的全等断言）。
for (const rule of ["R01","R02","R03","R04","R05","R07","R08","R09","R10","R11","R12","R13","R14","R15","R16","R17","R18"]) {
  const args = [".", "--exclude", "ai/selfcheck/fixtures", "--only=" + rule];
  if (rule === "R18") args.push("--baseline", "ai/selfcheck/r18-baseline.json");
  test(`A4-A7: ${rule} 全仓 0 违规`, () => assert.equal(count(args), 0));
}

// A3: 三种模式一致非零退出
test("A3: 三模式一致非零退出", () => {
  const bad = "ai/selfcheck/fixtures/R01/fail/Feature.tsx";
  for (const mode of [[], ["--json"], ["--sarif"]]) assert.equal(run([bad, ...mode]).code, 1);
});

// A11: 版本戳七源一致（README / tokens.json / tokens.css / meridian-ui.css / design-system.html / package.json / CHANGELOG）
test("A11: 版本戳 v1.6.0 七源一致（版本常量随每次发布同步更新，见 spec R-31）", () => {
  assert.ok(readFileSync("README.md", "utf8").includes("v1.6.0"));
  assert.equal(JSON.parse(readFileSync("ai/tokens.json", "utf8")).$version, "1.6.0");
  assert.match(readFileSync("ai/tokens.css", "utf8"), /Design Tokens v1\.6\.0/);
  assert.match(readFileSync("ai/meridian-ui.css", "utf8"), /参考组件库 v1\.6\.0/);
  assert.ok(readFileSync("design-system.html", "utf8").includes("Design System v1.6.0"));
  assert.equal(JSON.parse(readFileSync("package.json", "utf8")).version, "1.6.0");
  assert.ok(readFileSync("CHANGELOG.md", "utf8").includes("## 1.6.0"));
});

// 字阶与圆角菜单与 tokens.json 一致
test("字阶与圆角菜单与 tokens.json 一致", async () => {
  const { TEXT_MENU, RADIUS_MENU } = await import("../lib/scale.mjs");
  const json = JSON.parse(readFileSync("ai/tokens.json", "utf8"));
  for (const size of Object.keys(json.typography["sizes-px"]))
    assert.ok(TEXT_MENU.includes(size), `tokens.json 有字阶 ${size} 但 TEXT_MENU 没有`);
  for (const r of Object.keys(json.radius["scale-px"]))
    assert.ok(RADIUS_MENU.includes(r), `tokens.json 有 radius.${r} 但 RADIUS_MENU 没有`);
  assert.ok(TEXT_MENU.includes("display"));
});
