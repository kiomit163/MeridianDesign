import { toPx, isTokenRef } from "../lib/scale.mjs";
const OK = /^\s*(?:inherit|large|small|medium|unset|initial)/;
export const rule = {
  id: "R08", title: "font-size-floor", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (f.prop !== "font-size" || isTokenRef(f.value) || OK.test(f.value)) return [];
      const px = toPx(f.value);
      if (px === null || /%|em$/.test(f.value.trim())) return [];
      return px < 12 ? [{ line: f.line, message: `字号 ${px}px 低于 12px 地板（零例外）`, fix: "var(--m-text-xs) = 12px" }] : [];
    }
    const arb = f.token.match(/^text-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1])) {
      const px = toPx(arb[1]);
      if (px !== null && px < 12) return [{ line: f.line, message: `字号 ${px}px 低于 12px 地板`, fix: "text-xs" }];
    }
    return [];
  },
};
