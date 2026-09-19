#!/usr/bin/env node
/**
 * MERIDIAN — 设计合规校验器（AI coding 伙伴的第一道防线）
 *
 * 用法:
 *   node ai/validate.mjs <target…> [--json|--sarif] [--only=R11,R13] [--ignore <seg>] [--exclude <seg>]
 *                        [--baseline <file>] [--emit-manifest <file>]
 * 退出码: 有有效违规或有失效 allow → 1，否则 0。**与输出模式无关**
 *         （v1 的 `--json` 恒退出 0，等于把门禁换成一条会撒谎的绿线 —— 此处正面修掉。）
 *
 * 分工：`lib/classify.mjs` 分层 → `lib/facts.mjs` 事实装配 → `lib/engine.mjs` 规则×事实 →
 *       `checks/*.mjs` 规则本体（`checks/index.mjs` 注册）。本文件只做参数、遍历、报告与退出码。
 *
 * 契约：遍历产出的路径必须是**仓库相对 + 正斜杠 + 无 `./` 前缀**，因为 `classify()` 的
 *       `component` / `demo` 层是精确串匹配（`ai/meridian-ui.css`、`design-system.html`）。
 *       形式一变这两层就静默降级，v1 的自我失明了换个输入形式复辟。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { classify } from "./lib/classify.mjs";
import { factsFor, buildFs } from "./lib/facts.mjs";
import { run, applyBaseline, format } from "./lib/engine.mjs";
import { rules } from "./checks/index.mjs";

// CLI 在仓库根执行：`meridian.config.json` 与 classify 的相对路径都以它为基准。
const ROOT = process.cwd();
const rel = (abs) => relative(ROOT, abs).replace(/\\/g, "/");
const die = (msg) => { console.error(`meridian-validate: ${msg}`); process.exit(1); };

/** 取值的标志位——它们后面的那个参数是值，不是目标目录。`--exclude` 必须在此列内。 */
const PREV_TAKES_VALUE = new Set(["--only", "--baseline", "--ignore", "--exclude", "--emit-manifest"]);

export function parseArgs(argv) {
  const val = (n) => {
    const eq = argv.find((a) => a.startsWith(n + "="));
    if (eq !== undefined) return eq.slice(n.length + 1);
    const i = argv.indexOf(n);
    return i < 0 || i + 1 >= argv.length ? undefined : argv[i + 1];   // 缺标志时不得回落到 argv[0]（那是目标参数）
  };
  const many = (n) => argv.flatMap((a, i) =>
    a.startsWith(n + "=") ? [a.slice(n.length + 1)] : a === n && argv[i + 1] !== undefined ? [argv[i + 1]] : []);
  // 首个位置参数语义与 v1 一致；多余的位置参数同样参与本次扫描——计划里 `node ai/validate.mjs ai/tokens.css ai/tokens.json --only=R04`
  // 这类命令真实存在，只取第一个会把没扫的文件当成扫过了（假绿）。
  const targets = argv.filter((a, i) => !a.startsWith("--") && !PREV_TAKES_VALUE.has(argv[i - 1]));
  return {
    targets: targets.length ? targets : ["."],
    mode: argv.includes("--sarif") ? "sarif" : argv.includes("--json") ? "json" : "text",
    only: val("--only")?.split(",").map((s) => s.trim().toUpperCase()),
    ignores: many("--ignore"),
    excludes: many("--exclude"),
    baseline: val("--baseline"),
    manifest: val("--emit-manifest"),
  };
}

/**
 * `--exclude` 是"本次扫描临时跳过"，`cfg.ignore` 是"这些目录不属于被审代码"。
 * T17 全仓验收必须 `--exclude ai/selfcheck/fixtures`（`fail/` 样本故意植红），
 * T10 生成 manifest 时不传，才能把 fixtures 扫出来。两者都必须成立。
 */
export const excludePaths = (paths, excludes) => excludes.length ? paths.filter((p) => !excludes.some((x) => p.includes(x))) : paths;

/** 目录自身没有扩展名，classify 对它一律给 `ignore`；用合成文件名只探"忽略语义"（两种 ignore 写法都由 classify 判）。 */
const ignoredDir = (relPath, cfg) => classify(`${relPath}/x.ts`, cfg) === "ignore";

export function walk(target, cfg = { ignore: [] }) {
  const abs = resolve(ROOT, target);
  const base = rel(abs);
  if (base.startsWith("..")) die(`目标必须落在仓库内（收到 ${target}）：classify 以仓库相对路径为契约`);
  const st = statSync(abs, { throwIfNoEntry: false });
  if (st?.isFile()) return [base];
  if (!st?.isDirectory()) die(`目标不存在：${target}`);
  const out = [];
  const scan = (dirRel, dirAbs) => {
    for (const name of readdirSync(dirAbs)) {
      const p = join(dirAbs, name);
      const r = dirRel ? `${dirRel}/${name}` : name;   // 手工拼正斜杠：不引入 `./`，也不留反斜杠
      const s = statSync(p, { throwIfNoEntry: false });
      if (!s) continue;                                // 断链符号链接：没有内容可审
      if (s.isDirectory()) { if (!ignoredDir(r, cfg)) scan(r, p); continue; }
      out.push(r);
    }
  };
  scan(base, abs);
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = existsSync("meridian.config.json") ? JSON.parse(readFileSync("meridian.config.json", "utf8")) : { ignore: [] };
  if (args.ignores.length) cfg.ignore = [...(cfg.ignore ?? []), ...args.ignores];
  const baselinePath = args.baseline ?? cfg.baseline;
  const baseline = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : null;
  const activeRules = args.only ? rules.filter((r) => args.only.includes(r.id)) : rules;

  const paths = excludePaths(args.targets.flatMap((t) => walk(t, cfg)), args.excludes);
  const files = paths.map((p) => factsFor(p, cfg)).filter((f) => f.layer !== "ignore");
  const raw = run({ files, rules: activeRules, cfg, fs: buildFs(files) });
  const { violations, suppressed } = applyBaseline(raw.violations, baseline);

  if (args.manifest) {
    writeFileSync(args.manifest, JSON.stringify(violations.map(({ rule, file, line }) => ({ rule, file, line })), null, 2));
    console.log(`manifest written: ${violations.length} expected hits`);
    process.exit(0);
  }
  if (suppressed) console.error(`baseline 吸收了 ${suppressed} 处存量违规（${baselinePath}）—— 它只记账，不是豁免`);
  process.stdout.write(format(violations, args.mode, raw.staleAllows) + "\n");
  process.exit(violations.length || raw.staleAllows.length ? 1 : 0);
}

// 导出 `walk` 供测试证明路径契约，但只有被直接执行时才跑 CLI（否则 import 会顺手退出测试进程）。
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
