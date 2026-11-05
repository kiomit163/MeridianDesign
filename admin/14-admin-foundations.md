# 14 · 后台基础（Admin Foundations）

> 后台的唯一 KPI：**单位时间完成的运营动作数**。舞台人格 = Productive（见 docs/05-motion-iconography.md）。设计参照系 = Shopify Admin（Polaris）+ Carbon 数据密度。

---

## 一、体验原则

1. **商人优先于差异化**（Polaris："Match the rest of the admin, put merchant needs ahead of being different"）——熟悉感是生产力。
2. **读多写多，皆求快**：默认密度 comfortable（48px 行）；纯数字扫描型表格可切 productive（36px）；扫描列对齐；键盘全程可操作。
3. **破坏性操作重摩擦，常规操作零摩擦**：删除有确认，筛选无确认。
4. **状态永远可见**：保存中/已保存/失败/后台任务进度——运营者不敢用"静默"的系统。
5. **复杂度可折叠**：新手默认视图 + 高手可展开（"Hide complexity, but give access to sophistication" — Polaris 经验价值观）。

### 1.1 密度旋钮的作用域（v1.5）

`data-density="productive"` 只改变四类值，**不重写间距刻度**：

| 项 | comfortable（默认） | productive |
|---|---|---|
| 表格行高 | 48px | 36px |
| 卡片内距 `--m-card-padding` | 16px | 12px |
| 字段间距 `--m-field-gap` | 4px | 8px（行更矮，字段内距反而放宽，避免标签贴边） |
| 正文行高 `--m-body-leading` | 1.45 | 1.38 |

实现见 `ai/tokens.css` 的 `.stage-admin[data-density="productive"]`。页面级 section 节奏不随密度变化——那是页面作者的决定，不是旋钮的职责。

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
│ 顶栏 56px: 品牌/页面 | 搜索(⌘K) | 通知 | 账户           │
├────────┬─────────────────────────────────────────────┤
│ 店铺切换│  Contextual Save Bar（表单脏时插入顶栏下）      │
│ 240px  │ ┌ PageHeader ──────────────────────────────┐ │
│ (≤1024 │ │ ← Breadcrumbs                            │ │
│  56px) │ │ H1 页面标题 (2xl)                          │ │
│        │ │ [次要动作组…]              [主动作 primary] │ │
│        │ └──────────────────────────────────────────┘ │
│ 分组    │   内容区（max-w-admin 1000 / 表单 640 / 宽表自适应）│
│ 主导航  │   Card ｜ Card ｜ Card …（16px 间距）           │
│ 订单    │                                              │
│ 商品 … │                                              │
└────────┴─────────────────────────────────────────────┘
```

| 项 | 规格 |
|---|---|
| 侧栏 | 顶部店铺切换（`ad-storebtn` + 菜单）；分组标题（xs, fg-muted, 全大写可选）+ 项（桌面 32px / 移动抽屉 44px，图标 20 + label）；当前项 `bg-chrome-selected` + 左侧 2px primary 指示条；徽章数字（待处理订单）用 critical-fg；底部工具行（帮助 / 收起侧栏 `data-side-rail`） |
| 折叠态 | **≤1024px**：56px 图标轨（标签对读屏保留，hover 展开 popover）；**<768px**：汉堡 + 全屏抽屉（项 44px）；**≥1024px**：240px，可手动收成 64px（状态持久化）。`.m-shell` 与 `.ad-sidenav` 现已同口径 |
| 页头 | 标题 + 副题（可选）+ 动作区：**主动作永远一个**；次要动作 ≤2 平铺，更多收进 "⋯"（Polaris action groups 小屏自动 rollup） |
| 面包屑 | 资源型页面必带（`Orders / #1042`），可点击回列表 |
| Save Bar | 表单 dirty 时出现：`Unsaved changes` + [Discard]（plain）+ [Save]（primary）；离开路由拦截（`beforeunload` + 应用内路由守卫） |

## 三、页面类型 × 内容宽度

| 页面类型 | 宽度 | 骨架 |
|---|---|---|
| 列表页（Orders 等） | 全宽自适应 | PageHeader + 筛选/视图条 + DataTable（admin/15-admin-data-tables.md §一） |
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

### 7.1 任务状态机（`data-state` 封闭取值）

| `data-state` | 含义 | 必须可见 | 可执行动作 |
|---|---|---|---|
| `queued` | 已入队未开始 | "Queued" + 队列位置 | **Cancel** |
| `running` | 执行中，进度已知 | 进度条 + 已完成/总数 + 预计剩余 | **Cancel** |
| `running`（不确定） | 执行中，进度无法估算 | `.m-progress--indeterminate` + 已用时 | **Cancel** |
| `cancelling` | 已请求取消、等待收尾 | 静默进度 + "Cancelling…" | 无（防连点） |
| `cancelled` | 已取消 | 已处理项数 + "Cancelled" + **[Download partial]** | 重新发起 |
| `succeeded` | 完成 | 结果数 + [View] / [Download] | — |
| `failed` | 失败（整体或部分） | 原因 + [Retry failed N] | 重试失败项 |
| `expired` | 结果过期清理 | "Result expired (kept 7 days)" | 重新发起 |

铁律：

1. **Cancel 必须真的停止服务端工作**，不是只隐藏 UI。不可中断的任务（已提交的支付/发货）**不得显示 Cancel**，改为标注「不可中断」。
2. **取消必须保留部分产出**并给出口径："已处理 830 / 2,400，已导出的 830 条见 [Download partial]"。静默丢弃部分结果是最差解。
3. **`cancelling` 必须防重复提交**——按钮转 `disabled` + "Cancelling…"，否则用户连点会产生重复取消请求。
4. **刷新后必须能恢复**：任务中心状态来自服务端，不得只存在于内存。重载后 `running` 应带进度重新出现，`succeeded` 保留至过期。
5. **进度不可估算时必须显式不确定**，不得用 0% 或伪造百分比（对应 `.m-progress--indeterminate`）。

### 7.2 保留与清理

| 项 | 规格 |
|---|---|
| 结果保留 | 7 天，到期转 `expired`，只留一行记录与原因 |
| 任务记录保留 | 30 天（含 `cancelled` / `failed`） |
| 并发上限 | 同一用户同时 `running` ≤3，超出排队为 `queued` |
| 会话关闭 | **不等于取消**：`running` 继续，回到任务中心可见；>30min 额外发邮件 |

### 7.3 状态与视觉的对应

| 状态 | 组件 |
|---|---|
| 进度已知 | `.m-progress` + `--m-progress`（0–1） |
| 进度未知 | `.m-progress--indeterminate` |
| 已完成 | `.m-progress--success` |
| 已取消 | `.m-progress--cancelled`（静默色，宽度冻结在取消点） |

## 八、移动后台策略

响应式下探到 480px，但**功能分级**：只保 Mobile-Critical（看单、改状态、调库存、退单审批）；复杂配置（运费模板、税务）显示 "Available on desktop" 提示卡——不为移动而阉割桌面，不为全功能而毁掉移动。
