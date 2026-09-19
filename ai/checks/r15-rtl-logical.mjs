export const rule = {
  id: "R15", title: "physical-direction", layers: ["component", "feature", "demo"], facts: ["decl"],
  check(f) {
    return /^(?:margin|padding)-(?:left|right)$/.test(f.prop)
      ? [{ line: f.line, message: `${f.prop} 为物理方向属性`, fix: "margin-inline-start / padding-inline-end" }] : [];
  },
};
