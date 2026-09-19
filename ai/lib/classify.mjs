const DEFINE_RE = /(^|\/)([\w.-]*tokens\.(css|json)|tailwind-theme\.css)$/;
const COMPONENT = new Set(["ai/meridian-ui.css"]);
const DEMO = new Set(["design-system.html"]);
export const CODE_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".vue", ".svelte", ".html", ".css"]);

export function classify(path, cfg = { ignore: [] }) {
  // 契约：入参须为仓库相对路径（Task 6 遍历器负责 path.relative(repoRoot, abs)）；绝对路径与含 ".." 段的路径超出契约，本函数不解析。
  const p = path.replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/^\//, "");
  const parts = p.split("/");
  const listed = cfg.ignore ?? [];
  if (listed.some((ig) => parts.includes(ig) || p.startsWith(ig + "/"))) return "ignore";
  if (parts.some((seg) => seg !== "." && seg.startsWith("."))) return "ignore";
  if (COMPONENT.has(p)) return "component";
  if (DEMO.has(p)) return "demo";
  if (DEFINE_RE.test(p)) return "define";
  const dot = p.lastIndexOf(".");
  const ext = dot < 0 ? "" : p.slice(dot);
  if (ext === ".md") return "doc";
  if (CODE_EXT.has(ext)) return "feature";
  return "ignore";
}
