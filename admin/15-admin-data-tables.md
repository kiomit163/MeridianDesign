# 15 · 后台：数据表格（DataTable）

> 后台 60% 的界面是表格。对齐、密度、选择、批量的每一条规则都是为了**扫描速度**。

---

## 一、结构

```
┌ PageHeader: Orders                    [Export] [New order] ┐
├ 视图 tabs + 计数徽章 ──────────────────────────────────────┤
├ [Search /]  [Filters ▾]  已选 chips 行 · Clear all ────────┤
├ 批量操作栏（选中时替换此行, primary-tint 底）────────────────┤
│ ☑ 12 selected   [Fulfill] [Print] [⋯ more]    [Clear]     │
├────────────────────────────────────────────────────────────┤
│ ☑  Order ▲↓   Date    Customer      Payment ▲↓  Fulfillment│
│ ☑  #1042     Sep 12   Jane Doe      Paid ✅     Unfulfilled│
│ ☑  #1041     Sep 12   Hans Müller   Pending ⏳  Unfulfilled│
├ sticky header ─────────────────────────────────────────────┤
│                    ‹ 1 2 3 … 42 ›   200 per page ▾         │
└────────────────────────────────────────────────────────────┘
```

## 二、列规则

| 规则 | 说明 |
|---|---|
| 对齐 | **数字右对齐 + tnum，文本左对齐，永远不居中**（Polaris/Carbon 共识） |
| 首列 | 行选择 checkbox（44px 热区）或主标识（单号/名称，链接色，进入详情） |
| 排序列 | 表头是按钮 + `aria-sort`；箭头 16px；默认排序列高亮 |
| 截断策略 | **wrap 优先**（换行不截断，Polaris 原则）；仅名称类可 1 行 ellipsis + tooltip 全文；金额/日期/状态永不截断 |
| 列冻结 | 横向滚动时首列 sticky（数据 >1200px 宽必开） |
| 列数 | 可见 ≤7 列；更多进行内展开或详情页 |
| 状态列 | Badge（success/warning/critical/info 语义五件套）+ 图标辅助；纯色块禁止 |

## 三、行与密度

| 密度 | 行高 | 何时 |
|---|---|---|
| Comfortable | 48px（`--m-table-row-h-comfortable`） | 默认；含两行信息或缩略图 |
| Productive | 36px（`--m-table-row-h-productive`） | 用户可切换；纯数字扫描型表格 |

斑马纹：**关闭**为默认（边框分隔足够）；>12 列宽表可开（`odd: bg-inset`）。行 hover = `bg-surface-hover`；选中 = `bg-primary-tint` + checkbox 勾选。

## 四、选择与批量

- 表头 checkbox 三态：全选 / 全清 / 部分选中（indeterminate）。
- 选择栏替换筛选条（不叠加）：`12 selected` + 批量动作 ≤2 平铺 + more 菜单 + Clear。
- **跨页选择**：选择池保留跨页；计数显示 "12 selected on this page · 38 total"。
- 批量破坏性动作走 16 章确认矩阵（输入数量确认）。
- 动作进行中：受影响行显示行内 spinner；完成后局部刷新 + Toast。

## 五、分页

数字分页（‹ 1 2 3 … 42 ›）+ 每页条数（25/50/100/200，默认 50）。**禁止无限滚动**（运营需要位置感与总数）。总数展示 "1,042 orders"。筛选/排序变更回到第 1 页。

## 六、筛选器（Filters）

| 项 | 规格 |
|---|---|
| 结构 | [Filters ▾] 面板（popover e2）：分组勾选或值输入；应用后生成 chips |
| chips | `Status: Unfulfilled ×`（label: value + 移除）单行滚动 + [Clear all] |
| 提升位 | 最常用 2-3 个筛选平铺在搜索旁（Polaris promoted filters 上限） |
| 与视图 | 筛选改变 = 视图进入 "Modified" 态，提供 [Save as view] |
| 计数 | 每个筛选值显示结果数（"Unfulfilled (23)"）——过滤前 |

## 七、状态与边界

| 状态 | 规格 |
|---|---|
| 加载 | 10 行骨架；表头照常渲染（列宽稳定） |
| 刷新 | 局部 spinner（表头右侧），不清空现有数据 |
| 空 | 见 14 章三件套 |
| 错误 | 表格区域内嵌错误卡 + [Retry]（保留筛选） |
| 单行 | 无分页无总数，正常渲染 |
| 10k+ 行 | 强制服务端分页 + 提示用筛选/视图定位 |

## 八、行内编辑（可选能力）

- 单格编辑：双击/Enter 进入，输入框替换单元格（同宽），Esc 取消 Enter 提交；错误在格内（border-critical + 下方文本）。
- 仅开放低风险字段（库存数、标签）；金额、状态机字段不提供行内编辑（易错高代价）。
- 编辑中该行锁定（防并发覆盖）；提交后单元格 200ms success 底色闪示。

## 九、导出

[Export] 动作 → 模态：范围（当前视图 / 选中 / 全部）+ 格式（CSV）；>1000 行走后台任务（14 章第七节）。导出遵循**当前视图的筛选与排序**并在模态中明示范围。
