import { isTokenRef } from "../lib/scale.mjs";
const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/;
const FN = /\b(?:rgba?|hsla?|oklch|oklab|hwb|lch)\s*\(/;
const COLOR_CTX = /(?:^|[;{\s])(?:color|background|background-color|border-color|fill|stroke|outline-color)\s*[:=]/;
const NAMED = /^\s*(?:black|white|red|blue|green|gray|grey|yellow|orange|purple|pink)\s*$/;

function hit(text, { declMode }) {
  const t = String(text ?? "").replace(/["']/g, "");
  if (!t || isTokenRef(t)) return false;
  if (FN.test(t) && declMode) return true;
  if (HEX.test(t) && (declMode || COLOR_CTX.test(text))) return true;
  if (declMode && NAMED.test(t)) return true;
  return false;
}

export const rule = {
  id: "R01", title: "raw-color", layers: ["component", "feature"], facts: ["decl", "literal", "class"],
  offInDemo: true,
  check(f) {
    if (f.type === "class") {
      return /^(?:text|bg|border|fill|stroke|ring|outline|shadow)-\[#[0-9a-fA-F]{3,8}\]$/.test(f.token)
        ? [{ line: f.line, message: "Tailwind 任意值裸色值", fix: "bg-surface / text-critical" }] : [];
    }
    // 计划缺陷修正（brief §R01）：字面量里 `background: rgba(...)` 形如 CSS 声明，理应享有 declMode。
    // 最小改动：仅当字面量含 `:` 时按 declMode 处理（不会误伤 R01/pass 的 `"#1042"`/`"Order #A1B2"`/`"#FB"`）。
    // 注意：fill="#FF0000" 字面量 `#FF0000` 不含 `:`，brief 期望的 4 处命中只能拿到 3，
    // 这一处属 brief 计划缺陷（缺失 fill-属性上下文的 literal 收集），已上报控制者。
    const declMode = f.type === "decl" || (f.type === "literal" && /:/.test(f.text));
    const raw = f.type === "decl" ? f.value : f.text;
    return hit(raw, { declMode })
      ? [{ line: f.line, message: "裸色值", fix: "var(--m-fg) / bg-primary / text-critical" }] : [];
  },
};


