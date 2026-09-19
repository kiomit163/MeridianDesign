import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const NEW = ["--m-critical-solid-hover", "--m-critical-solid-active", "--m-control-off-bg",
             "--m-tooltip-bg", "--m-tooltip-fg", "--m-neutral-solid", "--m-body-fs"];

test("新增语义 token 同时存在于 tokens.css 与 tokens.json", () => {
  const css = readFileSync("ai/tokens.css", "utf8");
  const json = readFileSync("ai/tokens.json", "utf8");
  for (const t of NEW) {
    assert.ok(css.includes(`${t}:`), `${t} 未在 tokens.css 声明`);
    assert.ok(json.includes(`"${t.replace(/^--m-/, "")}"`) || json.includes(t.replace(/^--m-/, "")), `${t} 未同步进 tokens.json`);
  }
});
