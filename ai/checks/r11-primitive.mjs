const PRIM = /--m-(?:ink|brand|accent|info|success|warning|danger|mystic)-\d+\b/g;
export const rule = {
  id: "R11", title: "primitive-forbidden", layers: ["component", "feature", "demo"], facts: ["decl", "class", "literal"],
  offInDemo: false,
  check(f) {
    const hay = f.type === "decl" ? f.value : f.type === "class" ? f.token : f.text;
    const hits = String(hay ?? "").match(PRIM);
    return hits ? [{ line: f.line, message: `feature/component 层引用 primitive：${[...new Set(hits)].join(", ")}`, fix: "改用语义 token（docs/02 §三）" }] : [];
  },
};
