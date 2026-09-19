const DENY = new Set(["onlyPositive", "hideNegative", "filterNegative", "suppressUnfavorable"]);
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
    return [];
  },
};
