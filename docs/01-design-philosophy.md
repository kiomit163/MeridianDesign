# 01 · 设计哲学与原则

> Meridian（子午线）Design System v1.0 —— 面向欧美市场的企业级电商设计规范。
> 子午线连接东西：一套 token 骨架，驱动"卖货的前台"与"运营的后台"两个舞台。

---

## 一、我们从哪里来：对标杆系统的"精髓"提炼

本规范不是凭空创造，而是对 2025–2026 年欧美开源设计系统的深度解构与重组。以下是我们**吸收**与**刻意规避**的清单：

### 吸收的精髓

| 来源 | 吸收的精髓 | 在 Meridian 中的落点 |
|---|---|---|
| **Shopify Polaris** | ① 语义角色色板：`bg-surface / fg / border` + 每个状态族五件套（text/bg/border/icon/surface）；② `caution` 与 `warning` 分离的精细化告警；③ **Content-first**：每个组件文档强制微文案规则；④ 有主见的默认值（"我们替你做决定"）；⑤ Contextual Save Bar、Saved Views、Sheet 被废弃（"鼓励在新图层堆 UI，而不是改进现有 UI"）——对"何时**不给**组件"同样深思 | 状态族五件套、后台 save bar、saved views、文案规范第 docs/08-copywriting.md §一、"禁止清单"文化 |
| **IBM Carbon** | ① 2x 编号间距刻度（spacing-01=2px…13=160px）——编号去主观化；② **相对 layer token**（嵌套表面自动解析，消灭"嵌套卡片底色错误"整类 bug）；③ productive / expressive 双动效人格 | 4px 编号刻度、前台 expressive / 后台 productive 双人格动效、surface 层级规则 |
| **GitHub Primer** | ① 三层架构 + **"primitive 禁止直接使用"成为机器可查规则**；② `accent/success/attention/danger` 语义词汇 + `muted/emphasis` 强度后缀——**对比度由命名保证，而非靠 review**；③ 多主题（浅/深/高对比）一次 token 切换 | R1 校验规则（裸色值即违规）、muted/subtle 灰阶词汇、五件套后缀命名 |
| **Radix Colors** | ① **12 阶语义刻度**（1-2 背景 / 3-4 组件底 / 5-8 边框 / 9-10 实底 / 11-12 文本）——每一步"是什么用途"是确定的；② **对比度由构造保证**（11/12 阶对 2 阶预校准）；③ alpha 阶按深浅模式分别计算 | 全部 8 条色带都按 12 阶构造；对比契约表（02 章）|
| **Material 3** | ① 状态层公式：**内容色 × 固定透明度**（hover 8% / pressed 10-12% / dragged 16%）——一套公式覆盖所有组件；② emphasized easing；③ surface-container 五级 | `--m-state-*` 透明度 token、`--m-ease-enter/exit` |
| **Atlassian** | ① token 名携带状态（`.hovered/.pressed`）——**状态是 token 维度**；② 2px 焦点环 + offset 规范；③ Atlassian Sans = Inter Variable 派生——证明"Inter 改调校"是低成本高质量路线 | 权重调校 450/550/650（Polaris 同款）、焦点环双规格（前台外环/后台内嵌） |
| **shadcn/ui + Tailwind v4** | ① **CSS 变量优先 + `@theme inline`**——主题即变量；② `--radius` 单旋钮派生整套圆角；③ `data-slot` / `data-state` 作为机器可寻址挂点；④ cva 变体即 API | tailwind-theme.css、radius 主旋钮、组件契约的 data-slot 约定 |

### 刻意规避的教训

- **Polaris React 被废弃**（2025-10 转向 Web Components）的根因之一是**硬绑定单一框架** → Meridian 只承诺 CSS 变量层，组件层给契约不给实现。
- **Carbon v10→v11 token 改名**证明"按位置命名"（ui-01）会欠下迁移债 → 一切从第一天起按**语义**命名。
- **Atlassian 三代命名并存**的文档混乱 → token 词表带版本号，废弃必须给迁移路径。
- Polaris 的 **reduced-motion 只有原则没有规格** → 我们把它写成全局强制 CSS 契约。
- **样式锁死**（Shopify WC 无法被商家覆盖）是平台策略而非普适最佳实践 → Meridian 允许品牌层在"品牌插槽"内定制。

---

## 二、十条设计原则

1. **Opinionated by default（有主见的默认值）**
   每个场景只有一个推荐组件、一个推荐布局。选择越少，系统越一致，AI 越不会跑偏。规范的价值 = 替你做掉 80% 的决定。

2. **Semantic over literal（语义先于字面）**
   组件代码里只允许"用途"，不允许"外观"：写 `bg-surface`，永远不写 `#FFFFFF`。换主题、换品牌、上深色模式，业务代码零改动。

3. **Content is the interface（内容即界面）**
   排版先行、微文案与视觉同等地位。错误信息必须说"怎么修"，按钮必须是"动词+名词"，Toast 不超过 3 个词。

4. **One spine, two stages（一条脊骨，两个舞台）**
   前台的任务是**卖**（spacious、expressive、信任感）；后台的任务是**运营**（dense、productive、效率感）。两者共享同一 token 骨架，但节奏、密度、动效人格严格分离。

5. **Trust is a design material（信任是一种设计材料）**
   欧美市场的转化 = 信任的函数。价格透明（VAT 模式）、真实评价（FTC）、真实库存（禁止假紧迫感）、对等的拒绝权（GDPR）——这些不是法务备注，是组件规格。

6. **Accessible is the floor, not the ceiling（无障碍是地板）**
   WCAG 2.2 AA + 欧盟 EAA 是入场券。焦点环、24px 最小触达、错误识别、键盘全操作——全部烧进 token 与组件契约，不靠事后审计。

7. **Machine-legible design（机器可读的设计）**
   一条规则若 AI 无法确定性执行，它就不是规则。所有约束可被 `validate.mjs` 校验，所有组件有 `data-slot` 挂点，所有决策是表格而非散文。

8. **Performance is design（性能是设计的一部分）**
   LCP ≤ 2.5s / INP ≤ 200ms / CLS ≤ 0.1 是设计约束：首图永不懒加载、媒体必须声明宽高比、字体变量化预加载、第三方脚本有主线程序预算。

9. **Motion with restraint（克制的动效）**
   hover 150ms，入场 300ms，前台上限 600ms，后台上限 300ms。动效只用于"解释空间关系与因果"，不用于炫技。`prefers-reduced-motion` 一票否决。

10. **Density is a dial（密度是一个旋钮）**
    后台 comfortable（48px 行）/ productive（36px 行）两档；前台只有"呼吸感"一档。密度切换靠 token，不靠重写样式。

---

## 三、系统架构图

```
                    ┌─────────────────────────────────────┐
                    │   Brand Kit（品牌插槽：logo/字体/主色带）│  ← 唯一允许品牌自由的地方
                    └───────────────┬─────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  LAYER 1  PRIMITIVES   8×12 阶色带 / 4px 刻度 / 字阶    │  ← 仅 tokens.css 可见
        └───────────────────────────┬───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  LAYER 2  SEMANTIC     bg/fg/border/primary/状态族/价格 │  ← 业务代码唯一可用层
        │     ├── :root（Storefront Light）                       │
        │     ├── .stage-admin（Admin Light 灰底白卡）             │
        │     └── .theme-dark（深色，双向翻转型）                   │
        └───────────────────────────┬───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  LAYER 3  COMPONENT    --m-btn-* / --m-input-* / ...   │  ← 组件定制点
        └───────────────┬───────────────────────┬───────────────┘
                        ▼                       ▼
          ┌───────────────────────┐  ┌───────────────────────┐
          │  STOREFRONT 前台        │  │  ADMIN 后台             │
          │  卖：信任·转化·表达      │  │  运营：密度·效率·控制      │
          │  16px 正文 · e1 阴影    │  │  14px 正文 · 边框优先     │
          └───────────────────────┘  └───────────────────────┘
```

---

## 四、决策权边界（谁能改什么）

| 层 | 谁可以改 | 改什么 |
|---|---|---|
| Primitives | 仅设计系统维护者 | 色带值、字阶——走版本发布流程 |
| Brand Kit | 品牌方 | logo、display 字体、brand 色带整体替换（提供 12 阶生成配方，见 02 章） |
| Semantic | 仅设计系统维护者（随主题） | 语义指向关系 |
| Component | 产品团队 | `--m-*` 组件 token 覆盖（如 `--m-card-padding`） |
| 页面/功能 | 所有开发者与 AI | **只能消费语义层与组件层，禁止触碰 primitive** |

> 判断口诀：**"改品牌找 Brand Kit，改密度找 component token，其它一律找系统。"**
