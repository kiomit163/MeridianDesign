export const rule = {
  id: "R04", title: "no-important", layers: ["define", "component", "feature", "demo"], facts: ["decl"],
  check(f) {
    return /!\s*important/.test(f.value)
      ? [{ line: f.line, message: "!important 禁止（唯一例外须行级标注理由）", fix: "/* meridian-allow: reduced-motion-contract */" }] : [];
  },
};
