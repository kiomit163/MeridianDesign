/**
 * 标记 / JSX 事实流：`parseMarkup(src) → { tags, styleDecls, literals }`。
 *
 * `styleDecls` 与 `parseCss` 的 decl 同形状（`type/prop/value/selector/line/col`），
 * 属性名归一直接复用 parse-css 的 `splitDecl`（kebab 规则全仓只此一处）。两处语义差异需在
 * 下游注意：`selector` 为 `"@" + 标签名`；**`col` 是该属性在 `style` 属性值内的 1-based 字符偏移**，
 * 不是行内列号（CSS decl 的 col 才是列号）。表达式型 `style` 一律不产事实。
 */
import { splitDecl, isPropName } from "./parse-css.mjs";

const VOID = new Set(["img", "br", "hr", "input", "meta", "link", "source", "area", "col", "embed", "track", "wbr"]);
const TAG_RE = /<([A-Za-z][\w.:-]*)((?:"[^"]*"|'[^']*'|`[^`]*`|\{[^}]*(?:\{[^}]*\}[^}]*)*\}|[^>"'`])*?)(\/?)\s*>/g;
// 修正计划缺陷：原 ATTR_RE 的 `{...}` 分支会把 `className={`p-${n}`}` 的模板字面量原文当静态值捕获，
// 使 classTokens 拿到 "`p-${n}`" 这类假类名（计划注记明确要求"模板拼接不解析、拿不到内容"）。
// 花括号值内排除反引号 → 模板拼接表达式整体不匹配 → attrs 取空串，保守放行（宁漏不误）。
const ATTR_RE = /([A-Za-z_:][\w.:-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|\{((?:[^{}`]|\{[^{}`]*\})*)\}))?|([A-Za-z_:][\w.:-]*)/g;

// F4：`(` `)` `?` `&&` `||` `{` `}` `;` 引号、反斜杠 = 运行时才知道结果的表达式，
// 类名不是字面量，一个都不认领（原实现把 `cx("p-4", x)` 拆成 `cx("p-4"` 与 `x)` 当类名）。
// Tailwind 任意值 `[...]` 内部允许 `(`/`,`/引号（`text-[var(--m-x)]`、`p-[calc(100%-3rem)]`），
// 所以判定前先把 balanced 的 `[...]` 片段掩掉，避免把真类名一起漏掉。
const EXPR_MARK = /[(?)&|{};'"`\\]/;
const CLASS_JUNK = /["'`?&|{};,\\]/;
const balanced = (c, c1, c2) => c.split(c1).length === c.split(c2).length;

export function classTokens(value) {
  const s = String(value);
  if (EXPR_MARK.test(s.replace(/\[[^\]]*\]/g, "[]"))) return [];
  return s.split(/[\s,]+/).filter(Boolean)
    .map((c) => c.replace(/^(?:[a-zA-Z][\w-]*:)+/, ""))
    // F4：剥前缀之后再过滤（原实现先过滤，`"hover:"` 会留下空串当类名）；
    // 同时挡住只能来自表达式/数组字面量的碎片（`['p-4',` / `x]` 这类不成对括号）。
    .filter((c) => c && !CLASS_JUNK.test(c) && balanced(c, "[", "]") && balanced(c, "(", ")"));
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

/** 顶层切分：引号内与括号内的分隔符不切（否则 `linear-gradient(red, blue)` 会被腰斩成两条事实）。 */
function splitTop(text, sep, offset) {
  const out = [];
  let depth = 0, q = null, start = 0;
  const cut = (i) => { out.push({ raw: text.slice(start, i), at: offset + start }); start = i + 1; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === "\\") i++; else if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") q = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === sep && depth === 0) cut(i);
  }
  cut(text.length);
  return out;
}

/** 单一字符串字面量才去引号：内部还含同类引号时原样保留，不猜。 */
function unquote(v) {
  const q = v[0];
  if (q !== '"' && q !== "'" && q !== "`") return v;
  if (v.length < 2 || v[v.length - 1] !== q) return v;
  if (v.slice(1, -1).includes(q)) return v;
  return v.slice(1, -1);
}

/**
 * F7：`style` 值的两条切分路径。HTML 写法 `style="a:b;c:d"` 按 `;` 切；
 * JSX 写法 `style={{ a: b, c: d }}`（含单层 `{`）按 `,` 切。原实现两边都按 `,` 切，
 * 于是 `style="color:red;padding:7px"` 只产出一条 value 为 `red;padding:7px` 的假事实，
 * `padding:7px` 这条真事实就此消失（R05 在标记侧全线失明）。
 */
function pushStyleDecls(name, value, line, out) {
  const open = value.trimStart().startsWith("{") ? value.indexOf("{") : -1;
  const close = open >= 0 ? value.lastIndexOf("}") : -1;
  const objectForm = close > open;
  const body = objectForm ? value.slice(open + 1, close) : value;
  const base = objectForm ? open + 1 : 0;
  for (const part of splitTop(body, objectForm ? "," : ";", base)) {
    const d = splitDecl(part.raw.trim());
    // 冒号前不是属性名（如 `style={cond ? { color: "red" } : null}` 的 `cond ? { color`）→ 表达式，不产事实。
    if (!d || !isPropName(d.prop)) continue;
    const val = unquote(d.value);
    if (!val) continue;                       // 值为空 / 只剩引号 → 不是事实
    const at = part.at + (part.raw.length - part.raw.trimStart().length);
    out.push({ type: "decl", prop: d.prop, value: val, selector: "@" + name, line, col: at + 1 });
  }
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
    if ("style" in attrs) pushStyleDecls(name, attrs.style, line, styleDecls);
  }
  for (const m of blanked.matchAll(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g)) {
    const text = m[0].slice(1, -1);
    // F6：`"` / `'` 字符串在 JS/HTML 属性里不得跨行；含换行说明这是两处散文撇号被误配成一段
    // "字符串"（design-system.html 实测 2895 条里有 85 条如此，其中两条带 #fff → R01 会引用不存在的证据）。
    if (m[1] !== "`" && text.includes("\n")) continue;
    literals.push({ type: "literal", text, line: lineOf(blanked, m.index) });
  }
  return { tags, styleDecls, literals };
}
