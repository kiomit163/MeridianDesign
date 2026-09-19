export const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };

export function parseDoc(src, path = "") {
  const out = [];
  src.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(/(?:docs|storefront|admin|components)\/(\d{2})[\w-]*\.md\s*§([一二三四五六七八九十]+)/g))
      out.push({ type: "docref", kind: "section", file: m[1], section: m[2], line: i + 1 });
    for (const m of line.matchAll(/(?:第\s*)?(\d{2})\s*章/g))
      out.push({ type: "docref", kind: "chapter", file: m[1], line: i + 1 });
    for (const m of line.matchAll(/\bv(\d+\.\d+\.\d+)\b/g))
      out.push({ type: "docref", kind: "version", target: m[1], line: i + 1 });
  });
  return out;
}

export function headingsOf(src) {
  return [...src.matchAll(/^##\s+(?:([一二三四五六七八九十]+)、)?(.*)$/gm)]
    .map((m) => ({ numeral: CN_NUM[m[1]] ?? null, title: m[2].trim() }));
}
