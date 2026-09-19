export const rule = {
  id: "R12", title: "img-needs-intrinsic-size", layers: ["feature", "demo"], facts: ["tag"],
  check(f) {
    if (f.name.toLowerCase() !== "img") return [];
    const { width, height, class: cls, className } = f.attrs;
    if (width && height) return [];
    if (/(^|\s)aspect-(\[[^\]]+\]|square|video|auto)/.test(String(cls ?? className ?? ""))) return [];
    return [{ line: f.line, message: "<img> 未同时声明 width+height，也无 aspect 类（CLS 预算）", fix: 'width="800" height="1000"' }];
  },
};
