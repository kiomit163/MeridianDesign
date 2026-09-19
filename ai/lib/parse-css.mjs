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

function splitDecl(text) {
  const i = text.indexOf(":");
  if (i < 0) return null;
  const raw = text.slice(0, i).trim();
  // 修正计划缺陷：原文先 toLowerCase 再 kebab，使 kebab 的 /[A-Z]/ 永不匹配（zIndex → zindex）。
  // kebab 正则本体保持计划原样，仅调整调用顺序并去掉首字母大写产生的前导 "-"。
  const prop = kebab(raw).replace(/^-+/, "").toLowerCase();
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

export function parseCss(src) {
  const lines = stripComments(src).split(/\r?\n/);
  const facts = [];
  const stack = [];
  let carry = null;                       // 跨行续接 { text, line, col }
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let seg = "", segCol = -1;
    const emit = (text, line_, col_, ch) => {
      const joined = (carry ? carry.text + " " : "") + text;
      const at = carry ?? { line: line_, col: col_ };
      carry = null;
      if (ch === "{") { stack.push(joined.trim()); return; }
      if (ch === "}") { stack.pop(); return; }
      const d = splitDecl(joined.trim());
      if (d) facts.push({ type: "decl", ...d, selector: stack[stack.length - 1] ?? "", line: at.line, col: at.col });
    };
    for (let ci = 0; ci <= line.length; ci++) {
      const ch = ci === line.length ? "\n" : line[ci];
      if (ch === "{" || ch === "}" || ch === ";" || ch === "\n") {
        const text = seg.trim();
        const col = segCol >= 0 ? segCol + 1 : 1;
        seg = ""; segCol = -1;
        // 修正计划缺陷：原文对行尾 "\n" 也调用 emit，未结束的声明会就地落地，
        // carry 永远取不到值（计划里的跨行续接形同虚设，跨行声明丢失续接行）。
        // 行尾改为并入 carry，遇真正的终止符（; { }）再落地，行号取 carry 首行。
        if (ch === "\n") {
          if (text) carry = carry ? { ...carry, text: carry.text + " " + text } : { text, line: li + 1, col };
          continue;
        }
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
