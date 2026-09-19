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
});
