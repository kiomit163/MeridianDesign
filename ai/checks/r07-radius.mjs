import { isTokenRef, RADIUS_MENU } from "../lib/scale.mjs";
const OK = /^\s*(?:0|9999px|50%|inherit|none|var\(|calc\(var\()/;
export const rule = {
  id: "R07", title: "raw-radius", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (!/^border-radius(?:-[a-z-]+)*$/.test(f.prop) || OK.test(f.value) || isTokenRef(f.value)) return [];
      return [{ line: f.line, message: `自造圆角 ${f.value}`, fix: "var(--m-radius-md) 等菜单值" }];
    }
    const arb = f.token.match(/^rounded(?:-[trblxy]{1,4})?-\[([^\]]+)\]$/);
    if (arb && !isTokenRef(arb[1]) && !OK.test(arb[1])) return [{ line: f.line, message: `自造圆角：${f.token}`, fix: "rounded-md" }];
    // 命名级也查：Tailwind 自带 rounded-3xl/4xl… 不在 Meridian 菜单内（docs/04 §五 只有 xs/sm/md/lg/xl/2xl/pill）
    const named = f.token.match(/^rounded(?:-[trblxy]{1,4})?-?(none|full|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl)$/);
    if (named && !RADIUS_MENU.includes(named[1]))
      return [{ line: f.line, message: `${f.token} 不在圆角菜单内`, fix: "rounded-xs|sm|md|lg|xl|2xl|full" }];
    return [];
  },
};
