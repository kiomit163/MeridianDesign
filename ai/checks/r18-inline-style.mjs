// R18 · 内联样式预算（Batch 2 · 2.3）。
// 页面只挂类，布局住在组合层：`<div style="display:grid;gap:8px">` 让组合层的类永远等不到消费者
// （2.1 的 G-231 只能看见"类没人用"，看不见"页面自己又写了一遍"）。
// 存量 764 条按文件登记在 ai/selfcheck/r18-baseline.json（账本必须与实测全等，只减不增）；
// 布局类声明在消息里单列，作为清偿顺序——不是另一套阈值。
const LAYOUT = /(?:^|[;{,])\s*(?:display|grid(?:-[a-z-]+)?|flex(?:-[a-z-]+)?|padding(?:-[a-z-]+)?|margin(?:-[a-z-]+)?|(?:row-|column-)?gap|font-size)\s*:/i;

export const rule = {
  id: "R18", title: "inline-style-budget", layers: ["feature"], facts: ["tag"],
  // 同一行可以有多个带 style 的标签；它们各是一笔债，不能按"同规则同位置同消息"折叠。
  dedupe: false,
  check(f) {
    const style = String(f.attrs.style ?? "").trim();
    if (!style) return [];
    const layout = LAYOUT.test(style);
    return [{
      line: f.line,
      message: layout
        ? `<${f.name}> 内联布局声明（display/grid/flex/padding/margin/gap/font-size）——迁入组合层类，页面只挂类名`
        : `<${f.name}> 内联样式——预算只减不增，优先清偿布局声明`,
      fix: "把声明移入 ai/site.css 或 ai/admin.css 的组合类；补齐后在 r18-baseline.json 下调该文件额度",
    }];
  },
};
