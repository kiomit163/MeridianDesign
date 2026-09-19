const INTERACTIVE = new Set(["button", "a", "summary"]);
export const rule = {
  id: "R10", title: "icon-only-needs-name", layers: ["feature"], facts: ["tag"],
  check(f) {
    if (!INTERACTIVE.has(f.name.toLowerCase())) return [];
    if (!/<svg[\s/>]/i.test(f.inner)) return [];
    if (f.attrs["aria-label"] || f.attrs["aria-labelledby"] || f.attrs.title) return [];
    if (f.attrs.role === "img") return [];
    return f.hasText ? [] : [{ line: f.line, message: `${f.name} 内只有图标且无可访问名称`, fix: 'aria-label="Close"' }];
  },
};
