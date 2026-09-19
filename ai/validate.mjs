#!/usr/bin/env node
/**
 * MERIDIAN — 设计合规校验器（AI coding 伙伴的第一道防线）
 *
 * 用法:  node validate.mjs <src-dir> [--json]
 * 退出码: 0 = 通过，1 = 存在违规
 *
 * 校验的确定性规则（与 AGENTS.md 规则一一对应）:
 *   R1  组件代码禁止裸色值（#hex / rgb( / hsl( / oklch(）
 *   R2  禁止自造 z-index 数值（只允许 var(--m-z-*) 或 0/-1）
 *   R3  禁止自造 transition 时长/缓动（只允许 var(--m-duration-*) / var(--m-ease-*)）
 *   R4  禁止 !important（tokens.css 的 reduced-motion 块除外）
 *   R5  间距类（p/m/gap）禁止使用 4px 网格外的任意值（p-[7px] 等）
 *   R6  图标按钮/可点元素缺失 aria-label（抽查 data-icon-only 模式）
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--")) || "src";
const asJson = args.includes("--json");
/**
 * 设计系统资产文件：原始色值只允许出现在这里。
 * - tokens.css / tokens.json / tailwind-theme.css：令牌定义层
 * - meridian-ui.css：参考组件库（含两类文档化例外：第三方钱包品牌锁定色、代码块语法色板）
 * 业务代码（src/）一律不得出现裸色值。
 */
const TOKEN_FILES = /tokens\.css|tailwind-theme\.css|tokens\.json|meridian-ui\.css|\.mimosa/i;

const CODE_EXTS = new Set([".tsx", ".ts", ".jsx", ".js", ".vue", ".svelte", ".html", ".css"]);

function walk(d, out = []) {
  for (const name of readdirSync(d)) {
    if (name === "node_modules" || name === ".git" || name.startsWith(".")) continue;
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const RULES = [
  {
    id: "R1-raw-color",
    /**
     * 只在"值位置"检测 hex（前置 : ( , ' " 之一），避免把业务数据误判为颜色：
     *   color: #fff  ✅ 命中      fill="#FF0000" ✅ 命中      (#fff) ✅ 命中
     *   Invoice #1042 ❌ 不命中（空格后、非值位置）  Order #A1B2 ❌ 不命中
     * rgb()/hsl()/oklch() 无歧义，保持宽松匹配。
     */
    test: /(?::|\(|,|'|")\s*#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|(?::|\(|,|'|")\s*(?:\brgba?\(|\bhsla?\(|\boklch\()/,
    files: (p) => CODE_EXTS.has(extname(p)),
    skip: (c) => TOKEN_FILES.test(c),
    message: "裸色值。请改用语义 token：var(--m-fg) / bg-primary / text-critical 等。",
  },
  {
    id: "R2-raw-zindex",
    test: /z-index\s*:\s*(?!var\(|auto|0\b|-1\b)\d+/,
    files: (p) => CODE_EXTS.has(extname(p)),
    skip: (c) => TOKEN_FILES.test(c),
    message: "自造 z-index。只允许 var(--m-z-raised|nav|drawer|modal|toast|tooltip)。",
  },
  {
    id: "R3-raw-motion",
    test: /(?:transition|animation)(?:-duration)?\s*:\s*(?!var\(|inherit|0(?:\.0\d*)?m?s\b)(?:[\d.]+m?s)/,
    files: (p) => CODE_EXTS.has(extname(p)),
    skip: (c) => TOKEN_FILES.test(c),
    message: "自造时长。请使用 var(--m-duration-100|150|200|300|450|600)。",
  },
  {
    id: "R4-important",
    test: /!important/,
    files: (p) => CODE_EXTS.has(extname(p)),
    skip: (c) => TOKEN_FILES.test(c) || /reduced-motion/.test(c),
    message: "!important 禁止使用（reduced-motion 兜底除外）。",
  },
  {
    id: "R5-offgrid-spacing",
    test: /\b[pm][trblxy]?-\[\s*(?!0|var\()(?:[\d.]+)(?:px|rem)\s*\]/,
    files: (p) => /\.(tsx|jsx|vue|svelte|html)$/.test(extname(p)),
    skip: () => false,
    message: "脱离 4px 网格的任意间距。请使用标准间距（1..24）或 var(--m-space-*)。",
  },
  {
    id: "R6-icon-only-a11y",
    test: /(?:icon-button|IconOnlyButton|aria-hidden="true"\s*>\s*<svg)/,
    files: (p) => /\.(tsx|jsx|vue|svelte)$/.test(extname(p)),
    skip: () => false,
    message: "疑似纯图标按钮：必须携带可读的 aria-label。",
  },
];

const files = statSync(dir).isDirectory() ? walk(dir) : [dir];
const violations = [];

for (const file of files) {
  const ext = extname(file);
  if (!CODE_EXTS.has(ext)) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const rule of RULES) {
    if (!rule.files(file)) continue;
    if (rule.skip && rule.skip(file)) continue;
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (rule.test.test(line)) {
        violations.push({ rule: rule.id, file: relative(process.cwd(), file), line: i + 1, message: rule.message });
      }
    });
  }
}

if (asJson) {
  console.log(JSON.stringify({ ok: violations.length === 0, count: violations.length, violations }, null, 2));
} else if (violations.length === 0) {
  console.log("✓ Meridian 设计合规校验通过（0 violations）");
} else {
  console.error(`✗ ${violations.length} 处设计违规：\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}:${v.line} — ${v.message}`);
  }
  process.exit(1);
}
