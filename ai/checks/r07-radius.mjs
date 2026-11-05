import { isTokenRef, RADIUS_MENU } from "../lib/scale.mjs";
const OK = /^\s*(?:0|9999px|50%|inherit|none|var\(|calc\(var\()/;

// 语境门：菜单合规不代表档位选对。前台大幅商品图/卡媒体必须 ≥ lg(12px)；
// 缩略图、购物车行、头像等 UI 小图不受此门约束（它们本来就应该更紧）。
const LARGE_MEDIA = /(?:\.sf-gallery__main|\.sf-hero__figure|\.sf-mediaband|\.sf-editorial__media|\.sf-post|\.sf-prose\s+figure|\.m-product-card)\b/;
const RADIUS_PX = { none: 0, xs: 2, sm: 4, md: 8, lg: 12, xl: 16, "2xl": 24, pill: 9999, full: 9999 };
function menuRadiusPx(value) {
  const m = String(value).trim().match(/^var\(\s*--m-radius-([\w-]+)\s*\)$/);
  return m ? RADIUS_PX[m[1]] ?? null : null;
}

export const rule = {
  id: "R07", title: "raw-radius", layers: ["component", "feature", "demo"], facts: ["decl", "class"],
  check(f) {
    if (f.type === "decl") {
      if (!/^border-radius(?:-[a-z-]+)*$/.test(f.prop)) return [];
      if (LARGE_MEDIA.test(f.selector ?? "")) {
        const px = menuRadiusPx(f.value);
        if (px !== null && px < RADIUS_PX.lg)
          return [{ line: f.line, message: `大幅商品图/卡媒体圆角 ${f.value} 低于 lg（12px）`, fix: "var(--m-radius-lg|xl)" }];
      }
      if (OK.test(f.value) || isTokenRef(f.value)) return [];
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
