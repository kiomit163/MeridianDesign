import { stripVars } from "../lib/parse-css.mjs";
import { isTokenRef } from "../lib/scale.mjs";
const DUR = /(?<![\w.-])\d+(?:\.\d+)?(?:ms|s)\b/g;
const ZERO = /^0(?:\.0+)?(?:ms|s)$/;
const hasBadDuration = (text) => [...String(text).matchAll(DUR)].filter((m) => !ZERO.test(m[0]));

export const rule = {
  id: "R03", title: "raw-motion", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (!/^(?:transition|animation)(?:-duration)?$/.test(f.prop)) return [];
      const bad = hasBadDuration(stripVars(f.value));
      return bad.length
        ? [{ line: f.line, message: `自造时长 ${bad[0][0]}`, fix: "var(--m-duration-100|150|200|300|450|600)" }] : [];
    }
    const arb = f.token.match(/^duration-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1])) return [{ line: f.line, message: `自造时长：${f.token}`, fix: "duration-[var(--m-duration-150)]" }];
    if (/^duration-\d+$/.test(f.token))
      return [{ line: f.line, message: `Tailwind ${f.token} 未走时长 token`, fix: "duration-[var(--m-duration-150)]" }];
    if (/^ease-(?:linear|in|out|in-out)$/.test(f.token) || (/^ease-\[/.test(f.token) && !isTokenRef(f.token)))
      return [{ line: f.line, message: `自造缓动：${f.token}`, fix: "ease-[var(--m-ease-standard)]" }];
    return [];
  },
};
