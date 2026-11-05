const DENY = new Set(["onlyPositive", "hideNegative", "filterNegative", "suppressUnfavorable"]);
const PROVENANCE = new Set(["photograph", "ai-generated", "ai-retouched", "illustration"]);
const AI_PROVENANCE = new Set(["ai-generated", "ai-retouched"]);
const DISCLOSURE = new Set(["badge", "caption"]);
export const rule = {
  id: "R13", title: "commerce-compliance-props", layers: ["feature"], facts: ["tag"],
  check(f, ctx) {
    const aliases = ctx.cfg?.componentAliases ?? {};
    const groups = { Urgency: ["Urgency"], Price: ["Price"], ReviewItem: ["ReviewItem"] };
    const as = (g) => [...(groups[g] ?? []), ...(aliases[g] ?? [])];
    const n = f.name, a = f.attrs, one = (message, fix) => [{ line: f.line, message, fix }];
    if (as("Urgency").includes(n) && !("verified" in a))
      return one("Urgency 缺 verified —— 无 verified 必须渲染为空（假紧迫感禁令）", "verified={true}");
    if (as("Price").includes(n)) {
      if (!("market" in a)) return one("Price 缺 market —— 税制/千分位/符号位置由市场决定", 'market="US"');
      if ("compareAt" in a && !("compareAtVerified" in a))
        return one("compareAt 未与 compareAtVerified 成对（Omnibus 30 天最低价须后端校验）", "compareAtVerified");
    }
    if (as("ReviewItem").includes(n)) {
      const bad = Object.keys(a).filter((k) => DENY.has(k));
      if (bad.length) return one(`ReviewItem 不接受压制差评的参数：${bad.join(", ")}`, "删除该参数");
    }
    if (n === "img" || n === "video") {
      if (!("data-provenance" in a))
        return one("影像缺 data-provenance —— 来源必须登记（docs/10 §2.4）", 'data-provenance="photograph|ai-generated|ai-retouched|illustration"');
      const p = a["data-provenance"];
      if (!PROVENANCE.has(p))
        return one(`未知影像来源 ${p}`, "photograph|ai-generated|ai-retouched|illustration");
      if (AI_PROVENANCE.has(p) && !("data-provenance-disclosure" in a))
        return one("AI 影像缺可见披露挂点 —— 必须渲染 badge 或 caption", 'data-provenance-disclosure="badge"');
      if ("data-provenance-disclosure" in a && !DISCLOSURE.has(a["data-provenance-disclosure"]))
        return one(`未知披露形式 ${a["data-provenance-disclosure"]}`, 'data-provenance-disclosure="badge|caption"');
    }
    return [];
  },
};
