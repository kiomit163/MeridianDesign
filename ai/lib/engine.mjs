/**
 * 规则引擎：规则 × 事实 → 违规，外加行级 allow 的消耗与失效检测。
 *
 * 引擎不认识任何规则 id：demo 层豁免来自规则自己的 `offInDemo` 布尔，
 * define/component 层的取舍写在规则的 `layers` 里。任何"隐式白名单"都会成为下一个 v1 假绿。
 */
// doc 层不收集 allows（O8，S2）：文档里的 marker 语法示例不是被审计代码。
import { collectAllows } from "../checks/allow.mjs";

// 跨行声明的行号由解析器给（首行），标记写在结尾行也要能命中，故留 ±2 行的窗口。
const near = (a, b) => Math.abs(a - b) <= 2;

export function run({ files, rules, cfg = {}, fs = null }) {
  const violations = [], staleAllows = [];
  // 同 (rule, file, line, raw.message) 在单次 run() 内只记一次：R01/R11 这类 prop-agnostic
  // 规则会在 class token / literal / decl 三条事实通道上同时命中，通道之间的事实携带相同的
  // raw.message，引擎不该把它们渲染成 N 条重复违规。key 用规则自己写的 message 字符串（而非
  // 模板化后的版本），保证"同一规则、同一定位、同一定性"只冒一次；不同 primitive / 不同 fix
  // 路径会得到不同的 message，留给排序与展示去重无意义。
  // 作用域：仅本函数调用内（Set 在此声明），不跨 run() 共享——T10 的 --emit-manifest 依赖
  // run() 是纯函数。
  const seen = new Set();
  for (const src of files) {
    // Windows 下 `f.path` 可能是反斜杠形态（Git Bash 的 join / path.relative）。
    // 归一一次，输出与 ctx 共用同一个视图，否则 manifest 与 rules.test 的 key() 会整表假红。
    const file = { ...src, path: src.path.replace(/\\/g, "/") };
    // O8（S2）：文档不是被审计代码——文档里的 `meridian-allow` 只是语法示例文本，
    // 收集它只会造出永远消耗不掉的假 stale。doc 层直接给空 allows。
    const allows = file.layer === "doc"
      ? { byLine: new Map(), regions: [] }
      : collectAllows(file.text ?? "");
    const used = new Set();
    for (const fact of file.facts) {
      for (const rule of rules) {
        if (!rule.layers.includes(file.layer)) continue;
        if (!rule.facts.includes(fact.type)) continue;
        if (file.layer === "demo" && rule.offInDemo) continue;
        for (const raw of rule.check(fact, { cfg, file, fs, allows }) ?? []) {
          const line = raw.line ?? fact.line;
          const key = `${rule.id}|${file.path}|${line}|${raw.message}`;
          if (seen.has(key)) continue;
          // D3（S2）：消耗"未消耗且行距最近"的 marker。原先 find() 只取第一个 ±2 行内的 marker，
          // 相邻两处违规会同时命中同一个 marker（先行者吸收后来者），后来者自己的 marker 永不消耗 → 假 stale。
          const marker = [...allows.byLine.keys()]
            .filter((l) => !used.has(l) && near(l, line))
            .sort((a, b) => Math.abs(a - line) - Math.abs(b - line))[0];
          if (marker !== undefined) { used.add(marker); seen.add(key); continue; }
          seen.add(key);
          violations.push({ rule: rule.id, file: file.path, line, message: raw.message, fix: raw.fix });
        }
      }
    }
    for (const [line, reason] of allows.byLine) if (!used.has(line)) staleAllows.push({ file: file.path, line, reason });
  }
  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  staleAllows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { violations, staleAllows };
}

/** baseline 是"已记账的存量违规数"，只按 `文件|规则` 计数消耗，不看行号——行号会随任何一次编辑漂移。 */
export function applyBaseline(violations, baseline) {
  if (!baseline) return { violations, suppressed: 0 };
  const left = { ...baseline };
  const out = [];
  let suppressed = 0;
  for (const v of violations) {
    const key = `${v.file}|${v.rule}`;
    if ((left[key] ?? 0) > 0) { left[key]--; suppressed++; continue; }
    out.push(v);
  }
  for (const [key, n] of Object.entries(left)) if (n > 0) console.error(`baseline 记账过剩：${key} 剩余 ${n}，请收紧 baseline 文件`);
  return { violations: out, suppressed };
}

export function format(violations, mode, staleAllows = []) {
  const fail = violations.length > 0 || staleAllows.length > 0;
  if (mode === "json")
    return JSON.stringify({ ok: !fail, count: violations.length, staleAllows, violations }, null, 2);
  if (mode === "sarif")
    return JSON.stringify({ version: "2.1.0", runs: [{ tool: { driver: { name: "meridian-validate", version: "2.0.0",
      rules: [...new Set(violations.map((v) => v.rule))].map((id) => ({ id })) } },
      results: violations.map((v) => ({ ruleId: v.rule, message: { text: v.message },
        locations: [{ physicalLocation: { artifactLocation: { uri: v.file }, region: { startLine: v.line } } }] })) }] }, null, 2);
  if (!fail) return "✓ Meridian 设计合规校验通过（0 violations）";
  const head = `✗ ${violations.length} 处设计违规：\n`;
  const body = violations.map((v) => `  [${v.rule}] ${v.file}:${v.line} — ${v.message}${v.fix ? `\n           → ${v.fix}` : ""}`).join("\n");
  const tail = staleAllows.length ? `\n\n⚠ ${staleAllows.length} 条 meridian-allow 已失效（删除标记或恢复违规代码）：\n`
    + staleAllows.map((s) => `  ${s.file}:${s.line} — ${s.reason}`).join("\n") : "";
  return head + body + tail;
}
