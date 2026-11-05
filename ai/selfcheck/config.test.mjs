import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("config exposes every key the engine will read", () => {
  const cfg = JSON.parse(readFileSync("meridian.config.json", "utf8"));
  for (const k of ["ignore", "componentAliases", "demoRegions", "baseline"])
    assert.ok(k in cfg, `missing key: ${k}`);
  assert.ok(cfg.ignore.includes("_audit"));
  assert.deepEqual(cfg.demoRegions["design-system.html"], ["ramp-demo"]);
});

test("package.json is ESM with test and lint scripts", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.type, "module");
  assert.match(pkg.scripts.test, /node --test/);
  assert.match(pkg.scripts.lint, /validate\.mjs/);
  // 默认 lint 必须跳过自检 fixtures，否则干净克隆直接 60 处植红（v1.4 P0 回归）
  assert.match(pkg.scripts.lint, /--exclude ai\/selfcheck\/fixtures/);
});

test("文档中的校验命令不会把自检 fixtures 当业务代码", () => {
  for (const f of ["README.md", "ai/AGENTS.md", "ai/prompts.md", "design-system.html"]) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, /node ai\/validate\.mjs src\b/, `${f} 仍使用不存在的 src 目标`);
  }
});
