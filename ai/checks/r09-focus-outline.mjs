export const rule = {
  id: "R09", title: "focus-outline-removed", layers: ["component", "feature", "demo"], facts: ["decl"],
  check(f) {
    if (f.prop !== "outline" || f.selector?.includes("focus-within")) return [];
    return /^\s*(?:none|0|0px)\s*$/.test(f.value)
      ? [{ line: f.line, message: "移除 outline 且焦点指示不在本选择器上", fix: "依赖 tokens.css 的 outline 焦点环；确需移除请加 meridian-allow 理由" }] : [];
  },
};
