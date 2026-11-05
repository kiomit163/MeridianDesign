/**
 * 伪本地化（pseudo-localization）：在真实翻译到达前验证「膨胀 + 非 ASCII」下的排版。
 * - 字母替换为带变音符字符（暴露未走字体回退的硬编码字体栈）
 * - 四角括号标记（暴露被截断的字符串）
 * - 约 +35% 尾部填充（对齐德语/芬兰语的膨胀上界）
 * ICU 占位符原样保留，避免把 {count} 破坏成伪字符。
 */
const MAP = {
  a: "á", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "í", j: "ĵ", k: "ķ", l: "ļ",
  m: "ɱ", n: "ñ", o: "ó", p: "þ", q: "ǫ", r: "ŕ", s: "š", t: "ţ", u: "ú", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ž",
  A: "Á", B: "Ɓ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ĝ", H: "Ĥ", I: "Í", J: "Ĵ", K: "Ķ", L: "Ļ",
  M: "Ṁ", N: "Ñ", O: "Ó", P: "Þ", Q: "Ǫ", R: "Ŕ", S: "Š", T: "Ţ", U: "Ú", V: "Ṽ", W: "Ŵ", X: "Ẋ", Y: "Ý", Z: "Ž",
};

function matchBrace(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

export function pseudoLocalize(message) {
  let out = "";
  for (let i = 0; i < message.length; i++) {
    if (message[i] === "{") {
      const end = matchBrace(message, i);
      if (end > i) { out += message.slice(i, end + 1); i = end; continue; }
    }
    out += MAP[message[i]] ?? message[i];
  }
  const pad = "·".repeat(Math.ceil([...message].length * 0.35));
  return `⟦${out}${pad}⟧`;
}

export function buildPseudo(catalogue) {
  const out = { $locale: "en-XA", $name: "Pseudo (en-XA, +35%)" };
  for (const [k, v] of Object.entries(catalogue)) {
    if (k.startsWith("$") || typeof v !== "string") continue;
    out[k] = pseudoLocalize(v);
  }
  return out;
}
