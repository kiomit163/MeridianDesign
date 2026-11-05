# Changelog

本项目遵循"任何视觉可见的值变更 ≥ MINOR；语义重指向 / 删 token / 改变默认舞台 = MAJOR + 迁移说明"。

## 未发布 · v1.7.0（进行中：依据 `docs/superpowers/plans/2026-11-05-wiring-and-baseline-remediation-v1.7.0.md`）

> 依据：2026-11-05 独立评审（趋势对标 / 产物兑现 / 机器门有效性三轴）。本轮主线是**接线**：
> 补齐"定义的类必须被使用"的反向门，并把已声明未接线的表达层真正跑起来。

### Fixed（Batch 1 · P0 止血 7 条）

- **V-04 安全区**：新增 `--m-safe-top|right|bottom|left` = `env(safe-area-inset-*, 0px)`，四个贴边容器全部让位——`.sf-sticky-atc__inner`（吸底加购）、`.sf-mobilenav__head/__body`（全屏导航）、`.m-drawer__footer`（购物车抽屉底栏）、`.m-toast-stack`。左右轴**故意用 `padding-left/right`**：安全区是物理量，RTL 下 `padding-inline-start` 会把左缺口内边距加到右侧，这四处因此按行级 `meridian-allow: safe-area-inset-is-physical` 登记为 R15 例外。`viewport-fit=cover` 只加在真的渲染上述容器的 5 个页面（05/08/09/10 + design-system）——只扩视口不让位等于把正文推进小白条，这条"同现同灭"关系由 conformance 机器锁定。契约与例外全部写进 `storefront/09 §七`。
- **V-07 首页壳**：`08-home` 删除内联手搓的 nav/header，改挂组合层 `.sf-announce / .sf-header / .sf-nav / .sf-burger / .sf-mobilenav`；补 skip link、`<main id="main" tabindex="-1">`、移动端抽屉的 dialog/inert/焦点陷阱语义，并首次加载 `meridian-behavior.js`。09/10/11 的宣告条与头部同步归到组合层——此前 09/10/11 用 `--m-primary` 实底自绘，与文档规定的 `--m-announce-bg` 分叉。
- **V-03 页购物车几何**：11 的两件行项删掉内联 `width:72px;height:90px;radius-sm`，改挂 `.sf-cartline img / __thumb`（96px、4:5、`--m-radius-md`，≤767px 降到 72px）。原先是"抽屉档尺寸顶替页档"，同一几何在 CSS 与页面里共三份事实。
- **V-10 移动端输入地板**：`storefront/10` 排序 Select 的单一 36px 改为双口径（桌面 36 / ≤767 自动 44，`tokens.css` MOBILE FORM FLOOR）。新增 375px 计算样式运行时断言（`runtime-a11y.mjs` 量 `.m-input/.m-textarea/.m-select-wrap select` 的高与字号）——它当场抓到 `design-system.html` 两处内联 `height:34px` 顶掉地板，这类缺陷值门永远看不见。
- **V-02 z 层级**：新增 `--m-z-sticky-cta: 250`（高于 nav/cover，**低于 drawer**——`CartDrawer` 必须盖住吸底条），`.sf-sticky-atc` 与 PDP 文档改消费它。顺带闭合两处同族分叉：`tokens.json` 的 `elevation.z-ladder` 缺 `sticky-cta`、`scale.mjs` 的 `Z_LADDER` 长期缺 `cover`（一张无人消费的假名单，一旦被新规则消费即出厂即错）。三处镜像现由同一条单调性 + 同源断言钉住。
- **V-01 字重三方分叉**：`tokens.json` 的 `typography.weights` 由 `450/550/650` 改为与 CSS 同源的 `400/500/600/700`。文档侧把裸数字全部改为 token 名：`docs/03`（§三 前台/后台标题映射、§四 规则 6、§五 价格表——这份文档自己在 §2.1 论证了必须放弃 450/550/650，却在 46 行之后继续规定它们）、`docs/01`（把 Atlassian 的字重调校从"成就"改记为"只在交付变量字体时成立"）、`docs/10`、`storefront/10`、`storefront/11`（含 `bullets 550`）、`admin/17`（实测 `.m-banner b` 是 semibold，不是 medium——按实现写，不按旧数字写）。**最高杠杆的一处是 `ai/prompts.md`**：它的重构提示词正在教 AI「weights with 450/550/650」，即每一个由该 prompt 产出的页面都会重新引入已放弃的档位。`design-system.html` 环形图中央的活体 `font-weight:650` 一并改 token。
- **V-20 R01 盲区**：补两支检测——Tailwind **命名色**工具类（`bg-red-500` / `text-emerald-600` / `border-slate-200/70`，封闭色名表，`text-lg` 与 `divide-y` 不误伤）与 **SVG/HTML 着色属性**字面量（`fill/stroke/stop-color/flood-color/lighting-color/color/bgcolor`，`fill="none"` / `currentColor` / `url(#…)` / `var(--m-*)` 一律放行）。原 `R01/fail/Feature.tsx` 第 2 行的 `fill="#FF0000"` 是规则自证的漏网样本：manifest 曾把"检查器看不见"记成"代码里没有"。基线实测 **0 违规**（全仓无命名色类、无 hex 着色属性），因此无需预清即可开门——缺陷在检查器，不在产物。新增真阳性 `fail/RawAttrs.tsx`（6 条）与真阴性 `pass/ThemedAttrs.tsx`，fixture 清单 63 → 70 条。

### Migration（可见变化，均无需改业务代码）

- 08 首页壳：wordmark 走 `.sf-brand`（LOCUST 全大写规格）、导航字号 `md`→`sm`、当前项由胶囊底色改为下划线、购物袋计数徽章由 neutral 灰底改 `--m-primary`（前台即近黑）。徽章强度仍是开放项 O15。
- 09/10/11 宣告条：由 `--m-primary` 实底（前台=近黑）改为品牌 `--m-announce-bg`（`#0F6B57`）。
- 头部滚动收缩首次生效：72 → 56px，且 `.is-stuck` 才描边（此前 sticky 规则存在但从未被消费）。
- 11 页购物车缩略图：72×90 / radius-sm → 96px / 4:5 / radius-md。
- design-system 顶部搜索与页脚邮箱输入：34px → 36px（≤767px 44px）。
- iOS 真机：吸底加购条、全屏导航、抽屉底栏、Toast 各多出安全区内边距（横屏缺口 / 小白条量级）；桌面与非 cover 宿主无变化。
- 字重：实现侧本来就是 400/500/600/700，无可见变化；改的是文档承诺与 prompt 的前瞻行为。

### Gates

- `npm test` 227 → 232；`npm run lint`（validate + 测试）0 违规。运行时五门（a11y / behavior / ax / l10n / i18n）全绿，behavior 75 checks。
- 新增机器断言：安全区四容器 + `viewport-fit=cover` 成对；z 阶梯单调 + 三镜像同源；吸底转化件不得挂 `--m-z-nav`；字重阶梯锁定 400/500/600/700 + `tokens.json` 双向同源 + 规格文档/prompt 无裸字重数字；R01 新分支的真阳与真阴。

### Added（Batch 2 · 2.1–2.2 · 反向接线门 + admin 真实接线）

- **G-231 反向接线门**：新增 `ai/selfcheck/lib/wiring.mjs`（与 G-228 共用 `parse-css` / `classTokens` 的类宇宙）与 `wiring.test.mjs`。`ai/` 五层里每个选择器类必须被 13 张原型 / `design-system.html` / `meridian-behavior.js` 消费；零消费者类逐名登记进 `ai/selfcheck/wiring-baseline.json` 的 ticket（理由 + 目标批次）。棘轮三处：`deadMax` **只准下调且必须等于当前债量**、`defsFloor` 只准上调（删类 = MAJOR）、`layers[*].own` 与实测全等。落地时把计划里的 `WIRING_ALLOW`（白名单语义）改为**限期债账本**：例外不是永久 API 面，清偿后必须销账。
- **02 / 06 真实接线**：`02-dashboard.html` 与 `06-builder.html` 改挂 Sidebar v2（`.ad-side__store` 店铺切换、32px 导航项、`.ad-side__foot` 工具行）与 `.ad-topbar`；06 首次真正渲染 `.ad-builder` 三栏 IDE（15rem / 1fr / 18rem，`ad-builder__panel/__canvas/__bar/__stage/__frame`、`ad-elslot`、`ad-elselement`、`ad-propgroup`）。admin 组合层自有接线率 **0% → 45.8%**（38/83），死类 252 → **210**（清偿 42 笔）。
- **CDP 真实计算样式断言**：`runtime-behavior.mjs` 新增 8 条图标轨检查——240px 展开 → 点击 64px + `aria-pressed` + `localStorage["meridian.side-rail"]="1"` → 刷新仍 64px → 再点回 240px/`"0"`；≤1023 视口强制 56px；收轨后标签 `display≠none` 且 `width:1px / overflow:hidden`（sr-clip 的读屏语义有牙齿）。06 同时加入 behavior 的壳与键盘顺序巡检。

### Fixed（Batch 2 · 2.1–2.2）

- **`.m-canvas` 曾被组合层重复实现**：`.ad-builder__canvas` 自带 `background: var(--m-bg-page)`，与 page-rank 工具类 `.m-canvas` 两份事实。改为 06 挂 `m-canvas`，组合类只留容器行为与 `container-type`——表面 rank 归组件层。
- **页头在长语言包下顶穿容器**（l10n 门抓到）：德语 / en-XA 把 `.m-seg` 撑到 472px，02 页头在 320/375px 溢出。`min-width:0` 只解除自动最小尺寸，不能把换行后独占一行的 `max-content` 拉回行宽；补 `.m-pagehead > * { max-width: 100% }`，内部由 `.m-seg` 的 `overflow-x` 承担。桌面宽屏无可见变化。
- **卖货子导航漏进 56px 图标轨**（375px 视觉复评抓到）：`.ad-subnav.is-open { display: flex }` 的特异性（0,2,0）压过 ≤1023 媒体块里的裸 `.ad-subnav { display:none }`（0,1,0），展开态子导航在图标轨里被挤成"商/品""页/面/构/建/器"竖排。媒体块改为 `.ad-subnav.is-open`；behavior 新增一条检查直接读 `.is-open` 的计算 `display`（02 默认折叠态无法暴露该缺陷）。
- **构建器动作组逐字竖排**（375px 中栏 304px）：工具条图标化后仍需约 360px，`.m-btn` 的 `white-space: normal` 把「保存 / 预览」压成两行单字。动作组包成整体 `.m-toolbar`，≤400 容器允许工具条换行（`height:auto` + `flex-wrap`），按钮 `nowrap`，第二行 `margin-inline-start:auto` 保持右对齐。375px 下工具条 93px 两行、按钮均 32px 单行、无横向溢出。

### Migration（Batch 2 · 2.1–2.2）

- 02 后台壳：店铺切换进入侧栏顶部；导航项由内联结构改为 32px 组合层项；侧栏底部新增 帮助 / 收起侧栏；顶栏新增全局搜索（`⌘K`）；通知铃进入 `.m-topbar__actions`。02 页头动作区的分段控件在 ≤560px 中栏内收为图标 + 名称由 `aria-label` 保留。
- 06 构建器：页头行改为面包屑工具行（草稿 / 上次保存），三栏 IDE 满幅铺到主区边缘；画布工具条 44px 内 32px 基线，1280 下中栏约 512px，视口切换收文字保图标；属性面板 ≤1279px 收栏。
- 图标轨：≥1024 可手动 240 ↔ 64px 并持久化；≤1023 恒 56px。收轨后标签从 `display:none` 改为 sr-clip（对读屏保留名字）。
- 面包屑当前项仍无组件级样式（行内 color/font-weight），登记为 O23 待裁定。

### Gates（Batch 2 · 2.1–2.2）

- `npm test` 232 → **238**，`npm run lint` 0 违规。behavior **75 → 92 checks**（06 六条 + 图标轨八条 + 375px 窄屏三条）。a11y 6 页、l10n 95 checks、i18n、ax 全绿。
- 02 的 AX 基线重发：77 → 87 节点，新增节点均为侧栏店铺切换 / 帮助 / 收起侧栏 / 顶栏搜索 / 卖货子导航开关，`接单` 的可访问名带上计数（`接单 12`）。
- l10n 的 320/375 断言在本批第二次证明价值：它抓到的页头溢出是静态字符串门与 axe 都不会报的真实布局缺陷；而子导航竖排与动作组竖排两条是**所有自动门当时全绿**、仅 375px 截图可见的缺陷——自动门测"契约成立"，测不到"看起来坏掉"。

### Added（Batch 2 · 2.3 · R18 内联样式结构门）

- **R18 `inline-style-budget`**：feature 层的每个内联 `style` 都是一个结构债。规则落在 `ai/checks/r18-inline-style.mjs`：带 `display/grid/flex/padding/margin/gap/font-size` 的按"内联布局声明"报，其余按"内联样式"报；`dedupe:false` 让同一行多个带 style 的标签各自计数（否则一行只算一笔，账本会系统性少记）。**没有 warn 档**——本仓校验器从无警告层，加一条不会失败的警告就是第一个"软绿"；改为**硬错误 + 精确账本** `ai/selfcheck/r18-baseline.json`（键 `<file>|R18`，值与实测全等）：新增即红，清偿后不同步下调也红，总量另有 `BUDGET` 天花板。
- **账本只进 lint 的显式参数**：`--baseline ai/selfcheck/r18-baseline.json` 写在 `npm run lint` 与 A4-A7 验收测试里，不写进 `meridian.config.json`——否则单文件扫描会把其余文件的额度当成"记账过剩"刷屏，把真正的违规淹掉。
- **fixture 与清单**：`R18/fail/Layout.html`（4 条：布局声明 3 + 非布局 1）、`R18/pass/Clean.html`（零内联）。注册后暴露的真实命中全部入账：R00 审计样本 5 条、R01/R02/R05/R11 fail fixture 各 1 条；审计样本的"15 命中"断言改为显式排除 R18，保留原样本语义。

### Fixed（Batch 2 · 2.3 · O16 / O17 / O22）

- **O16 尺码胶囊触控契约**（裁定：契约优先，密度让位）：`09-plp.html` 5 处内联 `min-width:44px;height:36px` 与 `design-system.html` PDP 3 处 `min-width:40px;height:36px` 全部删除，回到 `.m-size-pill` 的 44×44。36px 高度既低于 `docs/04` 的 44px 行内可点项地板，也低于 WCAG 2.5.8 的 24px 仅余量；密集筛选条不值得用触摸精度换 8px。
- **O17 列表页搜索框**（裁定：删除覆盖）：`03-list.html` 搜索输入的内联 `height:var(--m-tool-h)`（32px）删除，回到 `--m-input-h`（桌面 36 / ≤767 44）。输入件不应借工具栏高度——两者在移动端地板不同。
- **O22 `.sf-prose` 层泄漏**（裁定：归位 site.css）：组件层 `meridian-ui.css` 的两条正文链接规则去掉 `.sf-prose`，店面层 `site.css` 自持 `.sf-prose a:not(.m-btn)` 的静息/悬停规则。W-05 只留 `m-skip` 一笔，`deadMax` 210 → **209**；`meridian-ui` 的 `defsFloor` 248 → 247 是**度量口径修正而非删类**——`.sf-prose` 仍定义在 site.css，减少的是组件层对 `sf-*` 的引用。AUDIT-1.4.0 的 A-13 回归断言原本把泄漏选择器写成了"正确实现"，已扩为同时锁住两层的 hover 加重规则。

### Migration（Batch 2 · 2.3）

- 09 PLP 筛选抽屉的尺码胶囊 36 → 44px 高；design-system PDP 尺码胶囊 40×36 → 44×44；03 列表页搜索框桌面 32 → 36px（移动端仍 44）。三处均有可见高度增加，触控热区随之达标。

### Gates（Batch 2 · 2.3）

- `npm test` 238 → **244**，`npm run lint` 0 违规（R18 存量 764 → **758**，布局 562）。运行时五门全绿：behavior 92、a11y 6 页、l10n 95、i18n、ax。
- a11y 新增 `.m-size-pill` 计算样式断言：375px 下实宽实高 ≥44×44（09 与 design-system 共 12 个）。axe 的 2.5.8 只保 24px 底线，抓不到本仓 44px 的自我承诺。
- R18 的实测数首跑 **764**（计划估 801；2.2 接线已先行消化 37 条）。本批清偿 O16/O17 后 **758**，Batch 2 出口目标仍为 ≤700——差额留给 2.7 的真实 `<img>` 改造（媒体占位符的内联定位随之消失）。

### Added（Batch 2 · 2.4 · R17 文档数字门）

- **R17 `doc-numeric-tokens`**：doc 层禁止裸字重 `450/550/650` 与声明式尺寸（`font-size: 14px` / `字号：16px`），必须写 token 名。解析器在 `parse-doc.mjs` 为候选行产出 `numeric` 事实并携带最近标题——**区段例外**需要它：`docs/03 §2.1` 整节在论证为什么放弃这三个档位，表格里的裸数字是证据，不是违规。
- **四类合法提及放行**：时长（`450ms`、`450–600ms`、`--m-duration-450|600` 整串）、禁令/反例语境（行内或小节标题含 放弃/禁止/never/塌陷/回落）、历史文档（CHANGELOG / MIGRATION-* / 根目录 AUDIT-* / docs/superpowers）。朴素正则会把论证本身判红——放行规则必须能独立读懂，而不是静默跳过。
- **规模收窄为声明式尺寸**：无冒号的散文（如"字号 16px"）是移动端平台地板事实（iOS 聚焦缩放 / 44px 触控），不是 token 选型；只拦 `font-size:` / `字号：` 这种会被复制进代码的形式。这条收窄写进规则头注释，避免下一批把平台事实一起删掉。

### Fixed（Batch 2 · 2.4）

- **1.6 漏网的 3 处裸字重**：`storefront/12`（"650 标题"→ semibold）、`admin/16` 的 Label 行（550 → medium，实测 `.m-field__label` 是 medium）与 Card 标题行（14/20 650 → `--m-text-sm` / semibold）。1.6 只改了目录中明确列出的位置，说明"按清单改"仍会漏——现在由 R17 全仓扫描兜底。
- **O18 文档↔产物分叉**（裁定：以产物为准，同 1.6 的 `.m-banner b` 判例）：`docs/10` 引用块写"3px 左侧条 + 20px 字号"，`.sf-prose blockquote` 实为 2px + `--m-text-2xl`；文档改为 2px + token 名。R17 **不扩面到边框宽度**——宽度不是字体数字，扩面会让规则名与职责脱节。

### Gates（Batch 2 · 2.4）

- `npm test` 244 → **249**（R17 五条：注册、真阳、真阴、CLI fail/pass；acceptance 17 规则）。`npm run lint` 0 违规，运行时五门不变。
- R17 的放行不是白名单：区段例外读最近标题，禁令语境读本行，历史文档按路径——三条都能从文档本身复核。代价是"禁止 450"与"规定 450"在同一行时会被放行；规范文档里前者远多于后者，这个取舍写入规则头注释。

### Added（Batch 2 · 2.5 · tokens.json 镜像归属）

- **归属表**：`tokens.json` 的 419 个叶子键现在每个都必须命中一条归属规则——"已比对（附断言出处）"或"显式不比对（附理由）"。未归属、模式空转、排除项缺理由均为红；顺序先到先得（窄排除写在宽比对之前，同 CSS 层叠）。新增 json 字段时先决定归属再写值，单边加字段会被 CI 直接拒绝。
- **新增结构全等断言**（此前完全没有值断言的半边）：舞台四件套（`body-fs/card-shadow/card-radius/overlay-blur`）、字体栈三支、字阶 `sizes-px` 的 px/行高双向、`leading` 菜单含 display、`body-leading` 双舞台、`display-clamp`、`tracking`、`space` 刻度 + 4px 网格（`05` 是唯一 2px 半格）、`radius` 由 knob 经 calc/max 求值、`z-ladder`、动效时长键集/缓动/状态层透明度、断点（`--m-bp-*` 在组件层，不在 tokens.css）、容器宽度、焦点环宽/偏移/后台 inset 表达式（`calc(-1 * (width + 1px))` 求值为 `-3px`）。
- **显式不比对项登记**：`$schema/$name/$description`、`color.surface-ranks-note`、舞台覆盖 `note`、`typography.body-fs`（散文，值在 `stage.*`）、`typography.roles.$note`、`typography.rules`、`elevation.e1–e4`（用途散文）、无障碍目标尺寸与对比度（axe / runtime-a11y / contrast 测试执行，CSS 无 token）。理由写在测试表里，`docs/00` 同步列出。

### Fixed（Batch 2 · 2.5）

- **README 的"全量比对"措辞校正**：此前 419 个镜像键里真正被断言的只有颜色、字重与角色行高；现在按归属表比对，文档不再把"镜像存在"说成"全量比对"。

### Gates（Batch 2 · 2.5）

- `npm test` 249 → **261**（tokens-sync 7 → 19 条）。`npm run lint` 0 违规，运行时五门不变。
- 求值器只覆盖本仓实际出现的语法（px/rem/calc/max/四则/负号）；遇到新写法会报"无法解析"而不是静默跳过——半径与焦点环的派生值第一次进入机器门。

### Added（Batch 2 · 2.6 · R12 空转探针）

- **G-230**：`prototypes-gate.mjs` 新增店面影像探针——`08-home` / `09-plp` / `10-pdp` / `11-checkout` 任一页零 `<img>` 即红。R12 是逐文件事实规则，页面没有 `<img>` 时它连一条事实都收不到，**看不见缺席**；缺席必须由门禁判。`prototypes-gate.test.mjs` 同时锁住探针源码与四个页面本体，防止探针被删后测试仍绿。

### Added（Batch 2 · 2.7 · 真实影像与表达层接线）

- **50 个本地 SVG 资产**：12 个商品 × 400/800/1200 三档宽度（4:5），hoodie 另加背面/面料/平铺，hero 横版 3 档 + 竖版 2 档。全部矢量化、离线、无外部许可与 AI 来源争议。
- **08–11 共 24 个真实 `<img>`**：全部带内在尺寸、`srcset`（400/800/1200w）与 `sizes`；hero 用 `<picture>` 在 ≤1023px 切 4:5 画幅；LCP 图 `loading="eager" fetchpriority="high"`，其余 `loading="lazy" decoding="async"`；商品卡 `alt=""`（相邻文本已命名商品），PDP 主图给描述性 alt。`docs/05` 的影像契约第一次有了可测试的产物。
- **首次接线**：`.sf-hero__copy/__figure`、`.sf-gallery` 四类、`.sf-pcard/quickadd`、`.sf-small/sf-meta`、`.m-i--24`。快加购在指针设备 hover/focus 浮现，在 `(hover:none),(pointer:coarse)` 常显且抬到 44px 触控地板（`m-btn--sm` 仅 32px）。
- **R18 758 → 697**：媒体占位符的内联定位消失（08 33 / 09 64 / 10 64 / 11 56），`BUDGET` 同步下调，出口目标 ≤700 达成。
- **W-02 死类 209 → 198**，`site.css` 接线率 19.4% → **26.4%**（38/144）；清偿 11 个类，余债仍逐名挂 plan，禁止删类销债。

### Fixed（Batch 2 · 2.7）

- 08：19 处页脚/图注内联样式改挂 `.sf-small` / `.sf-meta`；hero 占位图标换成 `<picture>` 影像。
- 09：12 个商品卡媒体换成真实 `<img>`；12 个快加购按钮从内联绝对定位改挂组合层；说明文案与页头注释同步。
- 10：整段内联图库换成 `.sf-gallery`（4 个缩略 tab + 主图），缩略图 88px，主图 LCP 优先。
- 11：两件购物车行项的图标替身换成 `.sf-cartline` 影像（96px / 4:5），成功标记改挂 `.m-i--24`。

### Migration（Batch 2 · 2.7）

- 四个店面原型从图标占位变为真实影像；08 hero 在移动端切换为 4:5 竖构图（`<picture>`），桌面仍 3:2。
- 09 快加购在桌面默认隐藏、hover/focus 浮现；触屏设备常显，点击面积从 32px 提到 44px。
- PDP 图库改为缩略图列 + 主图，缩略图 `role="tab"`，与 `docs/05` 的图序契约一致。

### Added（Batch 2 · 2.8 · 外部基线表）

- 新增 `docs/11-external-baseline.md`：7 条对标登记（Shopify OS 2.0/Horizon、Apple Liquid Glass、M3 Expressive、web.dev Baseline、Baymard PDP、Chrome/DevTools 节奏、2026-11 审美水位），结论强制三分（采用 / 观察 / 拒绝）并落到 token、规则或 O 决策。
- `docs/00` 顶部登记"基线表最后核对日期"作为唯一事实源；`ai/selfcheck/external-baseline.test.mjs` 五条断言：日期存在、超 90 天红、每行四列且日期不晚于核对日、必备条目齐全、91 天/90 天边界有效。
- 关键裁定：`light-dark()` 当前仅 Baseline 新可用，不作为"深色已解决"的证据，必须保留 `data-theme`/媒体查询回退；Chrome 153 起双周发布，核对节奏改为每季度 + 每次 MAJOR。

### Gates（Batch 2 · 2.6–2.8）

- `npm test` 261 → **266**（G-230 1 条、external-baseline 5 条）。`npm run lint` 0 违规（R18 697/697）。
- `npm run verify` 五门全绿：a11y 6 页 / behavior 92 checks / ax / i18n / l10n 95 checks。
- 人工视觉复评 1280 + 375 两档：四个店面页的影像、画幅切换、快加购触控态均符合契约；移动端 `loading="lazy"` 的截图空白已确认是 `captureBeyondViewport` 伪影，滚动后 12 个商品图 `naturalWidth > 0`。

### Added（Batch 3 · 3.1 前台叙事字阶）

- 新增三档流式 display：`--m-text-display-sm` clamp(32→48)、`--m-text-display` clamp(36→60)、`--m-text-display-lg` clamp(44→96)，映射 `.sf-display-sm/.sf-display/.sf-display-lg`。此前全仓最大字阶 60px，首屏叙事无法建立；现在 1280 视口实测 48 / 58.88 / 79.04px，96px 只在 ≥1600px 出现（流式上限，不是桌面固定值）。
- `docs/03` 增"前台叙事档"表与使用约束：每页只准一个 `display-lg`，后台禁用；`design-system` 补三档演示，`08` hero 与 `10` 叙事区块完成首次真实接线。

### Added（Batch 3 · 3.2 三态主题）

- 新增 `[data-theme="auto"]` / `.theme-auto`：声明 `color-scheme: light dark`，并在 `@media (prefers-color-scheme: dark)` 内镜像 main / admin / chart / code 四组深色变量。**默认舞台仍是浅色**，auto 只在用户显式选择后生效；默认翻转登记为 O11，留 v2 MAJOR。
- `auto-theme-parity.test.mjs` 三条断言：四组镜像与显式深色逐项全等、auto 不得把 `color-scheme` 锁成 `dark`、`:root` 保持 `light`。行为层提供 `MeridianBehavior.theme.get/set/cycle`（light → dark → auto，localStorage 持久化）；入口为 `08/09/10` 的 `[data-theme-cycle]` 与 design-system 的 `#themeBtn`，结账页 `11` 故意不提供切换。

### Added（Batch 3 · 3.3–3.4 层级与玻璃边界）

- 前台浮层开始消费既有 elevation：快加购 `--m-shadow-e2`、抽屉/模态 `e3`、toast `e4`，内容卡上限 `e2`。`docs/02 §5.1` 明确：前台画布与卡片仍为 1.00:1，"填充式层级"的前提未满足，因此当前仍以边界 + elevated 为主，阴影不得替代边界。
- 新增玻璃三件套 `--m-glass-blur: 20px` / `--m-glass-alpha: 72%` / `--m-glass-dim`，**唯一消费者** `.sf-header.is-stuck`；带 `@supports not (backdrop-filter)` 与 `prefers-reduced-transparency` 回退。硬禁止：内容卡、商品图、PDP 主图、story 画面禁用玻璃。契约落在 `docs/04 §3.1` 与 `docs/05`。

### Fixed（Batch 3 · 3.5 分级减动效）

- reduced-motion 从"全部关掉"改为分级：动画 `0.01ms`/1 次、平滑滚动关闭，但保留 opacity/color/background/border/shadow/fill/stroke 的 `100ms` 过渡；`.rv` 显式落在终态（`opacity:1`、`animation:none`、`translate:none`），修掉原先 `animation-fill-mode: both` 在降级下停在起点的问题。真实 Chrome 以 `Emulation.setEmulatedMedia` 断言 4 条。

### Added（Batch 3 · 3.6–3.7 容器查询与圆角语境门）

- 信任条、商品卡、PDP 图组三个宿主声明 `container-type: inline-size`：usp ≤360 转横向紧凑排；pcard ≤160 快加购全幅并隐藏色板；pdp ≤720 图组单列、缩略图转为换行行式。`docs/04` 写明"组件按自身容器响应，页面骨架仍用视口断点"的边界。
- R07 从"圆角是否在菜单内"扩为"档位是否适合语境"：大幅媒体（`.sf-gallery__main`/`.sf-hero__figure`/`.sf-mediaband`/`.sf-editorial__media`/`.sf-post`/`.sf-prose figure`/`.m-product-card`）的 radius 若解析为 token 且低于 `lg`（12px）即红；缩略图、购物车行、头像豁免，图表柱条仍允许 `xs`。

### Added（Batch 3 · 3.8 影像比例与 srcset）

- 新增 story 竖版三件套 `.sf-media--story` / `.sf-stories` / `.sf-story`（9:16），并在 `10-pdp` 落地「三种穿法」区块：2 张 9:16 真实图，全部带 `width/height`、`srcset` 与 `loading="lazy"`。
- 本地 SVG 资产从 50 扩到 **84**：商品与 hero 横版补齐 400/800/1200/1600/2400w 五档，hero 竖版四档；08/09/10 的候选集同步扩展。`docs/05` 明确 AVIF>WebP>JPEG、LQIP 永不用于 LCP、视频必须带 poster 且默认不自动播；srcset 是候选集，预算按单次传输量计算。

### Added（Batch 3 · 3.9–3.10 基线登记与性能预算）

- `docs/11` 增 B08 OKLCH：`oklch()` 已 Baseline widely available、Tailwind v4 默认 OKLCH；本仓保持 HEX，`@media (color-gamut: p3)` 与色带重建同批留 v2，避免 HEX+P3 的伪广色域。
- `docs/05 §四` 新增**性能预算分配表**（LCP、首屏非 LCP、折叠下、字体、CSS、自有 JS、异步三方、同步三方、总量、主线程、INP/CLS）与"必异步"清单；`storefront/09` 只留摘要并指回唯一事实源，`docs/01 #8` 改为指针。
- 废除"第三方脚本 ≤3"计数式条款：同步三方 **0KB**（CMP stub ≤20KB 内联为唯一白名单），异步三方 ≤100KB 且必须在 LCP 后加载。

### Fixed（Batch 3 · 运行时验证发现）

- **PDP 图库窄容器溢出**：容器查询启用后，240/480px 容器下分别溢出 168px / 33px。根因是 `grid-template-columns: 1fr` 的 min-content 与不换行的 4 个缩略图共同顶穿；改为 `minmax(0, 1fr)` + 缩略图 `flex-wrap: wrap` 后，240/480/720 三档溢出为 0。字符串门与 axe 均未发现，由真实 Chrome 门捕获。
- **design-system a11y 回归**：该页不加载 `ai/site.css`，直接演示 `.sf-media--story` 时图片无样式并溢出，触发 axe `scrollable-region-focusable`。改为 `.ph` 9:16 色块演示 + 说明，真实类只在加载 site.css 的 `10-pdp` 接线。

### Migration（Batch 3）

- 店面首屏标题改用 `.sf-display-lg`，1280px 下由固定字阶变为约 79px（上限 96px）；专题与集合标题分别改用 `.sf-display` / `.sf-display-sm`。后台字阶不受影响。
- 店面新增三态主题入口（浅色 / 深色 / 跟随系统），默认仍为浅色；结账页不提供切换。
- PDP 新增 9:16「三种穿法」影像区块；08/09/10 的图片请求候选集扩展到 1600/2400w（不是必传量）。
- sticky header 首次使用玻璃材质，并带 `@supports` 与减透明回退；内容区不提供玻璃。
- 信任条、商品卡、PDP 图组改为按容器宽度响应：窄容器下的排版与桌面视口断点不同。

### Gates（Batch 3）

- `npm test` 266 → **269**（auto-theme-parity 3 条）；`npm run lint` 0 违规（R18 **694/694**）。
- 新增 `npm run batch3`（`ai/selfcheck/runtime-batch3.mjs`，20 条真实 Chrome 断言：三档字阶、三态主题、容器查询、分级减动效），并接入 `npm run verify` 成为第六门。
- `npm run verify` 全绿：a11y 6 页 / behavior 92 / batch3 20 / ax / i18n / l10n 95。ax 基线按可见变更更新（design-system 475 / 09 90 / 10 70 节点）。
- R18 697 → **694**（08 三处叙事标题由内联 `font-size` 改挂 `.sf-display-*`）；`deadMax` 198 → **193**，site 接线率 26.4% → **32.2%**（48/149），W-02 债 114 → **109**。

### Added（Batch 4 · 4.1–4.2 影像来源契约与挂点）

- **`provenance` 四值枚举**：`docs/10 §2.4` 新增影像来源与披露契约——`photograph` / `ai-generated` / `ai-retouched` / `illustration`，每份商品影像（含视频 poster）必须登记。机器可读来源至少一种：C2PA manifest 或 IPTC `DigitalSourceType`（`trainedAlgorithmicMedia` / `compositeWithTrainedAlgorithmicMedia`），上传链路不得剥离元数据。
- **可见披露是契约本体**：AI 生成/修饰影像必须带 badge 或 caption，不得只写在 EXIF。badge 最小高度 `--m-badge-h`（20px）、文字 `--m-text-xs`、不透明 `m-badge--neutral`、距底边 8px、阅读起点侧、对比度 ≥4.5:1；图片渲染高度 <240px 时退化为 `<figcaption>`；视频固定于 poster 与首 2s。
- **components/18 C.2**：影像挂点 `data-provenance` 与 `data-provenance-disclosure="badge|caption"` 写入组件契约；文本侧 `data-provenance="ai"` 保持原义，不得与影像四值混用。
- **badge 尺寸 token 化**：新增 `--m-badge-h` / `--m-badge-gap`，`.m-badge` 由字面量改为消费 token；无可见变化（20px / 4px）。
- **R13 扩面到影像**：缺 `data-provenance`、未知来源、AI 值缺披露挂点、未知披露形式均报错；fixture 4 → 7 条真阳性 + 3 条真阴性，manifest 同步 +3。R00 审计样本与 R12 影像 fixture 补登记，避免跨规则污染。
- **店面 26 张影像登记**：08（5）/ 09（12）/ 10（7）/ 11（2）全部标 `data-provenance="illustration"`——当前素材是本地 SVG 插画，不是摄影。conformance 新增 2 条：文档↔组件↔产物三方一致；逐张扫描店面 `<img>` 的枚举与披露。

### Added（Batch 4 · 4.3–4.4 不可关闭底线与法源表）

- **PDP 真实摄影底线**：`storefront/11 §七` 新增两行——图组至少 1 张 `photograph`、AI 生成不得作为唯一主图、AI 修饰必须与真实摄影同组并披露；每张 `<img>`/`<video>` 带来源与披露挂点。
- **后台不可关闭项**：`admin/16 §6.1` 规定来源由素材元数据派生且只读、不得提供"隐藏 AI 披露"开关、缺真实摄影阻断发布、预览与店面同样渲染披露。
- **builder 设置项**：`06-builder` 属性面板新增「媒体来源」分组（锁定 badge + 说明），呈报清单同步；只复用既有类与 token，无新增 CSS 类、无新增内联样式。
- **`docs/06 §7.1` 法源表**：7 行逐条带生效日期、适用面与 `法务复核` 字段——EU AI Act Art. 50（2026-08-02）、CA SB 942/AB 853（2026-08-02，>100 万月活）、CA SB 1050（2027-01-01，视频/音频广告）、NY GBL §396-b（2026-06-09）、市场侧素材政策、CA SB 243（2026-01-01，排除客服 bot）、CA AB 1609（2027-01-01，>$5 亿营收）。

### Fixed（Batch 4 · 4.5 SB 243 归属纠偏）

- **SB 243 不是客服 bot 的依据**：它只管陪伴型聊天机器人，且明文排除客服/交易机器人。`docs/06 §7.1` 与 `docs/08 §四` 同时锚定——bot 披露主依据是 EU AI Act Art. 50；加州客服场景的成文依据是 AB 1609（2027-01-01），引用 SB 243 会让条款在执法时失效。

### Added（Batch 4 · 4.6 披露文案封闭集）

- **`docs/08 §五`**：`pdp.aiGenerated` / `pdp.aiRetouched` / `pdp.aiImageDetails` 三个 key，规定 PDP / 商品卡 / 邮件同口径、法务复核前只入目录不作出厂默认、披露不得与促销文案合并。
- **语言包**：en / de / ar 三份目录同步新增 3 个 key（28 keys），长度预算与 ICU 门全绿；`ar` 现有 RTL 排版门继续覆盖。

### Migration（Batch 4）

- **店面影像新增必填属性**：所有 `<img>`/`<video>` 必须带 `data-provenance`；AI 值还必须带 `data-provenance-disclosure` 与真实可见物。缺属性会被 R13 拒绝。当前样张全部登记为 `illustration`，无可见变化。
- **PDP 发布契约**：生产图组缺至少 1 张真实摄影时阻断发布；"AI 生成作为唯一主图"不再合法。当前原型不满足该生产条件（全部为插画），这是契约而非样张事实。
- **披露不可关闭**：后台设置与 builder 不提供关闭项；接旧数据时缺少来源的素材必须先补登记。

### Gates（Batch 4）

- `npm test` 269 → **271**（conformance 新增 2 条）；`npm run lint` 0 违规（R18 **694/694**）。
- `npm run verify` 全绿：a11y 6 页 0 blocking / behavior 92 / batch3 20 / ax 9 快照 / i18n 28 keys / l10n 95。
- R13 fixture 4 → **7** 条真阳性、3 条真阴性；manifest +3；R00 审计样本保持 15 命中（新增来源属性未改变既有命中）。
- **执行修正**：计划 4.6 写"6 语言包"，仓库实际只有 en/de/ar 三份目录；"6"是 `docs/07` 的市场矩阵口径，不是目录数。builder 未进入 ax/a11y 运行时场景，4.3 的 builder 检查由 conformance 文本断言承担。4.2 未新增 `site.css` 类：披露复用组件层 `.m-badge--neutral`，店面样张当前无 AI 影像，新增定位类会成为零消费者债；定位契约写入文档，随首个 AI 影像生产接线。

### Added（Batch 5 · 5.1–5.6 v2.0 方向登记）

- **`docs/00` 新增「v2.0 方向登记」**：5.1 机器可读商务层与视觉原子同源（JSON-LD 由同一 props 生成，当前全仓 `application/ld+json` 为 0）、5.2 block 级主题作用域（`data-m-scheme`）、5.3 OKLCH 色带重建 + P3 同批、5.4 深色默认跟随系统、5.5 邮件面（二选一：编译 token 或明示排除）、5.6 core/commerce/console 包边界。每行写明"为什么必须 MAJOR"与前置决策，只定契约与顺序，不在 v1.7 实施。
- **决策账本回填**：O13 结构已落地、`法务复核` 仍为 `待`（v2.0 法务门）；O14 邮件面未定（v2 规划会）；O20 `transform-origin` 物理轴 / O21 两套跳过导航 / O23 面包屑当前项 / O24 `ad-sidenav` 宽度与 builder 文档债均移至 v2.0，附处置方向与代价。O11 保持"机制就位、默认不翻转"，O12 / O15 已关闭。

### Fixed（Batch 5 · 指标口径纠偏）

- **贯穿指标改址**：计划 §10 原要求写进 `ai/selfcheck/manifest.json`，执行期证伪——该文件是 `rules.test.mjs` 消费的违规清单（扁平数组），塞入指标会直接破坏测试。六项指标改由 `docs/00` 的「贯穿指标」表承载，各自指向真实账本：G-231 接线率、R18 基线、conformance 影像扫描、batch3 主题断言、tokens-sync 归属表、external-baseline 90 天门。计划 §10 与 Batch 5 回填同步记录。
- **当前值登记**：接线率 site 32.2%（48/149）· admin 45.8%（38/83）· meridian 91.35%（169/185）；内联 `style=` 694（基线 834）；零 `<img>` 店面页 1（`12-account.html`）；`theme-dark` 可达 3/5（11 刻意不提供、12 未接线）；镜像归属 419/419；外部基线核对日 2026-11-05。

### Gates（Batch 5）

- 仅文档与决策登记，无 CSS / 原型 / 规则变更：`npm test` **271**、`npm run lint` 0 违规（R18 **694/694**）、`npm run verify` 六门全绿保持不变。
- `docs/00` 的 R14 引用校验、`docs/11` 日期门与 R17 数字门在本批后重跑通过；新增表格未引入裸字重 / 裸字号字面量。

### Fixed（补丁 · O25 购买箱同排基线）

- **根因是双层缺口**：规范分别规定 CTA 52px（`storefront/11 §五`、`--m-btn-h-cta`）与步进器 44px（`components/18`、`.m-stepper`），却没有规定同排共存时如何对齐；`.sf-buyrow` 虽写了 `align-items: stretch`，却是未文档化、零消费者的死类，且只拉伸外框。PDP 用 `.m-row`（`align-items:center`）手搓，实测步进器 46px（44 + 2px 边框）对 CTA 52px，差 6px。
- **修复**：`10-pdp` 改用 `.sf-buyrow`，删除行内 `gap` 与 `flex:1`；`site.css` 把步进器外框与 −/输入/+ 三段一起对齐到 `--m-btn-h-cta`（外框 52 = 内容 50 + 2px 边框），≤767px 纵向堆叠、CTA 独占整行。
- **契约与门禁**：`storefront/11 §五` 增「同排基线」；`components/18` 增「购买箱基线（数量 × CTA）」并更新 `QuantityStepper`；`runtime-a11y` 新增计算高度断言（外框 = CTA，三段 = 外框内容高），PDP 缺 `.sf-buyrow` 也判红；`conformance` 新增三方一致断言。
- **迁移**：桌面数量与加购间距 12 → 8px（`.sf-buyrow` 的组合间距），高度 46 → 52px；移动端由自动换行改为显式纵向堆叠，CTA 独占整行。均无功能变化。

### Gates（补丁 · O25）

- `npm test` 271 → **272**；`npm run lint` 0 违规（R18 **692/692**，10-pdp 64 → 62）。
- G-231：`deadMax` 193 → **192**，site 接线率 32.2% → **32.9%**（49/149），W-02 债 109 → 108；`sf-buyrow` 已从死类账本销账。
- `npm run verify` 六门全绿；a11y 新增 `[buyrow] PASS frame=52 cta=52 segments=50/50/50`，375px 纵向堆叠无横向溢出。

### Fixed（补丁 · 中性阶去蓝与装饰描边收口）

- **中性阶去蓝（保留明度与对比）**：`--m-ink-2..12` 全阶降 chroma。`ink-11` `#5C6675` → `#61666C`（Lab b* −9.7 → −3.4，hue 258.4 → 255.9）、`ink-9` `#66738A` → `#676B73`、`ink-6` `#CBD2DC` → `#CFD2D5`、`ink-5` `#DBE0E8` → `#DEE0E3`、`ink-12` `#1F2530` → `#232529`；浅阶同步微调（`ink-2` `#F7F8F9` / `ink-3` `#F0F2F4` / `ink-4` `#E8EAEC` / `ink-8` `#84888F` / `ink-10` `#62676E`）。色温从 Tailwind-gray 家族移到 zinc 与 stone 之间，**不再是蓝灰**。深色面未动，只把深色文字镜像中性化（`#DEE0E2` / `#B3B6BC` / `#95989E` / `#61666C`）。`tokens.json` 同步。
- **商品卡去框**：`.m-product-card` 改 `background: transparent; border: 1px solid transparent`，删除 hover 的 e2 阴影与 `translate`；悬停反馈改为图片 `scale(1.03)` 300ms，并带 `prefers-reduced-motion` 关闭。PLP 12 张卡不再各画一圈框。
- **tint 徽章去框**：`.m-badge--tint` 的边框改透明（纯填充），状态边界仍由 `outline` 变体承担；`solid` 不变。
- **后台默认卡片去框**：`.stage-admin .m-card:not([data-surface])` 在 ink-2 画布上白卡无描边、无阴影；`filled` / `tinted` 卡片的 `--m-card-divider` 置透明，卡头与卡脚的内部横线一并消失（02/03/04/05/06/07 共 37 张卡、36 条内部横线）。
- **新增 `tinted` 卡面**：`--m-card-bg-tinted`（浅色取 `--m-bg-inset`，深色取 `--m-bg-surface-hover`）+ `data-surface="tinted"`，解决“白画布上白卡无描边则不可分”的缺口——前台默认改用灰卡无描边，白卡描边降为兜底。`11-checkout` 五个卡面（购物车 / 结算 / 确认 / 摘要 / 吸顶侧栏）已接线。
- **页脚去横线**：`.sf-footer` 改为纯 `--m-bg-band` 色带，删除页脚顶线与底栏分隔线；08–11 四个原型与 `design-system.html` 的页脚全部改挂 `.sf-footer__inner/__grid/__col/__bottom/__legal`。R18 页脚内联样式清偿 76 处。
- **文档**：`docs/02 §5.1` 重写表面矩阵（admin ink-2 白卡无框 / storefront 灰卡无框 / 白卡兜底描边），`docs/04 §三` 改为“静态卡靠色差与间距分离”，`components/18` 增四种 `data-surface` 与 `--m-card-divider` 契约，`storefront/10` 商品卡规格同步，`ai/AGENTS.md` 舞台表更新。
- **门禁**：`conformance` 新增「装饰描边」测试（商品卡透明框 / 无 hover 阴影 / 图片缩放与 reduced-motion、tint 徽章、`--m-card-divider`），并扩展表面轴测试覆盖 `tinted` 与后台默认无框；页脚断言改为四个 `.sf-footer` 契约。

### Migration（补丁 · 去蓝与描边收口）

- 全站灰色轻微向中性移动；所有既有对比度门槛保持或提升（`fg-muted` 对白 **5.79:1**、对 ink-2 **5.45:1**、对 ink-3 **5.16:1**；`fg-subtle` 对 ink-3 **4.76:1**；`fg` 对白 **15.35:1**）。深色面视觉不变。
- 后台页面：卡片与卡内横线消失，层次由 ink-2 画布 / 白卡 / 间距承担；hover 仍可用底色提示。表格、输入框、选中态、聚焦环等**功能性描边全部保留**。
- 前台：商品卡不再浮起，悬停时图片轻微放大；tint 徽章只剩底色；结算页卡面变为浅灰；页脚上下两条横线消失，改为色带 + 间距。
- 若宿主自定义了 `.m-card` 的 `border`，`filled/tinted` 与后台默认态会显式置透明；需要描边请显式写 `data-surface` 之外的白卡兜底样式。

### Gates（补丁 · 去蓝与描边收口）

- `npm test` 272 → **273**；`npm run lint` 0 违规（R18 **616/616**，O25 后 692 → 页脚接线再清偿 76）。
- G-231：`deadMax` 192 → **188**，site 接线率 32.9% → **36.8%**（56/152），W-02 债 108 → 104；页脚四类已由 08–11 与 design-system 真实消费。
- `npm run verify` 六门全绿：a11y 6 页 0 blocking / behavior 92 / batch3 20 / ax 8 快照 / i18n 2×28 / l10n 95。
- AX 基线更新：`design-system--default` 475 → **495** 节点——页脚 demo 由邮箱订阅改为真实页脚组合，新增 3 个导航 landmark、语言/货币选择器与法务链接；其余 7 个快照未变。

---

## 1.6.0 — 2026-11-05

> 依据：对 v1.5.0 的独立评审（交互 / 工程 / 审美 / 通用性四轴）。本轮只做**可增量、可回滚**的修复；
> 两项 MAJOR 迁移（见文末"未做"）留待 v2。

### Fixed

- **深色成功色偏色**：深色 `--m-success-bg` 原为 `rgb(23 131 86 / 0.16)`，蓝通道 86 与 `--m-success-9`（`#178229` = rgb 23 130 41）不是同一色相，导致成功徽章/横幅在深色下偏青。改为由 9 阶派生的 `rgb(23 130 41 / 0.16)`，`tokens.json` 同步。
- **深色原生表面**：新增 `color-scheme`（`:root` 为 `light`，`[data-theme="dark"], .theme-dark` 为 `dark`）。此前未声明，UA 自绘表面（滚动条、select 弹层、日期选择器、自动填充）在深色下仍为亮色——实测深色页滚动条为 `#FCFCFC`。
- **异步 Combobox 语义缺失**：`meridian-behavior.js` 在列表为空时 `return`，导致 `role=combobox` / `aria-expanded` / `aria-controls` / 键盘全部不绑定。异步搜索（列表初始为空）等于未实现。现改为语义先就位、选项到达后由 `scan()` 补齐，并在 `input` 事件重扫。

### Added · 组件层

- **表面轴** `[data-surface="raised"]`：卡片由"永远描边"解耦为可选"纯填充分离 + e1 阴影"。描边写 `transparent` 而非 `border:none`，保住 1px 盒模型，切换不跳动。
- **同心圆角**：`.m-card .m-card` 采用 `外层 − 间隙`，替代原先"内层 ≤ 外层"的经验规则。
- **`:has()` 错误态绑定**：`.m-field:has([aria-invalid="true"])` 直接驱动输入描边，使无障碍契约成为视觉态唯一事实来源，消除"两套并行"。
- **模态/浮层动效**：新增 `m-modal-in`（缩放 0.96→1 + 淡入，200ms）与 `m-pop-in`（150ms），兑现 `docs/05` 早已写明却从未实现的承诺；`prefers-reduced-motion` 下关闭。原实现 `.m-modal` 无任何 `transition`。
- **`field-sizing: content`**（`@supports` 包裹）：`textarea` 随内容增长，不支持时退回 `min-height + resize`。
- **断行质量**：标题 `text-wrap: balance`、正文 `pretty`。
- **容器查询**：`.m-shell__main` 设 `container-type: inline-size`，`@container (max-width: 720px)` 下工具条换行——折叠侧栏时视口不变、媒体查询永不触发的问题。

### Added · 契约层

- `components/18-component-contracts.md` 新增三份状态契约：
  - **A 变更生命周期**：`data-state` 封闭取值（`idle/pending/optimistic/confirmed/failed/rolledback`），明确乐观更新的允许域与"错误不得用 Toast"。
  - **B 权限态**：`no-access / deleted-elsewhere / partial / session-expired`，并规定四种状态不得复用同一文案与插画。
  - **C AI 输出生命周期**：生成中/完成/采纳前/采纳后/发布/失败六阶段，含溯源挂点 `data-provenance="ai"` 与紫色四允许位。
- 新增 `docs/10-art-direction.md`：影像序列、插画契约、四个版式原型、字体身份规则、七个品牌时刻、品格门评审口径。

### Added · 门禁（补最大的盲区）

- **新增 `ai/selfcheck/dark-contrast.test.mjs`**：此前 CI 虽跑 axe / CDP / AX 快照，但 `PAGES` 从不设 `.theme-dark`，整个深色块没有任何自动对比度覆盖——这正是 `success-bg` 偏色能出厂的原因。四条守卫：
  1. 深色各状态族 `*-bg` 的半透明字面量，RGB 必须与同族 9 阶一致（禁止手抄漂移）
  2. 正文 ≥7:1、次要文本 ≥4.5:1 地板
  3. 正文 **≤16:1 上限**（近白压近黑在中文密笔画下产生眩光）
  4. admin-dark 与 dark 的 `fg` / `fg-muted` 不得各自漂移
- 上限守卫上线即捕获并修复一处存量问题：深色 `--m-fg` 从 `#F1F3F6`（**16.89:1**）降到 `#DCE0E6`（**14.17:1**），仍远高于 AAA 的 7:1。
- `--m-price-fg` 深色由硬编码 `#F1F3F6` 改为 `fg` 别名，与 CSS 的 `var(--m-fg)` 同源（原写法在 `fg` 变更后会立刻分叉）。

### Changed · 主题机制（v1.6 的核心结构改动）

- **迁移到 `light-dark()`**：18 个表面/文本/边框语义 token 改为一次声明覆盖两个主题；深色块与 admin-dark 合计删除 **20 处**重复声明。全文现有 **32 条** `light-dark()`，集中在 `:root, .stage-storefront` 与 `.stage-admin` 两处。
- **被消灭的 bug 类**：此前 `.stage-admin` 直接声明浅色值，压过从 `html[data-theme=dark]` 继承的深色值，暗色后台只能逐项手工对位——文件里"自定义属性自身声明优先于继承"那条注释就是它的墓志铭。迁移后这类错配在语义层**不可表示**；配合 `color-scheme`，UA 自绘表面（滚动条/弹层/自动填充）一并跟随。
- **测试解析器同步升级**：`tokens-sync` / `contrast` / `audit-regressions` 三处解析器支持 `light-dark()` 取支；`contrast` 顺带抽出 `resolveValue`，修掉原来"以 token 名为入参却直接返回值"的隐性缺陷。

### Changed · 品牌配方（docs/02 §十 重写）

- **旧配方固定 `L33 S55` 有两个硬伤**：① 复现不出自己发布的 Pine（实际 HSL 167/76/24，L=0.113）；② 会把鲜艳品牌色压成深棕——番茄橙 `#FF5F00` 经配方得到 `#824226`（L=0.088），对比度更好但品牌消失。
- **改为以相对亮度为约束**：实底必须落在"对比死区 `(0.183, 0.241)`"之外。`L ≤ 0.183` 走「深底 + 白字」，`L ≥ 0.241` 走「亮底 + 深字（#2B1F02）」。落点决定模式，模式决定 `--m-primary-fg`——不再默认白字。
- **结论修正**：「品牌槽位装不下鲜艳色」是旧配方的产物，不是对比度要求。番茄橙 L=0.294，配深字 **5.3:1** 完全达标；配白字才只有 3.05:1。
- 新增 **P3 断言**：六个实底 9 阶（brand/info/success/warning/danger/accent）必须在死区外，且与配对文字色 ≥4.5:1。

### Changed · 暖色带倒挂的定性纠正（docs/02 §二）

- 原文写作"已知倒挂，彻底修正需重生成暖色带（MAJOR）"。复核后确认这是**算术必然**，不是笔误：9 阶须 ≥0.241 才能承载深字，8 阶须 ≤0.30 才能对白底 ≥3:1；要让 8 阶"比 9 阶更浅"，它就得 >0.494——直接跌出 3:1。**同一色带内不可能同时成立。**
- **撤销一条与实现相反的规避规则**：v1.5 写"tint 徽章不用 8 阶描边"，但 `.m-badge--tint` 一直在用 `--_border`（=8 阶）。深环 + 浅底是正确做法，文档已改正。
- **明确唯一禁止的组合**：同一元素上叠加 `*-border` 描边与 `*-solid` 实底（深描边 + 亮实底 → 层级反转）。新增 **P4 静态守卫**扫描 `meridian-ui.css` / `site.css` / `admin.css`。
- **v2 方向改写**：不再说"重生成色带可解决"，而是把 `*-solid` 从 12 阶色带中解耦、单独走一条亮实底轨，色带只保留深描边轨。仅重生成色带解决不了这个问题。

### Added · 表格键盘模型（v1.6）

- 后台表格此前**没有键盘模型**：`admin/15` 只规定列对齐、密度、选择、行内编辑，未规定行间导航；几十上百行的表格只能逐行 Tab 到底才能离开。
- 新增 `table[data-grid]`（opt-in）+ `initDataGrid`：每行首个可聚焦控件组成 roving 组，`↑`/`↓` 行间移动，`Home`/`End` 首末行，`Space` 交给行内控件，`Tab` 离开整表。
- **不做整行聚焦**（`role="grid"` + 行 `tabindex`）：行内已有复选框时会与之争夺焦点，等于把"Tab 太多"换成"焦点语义混乱"。行内没有单一可聚焦控件的表格会被静默跳过。
- 样张 `#demoTable` 已启用；CDP 门禁新增 **5 条断言**（初始 roving 态、↓、End、Home、首行 ↑ 不越界），由真实 Chrome 键盘事件验证。

### Added · 长任务生命周期（admin/14 §七 重写）

- 此前任务中心有进度、有 `Retry failed 12`，**唯独没有 Cancel**，也没规定取消后如何处理已产出的部分结果——"契约写了但缺关键动作"的典型。
- 补齐 `data-state` 状态机：`queued` / `running` / `cancelling` / `cancelled` / `succeeded` / `failed` / `expired`，并给出"不可中断任务不得显示 Cancel"的例外。
- 五条铁律：Cancel 必须真的停服务端工作；取消必须保留部分产出并给口径（`Download partial`）；`cancelling` 必须防连点；刷新后状态从服务端恢复；进度不可估算时必须显式不确定（禁止 0% 或伪造百分比）。
- 新增 `.m-progress--indeterminate`（由时长 token 派生 1200ms 位移，`prefers-reduced-motion` 下静止）与 `.m-progress--cancelled`（静默色，宽度冻结在取消点）。
- 新增一条"文档 ↔ CSS"一致性断言，三个形态必须在两处同时存在。

### Added · 撤销栈（admin/16 §5.1 + 行为层）

- 此前"可撤销"只有 10 秒 undo toast——那是一次**机会**，不是一个**模型**：第二次删除覆盖第一次的机会，没有 ⌘Z 语义，且 builder 原型已自建一套栈。
- 行为层新增 `MeridianBehavior.history`：应用级历史栈，深度 50；`⌘Z`/`Ctrl+Z` 撤销、`⇧⌘Z`/`Ctrl+Shift+Z` 重做；任何新操作入栈即清空 redo 支。
- **编辑态判定按"是否可输入文字"，不按标签名**：复选框/单选/滑块没有原生撤销语义，若一并排除，焦点停在表格复选框上时全局撤销会失效——这一点由 CDP 用例现场逼出后修正。
- Toast 降级为栈的**视图**：`[Undo]` 调 `history.undo()`，toast 消失不影响可撤销性。
- CDP 门禁新增 **5 条断言**（撤销两次 / 重做 / 文本框内不接管 / 深度上限 50），63 项全 PASS。
- 一致性断言：文档声明的来源、重做键、编辑态例外必须在实现中真实存在。

### Fixed · 组件契约数（O6 关闭）

- README 与样张长期写"**22** 个组件契约"，而 `components/18` 实际是 `##` 分组：目前 **15 组组件契约 + 3 份状态契约**（A 变更生命周期 / B 权限态 / C AI 输出）。这个数字从未有人能核对，AUDIT-1.4.0 撤销这条质疑的理由（"22 只出现在历史 CHANGELOG"）也是错的——它当时就在 README 和样张里。
- 口径定为**可计算**：契约规模 = `components/18` 的 `##` 分组数，标题含"状态契约"的单独计数。README 与样张改为 15 组，`docs/00` 的 O6 标记关闭。
- 新增断言：两处声明必须等于实际分组数，数字再也漂不掉。

### Fixed · 表面轴（卡片描边的真问题）

- v1.6 曾引入 `[data-surface="raised"]`（无描边 + e1 阴影），但**全库零使用**，143 个卡片实例仍全部描边——只加了个开关，没有接线。
- 且该取值与实测不符：成熟 C 端产品是**无描边、无阴影、圆角 16**。配 e1 阴影等于"无描边 + 弱填充差 + 阴影"三种弱信号叠加，比描边更脏。
- 更名为两档封闭取值：`filled`（无描边、无阴影）与 `elevated`（无描边 + e1）。
- 补上前提条件：**`filled` 要求画布 ≠ 卡片色**。前台默认两者同为 `#FFFFFF`（1.00:1），填充分离会让卡片消失；后台 `ink-2` 画布（1.06:1）才可用。
- `docs/02 §5.1` 记录实测数据与三条启用检查；新增一致性断言（CSS 实现 + 文档用法 + 前提数值三方钉住）。

### Fixed · 卡片分隔线（对照 Arco Design 复核）

- 卡片描边此前直接复用 `--m-border`。该 token 在 v1.5 为满足控件边界 3:1 被提到 `ink-6`（对白 **1.52:1**），于是每张卡都自动获得一条 1.52:1 的硬框，与 1.06:1 的画布差叠加成"双弱边缘"。
- 对照 Arco：卡片描边取 `--color-neutral-3`（对白 **1.25:1**），且 `bordered` 是**可选变体**（默认无描边）。两者的画布对比完全一致（1.06:1）——差别只在描边权重与是否默认。
- 卡片改用独立 token `--m-card-border: var(--m-ink-5)`（对白 **1.33:1**，落在装饰带）。`--m-border` 保持 `ink-6` 专供控件边界。
- 新增断言：卡片分隔线必须落在 **1.2–1.4** 装饰带，且严格轻于语义边界。

### Added · 共享边缘卡片网格（`data-card-grid`）

- 解决"一屏一堆框"：n 张各自描边的卡片 = **4n 条线**；改为相邻卡片共用一条边，只需 **n+1 条**。
- 实现：容器 `display: grid` + `gap: 0` + 1px 外环（`box-shadow`，不占布局）；单元 `border: 0`，只用 `inset` 画**左 / 上**两条线——右 / 下由右邻或容器提供，天然不重叠，不需要负 margin。
- 圆角取 **0**：共享线在四角会断开，圆角与"一张表"的语义冲突。
- hover 用 `bg-surface-hover` 底色而**不加阴影**：加阴影会让单元浮出网格，破坏共用边。
- 列数旋钮 `--m-card-grid-cols`（未声明取 3）；RTL 下左线镜像为右线。
- 对照依据：Arco `.arco-card-grid` 用 5 条 `box-shadow` 同时画外框与内分隔线，卡片自身无 border。
- 新增 2 条 CDP 断言（单元无描边 + 容器外环）与 1 条文档↔CSS 一致性断言。

### Changed · 字体层：承认现实（方案 B）

- 字重从 Inter 调校档 `450 / 550 / 650` 回到静态阶梯 **400 / 500 / 600 / 700**。原值在系统不交付字体时会塌陷：**450 与 550 在 Windows 雅黑上渲染完全相同**，三档语义实际只剩两档。
- 写作一条硬约束：**标题层级不得只靠字重表达**，必须同时用字号或颜色承担区分。Windows 雅黑只有 400/700 两档——这是平台事实，不是建议。
- 新增 CJK 排版覆盖（`:lang(zh|ja|ko)`）：正文行高 1.6 → **1.75**，后台 1.45 → **1.6**，productive 1.38 → **1.5**；汉字标题字距强制 **0**。覆盖的是变量 `--m-body-leading` 而不是 `line-height` 属性，所有消费点自动跟随。
- 修正样张自身的违规：`h2.ds-h2`（`-0.02em`）与 `.ds-hero h1`（`-0.035em`）在中文页面上用了负字距，已改为 0。
- CDP 新增 2 条断言（正文行高比 1.75 / 汉字标题零字距），**真实计算样式**验证；一致性断言钉住静态字重阶梯。
- **仍未做**：`@font-face` 交付（方案 A），需要字体文件与许可证。

### 未做（需 MAJOR，v2 排期）

- **色带重建于 OKLCH**：现有 12 阶为 hex + HSL 配方，`docs/02` 已承认暖色带 8 阶比 9 阶更暗（边框重于填充）。需重生成 7 条色带并重跑全部对比断言。

### Migration

- 无 API 变更；无 token 改名或删除。`data-state` 与 `[data-surface]` 为新增可选择项，缺省行为不变。
- 深色成功 tint 的可见变化属于修复，不是重设计。

## 1.5.0 — 2026-10-25

> 依据：`AUDIT-1.4.0.md`（独立审计，P0–P3 共 30 条）。本版**不删 token、不改名**，全部为修复 + 新增。

### Fixed（P0）
- **Switch 热区**（A-01）：`.m-switch` 增 `min-height:44px`，隐藏 input 铺满 label（原来热区仅 20px 高，违反 WCAG 2.5.8，与契约“热区 44”矛盾）。
- **移动端表单地板**（A-02）：`≤767px` 时 `--m-input-font: 1rem` / `--m-input-h: 44px`（原 14px 会触发 iOS 聚焦缩放，结算页版式崩坏）。

### Fixed（P1）
- **Undo Toast**（A-03）：新增 `--m-toast-duration-action: 10000ms`；常规 Toast 仍 5000ms。三处文档口径统一，hover **与 focus** 均暂停计时。
- **表面阶梯坍缩**（A-04）：storefront `--m-primary-tint` ink-2 → ink-3，恢复“选中比 hover 深一档”；02/AGENTS 增“非白台面 hover 用状态层”规则。
- **时间性内容**（A-05）：06 增 2.2.2 / 1.2.2 / 1.2.3 / 1.2.5 / 1.3.5 / 2.3.1 映射与 §2.3/§2.4；PDP 视频默认不自动播、必须可暂停；进度条 `role="progressbar"`、倒计时 `role="timer"`。
- **primitive 泄漏与越级 z**（A-06）：新增 `--m-chart-grid`、`--m-z-cover:200`；09/17/18 改消费语义 token（宣告条改用既有的 `--m-announce-bg/-fg`），删除 `z-nav+`；原型 08 的宣告条从近黑 primary 修正为品牌绿。
- **密度旋钮**（A-07）：`.stage-admin[data-density="productive"]` 覆盖卡片内距 / 字段间距 / 正文行高 / 表格行高四类；新增 `--m-field-gap`。
- **深色 hover 方向**（A-08）：02/AGENTS 改写为“远离端点”；深色近白主操作 hover 压暗（实现本就正确，修正文档误导）。
- **触达口径互斥**（A-09）：04 重写触达表，明确 32px 工具族允许 4px 并列的例外。
- **行高门禁**（A-10）：新增 9 个光学行高 token + **规则 R16**（component/feature 层禁止裸 `line-height`）；`site.css`/`admin.css`/两个原型共 15 处字面量全部收口。
- **reduced-motion**（A-11）：05 删除“进度类保留动画”的错误表述；加载态改为静态可读。

### Fixed（P2/P3）
- 链接 hover 不再变浅（A-13，ink-9 → ink-12，反馈改由下划线加重）；状态族补齐 success/info/emphasis `-solid-hover/-active`（A-18）；无货 swatch 改为仅淡化色层、边框保持 3:1（A-17）；`.m-tool` 标签 12 → 13px（A-16）；App Shell 增 `100dvh`（A-21）。
- 02 焦点环误引 2.4.11 修正为 1.4.11 / 2.4.13（A-12）；模态圆角口径对齐 xl 16（A-15）；后台导航折叠口径与实现对齐（A-22）；`docs/01` 去版本戳、README/AGENTS 统一“事实来源”、治理条款区分可校验/review-only、文件地图根目录修正（A-25…A-28）；版本门扩到 7 源（A-31）。

### Added（token）
- 行高：`--m-leading-title-1|2|3`、`-tight`、`-lead`、`-copy`、`-note`、`-label`、`-none`（`tokens.json` 镜像于 `typography.roles`）。
- 色/层级：`--m-chart-grid`、`--m-z-cover`。
- 状态：`--m-success/info/emphasis-solid-hover|-active`。
- 组件：`--m-field-gap`、`--m-toast-duration-action`。

### Migration（可见变化，均无需改业务代码）
- 前台选中底（combobox/列表/头像）由 ink-2 变 ink-3，比 hover 深一档。
- 前台链接 hover 不再变浅；导航链接 hover 由“变灰”改为“下划线加重”。
- 按钮/工具的 focus ring、对比度、语义层 API 完全不变。

### Gates
- 新增 `R16`（行高 token）+ fixture；`npm run lint` 全绿；测试数 191 → 213。
- 独立评审：机器门 G1/G2 + frontend-design 视觉复评 G4 + 独立 subagent 评审 G5（记录见 `AUDIT-1.4.0.md §五/§六`）。

## 1.4.0 — 2026-10-24

### Fixed（P0）
- **前台焦点环不可见**：`*-fg` 环色只适用于后台内嵌环（`outline-offset` 为负、环压在填充上）；前台外环（offset 为正）保持 `border-focus`。修复前实测白环白底 1.00:1、深环深底 1.22:1；修复后 info-9 / info-5 对页面底 5.79 / 8.60:1。Checkbox / Radio / Switch 的选中态同样回到 `border-focus`。
- **`fg-subtle` 对比度破约**：`--m-ink-9` `#66738A` → `#5F6C80`。白底 4.79 → 5.33，ink-2（band / 前台 inset）4.50 → 5.00，ink-3（后台 inset）4.27 → 4.74；深色 `border-strong`（ink-9 对 surface）3.65 → 3.28，仍 ≥3:1。图表第 8 色同步。
- **验证闭环**：`npm run lint`、README、`ai/prompts.md`、`ai/AGENTS.md`、`design-system.html` 统一为 `node ai/validate.mjs . --exclude ai/selfcheck/fixtures`；`prototypes-gate` 的 G-224 白名单剔除闭合五件 CSS（tokens / brand-tokens / meridian-ui / admin / site），不再把合法组合层误判为白名单外；门禁纳入 CI。

### Fixed（P1）
- **组件度量单一化**：stepper 40→44（sm 保持 32）；排序 Select 文档 32→36（对齐 `--m-input-h`）；后台导航桌面 32 / 移动 44（原文档 44、实现 32 二选一）；密度默认统一为 comfortable 48（admin/14-admin-foundations.md、admin/15-admin-data-tables.md、ai/prompts.md 三方对齐）。
- **图标三档封闭**：14/18/48 全部收口到 16/20/24；新增 `.m-i--24`，空状态 48→24，面包屑/星级 14→16，后台导航 18→20。
- **品牌色卡接通**：PLP/PDP/Checkout 加载 `brand-tokens.css`；swatch 改消费 `--m-swatch-color`，占位灰块替换为真实商品色；组件层不再持有商品色。
- **Swatch 触达与边界**：48×48 热区（≥44）、24/32 视觉圆、`border-strong` 3.54:1 边界；删除 `.sf-color-row` 的 30px 覆写。
- **Wallet 可用化**：新增 Shop Pay / Apple Pay / Google Pay / PayPal 四个品牌变体（品牌色在 brand-tokens.css），Checkout 增加 Express 区块；对比均 ≥4.5:1。
- **Toast 舞台反转**：删除 `:root .m-toast-stack` 的无条件居中；前台居中 / `.stage-admin` 右下。
- **动效红线**：删除 `transition: all`；进度条 width→`transform: scaleX`；抽屉退场 300→150ms、入场 300ms。
- **整卡链接**：改为 stretched link（名称链接 `::after` 覆盖整卡，卡内控件 z-index:1），消除“整卡 a 包裹 button”的非法结构。
- **行高收口**：组件层改用 `--m-leading-*`；划线价去掉 0.9em；代码块使用 `--m-code-leading`；文档明确正文/display/code 三类光学例外。
- **触达与 320px**：OTP 改 6 列网格（≤304px）；chip 移除按钮 20→24；PDP/Checkout 双栏在 1023px 以下折叠为 `minmax(0,1fr)`，320px 无横向滚动。
- **RTL 组件层**：select/search 图标、表头/数字对齐、抽屉、开关、进度、按钮组圆角改逻辑属性，并补 `[dir="rtl"]` 方向；文档不再宣称组合层已全量 RTL。

### Fixed（P2）
- **Outline badge 边界**：从 `--_solid`（warning 1.93:1）改为 `--_border`；neutral 用 `border-strong`，AI 用 `ai-fg`；新增浅/深 ≥3:1 回归。
- **深色表面阶梯**：storefront `inset #10141A → #0B0E12`、admin-dark `#0E1218 → #090C10`，inset 现在严格比 chrome 暗一档；新增单调性测试。
- **ink 色带倒挂**：`ink-10 #57647B → #5A677B`，恢复 ink-9→12 亮度单调；新增回归，更新 O3。
- **封闭 Z 阶梯**：scrim 不再 `calc(drawer - 1)`（299），改用 `var(--m-z-drawer)`。
- **圆角菜单**：`.m-seg button` 6px `calc(md - 2px)` → `--m-radius-sm`。
- **demo 外壳**：`design-system.html` chrome 清除裸 hex/rgb 与 15/18/34px 离阶字号，改用 `--m-text-*`；新增 chrome 守卫。demo 已纳入 R01/R11，静态源 0 裸色 / 0 primitive。
- **Header 尺寸 token**：新增 `--m-header-h-mobile / -h / -h-stuck / --m-announce-h`，site.css 与 docs/09 消费；滚动收缩明确为 `.is-stuck` 脚本切换。
- **WCAG AA 映射补全**：新增 1.3.1 / 1.4.1 / 1.4.4 / 1.4.5 / 2.1.1 / 2.1.2 / 2.4.1 / 2.4.3 / 2.4.4 / 2.4.6 / 3.1.1 / 3.2.x / 3.3.2 / 4.1.2；新增法源表（含 2026-06-19 撤回权需法务复核）。
- **图表色板**：先补 8 色对白底 ≥3:1 回归；随后由 O5 独立分类色板替代（见下）。
- **促销红语义**：在 docs/02 明确 `price-sale` 借用 danger-11 是 commerce 例外，admin 不消费。
- **独立图表色板（O5 关闭）**：新增 `--m-chart-1..8`（浅/深两套），白底/深底 ≥3:1；CVD 模拟最小 CIEDE2000 浅色 ≥12 / 深色 ≥10；demo 图表全部改用 chart token。
- **demo 层纳入校验（O9 关闭）**：R01/R11 现覆盖 demo 层；`design-system.html` 静态源 0 裸色 / 0 primitive，色板浏览器只在运行时动态读取 ramp。
- **运行时无障碍（O4 关闭）**：新增 `npm run a11y`（axe-core + Chrome CDP），覆盖 design-system + 4 原型，WCAG A/AA + 320px + RTL 镜像；CI 安装 Chrome 后执行。
- **RTL 组合层**：site/admin 导航下划线、移动导航、tooltip 居中补逻辑属性/RTL 方向；原型角标与账户菜单改 `inset-inline-end`；`npm run a11y` 新增 `[rtl]` 实测（无溢出 / tooltip 居中 / 下划线原点翻转）；docs/07 状态更新。
- **窄屏 reflow**：`.m-grid-2/-4` 的 minmax 改为 `min(…,100%)`，PDP/Checkout 单列折叠；admin dashboard 320px 通过。
- **组件细节**：`.m-card__header/-footer` 12px 内衬 token 化；tooltip 居中逻辑化；demo 表单/组合框补 label/ARIA。
- **行为层落地（焦点/键盘）**：新增 `ai/meridian-behavior.js` 参考实现——浮层 `inert` + `aria-modal` + 锁滚动 + Tab 循环 + Esc 关闭 + 焦点归还；tabs/seg roving tabindex 与方向键（RTL 镜像）；combobox 过滤/↑↓/Enter/Esc/`aria-activedescendant`；原生 `<dialog>` 演示改为真实模态。抽屉/灯箱/命令面板全部改挂行为层，删除绕过它的 `openDrawer/openLightbox`。
- **跳过导航（WCAG 2.4.1）**：新增 `.m-skip-link`，5 个入口页首个 Tab 可直达 `#main`；焦点环实测 2px solid。
- **长文案与 RTL 排版加固**：`.m-btn` 改为 `min-height` + 允许换行（德语复合词不再溢出按钮）；`.m-cartline` / `.m-card__header` / `.m-crumbs` 可换行；`html[lang=ar]` 全局取消 `letter-spacing`（避免拆断连写）；≤767px 标签栏与分段控件内部横滚（焦点环同步改内嵌，2.4.7 不丢）；PDP 导航复用 `.sf-nav` 并补移动菜单（burger + 对话框）；PDP 页脚改用可折叠 `sf-grid-3`。
- **文档标题结构**：`11-checkout` 增加页面级 h1、区块标题升为 h2；`02-dashboard` 增加页面级 h1、两稿页标题降为 h2、空态标题 h4→h3（消除跳级）。
- **对话框可访问名称**：`dlg1/dlg2` 补 `aria-labelledby`（标题包进 span，避免把关闭按钮名字并进对话框名），`dlg3` 补 `aria-label="命令面板"`；此前 AX 树里 dialog 的 name 为空。
- **读屏输入层门禁（AX 快照）**：新增 `npm run ax`，冻结 9 个场景的 role/name/状态/live 属性；抽屉打开态的基线里没有背景导航，直接证明 inert 在 AT 层生效。
- **语言包与 TMS 流程**：新增 `i18n/en|ar|de.json`、术语表、QA 规则、Crowdin 配置与 `npm run i18n`（key 对齐 / ICU 占位符 / CLDR 复数 / 长度预算 / 禁用片段 / 不译术语）；`npm run l10n` 改为消费真实语言包并追加伪本地化 en-XA（+35% 膨胀）。
- **原生 dialog 契约**：明确「背景 inert 是不可变约束；Tab 到浏览器 chrome 属规范行为」，写入 docs/06 §2.1，测试只断言不落到背景页面。
- **依赖**：新增 devDependency `axe-core`；`npm run verify` = lint + a11y + behavior + ax + i18n + l10n。

### Added
- `runtime-ax.mjs` + `ai/selfcheck/ax/*.json`：读屏输入层基线（默认页 / 抽屉 / dialog / 组合框 / live region / 4 原型）。
- `i18n/`：en 源语言包、ar/de 翻译、glossary.csv、qa-rules.json、crowdin.yml。
- `ai/i18n/validate-catalogues.mjs`：语言包静态门禁（TMS 与本地共用同一份规则）。
- `ai/i18n/pseudo.mjs`：伪本地化生成器（保留 ICU 占位符，字母变音 + 四角括号 +35% 填充）。
- `meridian-behavior.js`：零依赖参考行为层（浮层焦点陷阱 / tabs / seg / combobox），契约见 docs/06 §2.1。
- `runtime-behavior.mjs`：CDP 真实按键门禁——skip link、焦点环、dialog/drawer/lightbox 焦点陷阱与归还、tabs/seg/combobox 键盘、toast 播报、同列焦点顺序、标题层级。
- `runtime-l10n.mjs`：真实语言包（ar/de）+ 伪本地化 en-XA 灌稿，320/375px 溢出、控件截断、字距连写守卫。
- `selfcheck/lib/cdp.mjs`：四个运行时门禁共用的 Chrome/CDP 驱动（含真实键盘事件注入）。
- `chart-cvd.test.mjs`：8 色 × 浅/深 × protan/deutan/tritan 的 CVD 与对比回归。
- `runtime-a11y.mjs`：axe-core + CDP 运行时门禁（5 页 + 320px）。
- `conformance.test.mjs`：P1 组件契约（11 组）+ P2 demo chrome / 封闭阶梯 / WCAG 法源 + P3 行为层 / skip link / 移动导航 / 本地化 / 标题结构 / AX 快照 / 语言包，共 21 组守卫。
- `contrast.test.mjs`：文本 token × 常见表面全矩阵（浅 / 深）；前台外环对相邻背景 ≥3:1；后台内嵌环对填充 ≥3:1 分列；ink 单调性、深色 rank 阶梯、outline badge、图表 8 色回归。
- `focus-ring.test.mjs`：只允许 `.stage-admin` 作用域覆盖实底环色；选中态白环回归。
- `prototypes-gate.test.mjs`：原型门禁进入 `npm test`，G-224/G-228/G-229 任一红即失败。
- `config.test.mjs`：`lint` 必须排除 selfcheck fixtures，防止默认命令再次假红。

### Changed
- 版本 1.3.0 → 1.4.0（primitive 改值 + 视觉可见变更 = MINOR）。

## 1.3.0 — 2026-10-24

### Fixed
- **P0 非文本对比度**：`--m-ink-8` `#8E99AA` → `#7E8999`；`--m-border-strong` 改用 ink-8（白底 3.54 / ink-2 3.33 / ink-3 3.16）；深色 `border-strong` 改用 ink-9（对 surface 3.65）。状态族 `*-border` 分色带校准：success/danger/info 用第 7 阶，warning/accent 用第 8 阶；深色改用第 6 阶实色（5.6–8.3:1）。
- **P0 焦点环**：实底按钮的 `outline-color` 改取该变体的 `*-fg`（后台 brand-9 上 6.44:1，danger-9 上 5.23:1），修复后台内嵌环在实底上 1.11:1 不可见。
- **P0 事实源**：`tokens.json` 与 `tokens.css` 主题语义逐值对齐（`:root` = 前台），新增 stage 维度与全量 parity 测试；明确 **tokens.css 为运行时事实来源，tokens.json 为主题层镜像**。
- **P1 深色前台**：支持主题类挂在祖先元素（`.theme-dark .stage-storefront` / `[data-theme="dark"] .stage-storefront`），不再因 body 自身声明遮蔽深色继承。
- **P1 语义色分离**：success 色带色相从 147–157 移到 130（Leaf Green），与品牌 Pine 拉开 30°+；accent 从 Amber 改为 Terracotta 赤陶（`accent-9 #C2410C`，白字 5.18:1），与 warning 黄色明确区分。图表色板 3/7 改用 `warning-8` / `accent-8`，全部 ≥3:1，并禁止同图双绿/双暖。
- **P1 链接可辨性**：正文内联链接静息态下划线（WCAG 1.4.1），不影响导航/按钮/卡片链接。
- **P1 行高**：新增 `--m-leading-*` 与 `--m-body-leading`（前台 1.6 / 后台 1.45），Tailwind `--text-*--line-height` 全量桥接；修正 lg/2xl/3xl/4xl/5xl/6xl 落到浏览器默认行高的问题。
- **P1 级联**：LAYER 3 不再重复声明 `--m-card-radius/-shadow/-overlay-blur`，去掉对前台语义的反覆盖。
- **P1 Loading**：spinner 改用变体前景色，次级按钮不再白圈白底；Checkbox 热区补到 44×44。
- **P1 Tailwind**：`dark:` 同时支持 `.theme-dark` 与 `data-theme="dark"`。
- **P1 展示层**：12 个原型补齐 `site.css` / `admin.css` 组合层（此前只加载 tokens + meridian-ui，导致 `sf-*` / `ad-*` 全部失效、390px 布局崩坏）；PLP 改用 `sf-product-grid` / `sf-grid-3`，390px 无横向滚动；design-system 的 `.g2` 与表格改为可收缩/内部滚动。新增原型组合层加载守卫。
- **P2**：侧栏选中态改用 `chrome-selected`；destructive pressed 与 hover 分离；前台 primary hover/pressed 方向修正；深色 Toast 抬升一档；`radius-xs` 保底 2px；补 Tailwind 缺失的 focus/scrim/price/pill 等导出。

### Changed
- `--m-primary-border`：前台 = `border-strong`，后台 = `brand-8`（语义边界 ≥3:1）。
- 版本 1.2.0 → 1.3.0（primitive 改值 + 视觉可见变更 = MINOR）。

### Added
- `contrast.test.mjs`：非文本对比 + 实底焦点环永久回归。
- `tokens-sync.test.mjs`：primitive / light / storefront / admin / dark / admin-dark 全量 parity。
- 行高 token 与 Tailwind 行高桥接；breakpoints & app shell increment section（Locust shell）。

## 1.2.0 — 2026-09-19

### Fixed
- 校验引擎两处缺陷：① doc 层不再收集 `meridian-allow`（O8 治本，文档示例 marker 不再误报 stale）；② marker 消耗改为"未消耗优先、行距最近"，相邻违规不再被远端 marker 抢先吸收（v1.1 遗留的 `meridian-ui.css` shimmer stale 由此根除）
- `--m-accent-11` `#96660A` → `#8A5E09`：修复 emphasis 族 `*-fg/*-bg` 实测 4.41 < 4.5 的对比度破约（accent-2 上现为 5.0:1，白底 5.7:1；色相不变，图表色板不受影响）
- docs/02 §六 `border/bg-surface` 契约值 ≥1.6:1 → 实测 ≈1.3:1（装饰性基线，非语义边界无 WCAG 义务）
- components/18 合规小字 11px → 12px（补齐 v1.1 迁移说明声称但漏改的口径）
- design-system.html 版本/计数统一（v1.2.0 · 22 契约 / 87 演示）；README 治理条款将演示页纳入版本一致性清单
- `.m-btn--destructive:active` 改用 `--m-critical-solid-active`（原先误用 hover 值，深色主题下 active/hover 无区分）

### Added
- `ai/selfcheck/contrast.test.mjs`：对比契约永久回归（浅色 §六 全表 + 状态族五件套 + 深色语义块，tokens.json↔css 同步断言）
- `ai/selfcheck/orphans.test.mjs`：非 primitive token 零孤儿守卫（业务 API 面白名单制，含逐条理由）
- `.m-combobox` 参考实现接入 c10 演示；components/18-component-contracts.md 指认 CommandPalette 参考实现 = `.m-palette`
- `.m-badge--promo` 促销徽章变体（默认与 emphasis 同值，品牌可经 `--m-badge-promo-*` 独立覆盖）
- 孤儿 token 消费：`--m-input-placeholder`（placeholder）、`--m-state-selected`（host-selected 态层）、`--m-critical-solid-active`（destructive :active）；`--m-state-dragged` 声明为 M3 公式完备集成员
- GitHub Actions CI（npm test + 校验门禁双闸）与 `.gitattributes eol=lf`

### Changed
- 版本纪律执行：primitive 改值 → MINOR（1.1.0 → 1.2.0）
- `engine.test.mjs` 的全仓 CLI 断言改为真实契约（全仓扫描命中 fixtures 植红 → 退出 1），套件首次 143/143 全绿

## 1.1.0 — 2026-09-19

### Added
- 校验规则 R01–R15（合计 14 条，全部 error 级，`R06` 空缺保留序号）+ `ai/selfcheck/` 精确集合回归（manifest 61 项）
- 语义 token：`--m-body-fs`、`--m-critical-solid-hover/-active`、`--m-control-off-bg`、`--m-tooltip-bg/-fg`、`--m-neutral-solid`
- `.m-toast` 参考实现、`[data-density="productive"]` 切换
- `docs/00-open-decisions.md`、本 `MIGRATION-1.1.md`、行级 `meridian-allow` 机制
- `--exclude <seg>` CLI（区别于 `cfg.ignore`，给 fixture 提供临时跳过）

### Changed
- **`:root` 默认舞台由后台语义改为前台**（主操作近黑、正文 16px、`fg-link` 中性、卡片 e1/16px、overlay-blur 4px）；后台必须显式 `.stage-admin`，组件 API 与 `m-btn--primary` 类名均不变
- 焦点环由 `box-shadow` 改为 `outline`，声明点收敛到 `ai/tokens.css` 一处；admin 后台保持贴边框内侧的环
- 密度默认统一为 comfortable 48px；`--m-table-row-h-productive` 通过 `[data-density="productive"]` 切换为 36px
- 头像底色 `brand-3` → `--m-primary-tint`、文字 `brand-12` → `--m-primary-text`（已声明的唯一可见色差）
- 31 行脱 4 网格间距（`6/10/14/1px`）归位为 `--m-space-{2,3,4,05}` token；间隙略微放宽

### Fixed
- 复选框 / 单选 / 开关的键盘焦点不可见（WCAG 2.4.7）：在 `.m-check/.m-radio/.m-switch` 的可见部件（`.box/.track`）上新增 `:focus-visible` outline
- `validate.mjs --json` 恒退出 0 造成的 CI 假绿（v1 的 `--json` 假绿彻底修死）
- 49 处 primitive 越权 → 0（meridian-ui.css 14 处 + design-system.html 35 处分别由 demo `offInDemo` 与新语义 token 解决）
- 33 处低于 12px 字号 → 0（meridian-ui.css 5 处 + design-system.html 28 处全部改 `var(--m-text-xs)`）
- 16 处物理方向属性 → 0（`margin/padding-{left,right}` 全部改 `margin/padding-inline-*`）
- 5 处裸色值、2 处越界圆角、3 处动画时长得 `meridian-allow` 行级豁免
- 跨目录裸章节引用全部改带文件名形式（同目录裸引用与"第N节"作为已知局限留给 S2 的锚点系统）
- `.theme-dark` 与 `.stage-*` 不得同元素的限制取消——现在 `.stage-x.theme-dark` 复合选择器两类同元素可用

## 1.0.1 — 2026-09-15

### Fixed
- `.m-tool` 基础规则不得声明 `border-radius`（同优先级靠后会覆盖形状族圆角）——见 `components/18-component-contracts.md` §Toolbar

## 1.0.0 — 2026-09-13

### Added
- Meridian v1.0.0：三层 token（primitive → semantic → component）、双舞台规范、22 个组件契约、`ai/` 机器层
