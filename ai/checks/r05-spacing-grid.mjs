import { toPx, onSpacingGrid, SPACING_STANDARD_PX } from "../lib/scale.mjs";
import { stripVars } from "../lib/parse-css.mjs";
const PROPS = /^(?:margin|padding|gap|row-gap|column-gap|grid-gap|inset-block-size)$/;
const CLASS = /^(?:-)?([pm][trblxy]?|gap|space[xy]?)-\[([^\]]+)\]$/;
const CLASS_STD = /^(?:-)?(?:[pm][trblxy]?|gap)-([\d.]+)$/;

export const rule = {
  id: "R05", title: "offgrid-spacing", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    const offenders = (text) => stripVars(text).split(/\s+/)
      .map((tok) => toPx(tok)).filter((px) => px !== null && !onSpacingGrid(px));
    if (f.type === "decl") {
      if (!PROPS.test(f.prop)) return [];
      const bad = offenders(f.value);
      return bad.length ? [{ line: f.line, message: `脱 4px 网格：${bad.map((p) => p + "px").join(", ")}`, fix: "p-4 / var(--m-space-4)" }] : [];
    }
    const arb = f.token.match(CLASS);
    if (arb) {
      const px = toPx(arb[2]);
      if (px !== null && !onSpacingGrid(px)) return [{ line: f.line, message: `脱 4px 网格：${f.token} = ${px}px`, fix: "p-4 / p-[var(--m-space-4)]" }];
      return [];
    }
    const std = f.token.match(CLASS_STD);
    if (std && std[1] in SPACING_STANDARD_PX) {
      const px = SPACING_STANDARD_PX[std[1]];
      if (!onSpacingGrid(px)) return [{ line: f.line, message: `${f.token} = ${px}px 脱 4px 网格`, fix: "取标准步（2/4/8/12/16…）" }];
    }
    return [];
  },
};
