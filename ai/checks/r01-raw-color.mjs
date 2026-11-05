import { isTokenRef } from "../lib/scale.mjs";
const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/;
const FN = /\b(?:rgba?|hsla?|oklch|oklab|hwb|lch)\s*\(/;
const COLOR_CTX = /(?:^|[;{\s])(?:color|background|background-color|border-color|fill|stroke|outline-color)\s*[:=]/;
const NAMED = /^\s*(?:black|white|red|blue|green|gray|grey|yellow|orange|purple|pink)\s*$/;

// Tailwind 命名色工具类（`bg-red-500` / `text-emerald-600` / `border-slate-200/70`）。
// 任意值分支挡不住它们：名字看着"语义"，值却是不随主题与 `.stage-admin` 覆盖变化的裸色。
// 色名表是 Tailwind 默认调色板的封闭集——只认 `<utility>-<paletteName>-<step>`，
// 因此 `text-lg` / `m-text-2xl` / `divide-y` 这类同前缀的非颜色工具不会误伤。
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const TW_NAMED = new RegExp(
  `^(?:text|bg|border|fill|stroke|ring|outline|shadow|from|via|to|accent|caret|decoration|divide|placeholder)-(?:${PALETTE})-\\d{2,3}(?:\\/\\d{1,3})?$`
);

// SVG/HTML 着色属性：`fill="#FF0000"` 的值是一段裸字面量，既不是 CSS 声明也不是带 `:` 的字符串，
// 所以在旧的 decl/literal/class 三支里全部隐形（R01/fail 的第 2 行就是这个漏网样本）。
// tag 事实的 attrs 才是它的落点。
const COLOR_ATTRS = ["fill", "stroke", "stop-color", "stopColor", "flood-color", "lighting-color", "color", "bgcolor"];

function hit(text, { declMode }) {
  const t = String(text ?? "").replace(/["']/g, "");
  if (!t || isTokenRef(t)) return false;
  if (FN.test(t) && declMode) return true;
  if (HEX.test(t) && (declMode || COLOR_CTX.test(text))) return true;
  if (declMode && NAMED.test(t)) return true;
  return false;
}

export const rule = {
  id: "R01", title: "raw-color", layers: ["component", "feature", "demo"],
  facts: ["decl", "literal", "class", "tag"],
  offInDemo: false,
  check(f) {
    if (f.type === "class") {
      if (/^(?:text|bg|border|fill|stroke|ring|outline|shadow)-\[#[0-9a-fA-F]{3,8}\]$/.test(f.token))
        return [{ line: f.line, message: "Tailwind 任意值裸色值", fix: "bg-surface / text-critical" }];
      if (TW_NAMED.test(f.token))
        return [{ line: f.line, message: `Tailwind 命名色 ${f.token}（不随主题/舞台覆盖）`, fix: "bg-surface / text-critical / border-line" }];
      return [];
    }
    if (f.type === "tag") {
      const out = [];
      for (const attr of COLOR_ATTRS) {
        const v = f.attrs?.[attr];
        if (!v || isTokenRef(v)) continue;
        if (HEX.test(v) || FN.test(v))
          out.push({ line: f.line, message: `${attr} 属性裸色值 ${v}`, fix: "fill=currentColor / var(--m-fg)" });
      }
      return out;
    }
    // 计划缺陷修正（brief §R01）：字面量里 `background: rgba(...)` 形如 CSS 声明，理应享有 declMode。
    // 最小改动：仅当字面量含 `:` 时按 declMode 处理（不会误伤 R01/pass 的 `"#1042"`/`"Order #A1B2"`/`"#FB"`）。
    // `fill="#FF0000"` 这类属性上下文不再依赖本分支——它由上面的 tag 事实接管。
    const declMode = f.type === "decl" || (f.type === "literal" && /:/.test(f.text));
    const raw = f.type === "decl" ? f.value : f.text;
    return hit(raw, { declMode })
      ? [{ line: f.line, message: "裸色值", fix: "var(--m-fg) / bg-primary / text-critical" }] : [];
  },
};
