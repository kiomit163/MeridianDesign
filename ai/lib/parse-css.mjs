export function stripComments(src) {
  let out = "", i = 0;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "*") {
      let j = src.indexOf("*/", i + 2);
      j = j < 0 ? src.length : j + 2;
      for (; i < j; i++) out += src[i] === "\n" ? "\n" : " ";
      continue;
    }
    if (c === '"' || c === "'") {
      out += c; i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") { out += src[i]; i++; }
        out += src[i]; i++;
      }
      out += src[i] ?? ""; i++;
      continue;
    }
    out += c; i++;
  }
  return out;
}

const kebab = (p) => p.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

/**
 * 属性名的唯一归一实现（parse-markup 的内联样式复用此处，不再各自写 kebab）。
 * 自定义属性（`--*`）大小写敏感且必须以 `--` 为身份，故**原样保留**：
 * 剥掉前导 `-` 会让 431 条 `--m-*` 事实变成 `m-*`（伪造出仓库里不存在的属性名，
 * 并让 token 层判定全线失明）；camelCase→kebab 与小写化只作用于普通属性。
 */
function normalizeProp(raw) {
  return raw.startsWith("--") ? raw : kebab(raw).replace(/^-+/, "").toLowerCase();
}

export function splitDecl(text) {
  const i = text.indexOf(":");
  if (i < 0) return null;
  const prop = normalizeProp(text.slice(0, i).trim());
  const value = text.slice(i + 1).trim();
  if (!prop || !value) return null;
  return { prop, value };
}

export function stripVars(value) {
  let out = String(value), guard = 0;
  do {
    guard++;
    out = out.replace(/\b(?:var|calc|clamp|min|max|color-mix)\([^()]*\)/g, "TOK");
  } while (/TOK[^)]*\(/.test(out) && guard < 8);
  return out;
}

// 属性名形状闸（parse-css 的 F3 判别与 parse-markup 的内联样式共用同一判据）：
// 自定义属性 `--*`（原样保留，故允许大写）或 kebab 化后的小写属性名。
const PROP_SHAPE = /^(?:--[\w-]+|[a-z][a-z0-9-]*)$/;
export const isPropName = (p) => PROP_SHAPE.test(p);

// F3 判别辅助：pending carry 遇 `{` 时，只有"确实像属性名"的那一类才按声明落地。
// `.btn:focus` / `&:hover` / `input[type=x]:valid` 这类跨行书写的选择器同样含 `:`，
// 若一律按声明处理就会凭空造出一条事实，故用属性名形状 + 标签名黑名单双重挡掉。
// （CSS 属性名与 HTML 标签名无同名，黑名单不会误伤真声明。）
const HTML_TAGS = new Set(("a abbr address area article aside audio b base bdi bdo blockquote body br button " +
  "canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset " +
  "figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label " +
  "legend li link main map mark menu meta meter nav noscript object ol optgroup option output p param picture " +
  "pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table " +
  "tbody td textarea tfoot th thead time title tr track u ul var video wbr svg path circle rect line polyline " +
  "polygon ellipse g defs use text").split(/\s+/));

export function parseCss(src) {
  const lines = stripComments(src).split(/\r?\n/);
  const facts = [];
  const stack = [];
  let carry = null;                       // 跨行续接 { text, line, col }
  let quote = null;                       // F2：字符串态；非 null 时 ; { } 与行尾都只是普通字符
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let seg = "", segCol = -1;
    // 行尾：并入 carry 而不是落地（见下方计划缺陷修正）。
    const keep = () => {
      const text = seg.trim();
      const col = segCol >= 0 ? segCol + 1 : 1;
      seg = ""; segCol = -1;
      if (text) carry = carry ? { ...carry, text: carry.text + " " + text } : { text, line: li + 1, col };
    };
    const emit = (text, line_, col_, ch) => {
      if (ch === "{" && carry && stack.length && !stack[stack.length - 1].startsWith("@")) {
        // 块内出现 `{` = 原生嵌套规则；此时 carry 是上一条未写 `;` 的声明，不是新选择器的一部分。
        // 直接拼栈会造出 `color: red .y` 这种源文件里不存在的选择器。
        const d = splitDecl(carry.text);
        if (d && isPropName(d.prop) && !HTML_TAGS.has(d.prop)) {
          facts.push({ type: "decl", ...d, selector: stack[stack.length - 1], line: carry.line, col: carry.col });
          carry = null;
          stack.push(text.trim());
          return;
        }
      }
      const joined = (carry ? carry.text + " " : "") + text;
      const at = carry ?? { line: line_, col: col_ };
      carry = null;
      if (ch === "{") { stack.push(joined.trim()); return; }
      if (ch === "}") { stack.pop(); return; }
      const d = splitDecl(joined.trim());
      if (d) facts.push({ type: "decl", ...d, selector: stack[stack.length - 1] ?? "", line: at.line, col: at.col });
    };
    for (let ci = 0; ci <= line.length; ci++) {
      const eol = ci === line.length;
      const ch = eol ? "\n" : line[ci];
      if (quote) {
        if (!eol && ch === "\\" && ci + 1 < line.length) {     // 转义：`\` 与下一字符整体属于字符串
          if (segCol < 0) segCol = ci;
          seg += ch + line[++ci];
          continue;
        }
        if (ch === quote) quote = null;
        if (eol) { keep(); continue; }                          // 未闭合字符串跨行：状态延续，不认分隔符
        if (segCol < 0 && ch !== " " && ch !== "\t") segCol = ci;
        seg += ch;
        continue;
      }
      if (!eol && (ch === '"' || ch === "'")) quote = ch;
      else if (eol) { keep(); continue; }
      else if (ch === "{" || ch === "}" || ch === ";") {
        const text = seg.trim();
        const col = segCol >= 0 ? segCol + 1 : 1;
        seg = ""; segCol = -1;
        // 修正计划缺陷：原文对行尾 "\n" 也调用 emit，未结束的声明会就地落地，
        // carry 永远取不到值（计划里的跨行续接形同虚设，跨行声明丢失续接行）。
        // 行尾改为并入 carry，遇真正的终止符（; { }）再落地，行号取 carry 首行。
        if (text) emit(text, li + 1, col, ch);
        else if (carry) emit("", li + 1, col, ch);   // 空段即终止符（如选择器后换行才写 "{"）：交回 emit 落地/出栈
        else if (ch === "}") stack.pop();
        continue;
      }
      if (segCol < 0 && ch !== " " && ch !== "\t") segCol = ci;
      seg += ch;
    }
  }
  return facts;
}
