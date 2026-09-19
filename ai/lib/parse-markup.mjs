const VOID = new Set(["img", "br", "hr", "input", "meta", "link", "source", "area", "col", "embed", "track", "wbr"]);
const TAG_RE = /<([A-Za-z][\w.:-]*)((?:"[^"]*"|'[^']*'|`[^`]*`|\{[^}]*(?:\{[^}]*\}[^}]*)*\}|[^>"'`])*?)(\/?)\s*>/g;
// 修正计划缺陷：原 ATTR_RE 的 `{...}` 分支会把 `className={`p-${n}`}` 的模板字面量原文当静态值捕获，
// 使 classTokens 拿到 "`p-${n}`" 这类假类名（计划注记明确要求"模板拼接不解析、拿不到内容"）。
// 花括号值内排除反引号 → 模板拼接表达式整体不匹配 → attrs 取空串，保守放行（宁漏不误）。
const ATTR_RE = /([A-Za-z_:][\w.:-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|\{((?:[^{}`]|\{[^{}`]*\})*)\}))?|([A-Za-z_:][\w.:-]*)/g;

export function classTokens(value) {
  return String(value).split(/[\s,]+/).filter(Boolean)
    .map((c) => c.replace(/^(?:[a-zA-Z][\w-]*:)+/, ""));
}

function parseAttrs(raw) {
  const attrs = {};
  for (const m of raw.matchAll(ATTR_RE)) {
    if (m[5]) { attrs[m[5]] = ""; continue; }
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

const lineOf = (src, idx) => src.slice(0, idx).split(/\r?\n/).length;

function innerOf(src, from, name) {
  if (VOID.has(name.toLowerCase())) return "";
  const openRe = new RegExp(`<${name}(?=[\\s/>])`, "gi");
  const closeRe = new RegExp(`</${name}\\s*>`, "gi");
  let depth = 1, i = from;
  while (i < src.length) {
    openRe.lastIndex = closeRe.lastIndex = i;
    const o = openRe.exec(src), c = closeRe.exec(src);
    if (!c) return "";
    if (o && o.index < c.index) { depth++; i = o.index + o[0].length; continue; }
    depth--;
    if (depth === 0) return src.slice(i, c.index);
    i = c.index + c[0].length;
  }
  return "";
}

const hasVisibleText = (inner) => /\S/.test(inner.replace(/<[^>]*>/g, " "));

function styleToObject(v) {
  const m = String(v).match(/^\s*\{?([\s\S]*?)\}?\s*$/);
  return m ? m[1] : null;
}

export function parseMarkup(src) {
  const blanked = src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (b) => b.replace(/[^\n]/g, " "));
  const tags = [], styleDecls = [], literals = [];
  for (const m of blanked.matchAll(TAG_RE)) {
    const name = m[1], rawAttrs = m[2] ?? "", selfClosed = m[3] === "/";
    if (/^(?:style|script)$/i.test(name)) continue;
    const line = lineOf(blanked, m.index);
    const attrs = parseAttrs(rawAttrs);
    const inner = selfClosed ? "" : innerOf(blanked, m.index + m[0].length, name);
    const classes = classTokens(attrs.class ?? attrs.className ?? "");
    tags.push({ name, attrs, classes, inner, hasText: hasVisibleText(inner), line });
    const obj = "style" in attrs ? styleToObject(attrs.style) : null;
    if (obj) {
      let col = 0;
      for (const pair of obj.split(",")) {
        const kv = pair.split(":");
        if (kv.length < 2) continue;
        styleDecls.push({
          type: "decl",
          prop: kv[0].trim().replace(/[A-Z]/g, (x) => "-" + x.toLowerCase()),
          value: kv.slice(1).join(":").trim(),
          selector: "@" + name, line, col: ++col,
        });
      }
    }
  }
  for (const m of blanked.matchAll(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g))
    literals.push({ type: "literal", text: m[0].slice(1, -1), line: lineOf(blanked, m.index) });
  return { tags, styleDecls, literals };
}
