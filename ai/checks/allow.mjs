/**
 * 例外机制：行级 `meridian-allow: <原因>` 与区段 `meridian-begin/-end: <名>`。
 *
 * 语义（spec §例外机制）：无理由的标记不生效；未被消耗的标记由引擎判为 stale。
 * 本模块只负责"从文本里取出标记"，判定与消耗在 `engine.run()`。
 */
// 计划缺陷修正：brief 的正则没有 `m` 标志，`$` 只在整个字符串末尾成立，
// 于是计划自己承认的另一种写法 `// meridian-allow: <原因>`（行尾、后面还有代码）永远匹配不到 ——
// 加了标记却仍被判红。补 `m` 让 `$` 在行尾成立。
const ALLOW_RE = /meridian-allow\s*(?::\s*([^*\/\n]+?))?\s*(?:\*\/|$)/gm;
const BEGIN_RE = /meridian-begin:\s*([\w-]+)/g;
const END_RE = /meridian-end:\s*([\w-]+)/g;
const at = (text, idx) => text.slice(0, idx).split(/\r?\n/).length;

export function collectAllows(text) {
  const byLine = new Map();
  for (const m of String(text).matchAll(ALLOW_RE)) {
    const reason = (m[1] ?? "").trim();
    if (reason) byLine.set(at(text, m.index), reason);
  }
  const regions = [];
  const open = new Map();
  for (const m of text.matchAll(BEGIN_RE)) open.set(m[1], at(text, m.index));
  // 未闭合的 begin 不产区段（宁漏不误：没有 end 就猜不到边界）。
  for (const m of text.matchAll(END_RE)) { const from = open.get(m[1]); if (from) regions.push({ name: m[1], from, to: at(text, m.index) }); }
  return { byLine, regions };
}
