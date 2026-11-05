import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// G-224 / G-228 / G-229 的常驻回归：门禁本身必须被测试套件执行，
// 否则 CI 会再次出现"npm test 全绿、门禁全红"的假绿（v1.4 P0 修复项）。

test("G-224 白名单剔除闭合五件 CSS（v1.4 P0 回归）", () => {
  const src = readFileSync("ai/checks/prototypes-gate.mjs", "utf8");
  assert.match(src, /tokens\|brand-tokens\|meridian-ui\|admin\|site/);
});

test("G-230 店面 08-11 必须带真实 <img>（R12 不得空转）", () => {
  const src = readFileSync("ai/checks/prototypes-gate.mjs", "utf8");
  assert.match(src, /G-230/);
  for (const f of ["08-home.html", "09-plp.html", "10-pdp.html", "11-checkout.html"]) {
    const html = readFileSync(`prototypes/${f}`, "utf8");
    assert.match(html, /<img\b/i, `${f} 零 <img>：R12 在该页空转`);
  }
});

test("prototypes-gate 退出 0", () => {
  let out = "";
  try {
    out = execFileSync(process.execPath, ["ai/checks/prototypes-gate.mjs"], { encoding: "utf8" });
  } catch (e) {
    assert.fail(`prototypes-gate 失败：\n${e.stdout ?? ""}${e.stderr ?? ""}`);
  }
  assert.match(out, /prototypes-gate: OK/);
});
