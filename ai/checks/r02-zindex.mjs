import { isTokenRef } from "../lib/scale.mjs";
export const rule = {
  id: "R02", title: "raw-zindex", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (f.prop !== "z-index") return [];
      if (isTokenRef(f.value) || /^\s*(?:auto|0|-1|1)\s*$/.test(f.value)) return [];
      return [{ line: f.line, message: `自造 z-index: ${f.value}`, fix: "var(--m-z-modal) 等六档之一" }];
    }
    const arb = f.token.match(/^z-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1])) return [{ line: f.line, message: `自造 z-index：${f.token}`, fix: "z-[var(--m-z-modal)]" }];
    if (/^z-(?:10|20|30|40|50)$/.test(f.token))
      return [{ line: f.line, message: `Tailwind ${f.token} 不在 z 阶梯上`, fix: "z-[var(--m-z-nav)]" }];
    return [];
  },
};
