# Meridian v1.7.0 · 接线与外部基线修复执行计划

> 依据：2026-11-05 独立评审（**趋势对标 / 产物兑现 / 机器门有效性** 三轴）。该评审的口径与 `AUDIT-1.4.0.md` 正交：后者做内部一致性，本轮做**外部对标与"声明→接线→验证"链路验证**。
> 目标：把 30 条发现落到 **代码 + token + 规格 + 门禁 + 产物** 五层；其中 4 条属 v2.0 MAJOR，本计划只登记方向，不在 v1.7 实施。
> 原则：**先证伪，再修复**；任何"已修复"必须同时有机器断言与评审记录；**修复顺序按"是否会丢单"排，不按"是否影响截图"排**。

---

## 0. 根因（三类，决定批次划分——不先定根因就会退化成 30 条补丁）

### 根因 A｜校验器判"值"，不判"结构"→ 合规与接线脱钩

本轮实测（`prototypes/*.html`，12 个文件）：

| 事实 | 数值 |
|---|---|
| 原型内联 `style="…"` 总数 | **801** |
| 原型内 `<style>` 块 | **0** |
| `ai/site.css` 选择器类定义 / 零消费者 | 172 / **143**（接线率 **16.9%**） |
| `ai/admin.css` 选择器类定义 / 零消费者 | 138 / **94**（接线率 **31.9%**） |
| `ai/meridian-ui.css` 接线率 | **92.8%**（235 定义 / 17 零消费——**唯一健康的层**） |
| `sf-*` 类定义 / 被原型消费 | **142 / 15** |
| `ad-*` 类定义 / 被消费 | **83 / 0**（**接线率 0%**） |
| `.ad-builder*` 类定义 / 使用 | **10 / 0**（`06-builder.html` 用 67 条内联 style 手搓画布与面板） |

机制：R05/R07/R16 等规则检查的是"这个值是否取自 token"。`<div style="padding:0 var(--m-space-4)">` **完全合规**，于是 801 条内联声明一路绿灯，而 CSS 层里的 254 个类没有任何屏幕调用。**门禁全绿与组合层零接线并不矛盾——它们测的不是同一件事。**

### 执行期回填｜基线可复现性（Batch 1 开工时实测）

上表写的是**结论**，没写**测法**，因此 Batch 1 无法在改动后复测。以下三行是本计划此后唯一生效的口径，2.1 的 `wiring.test.mjs` 必须实现同一算法并把算法本身写进测试文件头。

| 指标 | 可复现测法 | 计划撰写时 | Batch 1 后 |
|---|---|---|---|
| 原型内联 `style="` | `grep -o 'style="' prototypes/*.html \| wc -l`（12 文件，含 `prototypes/index.html`，不含 `design-system.html`） | **801 无法用任何测法复现**（HEAD `9e690ec` 同测法 = 889；工作树含未提交的 RTL/进度条改造） | **834** |
| `sf-*` 接线率 | `class="…"` 里出现过的类 ∩ CSS 文件内 `\.([a-z][\w-]*)` 提取的类名 | 16.9%（172 定义 / 143 零消费） | **25.3%**（182 定义 / 136 零消费） |
| `ad-*` 接线率 | 同上，测 `ai/admin.css` | 31.9%（138 / 94） | **30.8%**（146 / 101） |

三点必须记住的更正：

1. **801 这个数字作废**，棘轮基线改用 **834**（2026-11-05 实测，测法见上）。`design-system.html` 另计（366 条），它是 demo 层，不进 R18 的 feature 层预算。
2. **接线率的分母在动**：Batch 1 每加一个类就多一个定义。因此 G-231 的棘轮量必须是**零消费者类的绝对数**（site.css 143 → 136）而非百分比——百分比会因"同时补接线和加新类"而假性变好。
3. `02-dashboard.html` 相对 HEAD **+2** 条内联 style，但**不是 Batch 1 造成的**：工作树里有一批未提交的 `right:`→`inset-inline-end:` 与 `--m-progress` 改造（含新增 `<h2 style=…>`）。不变量 #8 的执行基线因此只能是"回填后的 834"，不能是 HEAD。

### 根因 B｜反向门缺失：只验"用的有没有定义"，不验"定义的有没有被用"

- 正向门已存在：G-228 要求原型每个 `class` 能在 CSS 里找到定义，无定义须进 `CLASS_ALLOW` 并附理由。
- **反向门不存在。** 于是：
  - `site.css:562-569` 的 `.rv/.rv--fade/.rv-1..6` 入场动画族零消费者，而 `prototypes-gate.mjs` 专门有一条 **动效守卫**要求 `.rv` 自带 `prefers-reduced-motion` 段——**CI 正在花断言守护一段没有页面调用的 CSS 的属性写法。**
  - `conformance.test.mjs:37-39` 用 3 条正则断言 `.ad-sidenav` 的 CSS 文本存在，而该类在全仓 HTML 中出现 **0** 次。
  - `AUDIT-1.4.0.md §6.5.4` **已经登记**过这件事（"`.ad-sidenav` 无原型实例…属 S4 组件示范债"）。HEAD 提交 `9e690ec`（G-229）把 `brand-tokens / admin / site` 收进单一事实源时，`admin.css` 带着 **83 个 `ad-*` 类、0 个实例**入仓，而 G-229 扩的是**正向**类允许清单（扫描面从 `meridian-ui.css` 五件并集）——**反向门在这一轮仍然缺位。这不是没被发现，是发现了没有处置路径。**

### 根因 C｜文档以"数字口径"抄写实现值，改一处不动另一处

字重是证据链最完整的一条：

| 位置 | 写的值 |
|---|---|
| `docs/03:28-38` | 论证**必须放弃** 450/550/650（自证 Windows 下 450 与 550 渲染相同） |
| `docs/03:84-96`、`:105`、`:113-114` | 同一份文档 **46 行之后**继续写 650 / 550 / 450 |
| `docs/01:22` | 把"权重调校 450/550/650"当作成就表彰 |
| `storefront/10:13` | 商品名 `md, 550` |
| `ai/tokens.css:187-190` | `400 / 500 / 600 / 700` |
| `ai/tokens.json:101` | `"regular":450,"medium":550,"semibold":650,"bold":700` |

镜像测试为什么没抓到：`tokens-sync.test.mjs` 的 6 条"全量一致"范围是 **primitive + semantic 主题层**（与 README 声明一致，README 没有过度声明），`:91` 那条 typography 测试只比 `leading` 与 `sizes-px` 两个键。而 `AUDIT §6.5.3` 把 LAYER 3（字阶角色等）定为"单向镜像、不比对"。**问题是 `tokens.json` 里存在一个"按约定不必镜像"的层中的镜像字段，且值已过期**——存在性本身没有归属判定。

### 根因 D｜审计轴封闭（方法论层）

`AUDIT-1.4.0.md` 覆盖 token/对比度/无障碍/机器门，**从未**做：外部趋势对标、真实浏览器像素走查、转化数据验证、性能实测、多品牌主题化、真实建站场景。本轮 30 条发现里 **26 条落在这些盲区**。因此本计划包含一个方法论工件（Batch 2 的"外部基线表"），否则下一轮仍会用同一副眼镜找同一个盲区。

---

## 1. 不变量（每一批都必须成立）

沿用 `2026-10-25-audit-remediation` 的 5 条，新增 3 条：

1. `node ai/validate.mjs . --exclude ai/selfcheck/fixtures` 退出码 0。
2. `node --test "ai/selfcheck/**/*.test.mjs" "ai/lib/**/*.test.mjs"` 全绿，**测试数只增不减**（当前基线：见各批"验收"）。
3. `tokens.css ↔ tokens.json` parity 保持绿；新增语义 token 必须双边同步。
4. 非 primitive 新 token 必须有消费者，否则进 `orphans.test.mjs` 白名单并附理由。
5. 不删除、不改名既有 token（删除 = MAJOR 迁移债）。
6. **【新】接线率棘轮**：`site.css` / `admin.css` / `meridian-ui.css` 的"类被 ≥1 个产物消费"比例**只增不减**（基线 16.9% / 31.9% / 92.8%，登记在 `ai/selfcheck/wiring.test.mjs`）。**执行期修正**：棘轮量应取"零消费者类的绝对数"（site.css 143 → 136），百分比在"边补接线边加新类"时会假性变好——见上方回填表。
7. **【新】同批接线**：任何新增 CSS 类必须在**同一批**带上 ≥1 个产物消费者；否则该类不得合入（防止第 N+1 个 `.ad-sidenav`）。
8. **【新】结构纪律**：原型内联 `style=` 计数**只减不增**（基线 801 → **作废，实测 834**；测法与归因见"执行期回填"），布局/字阶/间距类声明必须住在 CSS 层。

---

## 2. Batch 0 — 先把 v1.6.0 发出去（0.5 人日）

**为什么先做这个**：`CHANGELOG.md:5` 挂着"未发布 · v1.6.0（待发版：需同步 7 处版本常量 + A11 断言）"，其内已含 11 项改动。在待发布版本上再叠 30 条，会同时毁掉两件事：**可回滚性**（本仓明确承诺"本轮只做可增量、可回滚的修复"）和 CHANGELOG 的叙事单位。v1.6.0 先出，v1.7.0 才开始接新债。

| 步骤 | 文件 | 变更 | 验证 |
|---|---|---|---|
| 0.1 | `ai/tokens.json` `$version` 等 | 同步 7 处版本常量 → `1.6.0` | 既有版本门（A-31 扩到 7 源） |
| 0.2 | `CHANGELOG.md` | "未发布 · v1.6.0" → "1.6.0 — 2026-11-__" | 人工 |
| 0.3 | `npm run verify` | 六门全绿后打 tag | 门禁 |
| 0.4 | `AUDIT-1.4.0.md §6.5` | 把 §6.5.4（`.ad-sidenav` 无实例）**升级为未闭环项**，指向本计划 Batch 2；已知限制不得只做"登记待办"而无去处 | 文案断言（`audit-regressions`） |

**风险**：0.4 是对既有审计文档的追溯修正，属文档层。
**回滚**：版本号单点。

---

## 3. Batch 1 — P0 止血：会丢单或会出错的 7 条（3 人日｜无 MAJOR）

选择标准：**用户在这条上会失败，或数据会不一致**。与"好不好看"无关的先全部后置。

| 步骤 | 发现 | 文件 | 变更 | 验证 | 版本级 |
|---|---|---|---|---|---|
| 1.1 | V-04 安全区缺失 | `ai/tokens.css`、`ai/site.css`、`prototypes/10-pdp.html`、`prototypes/11-checkout.html` | 新增 `--m-safe-b: env(safe-area-inset-bottom, 0px)` / `--m-safe-t` / 两个 inline 轴；sticky ATC、`CartDrawer` 底栏、consent banner 的 `padding-block-end: calc(var(--m-space-3) + var(--m-safe-b))` | 新断言：4 个吸底容器必须引用 `--m-safe-b`；iPhone 15 真机/DevTools 截图 | MINOR |
| 1.2 | V-07 首页壳未接线 | `prototypes/08-home.html:40-48` | 删除内联 nav/header，改挂 `site.css:76-100` 既有 `.sf-nav` + `.sf-burger` + `.sf-mobilenav`；与 09/10 一致 | 375px 计算样式断言（nav 项 ≥44×44、无逐字竖排）；G-228 现成 | 无可见变更（后台/产物层纠偏） |
| 1.3 | V-03 购物车缩略图绕过契约 | `prototypes/11-checkout.html:76,95` | 删两处内联 `width:72px;height:90px;border-radius:var(--m-radius-sm)`，改挂 `site.css:352 .sf-cartline img` | 新断言：前台商品图 radius ≥ `--m-radius-md` | MINOR |
| 1.4 | V-10 移动端排序控件 36 | `storefront/10-storefront-plp.md:59`、`ai/site.css` | 文档 36 → "移动端 44（`--m-input-h` 移动端覆盖已在 `tokens.css`）"；PLP 排序 Select 确认走 `--m-input-h` | 计算样式断言 375px 下 select 高 44 | MINOR（文档纠偏 + 可能可见） |
| 1.5 | V-02 sticky ATC 挂在导航 z 层 | `storefront/11-storefront-pdp.md:91`、`ai/tokens.css:239-245`、`ai/site.css` | 现有阶梯 `raised10 / nav100 / cover200 / drawer300 / modal400 / toast500 / tooltip600`，**吸底转化条应落在 cover 与 drawer 之间**：新增 `--m-z-sticky-cta: 250`（低于抽屉——`CartDrawer` 必须盖住它；高于 nav 与浮层），ATC 与吸底栏改消费它。不动既有档位 | z 阶梯单调性测试（既有）+ 新断言"吸底转化件不得用 `--m-z-nav`"；CDP 验证抽屉开启时覆盖吸底条 | MINOR |
| 1.6 | V-01 字重三方分叉 | `ai/tokens.json:101`、`docs/03:84-96/105/113-114`、`docs/01:22`、`storefront/10:13` | json 改 `400/500/600/700`；文档所有裸数字改**token 名**（`--m-weight-semibold` 等） | `tokens-sync.test.mjs:91` 扩到 `typography.weights` | 无可见变更 |
| 1.7 | V-20 R01 漏 Tailwind 命名色 | `ai/checks/r01-raw-color.mjs` | 类分支补命名色表（`bg-red-500`/`text-emerald-600`…），SVG/HTML 属性字面量 `fill="#…"` 纳入；**先一次清基线再开门**（本仓 R16 先例） | 新 fixture 真阳/真阴；`--only=R01` 0 违规 | 无可见变更 |

**1.6 为什么改 json 而不是删**：`AUDIT §6.5.3` 已把 LAYER 3 定为单向镜像，删除 json 字段仍触发本仓"删 token = MAJOR"红线。正解是**给已存在的字段一个归属**：并入比对集。
**风险**：1.1 会改变 4 个吸底容器在 iOS 上的可见高度；1.3/1.5 改变前台视觉。均需 §Migration 记录可见变化（沿用 v1.5.0 Migration 写法）。
**回滚**：7 步彼此独立，可单点回退。

### Batch 1 执行结果与计划偏差（2026-11-05 回填｜已全绿）

`npm test` 227 → 232、`npm run lint` 0 违规、五道运行时门（a11y / behavior / ax / l10n / i18n）全绿。以下七条是**计划写错或没写够**的地方，后续批次不得再按原口径引用：

- **1.1｜计划的三个前提都不成立。** ①token 名改用 `--m-safe-top|right|bottom|left`（计划的 `--m-safe-b/-t` 与两 inline 轴不成体系，四轴对称才允许断言逐轴检查）。②**consent banner 不存在**：`.m-consent` 是居中卡片（`design-system.html:597`），不贴屏幕边，没有安全区可让；真正需要让位的是 `.sf-sticky-atc__inner`、`.sf-mobilenav__head/__body`、`.m-drawer__footer`、`.m-toast-stack` 四处。③计划漏掉了本条的一半：`env(safe-area-inset-*)` 在宿主未声明 `viewport-fit=cover` 时**恒为 0**，只加 token 不加 cover 等于没修。cover 只给真的渲染上述容器的 5 个页面，并由"同现同灭"断言锁死——反向铺开会让正文钻进小白条。**iPhone 真机截图在本环境不可执行**，替代验证是成对断言 + 计算样式；真机量级（横屏缺口 ≈34px）仍未被任何门测到。
- **1.2｜"无可见变更"判错，实为 MINOR。** 08 此前是内联手搓壳，接线后走组合层：导航字号 `md`→`sm`、当前项胶囊→下划线、购物袋徽章 neutral→`--m-primary`（前台=近黑）、wordmark 首次走 `.sf-brand` 全大写规格、sticky 收缩 72→56 首次生效。已按承诺写进 CHANGELOG 的 Migration。
- **1.3｜计划的验证措辞会误伤契约本身。** "前台商品图 radius ≥ `--m-radius-md`"与本仓的**尺寸分级圆角阶梯**冲突（≤56px 缩略图 = sm、96px 页购物车 = md、卡片 = lg、hero/画廊 = xl）。按原口径，`.sf-look__item img`（48px / sm）会被判违规，而它是契约不是缺陷。实际断言改为："页购物车几何必须由 `.sf-cartline img / __thumb` 持有，页面不得内联"。
- **1.4｜新门上线当天就抓到计划没写的两处。** 375px 计算样式断言（`runtime-a11y.mjs`）实测出 `design-system.html` 两个输入件用内联 `height:34px` 顶掉移动地板——值门（R05/R08/R16）对这种缺陷完全失明，这正是 Batch 2"断言计算样式而非字符串"的论据。同类残留 `prototypes/03-list.html`、09 尺码胶囊登记为 O16/O17，未顺手改：触控纠偏不该混进一次不可归因的视觉重写。
- **1.5｜"z 阶梯单调性测试（既有）"是假的。** R02 只验"值是否取自 `var(--m-z-*)`"，从不验顺序；单调性断言为本轮新写。落地时另发现并闭合两处同族镜像分叉：`tokens.json` 的 `elevation.z-ladder` 缺 `sticky-cta`，`scale.mjs` 的 `Z_LADDER` **长期缺 `cover`**（一张无人消费的菜单，一旦被新规则消费就是出厂即假）。计划的 CDP 验收"抽屉开启时覆盖吸底条"**当前不可执行**：`.sf-sticky-atc` 在 12 个原型里 0 消费者（根因 A 的又一例），延后并入 O19。
- **1.6｜实测 8 处分叉，计划只列了 4 处。** 另 4 处：`storefront/11:34` 与 `:75`、`admin/17:25`、`docs/10:86/112`、`ai/prompts.md:71`、`design-system.html:507`（活体 `font-weight:650`）。**杠杆最高的是 `ai/prompts.md`**：它把"weights with 450/550/650"作为重构指令交给 AI，即本规范最主要的消费者在系统性重新引入已放弃的档位。方法教训：`.m-banner b` 实测是 semibold 不是 medium——文档改 token 名前必须先读 CSS，机械改名会写下新的谎。`Z_LADDER` 之外的同类风险已由"三镜像同源"断言覆盖。
- **1.7｜"先清基线"的前提不成立：基线实测 0。** 全仓既无命名色工具类，也无 hex 着色属性（`grep` 独立复测确认），缺陷在检查器不在产物，因此开门零成本，无需 R16 式预清。真实收获是暴露了一条**已被固化的漏报**：`R01/fail/Feature.tsx:2` 的 `fill="#FF0000"` 从来没被命中，而 `manifest.json` 把它记成"该文件只有 3 处违规"——清单把检查器的盲区当成代码的事实。清单 63 → 70。实现过程中 `new RegExp("…?$/")` 末尾误留 `/`，命名色分支永不匹配，`fail/ 命中集合与 manifest 完全相等（漏报与误报同样红）` 当场变红：这条测试就是本批的护栏，保留原样。
- **→ 2.4（R17）新增设计约束**：文档里存在**合法的** 450/550/650 提及——`docs/03 §2.1` 的塌陷论证表、`docs/01:22` 的放弃理由、`ai/prompts.md` 的"never emit"禁令。朴素裸数字正则会全部误判，第一版就会逼作者删掉论证本身。R17 必须支持区段例外或禁令语境放行。

---

## 4. Batch 2 — 治本：反向门 + 外部基线（5 人日｜根因 A/B/C/D 各得一器）

**这一批是全计划杠杆最高的一批。** 不修它，Batch 3–5 做完照样会在 v1.8 长出新的 `.ad-sidenav`。

| 步骤 | 内容 | 文件 | 验证 |
|---|---|---|---|
| 2.1 | **G-231 接线门（反向）**：`ai/` CSS 层每个选择器类必须被 `prototypes/*.html` 或 `design-system.html` 消费；例外进 `WIRING_ALLOW`（附理由，沿用 `CLASS_ALLOW` 机制），棘轮**只减不增**。当前需登记例外：`sf-*` 143 个、`ad-*` 94 个、`m-*` 17 个 | 新建 `ai/selfcheck/wiring.test.mjs`；纳入 `npm run lint` | 首批必须给出 3 个文件的接线率并写进 manifest |
| 2.2 | **admin 组合层真实接线**（不是加白名单）：`02-dashboard.html` 与 `06-builder.html` 改挂 `ad-sidenav` / `ad-builder__*`。理由：builder 是建站产品的主界面，而 `admin.css` 已为它写了 10 个 frame 类却 0 使用；同时 O10 的裁定目前以 `.ad-sidenav` 表述、但没有任何屏幕渲染它——**决策记录的证据基础是一段没跑过的 CSS** | `prototypes/02`、`prototypes/06`、`ai/admin.css` | `wiring.test.mjs` 接线率上升；CDP 断言 56px/64px 图标轨在真实计算样式下成立 |
| 2.3 | **R18 结构门**：feature 层 HTML 的内联 `style=` 预算（**实测基线 764**，逐批下调；执行期修正：无 warn 档，直接硬错误 + 精确账本 `r18-baseline.json`）；布局类声明（`display/grid/flex/padding/margin/gap/font-size`）出现在内联 style 中时报"布局声明"，其余报"内联样式" | 新建 `ai/checks/r18-inline-style.mjs`，注册进 `ai/checks/index.mjs`（R06 编号已退役不复用，新规则从 R17/R18 起） | `--only=R18` + fixture |
| 2.4 | **文档字重/尺寸数字门（R17，doc 层）**：docs 层禁止出现裸 `450|550|650` 与"字号/行高裸数字 + 单位"，必须写 token 名（R14 已是 doc 层先例） | 新建 `ai/checks/r17-doc-numeric.mjs` | fixture 真阳/真阴；把 1.6 的纠偏钉住 |
| 2.5 | **镜像归属判定**：`tokens.json` 中每个对象键必须归入"已比对 / 显式不比对（附理由）"两表之一；未归属即红 | `ai/selfcheck/tokens-sync.test.mjs`、`docs/00` | 新增结构全等断言 |
| 2.6 | **空转探针纠偏**：R12（img 需内在尺寸）在零 `<img>` 的店面原型上**空转而报绿**。改为"店面原型 08–11 若零 `<img>` 即红"——图片是电商视觉的主体，缺图不是合规而是未测 | `ai/checks/r12-img-dims.mjs` 或 `prototypes-gate.mjs` | 新探针必须先修 2.7 才能开 |
| 2.7 | **产物影像补全**：08/09/10/11 的商品卡媒体、hero 主视觉、PDP 图组、购物车缩略图改为真实 `<img>` + `srcset`（走 `docs/05` 契约），移除图标替身 | `prototypes/08-11.html`、`ai/site.css` | R12 新探针 + 人工视觉复评 R2 |
| 2.8 | **外部基线表（根因 D 的方法论补丁）**：新建 `docs/11-external-baseline.md`，登记"对标对象 + 对标日期 + 结论"四列，条目至少含 Shopify OS 2.0（`color_scheme_group`/`font_picker`/Horizon blocks）、Apple HIG materials（玻璃边界）、M3 Expressive（字阶/形状档位）、web.dev Baseline（`light-dark`/OKLCH/VT 可用性）、Baymard PDP、Chrome DevTools 新特性节奏；每批发版前先核对本表 | 新建 `docs/11-external-baseline.md` | `docs/00` 新增一行"基线表最后核对日期"，超 90 天由测试报警 |

**风险**：2.1 上线会一次性暴露 254 个未接线类。**处置与门禁上线解耦**——首批以 warning 落地并登记 `WIRING_ALLOW`，2.2 完成后再升 error（沿用"先清基线，再开门"）。2.3 的 801 条内联声明是历史事实（实测 764），同样走棘轮而非一次性重写。
**回滚**：2.1/2.3/2.4 各自独立文件，可从 registry 摘除而不影响样式（本仓 R16 先例）。

### Batch 2 执行结果（2.1–2.8 回填｜2026-11-05）

- **2.1｜`WIRING_ALLOW` 的名字与语义都错了，已改为"账本 + ticket"。** 计划把 252 条零消费者类当"永久 API 面"去豁免，但这些是**限期债**：白名单会替债做永久的合法性背书。落地为 `ai/selfcheck/wiring-baseline.json`：每条 ticket 必带 reason（≥20 字）与 plan（目标批次），`deadMax` 必须**等于**当前债量（不是上限），`defsFloor` 防"删类销债"，`layers[*].own` 与实测全等。实测存量 **252**（计划估 254），门禁直接以 error 落地而非 warning——存量已逐名入账，新增即红，没有降级必要。
- **2.1｜接线率的三组实测（`npm test` 的 G-231 行）**：`ai/site.css` 19.4%（28/144 自有类）、`ai/admin.css` **45.8%**（38/83，2.2 后）、`ai/meridian-ui.css` 91.35%（169/185）。计划要求"写进 manifest"不成立：`ai/selfcheck/manifest.json` 是违规清单不是指标表；指标的唯一账本是 `wiring-baseline.json`，测试日志每跑一次打印一行。
- **2.2｜清偿 42 笔，不是计划估的 39。** 02 挂 Sidebar v2 + 顶栏；06 首次真正渲染 `.ad-builder` 三栏（此前 `.ad-builder__*` 10 个 frame 类 0 消费者）。admin 自有接线率 0% → 45.8%（验收线 ≥25%）。余下 57 笔按屏归属写进 W-01：图表族 → 07、表格/详情 → 03/04、表单/设置 → 05/12、媒体库/主题色 → 06 后续面板、登录/404 → 08。
- **2.2｜CDP 断言落在 behavior，而不是新增一支脚本。** 计划要求"56px/64px 图标轨在真实计算样式下成立"；实现为 8 条检查 + 06 加入巡检页列表：240 → 64（点击、`aria-pressed`、localStorage）→ 刷新恢复 → 240/`"0"` → 900px 视口 56px → 收轨标签 sr-clip（`width:1px`、`display≠none`）。字符串门能伪造 `class="ad-sidenav"`，但伪造不了 `getComputedStyle().width` 与持久化后的刷新态。
- **2.2｜两处执行期修正**：① `.ad-builder__canvas` 原本重复声明 `background: var(--m-bg-page)`，等于绕过 `.m-canvas` 的 rank 契约——删重复、页面挂工具类；② l10n 门抓到 02 页头在德语 / en-XA 的 320/375px 下溢出（`.m-seg` 472px 顶穿）：`min-width:0` 只解除自动最小尺寸，不能把换行后独占一行的 `max-content` 拉回行宽，补 `.m-pagehead > * { max-width:100% }`。这是"运行时门而非字符串门"的又一实证。
- **2.2｜视觉复评抓到的两处（375px 截图，CDP 计算样式门当时全绿）**：① **子导航漏进图标轨**——≤1023 的 `.ad-subnav { display:none }` 被 `.ad-subnav.is-open { display:flex }` 按特异性压过（0,1,0 vs 0,2,0），卖货子导航在 56px 栏里被挤成"商/品""页/面/构/建/器"竖排；改为 `.ad-subnav.is-open` 后由 behavior 新增断言锁死（检查 `.is-open` 的计算 `display`，02 的默认折叠态无法暴露此缺陷）。② **动作组逐字竖排**——375px 中栏 304px，工具条图标化后仍需 ~360px，`.m-btn` 的 `white-space:normal` 把「保存 / 预览」压成两行单字；动作组包成整体 `.m-toolbar` 落到第二行（`margin-inline-start:auto` 保持右对齐），≤400 容器开 `flex-wrap` + 按钮 `nowrap`。两条都是**字符串门与 axe 都不报的纯视觉缺陷**——这正是计划"人工视觉复评"列不可省的理由，也是把截图检查写进 2.2 收尾的依据。
- **2.3｜"warn" 改为硬错误 + 精确账本（执行期修正）。** 本仓校验器没有警告层；一条永不失败的 warn 会成为全仓第一个软绿。落地为 R18 硬规则 + `ai/selfcheck/r18-baseline.json`（键 `<file>|R18`，值与实测**全等**）+ `BUDGET` 天花板：新增即红，清偿后不同步下调也红。实测存量 **764**（计划估 801；2.2 接线已先行消化 37 条），O16/O17 清偿后 **758**（布局 562），Batch 2 出口目标仍为 ≤700——差额留给 2.7 的真实 `<img>` 改造。
- **2.3｜账本只挂在 `npm run lint` 与 R18 验收测试，不写进 config。** 否则单文件 `--only` 扫描会把其余文件的额度当成"记账过剩"刷屏，真正的违规被淹掉。
- **2.3｜fixture 迁移与审计样本语义。** 注册后暴露的是真实命中而非误报：R00 审计样本 +5（其标签本就带内联样式）、R01/R02/R05/R11 的 fail fixture 各 +1，全部入 `manifest.json`。"审计样本 15 命中"断言显式排除 R18——它守护的是那 15 条植入缺陷，不是 R18 的 fixture。
- **O16｜裁定：触控契约优先于密度。** 删除 `09-plp.html` 5 处 `height:36px` 与 `design-system.html` PDP 3 处 `min-width:40px;height:36px`，回到 `.m-size-pill` 的 44×44。36px 既低于 `docs/04` 的 44px 行内可点项地板，也不值得为 8px 牺牲触摸精度。
- **O17｜裁定：删除输入框高度覆盖。** `03-list.html` 搜索输入的内联 `height:var(--m-tool-h)`（32px）删除，回到 `--m-input-h`（桌面 36 / ≤767 44）——输入件不借工具栏高度，两者移动端地板不同。
- **O22｜裁定：层归位。** `.sf-prose` 从 `meridian-ui.css` 的两条正文链接选择器移除，`site.css` 自持 `.sf-prose a:not(.m-btn)` 的静息/悬停规则。W-05 只剩 `m-skip`，`deadMax` 210 → 209；`meridian-ui` `defsFloor` 248 → 247 是**度量口径修正**（类仍定义在 site.css，减少的是组件层对 `sf-*` 的引用），不是删类。AUDIT-1.4.0 的 A-13 断言原本把泄漏选择器写成了"正确实现"——回归测试也会固化缺陷，现已同时锁住两层。
- **2.3｜验证**：`npm test` 244（R18 六条：注册、账本全等、总量上限、消息分类、CLI fail/pass）；`npm run verify` 五门全绿（behavior 92 / a11y 6 页 / l10n 95 / i18n / ax）。**O16 由新增的 a11y 计算样式断言独立钉住**：375px 下每个 `.m-size-pill` 实宽实高必须 ≥44×44（09 5 个、10 4 个、design-system 3 个通过）——axe 的 2.5.8 只保 24px 底线，比本仓承诺低 20px。触控与高度三处为可见变更，已列入 CHANGELOG Migration。
- **2.4｜R17 的第一版会把论证本身判红，必须带区段例外。** 朴素裸数字正则会命中 `docs/03 §2.1` 的塌陷论证表、`docs/01:22` 的放弃理由、`ai/prompts.md` 的 "never emit" 禁令。实现为：`parse-doc.mjs` 为候选行产出 `numeric` 事实并携带**最近标题**（区段例外据此判断），规则再放行时长（`450ms` / `450–600ms` / `--m-duration-450|600` 整串）、禁令语境（本行或标题含 放弃/禁止/never/塌陷/回落）、历史文档（CHANGELOG / MIGRATION-* / AUDIT-* / docs/superpowers）。
- **2.4｜尺寸半边收窄为"声明式"尺寸。** 计划写"字号/行高裸数字 + 单位"，但全仓实测只有 4 处无冒号散文（"字号 16px"），全是移动端平台地板事实（iOS 聚焦缩放 / 44px 触控），不是 token 选型；只拦 `font-size: 14px` / `字号：16px` 这类会被复制进代码的形式。规则头注释记录了这个边界。
- **2.4｜抓到 1.6 漏网的 3 处裸字重**：`storefront/12:90`（650 标题）、`admin/16:9`（Label 550）、`admin/16:28`（Card 标题 14/20 650）。按实测改：Label → medium（`.m-field__label` 确是 medium），Card 标题 → `--m-text-sm` / semibold，确认页标题 → semibold。教训：按清单改会漏，全仓扫描才是兜底。
- **O18｜裁定：以产物为准，R17 不扩面。** `docs/10:112` 的"3px 左侧条 + 20px 字号"与 `.sf-prose blockquote` 的 2px + `--m-text-2xl` 分叉，改文档（同 1.6 的 `.m-banner b` 判例）。边框宽度不是字体数字，扩进 R17 会让规则名与职责脱节；若未来要门禁边框，应另立规则或并入 R07 的语境判断。
- **2.4｜验证**：`npm test` 249（R17 五条；acceptance 17 规则全仓 0），五门不变且全绿。放行的代价已写明：同一行既写"禁止 450"又规定 450 时会被放行——规范文档里前者远多于后者。
- **2.5｜归属表是"镜像"一词的兑现，不是新门。** 419 个叶子键逐条登记：约 40 条模式，先到先得（窄排除在宽比对之前）；未归属、模式空转、排除项缺理由三种腐烂全部判红。没有新增校验规则，只把 `tokens-sync.test.mjs` 从"颜色 + 字重"扩到全文件。
- **2.5｜新增断言覆盖此前零断言的半边**：舞台四件套、字体栈、`sizes-px` 的 px/行高双向、`leading`/`body-leading`/`display-clamp`/`tracking`、`space`（含 05 半格例外）、`radius`（knob 经 `calc/max` 求值）、`z-ladder`、动效三组、断点（`--m-bp-*` 实际定义在组件层，测试读第三个文件）、容器、焦点环（后台 inset 表达式求值 `-3px`）。
- **2.5｜不比对项不是"跳过"，是带理由的裁定**：散文（`typography.body-fs/rules`、`elevation.e1–e4`、各类 note）与运行时门执行的契约（axe target-size、runtime-a11y 44px、contrast 比率）登记为 excluded；`$version` 归 A11，`typography.roles` 归 A-10，避免同一值两处断言后各说各话。
- **2.5｜验证**：`npm test` 261（tokens-sync 7 → 19），`npm run lint` 0 违规。求值器遇未知语法直接红（"无法解析"），不静默返回原串。
- **→ 2.6（R12）约束不变**：死类清到 209 之后，site.css 的 W-02 仍有大量未接线类（含归位后的 `sf-prose`），先用 2.7 补屏消化；否则"店面零 `<img>` 即红"会让 08–11 在补图前整个变红。
- **2.7｜影像契约先要有影像。** 新增 50 个本地 SVG（无外部许可与 AI 来源争议，离线零依赖）：12 个商品 × 400/800/1200 三档宽度，另加 hoodie 背面/面料/平铺与 hero 横版 3 档、竖版 2 档。08–11 共 **24 个真实 `<img>`**：全部带 `width/height`、`srcset`（400/800/1200w）与 `sizes`；hero 用 `<picture>` 做 3:2 → 4:5 画幅切换，LCP 图 `loading="eager" fetchpriority="high"`，其余 `loading="lazy" decoding="async"`；商品卡的 `alt=""`（相邻文本已命名商品），PDP 主图给描述性 alt。**影像不是装饰，是 R12 的测试输入**——没有 `<img>` 的比例契约只是散文。
- **2.7｜把"已声明未接线"的表达层真正跑起来。** 首次消费 `.sf-hero__copy/__figure`、`.sf-gallery` 四类、`.sf-pcard/quickadd`、`.sf-small/sf-meta`、`.m-i--24`。快加购按指针能力分档：桌面 hover/focus 浮现，`(hover:none),(pointer:coarse)` 常显并抬到 44px 触控地板（`m-btn--sm` 只有 32px）。08 的 19 处页脚/图注内联样式改挂 `sf-small` / `sf-meta`，09 的 12 个快加购按钮从内联绝对定位改回组合层。
- **2.7｜R18 758 → 697，出口目标 ≤700 达成。** 差额来自媒体占位符的内联定位消失（08 33 / 09 64 / 10 64 / 11 56），`BUDGET` 同步下调到 697。无 warn 档的规则再次证明有效：改造后不同步下调账本会直接红。
- **2.7｜W-02 死类 209 → 198，site.css 接线率 19.4% → 26.4%**（38/144）。清偿的 11 个类来自 hero / 图库 / 商品卡 / 页脚文本四族；余下 114 个仍按屏归属挂在 W-02 的 plan 里，**禁止删类销债**。
- **2.6｜空转探针放在门禁，不放在 R12。** R12 是"逐文件事实"规则：页面零 `<img>` 时不产生任何 img 事实，规则**看不见缺席**。因此探针落在 `prototypes-gate.mjs` 的 G-230：店面 08–11 任一页零 `<img>` 即红，并在 `prototypes-gate.test.mjs` 里同时断言探针源码与四个页面本体。顺序必须先 2.7 后 2.6，否则 08–11 会在补图前整个变红——计划里"新探针必须先修 2.7"的约束成立。
- **2.8｜基线表是"趋势判断"的准入证。** 新建 `docs/11-external-baseline.md`，7 条登记（Shopify OS 2.0/Horizon、Apple Liquid Glass、M3 Expressive、web.dev Baseline、Baymard PDP、Chrome/DevTools 节奏、2026-11 审美水位）。结论强制三分：采用 / 观察 / 拒绝；每条必须落到 token、规则或 O 决策。`docs/00` 顶部登记"最后核对日期"作为唯一事实源，`ai/selfcheck/external-baseline.test.mjs` 五条断言：日期存在、超 90 天红、每行四列且日期不晚于核对日、必备条目齐全、91 天/90 天边界有效。日期只准写一处——两处必然漂移，测试只会保护错的那份。
- **2.8｜执行期修正：`light-dark()` 不能作为"深色已解决"的证据。** 官方 Baseline 状态是"新可用"而非"广泛可用"（2024-05 起新可用，广泛可用目标在 2026-11 仍未达成），因此结论只能是"增强 + 保留 `data-theme`/媒体查询回退"，而不是删掉现有回退。Chrome 自 153（2026-09-08）改为双周发布，浏览器核对节奏从"每次发布"改为**每季度 + 每次 MAJOR**，否则本表 90 天就会自然过期。
- **Batch 2 出口验证**：`npm test` **266**（新增 external-baseline 5 条、G-230 1 条），`npm run lint` 0 违规（R18 697/697）；`npm run verify` 五门全绿（a11y 6 页 / behavior 92 / ax / i18n / l10n 95）。人工视觉复评 1280 + 375 两档完成：四个店面页的图片、画幅切换、快加购触控态均符合契约。

---

## 5. Batch 3 — 时新度与表达基线（6 人日｜多为 MINOR，可见变更需 Migration）

这批处理"2026-11 的视觉水位"。全部**不得先于 Batch 2**：否则只是往零接线的层里继续堆声明。

| 步骤 | 发现 | 文件 | 变更 | 版本级 |
|---|---|---|---|---|
| 3.1 | V-11 display 上限 60px、全仓仅 2 处 clamp | `ai/tokens.css:156`、`docs/03:73` | 新增 `--m-text-display-sm/base/lg` 三档流式（上限提至 ~96px），`docs/03` 字阶表补"前台叙事档"；后台不受影响 | MINOR（新增 + 前台可见） |
| 3.2 | V-05 无 OS 深色跟随 | `ai/tokens.css`、`docs/02 §九` | 新增 `[data-theme="auto"]`：`color-scheme: light dark` + `@media (prefers-color-scheme: dark)` 重指向；**默认舞台不动**，画廊与原型加切换入口（补 2.6 的可达成性）。默认翻转 = MAJOR，留 v2 并登记 O11 | MINOR |
| 3.3 | V-14 层级只有描边；e2–e4 在店面 0 消费 | `ai/site.css`、`ai/meridian-ui.css` | 店面浮层（`CartDrawer`/搜索建议/`Quick add` 气泡）改消费 `--m-shadow-e2/e3`；`docs/02 §5.1` 明确"前台 `filled` 前提（画布≠卡色）仍未满足，故前台仍用 border/elevated" | MINOR |
| 3.4 | V-15 玻璃无边界 | `ai/tokens.css`、`docs/04`、`docs/05` | 新增 `--m-glass-blur/-alpha/-dim` **仅限 chrome 与 overlay**；一条硬禁止：**内容卡与商品图禁用玻璃**（Apple HIG 口径：liquid glass 用于固定/浮动面板与分隔线，需配调暗层）。玻璃是最容易显廉价的路径，需要的是边界而不是许可 | MINOR |
| 3.5 | V-24 reduced-motion 处置过粗 | `ai/tokens.css` reduced-motion 块、`docs/05:21` | 分级：禁位移/缩放/旋转，**保留**透明度与颜色过渡；`.rv` 的 `both` 填充在降级下须停在终态而非起始态（现写法会停在动画起点） | MINOR（可见） |
| 3.6 | V-13 断点只有视口；全站 `@container` 仅 1 处且在后台壳 | `ai/site.css`、`docs/04:48` | 商品卡/图组/信任条设 `container-type: inline-size`，**组件按自身容器而非视口响应**。理由：建站场景商家把组件塞进任意宽度容器，视口断点必然错。`docs/04` 补"容器优先于视口"的适用边界 | MINOR |
| 3.7 | V-12 圆角配比失衡（`radius-xs` 63 次 vs `md/lg/xl` 13 次） | `ai/checks/r07-radius.mjs`、`docs/04 §五` | **不禁止 `xs`**（它合法且在菜单内），加**语境门**：前台商品图/卡媒体 radius 必须 ≥ `lg`；图表柱条允许 `xs`。R07 现在只判"是否在菜单内"，判不出"档位选错"——这是"菜单合规但配比失衡"的根 | MINOR |
| 3.8 | V-19 无 9:16 / 视频比例；srcset 只 400/800/1200 | `docs/05`、`ai/site.css` | 影像比例补 9:16 与视频契约（含 poster、默认不自动播——`docs/06` 2.3 已有约束）；srcset 扩至 1600/2400，明确 AVIF>WebP>JPEG 优先级与 LQIP/blur-up 策略。**注意与 `docs/01:59` 首页 ≤1.2MB 冲突 → 见 4.10 预算表** | MINOR |
| 3.9 | V-08 全 HEX、0 oklch / 0 display-p3 | `ai/tokens.css` | **本批不动色带**（v2 MAJOR 已在 `CHANGELOG:130` 排期）。仅在 `docs/11-external-baseline.md` 登记基线事实：OKLCH 已 Baseline widely available、Tailwind v4 默认色板为 OKLCH；`@media (color-gamut: p3)` 必须与色带重建同批落地，否则 HEX+P3 是伪广色域 | 不做（登记） |
| 3.10 | V-23 性能预算与商业目标互相矛盾 | `docs/01:59`、`docs/05`、`storefront/09` | 新增**表现预算分配表**（LCP 元素 / 首屏图 / 字体 / 三方脚本 各自 MB 额度），并废除"第三方脚本 ≤3"这种计数式条款，改为分类预算（一方/异步三方/同步三方）与"必异步"清单 | MINOR |

### Batch 3 执行结果（3.1–3.10 回填｜2026-11-05）

- **3.1｜"上限 96px"不是所有屏都拿满。** 三档 clamp 落在 tokens：`display-sm` 32→48、`display` 36→60、`display-lg` 44→96；1280 视口实测 48 / 58.88 / 79.04px，96 只在 ~1600px 以上出现。这是流式字阶的应有行为：计划里的"上限提至 ~96px"是画布上限，不是桌面固定值。`docs/03` 补前台叙事档表（每页只准一个 display-lg，后台禁用），`design-system` 的三档演示与 `08/10` 的真实接线同批落地。
- **3.2｜auto 是"显式 opt-in"，不是改默认。** `[data-theme="auto"]`/`.theme-auto` 声明 `color-scheme: light dark`，并在 `@media (prefers-color-scheme: dark)` 内镜像四组深色块（main/admin/chart/code）。`auto-theme-parity.test.mjs` 三条：四组镜像逐项全等、auto 不得把 color-scheme 锁成 dark、`:root` 仍是 `light`。行为层三态循环（light → dark → auto）+ localStorage；入口为 08/09/10 的 `[data-theme-cycle]` 与 design-system 的 `#themeBtn`（后者复用 `MeridianBehavior.theme.cycle()`），11 结账页故意不放（支付页不引入主题切换）。真实 Chrome 门另证 auto 深/浅与显式深/浅**计算值逐项相等**，且 OS 切换时 body 背景真实变化。
- **3.3｜"filled 前提"仍未满足，所以只加浮层阴影。** 前台画布仍纯白、与卡片 1.00:1，填充式层级依然不可用；仅在浮层消费：快加购 `e2`、抽屉/模态 `e3`、toast `e4`，内容卡上限 `e2`（禁止靠阴影代替边界）。`docs/02 §5.1` 写明这是"前提未满足时的临时正确解"，不是永久配方。
- **3.4｜玻璃只给 sticky header，一条硬禁止。** `--m-glass-blur:20px` / `--m-glass-alpha:72%` / `--m-glass-dim`；唯一消费者 `.sf-header.is-stuck`，带 `@supports not (backdrop-filter)` 与 `prefers-reduced-transparency` 回退；内容卡、商品图、PDP 主图、story 画面全部禁用。docs/04 §3.1 与 docs/05 双处写死，防止"玻璃=高级"的复制扩散。
- **3.5｜减动效从"全关"改为"分级"。** 动画 0.01ms/1 次、滚动 auto，但保留 opacity/color/background/border/shadow/fill/stroke 的 100ms 过渡；`.rv` 显式落在终态（opacity 1 / animation none / translate none），修掉原先 `both` 填充停在起点的问题。真实 Chrome 的 `Emulation.setEmulatedMedia` 断言 4 条（终态、属性白名单、100ms、滚动关闭）。
- **3.6｜容器查询优先于视口，且真机抓到一处布局缺陷。** 信任条（usp）、商品卡（pcard）、PDP（pdp）三个宿主声明 `container-type: inline-size`；阈值：usp ≤360 转横向、pcard ≤160 快加购全幅并隐藏色板、pdp ≤720 图库单列。**真实 Chrome 在 240/480px 容器下发现图库横向溢出 168/33px**——`grid-template-columns: 1fr` 的 min-content 与不换行的 4 个缩略图共同顶穿；改为 `minmax(0,1fr)` + 缩略图 `flex-wrap` 后 240/480/720 三档溢出为 0。axe 与字符串门都不报，这是"运行时门 + 视觉复评"不可替代的又一实证。
- **3.7｜R07 从"菜单合规"扩到"语境合规"。** 大幅媒体选择器（`.sf-gallery__main`/`.sf-hero__figure`/`.sf-mediaband`/`.sf-editorial__media`/`.sf-post`/`.sf-prose figure`/`.m-product-card`）的 `border-radius` 若解析为 token 且 < lg(12px) 即红；缩略图、购物车行、头像等 UI 小图不受约束，图表柱条仍允许 `xs`。`docs/04 §五` 登记例外，防止把语境门误读成"全面禁 xs"。
- **3.8｜影像契约补 9:16 与五档 srcset，先有资产再有断言。** 新增 story 竖版三件套（`.sf-media--story`/`.sf-stories`/`.sf-story`）与 PDP「三种穿法」真实区块（2 张 9:16，`width/height`、srcset、lazy）。资产从 50 扩到 **84 个 SVG**：商品与 hero 横版五档 400/800/1200/1600/2400w，hero 竖版四档。`docs/05` 写明 AVIF>WebP>JPEG、LQIP 永不用于 LCP、视频 poster/不自动播/手势播放；预算表与 3.10 互相引用，不再出现"1.2MB 总额度 vs 五档 srcset"的误读（srcset 是候选集，不是单次传输量）。
- **3.9｜OKLCH 只登记、不动色带。** `docs/11` 增 B08：`oklch()` 已 Baseline widely available、Tailwind v4 默认 OKLCH；本仓保持 HEX，因为单改颜色语法而不重建色带只会得到"看起来一样"的假现代化；`@media (color-gamut: p3)` 必须与 v2 色带重建同批，否则 HEX+P3 是伪广色域。
- **3.10｜预算表成为唯一事实源。** `docs/05 §四` 新增分类预算（LCP、首屏非 LCP、折叠下、字体、CSS、自有 JS、异步三方、同步三方、总量、主线程、INP/CLS）与"必异步"清单；`storefront/09` 只保留摘要并指回 docs/05，`docs/01 #8` 改为指针。废除"第三方脚本 ≤3"这类计数式条款：**同步三方 0KB**（CMP stub ≤20KB 内联是唯一白名单），异步三方 ≤100KB 且须在 LCP 后加载。
- **执行期修正｜design-system 的 a11y 回归。** 先在 design-system 直接放 `.sf-media--story` 演示，但该页不加载 `ai/site.css`，无样式图片在 400px demo 内溢出，axe `scrollable-region-focusable` 判红。修正为 `.ph` 9:16 色块演示 + 文案说明，真实类只在加载 site.css 的 `10-pdp` 接线——**演示页不得演示它没有加载的层**。
- **执行期修正｜batch3 用例的前提写错。** 用例原在 08 找 `.sf-pcard .swatches`，但 08 用 `.m-product-card`；pcard 容器查询的真实宿主在 09。断言改为 160px 时 quick-add `inset-inline-start: 0`、240/480px 保留 8px 内缩，并在 09 上执行。
- **Batch 3 出口验证**：`npm test` **269**（auto-theme-parity 3 条，其余为既有门）；`npm run lint` 0 违规（R18 **694/694**，08 30）；`npm run verify` 六门全绿——a11y 6 页 / behavior 92 / batch3 **20** / ax / i18n / l10n 95。R18 697→694 来自 08 三处叙事标题从内联 `font-size` 改挂 `.sf-display-*`；`deadMax` 198→**193**，site 接线率 26.4%→**32.2%**（48/149），W-02 债 114→**109**。ax 基线按可见变更更新：design-system 475 / 09 90 / 10 70 节点。

---

## 6. Batch 4 — AI 影像来源与披露（3 人日 + 法务门）

**这一批有法律结论，规范作者不得自行签署。** 本批只交付**结构与占位**，法务确认前不得进出厂文案。

| 步骤 | 内容 | 文件 | 验证 / 边界 |
|---|---|---|---|
| 4.1 | 摄影契约新增"来源与披露"小节：每份商品影像登记 `provenance`（拍摄 / AI 生成 / AI 修饰）、C2PA 或 IPTC 字段要求、披露 badge 的位置与最小尺寸 | `docs/10 §二` | 文案断言；**条款以"必填字段"表达，不断言法律义务范围** |
| 4.2 | 影像侧溯源挂点对齐文本侧既有机制：`data-provenance="ai"`（`components/18` 状态契约 C）扩到 `<img>`/`<video>`；新增 `--m-badge-*` 复用而非新色 | `components/18`、`ai/site.css` | conformance 断言：挂点存在且有可见等价物 |
| 4.3 | 一条**不可关闭**的契约：PDP 图组至少 1 张真实摄影，builder 不得提供关闭项（Baymard 口径：转化瓶颈在可验证性，不在风格） | `storefront/11`、`admin/16`（builder 设置项） | 文档断言 + builder 原型设置项检查 |
| 4.4 | 法源表补行并**逐条标注生效日期与适用面**：EU AI Act Art. 50 透明度义务（2026-08-02 起适用）、CA SB 942 / SB 1050（后者 2027-01-01）、NY GBL §396-b、市场侧合成表演者素材的 IPTC 标识要求 | `docs/06 §七` | 每行必须带 `法务复核：待/已` 字段；`R13` 合规门扩面 |
| 4.5 | **纠偏（防止把结论写错）**：CA **SB 243 管陪伴型聊天机器人，明确排除客服 bot**——本仓任何 AI 披露条款不得以 SB 243 为主依据；bot 披露义务应锚在 EU AI Act Art. 50 与加州/NJ 的 bot 欺骗披露法上 | `docs/06`、`docs/08` | 文案断言（禁止出现 SB 243 作为客服场景依据） |
| 4.6 | 披露文案模板进封闭微文案集（前台/邮件/PDP 三处同一口径） | `docs/08` | i18n 门（6 语言包 key 齐备，`ar` 需 §6.5 先解决 RTL 市场行） |

### Batch 4 执行结果（4.1–4.6 回填｜2026-11-05）

| 步骤 | 落点 | 结果 |
|---|---|---|
| 4.1 | `docs/10 §2.4` | 四值枚举 + C2PA/IPTC + 登记字段 + 可见披露 + badge 规格（20px / 12px / 不透明 / 8px / 起点侧 / ≥4.5:1）+ 小图退化 + 视频时序 + 真实摄影底线 + 文案封闭集；§7.1 合规门加入来源与披露 |
| 4.2 | `components/18 C.2`、`tokens.css`、`meridian-ui.css`、`R13`、fixtures、店面 26 张 `<img>` | 影像挂点与披露挂点成对；`--m-badge-h` / `--m-badge-gap` 有消费者；R13 扩面；fixture 7 真阳 / 3 真阴；08/09/10/11 共 26 张登记 `illustration`；conformance +2 |
| 4.3 | `storefront/11 §七`、`admin/16 §6.1`、`06-builder` | 真实摄影底线与来源披露行；后台四条不可关闭规则；builder「媒体来源」只读分组（无新类 / 无新内联样式） |
| 4.4 | `docs/06 §7.1` | 7 行法源表，逐行带生效日期、适用面与 `法务复核：待/已` |
| 4.5 | `docs/06`、`docs/08 §四` | SB 243 定位为陪伴型聊天机器人并明确排除客服 bot；bot 披露锚定 Art. 50 + AB 1609 |
| 4.6 | `docs/08 §五`、`i18n/{en,de,ar}.json` | 3 个披露 key + 同口径规则；三份目录 28 keys，ICU / 长度 / 术语全绿 |

- **执行修正**：计划 4.6 写“6 语言包”，仓库实际只有 en/de/ar 三份目录（“6”是 docs/07 的市场矩阵口径）；新增 key 三份齐备。4.3 的 builder 未进入 ax/a11y 运行时场景，检查由 conformance 文本断言承担。4.2 未新增 `ai/site.css` 类：披露视觉复用组件层 `.m-badge--neutral`，店面样张当前无 AI 影像，新增定位类会立刻成为零消费者债（违反不变量 #7）；定位契约写入 docs/10 §2.4 与 components/18 C.2，随首个 AI 影像生产接线时落地。
- **真实性边界**：店面现有 26 张影像均为本地 SVG 插画，统一登记 `illustration`；“至少 1 张真实摄影”是生产发布契约，不是当前样张已满足的事实，已在 docs/10 §2.4 与 storefront/11 §七写明。
- **出口验证**：`npm test` **271**（conformance +2）；`npm run lint` 0 违规（R18 **694/694**）；`npm run verify` 六门全绿——a11y 6 页 0 blocking、behavior 92、batch3 20、ax 9 快照、i18n 28 keys、l10n 95。R13 fixture 4→7，manifest +3；R00 审计样本仍为 15 命中。

---

---

## 7. Batch 5 — v2.0 MAJOR 方向（本计划只定契约与顺序，不实施）

| # | 事项 | 为什么必须 MAJOR | 前置 |
|---|---|---|---|
| 5.1 | **机器可读商务层与视觉原子同源**：`Product/Offer/AggregateRating/Review` JSON-LD 由 `Price`/`Rating`/`ProductCard` 的同一 props 生成；`compareAt` 的后端 30 天最低价约束必须同时投影到 `priceSpecification`（现在只约束可见文本）。补 `llms.txt` 与商品目录导出契约。全仓 `application/ld+json` 现为 **0** | 新增一整层事实来源与消费方（Agent），且要求"可见价 = 机器价"的单一源——现有架构是 CSS 单源，不含结构化输出 | Batch 2（接线门先行，否则又是一层零消费者的声明） |
| 5.2 | **block 级主题作用域**：`data-m-scheme`（section/block 粒度覆盖封闭属性集）。建站 SaaS 的刚需是"页头深绿 + 首屏浅底 + 促销带反转"并存，现在只有单品牌单方案（一个 `.stage-storefront` + 一个 `brand-tokens.css`）。**关闭 O1（商家可覆盖到哪一层）** | 若同时开放公共覆盖面 → 语义重指向 = MAJOR + 迁移说明 | 5.1 之前或同批（两者都改"事实从哪来"） |
| 5.3 | **OKLCH 色带重建**（`CHANGELOG:130` 已排）：7 条色带重生成 + 全部对比断言重跑 + `*-solid` 解耦到独立亮实底轨（`docs/02 §二` 已证同一色带内 8/9 阶倒挂是算术必然，重生成解决不了，必须解耦）。与 `color-gamut: p3` 同批 | 视觉可见 + 阶位语义变更 | O3（单调性是否作硬约束）先裁定 |
| 5.4 | **深色默认跟随系统**（3.2 的机制已就位，翻转默认即 MAJOR）。**关闭 O2** | 改变默认舞台 = MAJOR | 3.2 + `dark-contrast.test.mjs` 扩到自动态 |
| 5.5 | **邮件面**：独立工作流，不塞进 v1.7。取舍需明示——邮件客户端是另一套 CSS 支持子集（table 布局、深色图片反转、预览截断），可选路径：(a) `tokens.json` 编译出邮件变量；(b) 明确"邮件不属于本设计系统范围"，从电商承诺里删掉。当前状态是**沉默**，而沉默在独立站语境下等于漏掉 30–50% 营收渠道 | — | 需产品决策，非规范决策 |
| 5.6 | **包边界**（O7）：core / commerce / console 分离。5.1/5.2 会让"commerce 特化条款"继续膨胀，不划边界则 v2 版本决策仍与电商耦合 | — | — |

### Batch 5 执行结果（方向、决策与指标回填｜2026-11-05）

- **v2 方向登记**：5.1–5.6 已写入 `docs/00-open-decisions.md` 的「v2.0 方向登记」表，逐条说明 MAJOR 理由、前置条件与关联决策；本批不实施任何 5.x。
- **决策台账**：O13 更新为"结构已落地（Batch 4）、法务复核未过"；O14 登记为 v2 规划会待决；O20 / O21 / O23 / O24 在 Batch 3 的 RTL 复评中未处置，正式转入 v2.0，不再留在计划正文里悬空；O1 / O2 / O3 / O7 与 5.2 / 5.4 / 5.3 / 5.6 双向绑定。
- **指标账本纠偏**：计划 §10 要求"写进 `manifest.json`"不成立——`ai/selfcheck/manifest.json` 是规则违规清单，不是指标表（2.1 已记录）。六个贯穿指标改登记在 `docs/00-open-decisions.md` 的「贯穿指标」表，逐项写明当前值与守护测试：接线率（G-231）、内联 style 694（R18）、零 `<img>` 店面页 1（12-account）、theme-dark 3/5、镜像归属 419/419、外部基线 2026-11-05。
- **出口验证**：本批只改文档与台账，`npm test` 保持 **271**，`npm run lint` 仍 0 违规；Batch 4 的 `npm run verify` 结果继续有效（六门全绿）。

### 补丁：PDP 购买箱同排基线（O25｜2026-11-05）

- **触发**：评审追问「数量步进器 44px 与加购 CTA 52px 高度不一致」是规范缺陷还是页面失误。实测确认是双层缺口：PDP 用 `.m-row`（center）手搓，步进器外框 46px 对 CTA 52px；`.sf-buyrow` 虽存在且写了 stretch，但未文档化、零消费者，且只拉伸外框，内部三段仍 44px。
- **修复**：`10-pdp` 改用 `.sf-buyrow` 并删除行内 `gap` / `flex:1`；`site.css` 将步进器外框与子控件一起对齐 `--m-btn-h-cta`，≤767px 纵向堆叠；`storefront/11` 与 `components/18` 补契约；`runtime-a11y` 与 `conformance` 各加一条断言。
- **出口验证**：`npm test` 272、lint 0（R18 692/692）、六门全绿；a11y 输出 `[buyrow] PASS frame=52 cta=52 segments=50/50/50`；G-231 `deadMax` 192，site 接线率 32.9%（49/149），W-02 债 108。

---

## 8. 明确不做（附理由，防止评审退化成清单式讨好）

| 不做 | 理由 |
|---|---|
| 不引入 APCA/WCAG 3 对比算法 | `adrianroselli` 2026-04 的口径与 `docs/06` 现锚 2.2 AA 均支持此判；只在 `docs/06` 补一句"APCA 为建议项，不得据以放宽"。**过度设计比缺设计更贵。** |
| 不恢复 Sheet 类复合容器 | `docs/01:17`/`admin/17` 按 Polaris 教训主动废弃，是正确的历史决策 |
| 不做整行聚焦的 `role="grid"` 表格 | `components/18` 已给出理由（与行内控件争夺焦点）；roving 模型保留 |
| 不在前台启用 `filled` 卡片 | `docs/02 §5.1` 实测前台画布与卡面同为 `#FFFFFF`（1.00:1），填充分离会让卡片消失。前提不成立则不启用 |
| 不删除 `--m-radius-xs`，不"全面大圆角" | V-12 是配比与语境问题，不是档位问题。见 3.7 |
| 不把 254 个未接线类直接删掉 | 删除 token/类是本仓 MAJOR 红线；正确处置是 **接线（2.2）或登记例外（2.1）**。删代码看似干净，实为把债换成迁移债 |
| 不把"品牌感"外包给渐变/mesh 预设 | 3.4 给的是玻璃**边界**，不是材质库。补齐表达预设而不给边界，只会更快落入 `docs/10 §七` 自己反对的"只有打折红" |
| 不在 v1.7 翻转深色默认 | 见 5.4，MAJOR |

---

## 9. 决策登记（同步进 `docs/00-open-decisions.md`，目标轮次写明）

| # | 待决 | 影响面 | 目标 |
|---|---|---|---|
| O11 | 深色默认是否跟随系统（`[data-theme="auto"]` 是否成为缺省） | 前台默认舞台 / 品牌一致性 | v2.0（机制在 v1.7） |
| O12 | `WIRING_ALLOW` 是"永久 API 面"还是"限期债"（admin 组合层若定位为业务侧 SDK，94 个零消费者类可豁免） | 治理 / 组合层定位 | Batch 2 结束前必须裁定 |
| O13 | AI 影像披露条款的法务适用范围（哪些类目、哪些市场强制） | 合规 / `docs/06` | **结构已落地（Batch 4）**；`法务复核` 未过，转 v2.0 法务门 |
| O14 | 邮件面纳入范围还是明确排除 | 电商承诺边界 | v2 规划会 |
| O15 | 表现预算分配表以 MB 还是元素数为准（"第三方脚本 ≤3"废止后用什么口径守 LCP） | 性能契约 | Batch 3（3.10） |
| O16 | `prototypes/09-plp.html:111-115` 与 `design-system.html:722` 用内联 `height:36px` 覆盖 `.m-size-pill` 的 44×44 触控契约（1.4 的新计算样式门当场抓出）。内联高度一旦删掉，视觉会变——需裁定：是胶囊契约让位给密集筛选条（则改 `components/18` 规范），还是内联覆盖必须删（则归 R18 预算） | 触控最小尺寸 vs 密度 | **已裁定（2.3）：契约优先**——8 处覆盖删除，回到 44×44；可见变更进 CHANGELOG Migration |
| O17 | `prototypes/03-list.html:92` 内联 `height:var(--m-tool-h)` 把搜索框压到工具栏高度，低于 36px 输入下限（同 O16 家族，但这里是**用 token 表达的覆盖**，R18 的声明黑名单抓不到） | 移动端输入下限 | **已裁定（2.3）：删除覆盖**——回到 `--m-input-h`（36/44） |
| O18 | `docs/10:112` 写"引用块 3px 左侧条"，`.sf-prose blockquote` 实为 `border-inline-start: 2px`。R17 数值门只能挡字重与字号，挡不住边框宽度——需裁定：文档改 2px，还是产物改 3px | 文档↔产物字面量一致性 | **已裁定（2.4）：文档改 2px + `--m-text-2xl`**；R17 不扩面到边框宽度 |
| O19 | `.sf-sticky-atc` 在 13 个原型里 **0 消费者**（1.5 只完成 token + 规则 + 规范，CDP"抽屉盖住吸底 ATC"无法验证）。1.1/1.5 的验收的一半被推到接线批次 | 组合层接线 / 吸底转化 | **v2.0**：仍是 W-02 记账债；接线前不得用删类销债 |
| O20 | R15 只检查 `margin` / `padding` 长期属性，故 `transform-origin: left center`（`.m-progress i`）与 `.sf-nav a::after { transform-origin: left }` 这类**物理轴向的第三个家族**不在覆盖内（1.1 修 safe-area 时撞上：改逻辑属性会把刘海内缩在 RTL 下镜像错）。扩面或明示不覆盖，二选一 | RTL 契约覆盖边界 | **v2.0**：Batch 3 复评未处置，转台账 |
| O21 | 跳过导航有**两套并行实现**：`.m-skip-link`（`inset-inline-start`，P3/conformance 断言的那套）与 `.m-skip`（`top` 物理定位、translate -200%，W-05 零消费者）。两套都自称 WCAG 2.4.1 契约，后者还是唯一使用物理 `top` 的组件。裁：删一套（MAJOR）还是把 `.m-skip` 标为废弃并接线 | 组件去重 / 物理-逻辑属性 | **v2.0**：Batch 3 复评未处置，转台账 |
| O22 | `.sf-prose` 是店面组合层类，却被 `meridian-ui.css` 的 `:where(p, .m-prose, .sf-prose)` 两条链接规则引用——G-231 因此把它记成 meridian-ui.css 的死类（W-05）。这不是缺消费者，是**层泄漏**：组件层不应知道 `sf-*` 的名字。裁：把链接基线规则移到 site.css，还是给组件层一个与舞台无关的 prose 钩子 | 层前缀纪律（G-229） | **已裁定（2.3）：归位 site.css**——组件层两处去 `.sf-prose`，店面层自持链接规则；W-05 只留 `m-skip`，deadMax 209 |
| O23 | `.m-crumbs` 没有当前项样式（`aria-current="page"` 无色阶/字重变化），06 只能内联 `color` / `font-weight` 复刻；02 的今日项则靠 `is-active`。同一语义两种实现 | 组件契约缺口 | **v2.0**：补 `.m-crumbs [aria-current="page"]`，删内联（R18 会随之下降） |
| O24 | `.ad-sidenav` 刻意不声明 width（依赖 `.m-shell__sidenav` 的 56/240 两档），组合层单独引用时没有宽度；同时 admin/14 §2.2 只描述侧栏与页头，未记录 `.ad-topbar` 的搜索/通知/账户顺序与 `.ad-builder` 三栏结构。2.2 已补店铺切换与工具行，builder 结构仍只在 06 的呈报清单里 | 组合层文档债 | **v2.0**：admin/14 增补壳与 builder 骨架 |

---

## 10. 里程碑与验收度量

| 批 | 人日 | 版本 | 出厂判据（可计算） |
|---|---|---|---|
| 0 | 0.5 | 1.6.0 发布 | 六门全绿 + 7 处版本常量一致 + tag |
| 1 | 3 | 1.7.0 | 安全区/壳/图 radius/z/字重/排序/`--only=R01` 七项断言绿；`node --test` 数 ≥ 基线；Migration 记录可见变化 |
| 2 | 5 | 1.7.0 | `wiring.test.mjs` 上线并给出 3 文件接线率基线；admin 接线率 0% → **≥25%**；内联 `style=` 801 → ≤700；`docs/11-external-baseline.md` 存在且有日期门 |
| 3 | 6 | 1.7.0 | display 三档可解析；`[data-theme="auto"]` 在真实 Chrome 下随 OS 切换；`.container` 断言：3 个前台组件在 240/480/720px 容器内无溢出；reduced-motion 分级由 CDP 验证 |
| 4 | 3+法务 | 1.7.0 | 字段结构齐备且 `法务复核` 状态可见；**法务未过则只出厂结构，不出厂文案** |
| 5 | — | 2.0.0 规划 | 5.1–5.6 各有 spec，O1/O2/O3 有裁定 |

**贯穿指标（写进 `manifest.json`，逐版追踪）**：① 三文件接线率；② 原型内联 style 数；③ 零 `<img>` 店面页数；④ `theme-dark` 可达性；⑤ 镜像字段归属率；⑥ 外部基线表最后核对日期。
**执行修正（Batch 5）**：`manifest.json` 是违规清单，不承载指标；六个指标的当前值与唯一账本见 `docs/00-open-decisions.md` 的「贯穿指标」表。
这六个指标是本轮评审的真正产物——**30 条发现会修完，指标不会自动守住。**

---

## 11. 风险登记册

| 风险 | 缓解 |
|---|---|
| Batch 2 的反向门一次性暴露 254 个未接线类，团队倾向"全删了事" | 与本仓红线一致：**禁止删除**；走 `WIRING_ALLOW` 棘轮 + 分批接线。2.1 先 warning，2.2 后升 error |
| 接线门被绕过（在原型里加一处 `class="rv"` 占位即算消费） | 判据必须是**可见性**而非字符串存在：断言"计算样式里该类的声明生效"，由 `runtime-behavior.mjs`/CDP 承担；纯字符串匹配的门会被训练出假绿 |
| Batch 3 的可见变更与"商家品牌不变"的承诺冲突（hero 变大、玻璃、阴影） | 全部限定在 `.stage-storefront`，后台不受影响；Migration 逐条列可见变化，沿用 v1.5.0 写法 |
| OKLCH 与 P3 被拆成两批，出现 HEX 底 + P3 覆盖的伪广色域 | 5.3 明确同批；3.9 只做登记不做实施 |
| AI 披露条款在法务确认前被当作义务出厂，写错适用范围 | 4.4 的 `法务复核` 字段为门禁项；未过则 `docs/08` 文案不进封闭集 |
| Batch 5 的机器可读层被理解成 SEO 附加题 | 5.1 前置为"事实同源"架构问题：可见价与机器价来自同一 props，否则必然漂移（现在 `compareAt` 只约束可见文本） |

---

## 12. 一句话交付判据

v1.7.0 结束时，若只能验证一条，验证这条：

> **`ai/` 层里是否还存在没有任何屏幕调用、却被 CI 断言守护的声明？**
> 若为 0，则 C1 类缺陷（声明与兑现断层）在本仓不可复现；若 >0，则 v1.8 会再长出一个 `.ad-sidenav`。
