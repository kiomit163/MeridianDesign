/**
 * R17 文档数字门：规范文档里的字重/字号必须写 token 名，不写裸数字。
 *
 * 两类命中：
 *   1. 裸字重 450/550/650 —— 本系统不交付 @font-face，这三个档位在 Windows 塌陷成 400/700；
 *   2. `font-size: 14px` / `字号：16px` 这类声明式尺寸 —— 值只应存在于 tokens.css 与 docs/03 映射表。
 * 不计入的情况（按计划 §2.4 的"区段例外/禁令语境"要求）：
 *   - 时长：`450ms`、`450–600ms`、`--m-duration-450`（与字重同数不同义）；
 *   - 反例论证：行内或所在小节标题含 放弃/禁止/never/塌陷/回落 等；
 *   - 历史文档：CHANGELOG、MIGRATION-*、根目录审计报告、docs/superpowers（记录过去，不是当下规范）。
 */
const WEIGHT = /\b(?:450|550|650)\b/;
const DURATION = /--m-duration-[\d|]+|\b\d+(?:\.\d+)?\s*[–—-]\s*\d+(?:\.\d+)?\s*ms\b|\b\d+(?:\.\d+)?\s*ms\b/gi;
const NEGATIVE = /(?:放弃|禁止|不得|never|塌陷|回落|拒绝|已弃用|已退役|反例)/i;
const SIZE_DECL = /(?:font-size|line-height)\s*[:：]\s*\d|(?:字号|行高)\s*[:：]\s*\d/;
const HISTORICAL = [/^CHANGELOG\.md$/, /^MIGRATION-[^/]*\.md$/, /^AUDIT-[^/]*\.md$/, /^docs\/superpowers\//];

export const rule = {
  id: "R17", title: "doc-numeric-tokens", layers: ["doc"], facts: ["numeric"],
  check(f, ctx) {
    const path = ctx.file.path.replace(/\\/g, "/");
    if (HISTORICAL.some((re) => re.test(path))) return [];
    const text = String(f.text ?? "");
    const exempt = NEGATIVE.test(text) || NEGATIVE.test(f.heading ?? "");
    const out = [];
    if (SIZE_DECL.test(text) && !exempt)
      out.push({
        line: f.line,
        message: "字号/行高写成裸数字——规范文档必须给 token 名",
        fix: "改 --m-text-* / --m-leading-*；数值只留在 tokens.css 与 docs/03 的映射表",
      });
    const stripped = text.replace(DURATION, "");
    if (WEIGHT.test(stripped) && !exempt)
      out.push({
        line: f.line,
        message: "裸字重数字 450/550/650——本系统只交付 400/500/600/700",
        fix: "改 --m-weight-regular|medium|semibold|bold",
      });
    return out;
  },
};
