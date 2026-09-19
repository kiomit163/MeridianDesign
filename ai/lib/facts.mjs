/**
 * 事实装配：路径 → 层 + 该层的事实流。CLI 与测试共用（v1 假绿的成因之一就是两边各算一套）。
 * 本模块只做"分派与拼装"，任何解析细节都留在 parse-css / parse-markup / parse-doc 里，不在此重实现。
 */
import { readFileSync, existsSync } from "node:fs";
import { classify } from "./classify.mjs";
import { parseCss } from "./parse-css.mjs";
import { parseMarkup } from "./parse-markup.mjs";

// 计划缺陷修正：`parse-doc.mjs` 由 Task 9 交付，brief 在此处静态 import 会让本模块今天就
// ERR_MODULE_NOT_FOUND（Step 8 的 CLI 冒烟必崩）。改为可选依赖：缺失时 doc 层不产事实（保守放行），
// Task 9 落地后无需回头改这里。
let parseDoc = () => [];
try {
  parseDoc = (await import("./parse-doc.mjs")).parseDoc;
} catch (err) {
  if (err?.code !== "ERR_MODULE_NOT_FOUND" || !/parse-doc/.test(String(err?.message))) throw err;
}

export function factsFor(path, cfg = { ignore: [] }) {
  const layer = classify(path, cfg);
  if (layer === "ignore") return { path, layer, text: "", facts: [] };
  const text = readFileSync(path, "utf8");
  const ext = path.slice(path.lastIndexOf("."));
  let facts = [];
  if (layer === "doc") facts = parseDoc(text, path);
  else if (ext === ".css" || ext === ".json") facts = parseCss(text);
  else {
    const m = parseMarkup(text);
    facts = [...m.tags.map((t) => ({ type: "tag", ...t })), ...m.styleDecls,
      ...m.tags.flatMap((t) => t.classes.map((token) => ({ type: "class", token, line: t.line, tag: t.name }))),
      ...m.literals];
    // 标记文件里的 `<style>` 块同样按 CSS 事实处理，但打上来源标记，规则要区分时可退让。
    if (ext === ".html" || ext === ".vue" || ext === ".svelte") facts.push(...parseCss(text).map((d) => ({ ...d, fromStyleBlock: true })));
  }
  return { path, layer, text, facts };
}

/** CLI 与测试共用的文档视图（避免"测试通过但 CLI 判定不同"——v1 假绿的成因）。 */
export function buildFs(files) {
  // 索引键与规则的引用路径统一为正斜杠：Task 10 用 `join()` 造的路径是反斜杠形态，
  // 不归一的话 `byPath` / `chapters` 在 Windows 上查不到，R14 会整层失明。
  const rel = (p) => p.replace(/\\/g, "/").replace(/^\.\//, "");
  const md = files.filter((f) => f.layer === "doc");
  return {
    changelog: existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : null,
    byPath: new Map(md.map((f) => [rel(f.path), f.text])),
    chapters: new Map(md.flatMap((f) => { const m = f.path.match(/(\d{2})-[\w-]+\.md$/); return m ? [[m[1], rel(f.path)]] : []; })),
  };
}
