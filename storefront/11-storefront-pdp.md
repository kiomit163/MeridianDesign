# 11 · 前台：商品详情页（PDP）

> Baymard：62% 领先网站的 PDP 体验平庸——PDP 是整套系统最高价值的战场。**关键信息不进 Tab**（研究结论：Tab 藏住运费/退货/尺码会杀转化），全部可见区块或手风琴。

---

## 一、整页解剖（桌面 ≥md）

```
┌ Breadcrumb ─────────────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────────────────────┐  │
│ │ 画廊           │  │ 集合链接 (xs link)             │  │
│ │ 主图 4:5       │  │ H1 商品名 (5xl)                │  │
│ │ 缩略图列(左/下) │  │ ★4.8 (312) → 跳转评论区        │  │
│ │ zoom/video/UGC │  │ Price 块（见二）               │  │
│ └──────────────┘  │ 色号 swatches（名+无货态）      │  │
│                   │ 尺码 + Size guide 链接          │  │
│  粘性视口           │ 库存/交付（见三）               │  │
│                   │ [Add to cart] [Express 按钮]    │  │
│                   │ 信任条（见 13 章）               │  │
│                   │ 手风琴: Description / Specs /   │  │
│                   │   Shipping & Returns / Care     │  │
│                   └──────────────────────────────┘  │
│  评论区（完整组件，见 13 章）                          │
│  相关商品（Complete the look / You may also like）    │
└─────────────────────────────────────────────────────┘
移动端: 画廊(滑动,页码点) → 标题 → 价格 → 变体 → 交付 →
        [粘性加购条] → 手风琴 → 评论 → 相关
```

## 二、价格块（合规核心）

```
$68.00   $85.00        ← 当前价(lg,650,price-sale) + 划线原价(compare)
Save 20%                ← 徽章（30 天最低价由后端校验，Omnibus）
or 4 interest-free payments of $17.00 with Klarna   ← BNPL 行（链接计划弹层）
Incl. VAT · Free shipping over $75                  ← 税注 + 门槛
= $0.68/ml                                           ← 仅 DE/FR/IT（Grundpreis）
```

规则：所有价格元素走 Price 组件；BNPL 消息紧贴价格（高客单转化利器），文案含真实分期数与金额。

## 三、变体选择

| 项 | 规格 |
|---|---|
| 色号 | swatch 32px（PDP 比卡片大）+ 色名文本；选中：2px primary 环；**无货显示但置灰 + 划线** |
| 尺码 | pill 按钮 44px；无货置灰可点→弹 "Notify me"；"Size guide" 链接开模态（含换算表 + 模特身型注） |
| 联动 | 切变体即时更新：价格、主图、库存行、URL（`?variant=`）——全部 ≤100ms 无布局跳动 |
| 未选必填 | 尺码类商品默认不选；点加购未选 → 对应组标题变 critical-fg + 抖动一次 + 文案 "Select a size" |

## 四、库存与交付（真实数据绑定）

```
Low stock · Only 3 left            ← warning 色点 + 文本（必须绑定真实库存）
Get it Wed, Sep 17 – Fri, Sep 19   ← 交付日期区间（不用承运商术语）
Free shipping & free 30-day returns
```

**假紧迫感禁令**（FTC/DFA）：`Only X left` 仅当 `verified_inventory=true`；倒计时仅限真实促销截止时间；交付日期用真实物流承诺区间。组件无数据即不渲染。

## 五、加购区

| 项 | 规格 |
|---|---|
| Add to cart | primary，h 52px，全宽（移动）/ 半宽（桌面）；点击 → 乐观加购 + 打开购物车抽屉 |
| Express | 动态钱包按钮（Shop Pay/Apple Pay/Google Pay/PayPal），secondary 描边样式，置于普通按钮**上方**（钱包转化优先）；无钱包可用时隐藏整块 |
| 数量 | 步进器（−/输入/+，各 44px），默认 1；限购时显示 "Max 4 per customer" |
| 售罄 | 按钮变 "Sold out"（disabled）+ 下方 "Notify me when available" 次按钮 |

## 六、信息区（手风琴，默认展开 Description）

| 区块 | 内容规则 |
|---|---|
| Description | ≤120 词 + 3-5 个要点（bullets 550 权重）；卖利益不堆参数 |
| Specifications | 两列表格（label: value），数据驱动 |
| Shipping & Returns | 免运费门槛、预计送达、退换窗口与流程、退货运费承担方——**退货政策是转化杠杆，写清楚** |
| Care / Materials | 材质成分（EU 纺织品法定）、洗护图标 |

## 七、画廊

| 项 | 规格 |
|---|---|
| 构成 | 主图 4-8 张 + ≥1 视频（静音循环）+ UGC 2 张（真实评价图，FTC 溯源）|
| 交互 | 桌面 hover 放大（≤2.5×）；点击开灯箱（键盘 ←→、Esc）；移动滑动 + 页码点 |
| 缩略图 | 64px，选中 primary 环；当前索引 aria-current |
| 加载 | 主图 eager + fetchpriority high；其余 lazy；灯箱图预加载下一张 |

## 八、粘性加购条（移动端）

主 CTA 滚出视口后出现：底部固定（z-nav），内容 = 主图 40px + 名称（1 行省略）+ 价格 + [Add to cart]（h 44px）。出现动画 200ms enter；已加购时按钮变 "View cart (2)"。

## 九、状态矩阵

| 状态 | 处理 |
|---|---|
| 加载中 | 画廊骨架 + 文本区骨架（布局稳定不跳） |
| 404 / 下架 | 保留页面框架："This product is no longer available" + 同类推荐 4 卡 |
| 价格更新 | 变体切换同步；页面停留 >15min 的旧价点击结算时服务端校验并提示 |
| 一图商品 | 画廊退化为单图 + zoom；缩略图隐藏 |
