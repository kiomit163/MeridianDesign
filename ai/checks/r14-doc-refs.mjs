import { CN_NUM } from "../lib/parse-doc.mjs";
export const rule = {
  id: "R14", title: "doc-reference-integrity", layers: ["doc"], facts: ["docref"],
  check(f, ctx) {
    const fs = ctx.fs ?? { changelog: null, byPath: new Map(), chapters: new Map() };
    if (f.kind === "version")
      return fs.changelog === null
        ? [{ line: f.line, message: `引用 v${f.target} 但 CHANGELOG.md 不存在（fail-closed）`, fix: "创建 CHANGELOG.md" }]
        : fs.changelog.includes(f.target) ? [] :
          [{ line: f.line, message: `引用 v${f.target} 但 CHANGELOG.md 无此条目`, fix: "补 CHANGELOG 条目或删除引用" }];
    if (f.kind === "chapter") {
      const target = fs.chapters.get(f.file);
      if (!target) return [{ line: f.line, message: `引用「${f.file} 章」但没有编号为 ${f.file} 的文档`, fix: "核对编号" }];
      const dirOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : ".");
      if (dirOf(target) === dirOf(ctx.file.path)) return [];       // 同目录裸引用：语义需读散文，不判（见局限）
      return [{ line: f.line, message: `跨目录裸章节引用「${f.file} 章」实为 ${target}`, fix: `改写成 ${target} §N 形式` }];
    }
    const src = fs.byPath.get(`docs/${f.file}`) ?? [...fs.byPath.entries()].find(([p]) => p.includes(`/${f.file}-`))?.[1];
    if (!src) return [{ line: f.line, message: `引用目标 ${f.file} 不存在`, fix: "" }];
    const numerals = new Set([...src.matchAll(/^##\s+([一二三四五六七八九十]+)、/gm)].map((m) => CN_NUM[m[1]]));
    return numerals.has(CN_NUM[f.section]) ? [] : [{ line: f.line, message: `docs/${f.file} 无 §${f.section}`, fix: "核对目标小节号" }];
  },
};
