# 14 · 后台基础（Admin Foundations）

> 后台的唯一 KPI：**单位时间完成的运营动作数**。舞台人格 = Productive（见 05 章）。设计参照系 = Shopify Admin（Polaris）+ Carbon 数据密度。

---

## 一、体验原则

1. **商人优先于差异化**（Polaris："Match the rest of the admin, put merchant needs ahead of being different"）——熟悉感是生产力。
2. **读多写多，皆求快**：默认密度 productive；扫描列对齐；键盘全程可操作。
3. **破坏性操作重摩擦，常规操作零摩擦**：删除有确认，筛选无确认。
4. **状态永远可见**：保存中/已保存/失败/后台任务进度——运营者不敢用"静默"的系统。
5. **复杂度可折叠**：新手默认视图 + 高手可展开（"Hide complexity, but give access to sophistication" — Polaris 经验价值观）。

## 二、应用框架（App Shell）

> **先说拓扑**：后台有两种骨架，选错会导致整个页面的灰阶层级颠倒（详见 docs/02 §四、§五）。
> - **记录型**（订单/商品/客户列表、设置、仪表盘）→ 拓扑 A「画布 + 卡片」：灰底 + 白卡
> - **外壳型**（2–3 栏常驻工作台：IDE、AI 对话、邮件、CRM）→ 拓扑 B「框架 + 工作台面」：灰框架包围一块白色工作台面
>
> 判据："内容是一块块可数的卡片，还是一整片连续的流？"

### 2.1 区域层级分配表（两个拓扑通用）

| 区域 | rank | Token（浅色） | 说明 |
|---|---|---|---|
| 导航栏（左侧） | −1 | `--m-bg-chrome` | 常驻框架，**随页面滚动不动** |
| 检视栏（右侧） | −1 | `--m-bg-chrome` | 同上；与左栏同色——两侧框架必须是同一档 |
| 顶栏 / 工具栏 | −1 | `--m-bg-chrome` | 与两侧栏连成一个框架 |
| 内容区（记录型） | −1 | `--m-bg-page` | 画布（灰），其上浮白卡 |
| **工作台面（外壳型）** | **0** | `--m-bg-surface` | **白色**——注意力所在 |
| 卡片 / 面板 | 0 | `--m-bg-surface` | 白底 + 边框（后台不用阴影表达层级） |
| 凹槽（输入内衬、代码、空态） | −2 | `--m-bg-inset` | 台面内部再凹一档 |

**框架的 hover/选中必须换梯度**（铁律 2）：

```css
.side a:hover        { background: var(--m-bg-chrome-hover); }     /* 不可用 --m-bg-surface-hover */
.side a[aria-current] { background: var(--m-bg-chrome-selected); box-shadow: inset 2px 0 0 var(--m-primary); }
```

若组件可能出现在任意底色上，改用状态层叠加（host-agnostic）：`color-mix(in oklab, var(--m-fg) 8%, transparent)`。

### 2.2 骨架图（外壳型）

```
┌ 顶栏 chrome ──────────────────────────────────────────────┐
├──────────┬────────────────────────────────┬───────────────┤
│ 导航      │ 工作台面 surface（白）           │ 检视栏 chrome  │
│ chrome   │  ← 注意力在此                   │ ← 与左栏同档   │
│          │                                │               │
│ hover 用  │  内部凹槽用 inset（输入、代码）   │ hover 用       │
│ chrome-* │                                │ chrome-*      │
└──────────┴────────────────────────────────┴───────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│ 顶栏 56px: 搜索(⌘K 全局) | 帮助 | 市场/店铺切换 | 账户   │
├────────┬─────────────────────────────────────────────┤
│ 侧栏    │  Contextual Save Bar（表单脏时插入顶栏下）      │
│ 240px  │ ┌ PageHeader ──────────────────────────────┐ │
│ (≤1024 │ │ ← Breadcrumbs                            │ │
│  折叠   │ │ H1 页面标题 (2xl)                          │ │
│  56px) │ │ [次要动作组…]              [主动作 primary] │ │
│        │ └──────────────────────────────────────────┘ │
│ 分组    │   内容区（max-w-admin 1000 / 表单 640 / 宽表自适应）│
│ 主导航  │   Card ｜ Card ｜ Card …（16px 间距）           │
│ 订单    │                                              │
│ 商品 … │                                              │
└────────┴─────────────────────────────────────────────┘
```

| 项 | 规格 |
|---|---|
| 侧栏 | 分组标题（xs, fg-muted, 全大写可选）+ 项（44px 高，图标 20 + label）；当前项 `bg-surface-selected` + 左侧 2px primary 指示条；徽章数字（待处理订单）用 critical-fg |
| 折叠态 | ≤1024px 图标栏 56px（hover 展开 popover）；移动端汉堡 + 全屏抽屉 |
| 页头 | 标题 + 副题（可选）+ 动作区：**主动作永远一个**；次要动作 ≤2 平铺，更多收进 "⋯"（Polaris action groups 小屏自动 rollup） |
| 面包屑 | 资源型页面必带（`Orders / #1042`），可点击回列表 |
| Save Bar | 表单 dirty 时出现：`Unsaved changes` + [Discard]（plain）+ [Save]（primary）；离开路由拦截（`beforeunload` + 应用内路由守卫） |

## 三、页面类型 × 内容宽度

| 页面类型 | 宽度 | 骨架 |
|---|---|---|
| 列表页（Orders 等） | 全宽自适应 | PageHeader + 筛选/视图条 + DataTable（15 章） |
| 资源详情（Order #1042） | 1000px | 双栏：主内容 2/3 + 摘要卡 1/3（sticky） |
| 创建/编辑表单 | 640–1000px | 分组 Card + 底部动作条 |
| 设置页 | 640px + 左侧锚点导航 ≥1280px | 分组 Card + autosave 或 save bar（16 章决策表） |
| 仪表盘 | 全宽 | KPI 行 + 图表卡（17 章） |

## 四、Saved Views（保存视图，Polaris IndexFilters 精髓）

列表页标配三件套：

```
[视图 tabs: All · Awaiting fulfillment(23) · ↑ ↓]  [Search]  [Filters]  [Sort]
```

- 视图 = 筛选+排序的命名预设；可创建/重命名/复制/删除；共享给团队（权限另设）。
- 当前视图与 All 不同时高亮；计数徽章实时。
- 搜索与筛选的组合结果同样可"Save as view"。

## 五、键盘与命令面板

| 快捷键 | 动作 |
|---|---|
| ⌘K / Ctrl+K | 全局命令面板（z-modal）：跳转、搜索资源、执行动作（"New product"） |
| `C` | 当前上下文新建（列表页=新建资源） |
| `/` | 聚焦列表搜索 |
| `Esc` | 关闭浮层/退出编辑 |
| ⌘S | 保存（表单页） |

规则：快捷键只增不破——所有动作必须鼠标可达；面板列表支持 ↑↓ + Enter；动作项附快捷键提示（右侧 fg-muted）。

## 六、后台空状态三件套（每张列表页必须有）

| 状态 | 规格 |
|---|---|
| 空 | 插图（24 区域）+ "No orders yet" + 一句解释 + 主 CTA（"Set up payments"） |
| 筛选无结果 | "No orders match your filters" + [Clear filters] |
| 加载 | 表格骨架 10 行（行高一致，不闪动）；数据到位后 `aria-busy=false` |

## 七、后台批量任务与异步

| 模式 | 规格 |
|---|---|
| 即时批量（≤50 项） | 同步执行 + Toast（"3 orders exported"） |
| 大批量（>50 项） | 后台任务：Toast "Exporting 2,400 orders…" + 顶栏任务中心（进度条 + 完成后下载/查看）；完成后 Toast 附 [View file] |
| 失败 | 任务中心列出失败原因 + [Retry failed 12] |
| 长任务超时 | >30min 撤回为邮件通知（后台会话可能关闭） |

## 八、移动后台策略

响应式下探到 480px，但**功能分级**：只保 Mobile-Critical（看单、改状态、调库存、退单审批）；复杂配置（运费模板、税务）显示 "Available on desktop" 提示卡——不为移动而阉割桌面，不为全功能而毁掉移动。
