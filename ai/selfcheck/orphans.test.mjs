import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 孤儿 token 守卫（spec S2 R-26 / D8）：
// 非 primitive 的 --m-* token 必须被实现层或演示层消费，或在显式白名单内。
// 白名单外的孤儿 = 声明了却没人用的死配置。消费或加白名单（附理由），禁止删 token（删除 = MAJOR）。

const files = ["ai/tokens.css", "ai/meridian-ui.css", "ai/tailwind-theme.css", "design-system.html"];
const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
const defined = [...text.matchAll(/^\s*(--m-[\w-]+)\s*:/gm)].map((m) => m[1]);
const used = new Set([...text.matchAll(/var\((--m-[\w-]+)/g)].map((m) => m[1]));
// primitive 色带是设计者的调色盘，允许无实现消费者（设计系统惯例）
const PRIM = /^--m-(ink|brand|accent|info|success|warning|danger|mystic)-\d+$/;
// 业务代码 API 面：实现层按定义不消费，由业务侧取用（响应式 clamp、断点、M3 完备公式成员、半径菜单端点）
const API_SURFACE = new Map([
  // 间距/断点/时长大档：响应式与业务侧取用
  ["--m-space-0", "间距刻度成员（0 基线）"],
  ["--m-space-16", "间距刻度成员"], ["--m-space-20", "间距刻度成员"], ["--m-space-24", "间距刻度成员"],
  ["--m-space-section", "前台区块响应式节奏（clamp）"],
  ["--m-bp-xs", "断点（JS/媒体查询取值）"], ["--m-bp-sm", "断点（JS/媒体查询取值）"],
  ["--m-bp-md", "断点（JS/媒体查询取值）"], ["--m-bp-lg", "断点（JS/媒体查询取值）"],
  ["--m-bp-xl", "断点（JS/媒体查询取值）"],
  ["--m-radius-2xl", "半径菜单端点（前台大模态）"],
  ["--m-duration-600", "时长阶梯端点（前台表达性）"],
  ["--m-state-dragged", "M3 公式完备集成员（拖拽态）"],
  // 语义/组件层白名单（各有明确理由）
  ["--m-fg-inverse", "业务自定义深底（scrim、营销区块）上的反白文本语义位"],
  ["--m-badge-py", "组件覆盖点：业务加大徽章高度时配套调节纵向内边距"],
  ["--m-toast-duration", "JS 行为层钩子：meridian-ui.css §11 约定 getComputedStyle 读取（S4 行为层落地）"],
]);

test("非 primitive token 无孤儿（白名单制，D8 回归）", () => {
  const orphans = [...new Set(defined)].filter(
    (t) => !PRIM.test(t) && !API_SURFACE.has(t) && !used.has(t)
  );
  assert.deepEqual(orphans, [], `孤儿 token（消费或加白名单）: ${orphans.join(", ")}`);
});
