import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { Z_LADDER } from "../lib/scale.mjs";

// P1 组件契约一致性守卫：文档声明的尺寸/结构必须在 CSS 与原型里真的存在。
// 这里不复制实现，只钉住"文档 ↔ CSS ↔ 原型"的三方一致性。

const ui = readFileSync("ai/meridian-ui.css", "utf8");
const admin = readFileSync("ai/admin.css", "utf8");
const site = readFileSync("ai/site.css", "utf8");
const tokens = readFileSync("ai/tokens.css", "utf8");
const brand = readFileSync("ai/brand-tokens.css", "utf8");
const plpDoc = readFileSync("storefront/10-storefront-plp.md", "utf8");
const contracts = readFileSync("components/18-component-contracts.md", "utf8");
const adminDoc = readFileSync("admin/14-admin-foundations.md", "utf8");
const tableDoc = readFileSync("admin/15-admin-data-tables.md", "utf8");
const prompts = readFileSync("ai/prompts.md", "utf8");
const plp = readFileSync("prototypes/09-plp.html", "utf8");
const home = readFileSync("prototypes/08-home.html", "utf8");
const pdp = readFileSync("prototypes/10-pdp.html", "utf8");
const checkout = readFileSync("prototypes/11-checkout.html", "utf8");
const demo = readFileSync("design-system.html", "utf8");
const dashboard = readFileSync("prototypes/02-dashboard.html", "utf8");
const behavior = readFileSync("ai/meridian-behavior.js", "utf8");
const a11yDoc = readFileSync("docs/06-accessibility-compliance.md", "utf8");
const colorDoc = readFileSync("docs/02-color-system.md", "utf8");
const tokensJson = readFileSync("ai/tokens.json", "utf8");
const pdpSpec = readFileSync("storefront/11-storefront-pdp.md", "utf8");
const foundationsDoc = readFileSync("storefront/09-storefront-foundations.md", "utf8");

const has = (text, re, msg) => assert.match(text, re, msg);
const not = (text, re, msg) => assert.doesNotMatch(text, re, msg);

test("P1 尺寸：stepper 44 / select 36 / admin nav 32-44", () => {
  has(ui, /\.m-stepper button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/, "stepper 默认必须 44");
  has(ui, /\.m-stepper input\s*\{[^}]*height:\s*44px/, "stepper 输入必须 44");
  has(ui, /\.m-stepper--sm button, \.m-stepper--sm input\s*\{[^}]*height:\s*32px/, "sm 变体保持 32");
  has(plpDoc, /Select 走 `--m-input-h`：桌面 36px，≤767px 自动升到 44px/, "PLP 排序 Select 必须写双口径（桌面 36 / 移动 44），单一 36 是移动端触控缺陷");
  has(contracts, /h-36/, "组件契约必须写 36");
  has(adminDoc, /桌面 32px \/ 移动抽屉 44px/, "后台导航文档必须区分桌面/移动");
  has(admin, /\.ad-sidenav \.m-sidenav a\s*\{[^}]*min-height:\s*32px/, "后台桌面导航 32");
  has(admin, /@media \(max-width: 767px\)[\s\S]*?\.ad-sidenav \.m-sidenav a\s*\{[^}]*min-height:\s*44px/, "后台移动导航 44");
  has(admin, /\.ad-sidenav \.m-sidenav a svg\s*\{[^}]*width:\s*20px/, "后台导航图标 20");
});

test("P1 图标：16 / 20 / 24 三档封闭", () => {
  has(ui, /svg\.m-i\s*\{[^}]*width:\s*20px/, "默认图标 20");
  has(ui, /svg\.m-i--16\s*\{[^}]*width:\s*16px/, "16 档");
  has(ui, /svg\.m-i--24\s*\{[^}]*width:\s*24px/, "24 档");
  has(ui, /\.m-empty svg\s*\{[^}]*width:\s*24px/, "空状态 24（文档承诺）");
  not(ui, /\.m-empty svg\s*\{[^}]*48px/, "空状态不得再用 48");
  has(ui, /\.m-crumbs svg\s*\{[^}]*width:\s*16px/, "面包屑 16");
  has(ui, /\.m-rating \.stars svg\s*\{[^}]*width:\s*16px/, "星级 16");
  not(plp, /width:48px;height:48px/, "原型不得再内联 48px 图标");
  not(pdp, /width:48px;height:48px/, "原型不得再内联 48px 图标");
});

test("P1 密度：comfortable 48 是唯一默认", () => {
  not(adminDoc, /默认密度 productive/, "后台不得再声明 productive 为默认");
  has(adminDoc, /默认密度 comfortable/, "后台文档必须写 comfortable 默认");
  has(tableDoc, /Comfortable \| 48px/, "表格文档必须 48 默认");
  has(prompts, /48px comfortable/, "AI 提示词必须 48 默认");
});

test("P1 Swatch：48 热区 + 24/32 视觉 + 3:1 边界 + 真实品牌色", () => {
  has(ui, /\.m-swatch\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px;[^}]*padding:\s*var\(--m-space-3\)/, "swatch 热区 48");
  has(ui, /\.m-swatch::before\s*\{[^}]*background:\s*var\(--m-swatch-color/, "视觉圆必须消费品牌变量");
  has(ui, /\.m-swatch::before\s*\{[^}]*border:\s*1px solid var\(--m-border-strong\)/, "边界必须 border-strong");
  has(ui, /\.m-swatch--lg::before\s*\{[^}]*inset:\s*var\(--m-space-2\)/, "PDP 视觉 32");
  has(brand, /--m-swatch-oat:/, "品牌色卡必须定义燕麦色");
  has(plpDoc, /热区 ≥44px/, "PLP 文档热区");
  has(contracts, /热区 ≥44×44/, "组件契约热区");
  has(plp, /brand-tokens\.css/, "PLP 必须加载品牌插槽");
  has(pdp, /brand-tokens\.css/, "PDP 必须加载品牌插槽");
  has(checkout, /brand-tokens\.css/, "Checkout 必须加载品牌插槽");
  has(plp, /--m-swatch-color:var\(--m-swatch-oat\)/, "PLP 必须用真实品牌色");
  has(pdp, /--m-swatch-color:var\(--m-swatch-oat\)/, "PDP 必须用真实品牌色");
  not(plp, /色块为占位圆/, "不得再保留占位色块文案");
});

test("P1 Wallet：四个品牌变体存在且对比达标", () => {
  has(checkout, /brand-tokens\.css/, "结账必须加载品牌插槽");
  for (const w of ["shop-pay", "apple-pay", "google-pay", "paypal"]) {
    has(ui, new RegExp(`\\.m-wallet--${w}\\s*\\{`), `缺少 .m-wallet--${w}`);
    has(brand, new RegExp(`--m-wallet-${w}-bg:`), `品牌插槽缺少 ${w} 背景`);
    has(checkout, new RegExp(`m-wallet--${w}`), `结账原型未使用 ${w}`);
  }
  const lum = (h) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      let c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  for (const w of ["shop-pay", "apple-pay", "google-pay", "paypal"]) {
    const bg = brand.match(new RegExp(`--m-wallet-${w}-bg:\\s*(#[0-9A-Fa-f]{6})`))[1];
    const fg = brand.match(new RegExp(`--m-wallet-${w}-fg:\\s*(#[0-9A-Fa-f]{6})`))[1];
    assert.ok(ratio(fg, bg) >= 4.5, `${w} 文字/填充 ${ratio(fg, bg).toFixed(2)} < 4.5`);
  }
});

test("P1 Toast：前台居中 / 后台右下", () => {
  has(ui, /\.stage-admin \.m-toast-stack\s*\{[^}]*inset-inline-start:\s*auto;[^}]*inset-inline-end:\s*var\(--m-space-4\)/, "后台 toast 必须右下");
  not(ui, /:root \.m-toast-stack\s*\{/, "不得用 :root 无条件居中");
});

test("P1 动效：禁止 transition all / 布局属性；抽屉退场 150ms", () => {
  not(ui, /transition:\s*all\b/, "禁止 transition: all");
  not(ui, /transition:\s*(width|height|top|left)\b/, "禁止布局属性过渡");
  has(ui, /\.m-drawer\s*\{[^}]*transition:\s*transform var\(--m-duration-150\) var\(--m-ease-exit\)/, "抽屉退场 150");
  has(ui, /\.m-drawer\.is-open\s*\{[^}]*transition:\s*transform var\(--m-duration-300\) var\(--m-ease-enter\)/, "抽屉入场 300");
  has(ui, /\.m-progress i\s*\{[^}]*transform:\s*scaleX\(var\(--m-progress/, "进度用 transform");
});

test("P1 整卡链接：stretched link，不用嵌套交互", () => {
  has(ui, /\.m-product-card\s*\{[^}]*position:\s*relative/, "卡容器必须定位");
  has(ui, /\.m-product-card \.name::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/, "名称链接必须伸展覆盖整卡");
  has(plpDoc, /stretched link/, "PLP 文档必须写 stretched link");
  has(contracts, /stretched link/, "组件契约必须写 stretched link");
});

test("P1 触达与 320px：OTP 网格 / chip 24 / stepper 44 / 单列折叠", () => {
  has(ui, /\.m-otp\s*\{[^}]*grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)[^}]*max-width:\s*304px/, "OTP 必须 6 列且 ≤304px");
  has(ui, /\.m-chip \.x\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px/, "chip 移除按钮 24");
  has(ui, /\.m-stepper button\s*\{[^}]*width:\s*44px/, "stepper 44");
  has(site, /\.sf-co-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 320px/, "结账双栏基线");
  has(site, /@media \(max-width: 1023px\) \{ \.sf-co-shell \{ grid-template-columns: minmax\(0, 1fr\)/, "结账移动折叠");
  has(site, /\.sf-pdp \{ grid-template-columns: minmax\(0, 1fr\)/, "PDP 移动折叠");
});

test("P1 RTL：组件层关键方向已逻辑化", () => {
  not(ui, /\.m-select-wrap svg\s*\{[^}]*\bright:/, "select 箭头不得用 right");
  not(ui, /\.m-search svg\s*\{[^}]*\bleft:/, "搜索图标不得用 left");
  not(ui, /\.m-table th\s*\{[^}]*text-align:\s*left/, "表头不得用 text-align: left");
  has(ui, /\[dir="rtl"\] \.m-drawer/, "抽屉必须有 RTL 方向");
  has(ui, /\[dir="rtl"\] \.m-switch input:checked \+ \.track::after/, "开关必须有 RTL 方向");
  has(ui, /\[dir="rtl"\] \.m-tooltip \.tip/, "tooltip 必须有 RTL 居中");
  has(site, /\[dir="rtl"\] \.sf-mobilenav/, "移动导航必须有 RTL 方向");
  has(site, /\[dir="rtl"\] \.sf-nav a::after/, "导航下划线必须有 RTL 方向");
});

test("P1 行高：组件层使用 leading token / 文档定义例外", () => {
  has(ui, /\.m-pagehead h1\s*\{[^}]*line-height:\s*var\(--m-leading-2xl\)/, "页面标题行高 token");
  has(ui, /\.m-kpi \.value\s*\{[^}]*line-height:\s*var\(--m-leading-3xl\)/, "KPI 行高 token");
  has(ui, /\.m-product-card \.name\s*\{[^}]*line-height:\s*var\(--m-leading-md\)/, "商品名行高 token");
  has(ui, /\.m-textarea\s*\{[^}]*line-height:\s*var\(--m-leading-md\)/, "textarea 行高 token");
  has(ui, /\.m-composer__input\s*\{[^}]*line-height:\s*var\(--m-leading-sm\)/, "composer 行高 token");
  has(ui, /\.m-price s\s*\{[^}]*font-size:\s*1em/, "划线价不得用 0.9em");
  has(tokens, /--m-code-leading:\s*1\.7/, "代码行高必须 token 化");
});

test("P2 demo chrome：文档外壳不再使用裸色值/离阶字号", () => {
  const chrome = demo.slice(demo.indexOf("<style>"), demo.indexOf("</style>"));
  not(chrome, /#[0-9a-fA-F]{3,6}\b/, "demo chrome 不得有裸 hex");
  not(chrome, /rgb\(/, "demo chrome 不得有裸 rgb");
  not(chrome, /font-size:\s*\d+px/, "demo chrome 字号必须走 --m-text-*");
});

test("P2 封闭阶梯与组件 token：scrim z / seg radius / header heights", () => {
  has(ui, /\.m-scrim\s*\{[^}]*z-index:\s*var\(--m-z-drawer\)/, "scrim 必须复用 z-drawer");
  not(ui, /calc\(var\(--m-z-drawer\) - 1\)/, "不得自造 299");
  has(ui, /\.m-seg button\s*\{[^}]*border-radius:\s*var\(--m-radius-sm\)/, "seg 圆角必须走菜单值");
  not(ui, /calc\(var\(--m-radius-md\) - 2px\)/, "不得自造 6px 圆角");
  has(tokens, /--m-header-h-stuck:\s*3\.5rem/, "header stuck token");
  has(site, /\.sf-header\.is-stuck \.sf-header__inner[^{]*\{[^}]*height:\s*var\(--m-header-h-stuck\)/, "header 收缩消费 token");
  has(site, /height:\s*var\(--m-header-h\)/, "header 桌面高度消费 token");
});

test("P2 WCAG AA 映射与法源可追溯", () => {
  for (const id of ["1.3.1", "1.4.1", "1.4.4", "1.4.5", "2.1.1", "2.1.2", "2.4.1", "2.4.3", "2.4.4", "2.4.6", "3.1.1", "3.2.3", "3.3.2", "4.1.2"])
    has(a11yDoc, new RegExp(id.replace(/\./g, "\\.")), `WCAG AA 映射缺 ${id}`);
  has(a11yDoc, /16 CFR Part 465/, "FTC 法源");
  has(a11yDoc, /2011\/83\/EU/, "EU 撤回权法源");
  has(colorDoc, /CIEDE2000/, "图表色觉安全阈值必须写明");
  has(colorDoc, /chart-cvd\.test\.mjs/, "图表 CVD 必须有回归测试引用");
});

// 行为层与本地化：这些是 runtime-behavior / runtime-l10n 的静态锚点，
// 保证「有契约、有挂载点、有守卫脚本」不会在重构中被悄悄拆掉。
test("P3 行为层：契约文件、挂载点与浮层语义", () => {
  has(behavior, /window\.MeridianBehavior/, "行为层必须暴露 MeridianBehavior");
  for (const attr of ["data-overlay-open", "data-overlay-close", "data-tabs", "data-seg", "data-combobox"])
    has(behavior, new RegExp(attr), `行为层必须绑定 ${attr}`);
  has(behavior, /aria-modal/, "浮层必须设置 aria-modal");
  has(behavior, /\.inert\s*=\s*(true|false)/, "浮层必须用 inert 隔离背景");
  has(behavior, /preventDefault\(\);\s*last\.focus\(\)/, "Tab 必须回绕到末项");
  has(demo, /<script src="ai\/meridian-behavior\.js"><\/script>/, "design-system 必须加载行为层");
  has(demo, /id="drawer"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="drawerTitle"/, "抽屉必须是带名称的模态对话框");
  has(demo, /id="drawer"[^>]*inert/, "关闭态抽屉必须 inert（退出可访问树）");
  has(demo, /data-overlay-open="drawer"/, "抽屉必须由 data 属性打开（焦点归还依赖 trigger）");
  has(demo, /data-combobox/, "组合框必须接入行为层");
  not(demo, /function openDrawer\(/, "不得保留绕过行为层的 openDrawer");
});

test("P3 跳过导航：5 个入口页都有 skip link 与 #main", () => {
  has(ui, /\.m-skip-link\s*\{[^}]*inset-inline-start/, "skip link 必须用逻辑定位");
  has(ui, /\.m-skip-link:focus-visible\s*\{[^}]*translate:\s*0 0/, "skip link 必须焦点时进入视口");
  for (const [name, src] of [["design-system", demo], ["08", home], ["09", plp], ["10", pdp], ["11", checkout], ["02", dashboard]]) {
    has(src, /class="m-skip-link" href="#main"/, `${name} 缺 skip link`);
    has(src, /<main[^>]*id="main"[^>]*tabindex="-1"/, `${name} 缺 #main 焦点落点`);
  }
});

test("P3 移动导航：storefront 页面有可用的菜单入口", () => {
  for (const [name, src] of [["08", home], ["09", plp], ["10", pdp]]) {
    has(src, /class="m-tool m-tool--square sf-burger"[^>]*data-overlay-open="sfm-/, `${name} 缺汉堡按钮`);
    has(src, /class="sf-mobilenav"[^>]*role="dialog"[^>]*aria-modal="true"/, `${name} 缺移动菜单对话框`);
    has(src, /class="sf-mobilenav"[^>]*inert/, `${name} 关闭态菜单必须 inert`);
    has(src, /meridian-behavior\.js/, `${name} 缺行为层脚本`);
  }
  has(site, /\.sf-mobilenav\s*\{[^}]*visibility:\s*hidden/, "关闭态菜单必须退出可访问树");
  has(pdp, /<nav aria-label="店面主导航" class="sf-nav">/, "PDP 主导航必须复用 sf-nav（<1023 收起）");
});

test("P3 店面壳接线：08-11 的公告条与头部必须走组合层类，不得内联手搓", () => {
  // 反向门的最小前身（Batch 2 G-231 的全量版）：site.css 的壳类家族有定义，也必须有消费者。
  const shells = [["08", home], ["09", plp], ["10", pdp], ["11", checkout]];
  for (const [name, src] of shells) {
    has(src, /<div class="sf-announce">/, `${name} 公告条未挂 .sf-announce`);
    has(src, /<div class="sf-announce__inner">/, `${name} 公告条未挂 .sf-announce__inner`);
    has(src, /<header class="sf-header">/, `${name} 头部未挂 .sf-header`);
    has(src, /<div class="sf-header__inner">/, `${name} 头部未挂 .sf-header__inner`);
    has(src, /class="sf-brand sf-wordmark"/, `${name} 字标未挂 .sf-brand`);
    not(src, /<header class="m-chrome"/, `${name} 头部不得退回 m-chrome + 内联壳`);
    not(src, /background:var\(--m-primary\);color:var\(--m-primary-fg\);text-align:center/, `${name} 公告条不得借用前台 primary（A-06）`);
  }
  for (const [name, src] of [["08", home], ["09", plp], ["10", pdp]]) {
    has(src, /<div class="sf-actions">/, `${name} 操作区未挂 .sf-actions`);
    has(src, /<span class="sf-cart-trigger">/, `${name} 购物袋锚点未挂 .sf-cart-trigger`);
    has(src, /<span class="sf-cart-count">/, `${name} 计数未挂 .sf-cart-count`);
    not(src, /<nav aria-label="店面主导航" style=/, `${name} 主导航不得内联样式`);
  }
  // 新增类必须同批带消费者（不变量 7）：.sf-cart-trigger 的定义与 4 个实例锁死
  has(site, /\.sf-cart-trigger\s*\{[^}]*position:\s*relative/, ".sf-cart-trigger 必须是绝对定位锚");
  // .sf-header.is-stuck 是行为类：CSS 有定义就必须有写入点，否则等于装饰性 CSS
  has(site, /\.sf-header\.is-stuck\s*\{[^}]*var\(--m-border\)/, "is-stuck 分割线契约");
  has(behavior, /initStickyHeader[\s\S]{0,400}classList\.toggle\("is-stuck"/, "行为层必须写入 .is-stuck（无写入点=死样式）");
  has(behavior, /initStickyHeader\(root\);/, "is-stuck 写入点必须进 init");
  // 触屏 44px 只作用于真壳：壳类未接线时该规则是装饰（V-07 的机制）
  has(site, /@media \(max-width: 767px\)[\s\S]*?\.sf-header__inner \.m-tool, \.sf-header__inner \.sf-burger\s*\{[^}]*min-(width|height):\s*44px/, "≤767 页头可点区必须 44");
});

test("P3 本地化：长文案与 RTL 的布局约束", () => {
  has(ui, /html\[lang="ar"\] body :where\(\*\)[^{]*\{[^}]*letter-spacing:\s*normal/, "阿拉伯语必须取消字距");
  has(ui, /\.m-btn\s*\{[^}]*min-height:\s*var\(--m-btn-h-md\)/, "按钮高度必须可容纳换行");
  not(ui, /\.m-btn\s*\{[^}]*white-space:\s*nowrap/, "按钮不得锁死单行（长语言会溢出）");
  has(ui, /\.m-btn--sm\s*\{[^}]*min-height:/, "sm 按钮同样用 min-height");
  has(ui, /\.m-cartline\s*\{[^}]*flex-wrap:\s*wrap/, "购物车行必须可换行");
  has(ui, /\.m-card__header\s*\{[^}]*flex-wrap:\s*wrap/, "卡片头必须可换行");
  has(ui, /\.m-crumbs\s*\{[^}]*flex-wrap:\s*wrap/, "面包屑必须可换行");
  has(ui, /@media \(max-width: 767px\)[\s\S]*?\.m-tabs, \.m-seg\s*\{[^}]*overflow-x:\s*auto/, "窄屏标签栏/分段控件必须内部横滚");
  has(ui, /@media \(max-width: 767px\)[\s\S]*?\.m-tabs \.m-tab:focus-visible, \.m-seg button:focus-visible\s*\{[^}]*outline-offset:\s*calc\(-1 \* var\(--m-focus-ring-width\)\)/, "横滚容器内的焦点环必须内嵌");
  has(pdp, /<footer class="sf-footer">/, "页脚必须复用组合层页脚（不再手写 band 与横线）");
  has(site, /\.sf-footer__grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/, "页脚三列必须由组合层栅格提供");
  has(site, /\.sf-footer__bottom\s*\{[^}]*flex-wrap:\s*wrap/, "页脚底栏必须可换行");
  has(site, /@media \(max-width: 767px\)[\s\S]*?\.sf-footer__grid\s*\{[^}]*grid-template-columns:\s*1fr/, "页脚栅格窄屏必须单列");
});

test("P0 页购物车缩略图走组合层几何（V-03）", () => {
  // 缺陷机制：占位缩略图把 72×90 + radius-sm 抄在 style 里，同一几何在 CSS 里有两份、在页面里有第三份，
  // 且页购物车（.sf-cartline，96px / radius-md）被抽屉档（.m-cartline，72px / radius-sm）的尺寸顶替。
  has(site, /\.sf-cartline img, \.sf-cartline__thumb\s*\{[^}]*aspect-ratio:\s*4 \/ 5[^}]*border-radius:\s*var\(--m-radius-md\)/,
    "页购物车缩略图必须继承 96px / 4:5 / radius-md 契约");
  has(site, /@media \(max-width: 767px\)[\s\S]*?\.sf-cartline img, \.sf-cartline__thumb\s*\{[^}]*width:\s*72px/, "窄屏缩略图同步降到 72px");
  not(checkout, /width:72px;height:90px/, "行项缩略图不得内联几何");
  assert.equal((checkout.match(/class="sf-cartline__thumb"/g) || []).length, 2, "两件行项各一个 .sf-cartline__thumb");
  assert.equal((checkout.match(/<div class="sf-cartline">/g) || []).length, 2, "页购物车行必须挂 .sf-cartline");
  has(checkout, /<span class="m-price line-price">/, "行合计必须是 .line-price 栅格第三列");
});

test("P0 移动端输入地板（V-10）：高度归 token，页面不得顶掉", () => {
  has(tokens, /@media \(max-width: 767px\)[\s\S]{0,200}?--m-input-h:\s*2\.75rem/, "≤767 输入族必须升到 44px");
  has(tokens, /@media \(max-width: 767px\)[\s\S]{0,200}?--m-input-font:\s*1rem/, "≤767 输入字号必须 16px（iOS 聚焦缩放防线）");
  has(ui, /\.m-input, \.m-textarea, \.m-select-wrap select\s*\{[^}]*height:\s*var\(--m-input-h\)/, "输入族高度必须只由 --m-input-h 驱动");
  for (const [name, src] of [["08", home], ["09", plp], ["10", pdp], ["11", checkout], ["demo", demo]])
    not(src, /class="m-input"[^>]*style="[^"]*height:/, `${name} 输入件不得内联顶掉高度`);
});

// V-04：安全区不是"锦上添花"，是 iOS 上把 CTA 压在小白条底下的直接原因。
// 缺陷机制：env(safe-area-inset-*) 只在宿主声明 viewport-fit=cover 时非 0，
// 所以"容器让位"与"页面扩视口"是一对必须同现同灭的契约——单独成立任一侧都是回归。
test("P0 安全区契约（V-04）：吸底容器让位 + viewport-fit=cover 成对", () => {
  for (const ax of ["top", "right", "bottom", "left"])
    has(tokens, new RegExp(`--m-safe-${ax}:\\s*env\\(safe-area-inset-${ax},\\s*0px\\)`),
      `安全区 ${ax} 必须带 0px 回落：未声明 cover 的宿主应静默降级，而不是拿到未定义值`);
  has(site, /\.sf-mobilenav__head\s*\{[^}]*var\(--m-safe-top\)[^}]*var\(--m-safe-left\)[^}]*var\(--m-safe-right\)/, "全屏移动导航头必须让开刘海与两侧缺口");
  has(site, /\.sf-mobilenav__body\s*\{[^}]*var\(--m-safe-bottom\)[^}]*var\(--m-safe-left\)[^}]*var\(--m-safe-right\)/, "全屏移动导航体必须让开小白条");
  has(site, /\.sf-sticky-atc__inner\s*\{[^}]*var\(--m-safe-bottom\)/, "吸底加购条必须让开小白条");
  has(ui, /\.m-drawer__footer\s*\{[^}]*var\(--m-safe-bottom\)/, "购物车抽屉底栏必须让开小白条");
  has(ui, /\.m-toast-stack\s*\{[^}]*var\(--m-safe-bottom\)/, "Toast 栈必须让开小白条");
  not(site + ui, /padding[^:]*:\s*calc\([^)]*env\(safe-area-inset/, "容器只准消费 --m-safe-* token，不得裸写 env()");
  has(foundationsDoc, /viewport-fit=cover/, "09 章必须写 cover 契约");
  has(foundationsDoc, /--m-safe-bottom/, "09 章必须给出安全区 token 名");
  const BOTTOM_CONTAINERS = ["sf-mobilenav", "sf-sticky-atc", "m-drawer__footer", "m-toast-stack"];
  const pages = [...readdirSync("prototypes").filter((f) => f.endsWith(".html")).map((f) => `prototypes/${f}`), "design-system.html"];
  for (const rel of pages) {
    const src = readFileSync(rel, "utf8");
    assert.equal(src.includes("viewport-fit=cover"), BOTTOM_CONTAINERS.some((c) => src.includes(c)),
      `${rel}：viewport-fit=cover 必须与吸底容器同现同灭（只扩视口不让位 = 正文推进小白条）`);
  }
});

// V-02：吸底转化条原来挂 --m-z-nav(100)，而 CartDrawer 挂 --m-z-drawer(300)——
// 加购后抽屉打不开（被导航层顶住）与抽屉盖不住吸底条，是同一个错层的两面。
test("P0 z 阶梯（V-02）：吸底转化档落在 cover 与 drawer 之间", () => {
  const rungs = [...tokens.matchAll(/--m-z-([a-z-]+):\s*(\d+)/g)].map(([, k, v]) => [k, Number(v)]);
  const values = rungs.map(([, v]) => v);
  assert.deepEqual(values, [...values].sort((a, b) => a - b), "tokens.css 的 z 档位必须按声明顺序单调递增");
  const ladder = Object.fromEntries(rungs);
  assert.ok(ladder["sticky-cta"] > ladder.cover && ladder["sticky-cta"] < ladder.drawer, "吸底转化档必须高于浮层、低于抽屉");
  assert.deepEqual(ladder, JSON.parse(tokensJson).elevation["z-ladder"], "tokens.json 的 z-ladder 镜像必须与 CSS 同源（分叉过一次就是第二次）");
  assert.deepEqual(Z_LADDER, rungs.map(([k]) => k), "scale.mjs 的 Z_LADDER 必须与 tokens.css 档位同源：无人消费的菜单一旦被新规则消费，就是出厂即假的名单");
  has(site, /\.sf-sticky-atc\s*\{[^}]*z-index:\s*var\(--m-z-sticky-cta\)/, "吸底加购条必须消费新档");
  not(site, /\.sf-sticky-atc\s*\{[^}]*z-index:\s*var\(--m-z-nav\)/, "吸底转化件不得挂导航层");
  has(pdpSpec, /底部固定（`--m-z-sticky-cta`/, "PDP 文档必须写吸底转化档");
  not(pdpSpec, /底部固定（`--m-z-nav`）/, "PDP 文档不得再把吸底条钉在导航层");
});

// V-01：字重三方分叉。docs/03 §2.1 自己论证了"不交付 @font-face 时 450/550/650 在
// Windows 雅黑上塌陷成两档"，却在 46 行之后继续规定 650/550/450；ai/prompts.md 更把这三档
// 当成重构目标教给 AI。R17（文档裸数字门）落地前，先钉住本轮已纠偏的每一处。
test("P0 字重收敛（V-01）：规格文档与生成提示只准写 token 名", () => {
  const typography = readFileSync("docs/03-typography.md", "utf8");
  const from = typography.indexOf("### 2.1 为什么放弃");
  const to = typography.indexOf("## 二之二");
  assert.ok(from > 0 && to > from, "docs/03 必须保留 §2.1 的字重回落论证（它是这套阶梯唯一的事实来源）");
  // §2.1 是"反例区"：那里出现的 450/550/650 是在解释为什么放弃它们，不是规定。
  const outside = typography.slice(0, from) + typography.slice(to);
  not(outside, /\b(?:450|550|650)\b/, "§2.1 之外不得出现裸字重数字，必须写 --m-weight-*");
  for (const [rel, src] of [
    ["storefront/10-storefront-plp.md", plpDoc],
    ["storefront/11-storefront-pdp.md", pdpSpec],
    ["admin/17-admin-feedback-dashboard.md", readFileSync("admin/17-admin-feedback-dashboard.md", "utf8")],
    ["docs/10-art-direction.md", readFileSync("docs/10-art-direction.md", "utf8")],
  ]) not(src, /\b(?:450|550|650)\b/, `${rel} 不得出现裸字重数字`);
  // 生成提示是把规范交给 AI 的那只手：它指错档，每一个产出页都错。
  has(prompts, /weights with --m-weight-\*/, "prompts.md 的重构指令必须指向 --m-weight-*");
  not(prompts, /weights with 450/, "prompts.md 不得再把已放弃的字重档当成重构目标");
  const philosophy = readFileSync("docs/01-design-philosophy.md", "utf8");
  has(philosophy, /字重调校\*\*只在交付变量字体时成立\*\*/, "docs/01 必须把 Atlassian 的字重调校记为「有条件采纳」，而非成就");
});

test("P3 文档标题结构：单 h1 与不跳级", () => {
  has(checkout, /<h1 class="m-sr-only">结账流程/, "结账页需要页面级 h1");
  has(checkout, /<h2 id="pg-cart"/, "页面区块标题应为 h2");
  has(dashboard, /<h1 class="m-sr-only">02 仪表盘/, "双稿页需要页面级 h1");
  has(dashboard, /<h3>暂无正在浏览的商品<\/h3>/, "空态标题应降到 h3（不跳级）");
});

test("P3 AX 树快照：读屏输入层被冻结", () => {
  const dir = "ai/selfcheck/ax";
  assert.ok(existsSync(dir), "缺少 AX 基线目录");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(files.length >= 9, `AX 基线不足（${files.length}）`);
  const drawer = JSON.parse(readFileSync(`${dir}/design-system--drawer.json`, "utf8"));
  assert.ok(drawer.nodes.some((n) => n.role === "dialog" && /cart/i.test(n.name)), "抽屉必须有可朗读名称");
  assert.ok(!drawer.nodes.some((n) => n.role === "navigation"), "抽屉打开时背景导航不得进入 AX 树");
  const live = JSON.parse(readFileSync(`${dir}/design-system--live-regions.json`, "utf8"));
  assert.ok(live.nodes.some((n) => n.role === "status" && n.live === "polite" && n.atomic === true), "live region 必须 polite + atomic");
  has(demo, /<dialog id="dlg1"[^>]*aria-labelledby="dlg1-title"/, "dlg1 必须有可访问名称");
  has(demo, /<dialog id="dlg2"[^>]*aria-labelledby="dlg2-title"/, "dlg2 必须有可访问名称");
  has(demo, /<dialog id="dlg3"[^>]*aria-label="命令面板"/, "命令面板必须有可访问名称");
});

test("P3 语言包：真实 key 结构 + TMS 规则 + 伪本地化", () => {
  for (const f of ["en.json", "ar.json", "de.json", "glossary.csv", "qa-rules.json", "crowdin.yml"])
    assert.ok(existsSync(`i18n/${f}`), `缺少 i18n/${f}`);
  const en = JSON.parse(readFileSync("i18n/en.json", "utf8"));
  const ar = JSON.parse(readFileSync("i18n/ar.json", "utf8"));
  const keys = Object.keys(en).filter((k) => !k.startsWith("$")).sort();
  assert.deepEqual(Object.keys(ar).filter((k) => !k.startsWith("$")).sort(), keys, "ar 与 en 的 key 必须一一对应");
  assert.ok(keys.some((k) => /\{count,\s*plural/.test(en[k])), "源语言必须包含 ICU 复数样例");
  const l10n = readFileSync("ai/selfcheck/runtime-l10n.mjs", "utf8");
  has(l10n, /from "\.\.\/i18n\/pseudo\.mjs"/, "l10n 必须使用真实伪本地化生成器");
  has(l10n, /readCatalogue\("ar\.json"\)/, "l10n 必须读取真实阿拉伯语语言包");
  has(readFileSync("ai/i18n/pseudo.mjs", "utf8"), /pseudoLocalize|buildPseudo/, "伪本地化生成器缺失");
  has(readFileSync("i18n/crowdin.yml", "utf8"), /translation:\s*\/i18n\/%two_letters_code%\.json/, "TMS 映射必须指向 i18n/<locale>.json");
});

// v1.6 · 任务中心契约 ↔ 实现（admin/14 §七 ↔ meridian-ui.css）
// 取消能力此前只在文档里缺：有进度、有重试，没有 Cancel，也没有"取消后部分产出怎么交代"。
test("任务中心：不确定进度 / 已取消态 / 部分产出必须在文档与 CSS 双向存在", () => {
  has(adminDoc, /m-progress--indeterminate/, "admin/14 必须声明不确定进度");
  has(adminDoc, /cancelling/, "admin/14 必须给出 cancelling 中间态（防连点）");
  has(adminDoc, /Download partial/, "admin/14 必须规定取消后保留部分产出");
  has(ui, /\.m-progress--indeterminate\b/, "CSS 必须实现 .m-progress--indeterminate");
  has(ui, /\.m-progress--cancelled\b/, "CSS 必须实现 .m-progress--cancelled");
});

// v1.6 · 撤销栈契约 ↔ 实现（admin/16 §5.1 ↔ meridian-behavior.js）
test("撤销栈：文档声明的来源 / 重做键 / 编辑态例外必须在实现中存在", () => {
  const formsDoc = readFileSync("admin/16-admin-forms-settings.md", "utf8");
  const behavior = readFileSync("ai/meridian-behavior.js", "utf8");
  has(formsDoc, /MeridianBehavior\.history/, "admin/16 必须指明撤销栈的唯一来源");
  has(formsDoc, /⇧⌘Z|Ctrl\+Shift\+Z/, "admin/16 必须给出重做快捷键");
  has(behavior, /history:\s*\{/, "行为层必须导出 history");
  has(behavior, /isContentEditable/, "必须处理 contenteditable 编辑态");
  has(behavior, /深度上限|HISTORY_MAX/, "必须实现深度上限");
});

// v1.6 · 组件契约数：把"22"这种无人能核对的数字换成可计算的声明。
// 口径 = components/18 的 `##` 分组，其中标题含"状态契约"的单独计数，不算组件组。
test("组件契约数：README 与样张声明必须等于 components/18 的实际分组数", () => {
  const sections = contracts.match(/^## .+$/gm) ?? [];
  const stateContracts = sections.filter((s) => /状态契约/.test(s)).length;
  const groups = sections.length - stateContracts;
  assert.ok(groups >= 10, `组件分组数异常：${groups}`);
  const readme = readFileSync("README.md", "utf8");
  const specimen = readFileSync("design-system.html", "utf8");
  has(readme, new RegExp(`${groups} 组组件契约`), `README 必须声明 ${groups} 组组件契约`);
  has(specimen, new RegExp(`<b>${groups}</b> 组组件契约`), `样张必须声明 ${groups} 组组件契约`);
});

// v1.7 · 表面轴：default / filled / tinted / elevated 与舞台默认必须双向存在。
test("表面轴：filled / tinted / elevated 与画布前提必须双向存在", () => {
  const doc = readFileSync("docs/02-color-system.md", "utf8");
  has(doc, /data-surface="filled"/, "docs/02 必须给出 filled 用法");
  has(doc, /data-surface="tinted"/, "docs/02 必须给出 tinted 用法（白画布上的灰卡）");
  has(doc, /data-surface="elevated"/, "docs/02 必须给出 elevated 用法");
  has(doc, /1\.00:1/, "docs/02 必须写明：前台画布与卡片同色时填充分离不可用");
  has(tokens, /--m-card-bg-tinted:/, "tinted 必须有卡片底色 token");
  has(ui, /\.m-card\[data-surface="filled"\]/, "CSS 必须实现 filled");
  has(ui, /\.m-card\[data-surface="tinted"\]/, "CSS 必须实现 tinted");
  has(ui, /\.m-card\[data-surface="elevated"\]/, "CSS 必须实现 elevated");
  has(ui, /\.stage-admin \.m-card:not\(\[data-surface\]\)/, "后台默认卡片必须无描边");
  assert.doesNotMatch(ui, /data-surface="raised"/, "raised 已更名，不得残留");
});

// v1.7 · 描边收口：装饰框只留给兜底白卡，商品卡 / tint 徽章 / 卡内横线一律关闭。
test("装饰描边：商品卡、tint 徽章与卡内横线必须收口", () => {
  has(ui, /\.m-product-card\s*\{[^}]*background:\s*transparent[^}]*border:\s*1px solid transparent/, "商品卡不得有装饰框（透明 1px 保盒模型）");
  assert.doesNotMatch(ui, /\.m-product-card:hover\s*\{[^}]*box-shadow/, "商品卡 hover 不得投射阴影");
  has(ui, /\.m-product-card:hover \.media img\s*\{[^}]*scale\(1\.03\)/, "商品卡 hover 反馈必须落在媒体图");
  has(ui, /prefers-reduced-motion: reduce\)[\s\S]{0,200}\.m-product-card:hover \.media img\s*\{[^}]*transform:\s*none/, "减少动效下商品卡缩放必须静止");
  has(ui, /\.m-badge--tint\s*\{[^}]*border:\s*1px solid transparent/, "tint 徽章不得有描边");
  has(ui, /\.m-card__header\s*\{[^}]*border-bottom:\s*1px solid var\(--m-card-divider/, "卡头横线必须走可关闭变量");
  has(ui, /\.m-card__footer\s*\{[^}]*border-top:\s*1px solid var\(--m-card-divider/, "卡尾横线必须走可关闭变量");
  has(ui, /\.m-card\[data-surface="filled"\], \.m-card\[data-surface="tinted"\]\s*\{[^}]*--m-card-divider:\s*transparent/, "无描边卡内的横线必须关闭");
});

// v1.6 · 共享边缘网格：n 张卡共用 n+1 条线，而不是各自 4n 条
test("共享边缘网格：文档约定与 CSS 实现必须一致", () => {
  has(contracts, /data-card-grid/, "18 章必须给出共享边缘网格");
  has(contracts, /--m-card-grid-cols/, "18 章必须给出列数旋钮");
  has(ui, /\[data-card-grid\]\s*\{/, "CSS 必须实现容器规则");
  has(ui, /\[data-card-grid\] > \.m-card\s*\{/, "CSS 必须实现单元规则");
  has(ui, /inset 1px 0 0 var\(--m-card-border\)/, "单元必须用内嵌线画共用边");
  has(ui, /\[dir="rtl"\] \[data-card-grid\]/, "必须处理 RTL 镜像");
});

// v1.6 · 字重必须是静态档：450/550/650 是为 Inter 变量字体调的，系统不交付字体时会塌成两档
test("字重阶梯：静态 400/500/600/700，且 CJK 行高/字距覆盖存在", () => {
  const w = (n) => Number((tokens.match(new RegExp(`--m-weight-${n}:\\s*(\\d+)`)) ?? [])[1]);
  assert.deepEqual(
    [w("regular"), w("medium"), w("semibold"), w("bold")],
    [400, 500, 600, 700],
    "字重必须回到静态阶梯（450/550 在 Windows 上渲染相同）"
  );
  has(tokens, /:lang\(zh\)[^{]*\{[^}]*--m-body-leading/, "CJK 行高覆盖缺失");
  has(tokens, /:lang\(zh\) h1/, "汉字标题零字距覆盖缺失");
  const typo = readFileSync("docs/03-typography.md", "utf8");
  has(typo, /不得只靠字重表达/, "03 章必须写明字重不足以表达层级");
  has(typo, /1\.75/, "03 章必须记录 CJK 正文行高");
});

// v1.7 · 影像来源：结构契约必须与门禁、产物同时存在（Batch 4）
test("影像来源：四值枚举、C2PA/IPTC 与披露挂点三方一致", () => {
  const art = readFileSync("docs/10-art-direction.md", "utf8");
  const copy = readFileSync("docs/08-copywriting.md", "utf8");
  const forms = readFileSync("admin/16-admin-forms-settings.md", "utf8");
  const builder = readFileSync("prototypes/06-builder.html", "utf8");
  has(art, /`provenance` 四值封闭：`photograph` \/ `ai-generated` \/ `ai-retouched` \/ `illustration`/, "docs/10 必须给出封闭枚举");
  has(art, /C2PA/, "docs/10 必须给出来源元数据");
  has(art, /DigitalSourceType/, "docs/10 必须给出 IPTC 字段");
  has(art, /--m-badge-h/, "docs/10 必须钉住 badge 最小高度");
  has(art, /至少 1 张 `photograph`/, "docs/10 必须写真实摄影底线");
  has(contracts, /data-provenance-disclosure/, "components/18 必须给出影像披露挂点");
  has(contracts, /可见披露才是契约本体/, "components/18 必须说明可见等价物");
  has(pdpSpec, /真实摄影底线/, "storefront/11 必须写真实摄影底线");
  has(pdpSpec, /data-provenance-disclosure="badge\|caption"/, "storefront/11 必须写披露挂点");
  has(forms, /媒体来源（不可关闭项，v1\.7）/, "admin/16 必须给出不可关闭项");
  has(forms, /不得出现"隐藏 AI 披露/, "admin/16 必须禁止关闭开关");
  has(a11yDoc, /SB 243[\s\S]{0,160}明确排除客服/, "docs/06 必须写明 SB 243 排除客服 bot");
  has(a11yDoc, /AB 1609/, "docs/06 必须锚定 AB 1609");
  has(a11yDoc, /2026-08-02/, "docs/06 必须写 EU AI Act Art. 50 与 SB 942 的生效日");
  has(a11yDoc, /2027-01-01/, "docs/06 必须写 SB 1050 / AB 1609 的生效日");
  has(copy, /pdp\.aiGenerated/, "docs/08 必须给出披露 key");
  has(copy, /pdp\.aiRetouched/, "docs/08 必须给出修饰披露 key");
  has(copy, /pdp\.aiImageDetails/, "docs/08 必须给出详情入口 key");
  has(copy, /SB 243[\s\S]{0,80}不得作为客服场景/, "docs/08 必须纠正 SB 243 归属");
  has(builder, /媒体来源/, "builder 必须有媒体来源分组");
  has(builder, /不可隐藏披露/, "builder 必须声明披露不可关闭");
});

test("影像来源：店面每张 img 都有合法 provenance，AI 值带披露挂点", () => {
  const files = ["prototypes/08-home.html", "prototypes/09-plp.html", "prototypes/10-pdp.html", "prototypes/11-checkout.html"];
  const valid = new Set(["photograph", "ai-generated", "ai-retouched", "illustration"]);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const imgs = html.match(/<img\b[^>]*>/g) ?? [];
    assert.ok(imgs.length, `${file} 应包含商品影像`);
    for (const tag of imgs) {
      const m = tag.match(/data-provenance="([^"]+)"/);
      assert.ok(m, `${file} 影像缺 data-provenance：${tag.slice(0, 60)}`);
      assert.ok(valid.has(m[1]), `${file} 非法 provenance：${m[1]}`);
      if (m[1] === "ai-generated" || m[1] === "ai-retouched")
        assert.match(tag, /data-provenance-disclosure="(?:badge|caption)"/, `${file} AI 影像缺披露挂点`);
    }
  }
});

// v1.7 · 购买箱同排基线（O25）：步进器 × CTA 必须等高，且内部三段填满外框
test("购买箱同排基线：组合类、内部三段与文档三方一致", () => {
  has(site, /\.sf-buyrow \.m-stepper\s*\{[^}]*height:\s*var\(--m-btn-h-cta\)/, "site.css 必须把步进器外框对齐 CTA 高度");
  has(site, /\.sf-buyrow \.m-stepper button, \.sf-buyrow \.m-stepper input\s*\{[^}]*height:\s*100%/, "内部三段必须填满外框");
  has(site, /@media \(max-width: 767px\)[\s\S]*?\.sf-buyrow \.m-btn\s*\{[^}]*flex-basis:\s*100%/, "窄屏 CTA 必须独占整行");
  has(pdp, /class="sf-buyrow"/, "PDP 必须使用组合类，不得用 m-row 手搓");
  not(pdp, /class="m-row"[^>]*>\s*<div class="m-stepper"/, "PDP 数量行不得回退到 m-row");
  has(pdpSpec, /同排基线/, "storefront/11 必须写同排基线");
  has(contracts, /购买箱基线（数量 × CTA/, "components/18 必须写购买箱基线");
  has(contracts, /不得只拉伸外框/, "组件契约必须说明内部三段一起长");
});
