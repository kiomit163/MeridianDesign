import { isTokenRef } from "../lib/scale.mjs";

// R16 · 行高必须走 token（docs/03 §三/§四.3）。
// 组件层（meridian-ui.css）与组合层/业务层（site.css / admin.css / 原型 / TSX）
// 禁止裸 line-height：行高是字阶的一部分，散落字面量会让“字阶是有限菜单”失效。
const KEYWORD = /^\s*(?:inherit|normal|initial|unset|revert|revert-layer)\s*$/i;

export const rule = {
  id: "R16", title: "line-height-token", layers: ["component", "feature", "demo"], facts: ["decl"],
  check(f) {
    if (f.type !== "decl" || f.prop !== "line-height") return [];
    if (isTokenRef(f.value) || KEYWORD.test(f.value)) return [];
    return [{
      line: f.line,
      message: `裸行高：${f.value}（行高必须来自字阶/光学 token）`,
      fix: "var(--m-leading-lg) / var(--m-leading-title-2) / var(--m-leading-copy) 等",
    }];
  },
};
