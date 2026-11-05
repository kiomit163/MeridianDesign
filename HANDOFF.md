# Meridian v1.1.0 收尾 · S1 工作区交接指令

> **历史存档（v1.5.0 注）**：本文件记录 2026-09 的 S1 交接，其中的路径与版本已过期。当前版本以 `ai/tokens.json` 的 `$version` 为准；当前缺陷清单见 `AUDIT-1.4.0.md`。

> 把整段粘到新会话第一条消息即可。如果只想看修哪几条，本文件 §2 直接给清单。

## 1. 接手第一步

```bash
cd "C:\Users\HK\Desktop\设计规范0919"
git log --oneline -30          # 确认在 f88fe1d 或更新
cat .superpowers/sdd/2026-09-19-meridian-s1-machine-layer/progress.md   # 必读！包含 R-0..R-19 的全部裁定
node --test ai/selfcheck 2>&1 | tail -8     # 应看到 5 项 fail
```

**优先读** `.superpowers/sdd/2026-09-19-meridian-s1-machine-layer/progress.md`——这是上一会话的 ledger，含：
- 每条裁定（R-0 至 R-19）及其代价
- 每次 review 的发现
- 每次 fix round 的范围
- spec / plan 的提交位置

### 4 条最关键的判定（其余都在 ledger）

- **R-2** — T13/14 在已修改的文件里**按选择器定位**，行号仅作提示
- **R-7** — `walk()` 必须产 `path.relative(root, abs)`；校验器把 `./` 前缀/绝对路径当 fallback
- **R-9** — `classify` 不抛错（throw 会崩整次 walk）；契约由 engine 冒烟断言钉住
- **R-19** — R11 dedupe 键是 `${rule.id}|${f.path}|${line}|${raw.message}`（用 `raw.message`，不是 engine 格式化后的）

## 2. 5 项失败与修复

### 2.1 `engine.test.mjs:270`（**不要动**）

`CLI: 位置参数缺失时目标为仓库根` —— 这是**已知的、T17 自己的判定**：仓库根开启全部 14 条规则必然有违规，acceptance 是它的替代。

### 2.2 4 项 acceptance 失败（本次任务目标）

按工作量从小到大：

#### A. R12：4 张 `<img>` 缺 width/height
- 路径：`design-system.html` 行 684 / 736 / 741 / 1095
- 修复：Edit 这 4 行，在 `/>` 前加 `width="24" height="24"`
- 我之前 regex 失败因为 `<img src="..." />` 自闭合形式没匹配上

#### B. R14：9 处跨目录裸章节引用
- 命令：
  ```bash
  node ai/validate.mjs . --exclude ai/selfcheck/fixtures --only=R14 --json
  ```
- 改法：把每条改成 `（dir/NN-*.md）` 形式。位置在 `admin/14/17`、`components/18`、`docs/06`、`README.md`、`storefront/09`
- 我之前 str.replace 模板匹配失败（字符串带括号/空格差异）。**用 Edit 工具按 grep 输出逐条精确改**，不要赌 sed

#### C. R05（24 处） + R07（7 处）：design-system.html 内部
- 都在 `design-system.html` 的 inline `style="..."` 与 `<style>` 块里
- 推荐写法——一段 python 脚本读全文一次性替换：
  ```python
  # 间距查表（参考 task 14 plan）
  # 1->space-05, 5->space-1, 6->space-2, 10->space-3, 14->space-4
  # 4->radius-sm, 8->radius-sm, 12->radius-md
  ```
  > 注意：meridian-ui.css 的 31 行已归位（task 14 提交 `7c3ccc6`），**只差 design-system.html 的内联/`<style>` 块**。

#### D. 验证（每改一处都跑）
```bash
node ai/validate.mjs . --exclude ai/selfcheck/fixtures --only=Rxx --json
```
该规则计数为 0 才走下一步。

## 3. 收尾与提交

按规则分组提交（避免一个 commit 太大）：

```bash
git commit -m "fix(design-system): R05 间距归位"
git commit -m "fix(design-system): R07 圆角归位"
git commit -m "fix(design-system): R12 img 尺寸"
git commit -m "docs: R14 跨目录引用修正 9 处"
```

最终验收：

```bash
npm test
```

期望 **136/136 全绿**（含已有的 1 项 pre-existing fail——是 `engine.test.mjs:270` 那个，T17 acceptance 没顶替它）。如果你想把那一项也修干净，acceptance.test.mjs:34 那条 CLI 断言改成 `assert.equal(run([bad]).code, 1)` 之类即可（细节见 ledger R-17）。

## 4. 交接状态（动手前心里有数）

| 项 | 状态 |
|---|---|
| 分支 | `feat/s1-machine-layer` HEAD `f88fe1d` |
| 与 `master` 的差异 | 27 commits |
| 17 任务 tracker 状态 | 全 completed |
| 仓库总违规数（除 fixtures） | 44（基准 ~283 → -84%） |
| 待修尾 | 4 类小缺陷（详见 §2） |

### 残留违规按规则分布
| R | 命中 | 主要位置 |
|---|---|---|
| R05 | 24 | design-system.html 内联 + style 块 |
| R14 | 9 | admin/14/17、components/18、docs/06、README、storefront/09 |
| R07 | 7 | design-system.html |
| R12 | 4 | design-system.html（SVG 图标） |

### 已知 stale allow（3 条遗留）
- `ai/AGENTS.md:32 / :45` — 文档里的 marker 语法示例被引擎误捕（O8，治本在 S2）
- `ai/meridian-ui.css:163` shimmer — 引擎边界，allow 应在下一行
- `MIGRATION-1.1.md:62` `meridian-allow: pre-1.1-avatar` 示例文本——已尝试清理但未完全消除（可忽略或手工 Edit 一次）

### 不要做的事
- 不要重写 `acceptance.test.mjs` 的 14 条规则——它们是 spec / plan 的直接产物，是合同
- 不要动 `engine.test.mjs:270`（T17 已判定）
- 不要碰 `_audit/`（它是审计临时产物，已 gitignore）
- 不要顺手"清理" ledger 里看起来像"错误"的早期裁定——它们已经付代价了

## 5. 收尾后顺手做的两件事（不强求）

1. 删工作区：`rm -rf .superpowers/sdd/2026-09-19-meridian-s1-machine-layer`
2. 把 `progress.md` 里的 5 条 R-0..R-19 复制到 PR 描述（按每条"裁定 + 代价"的格式），方便 review

## 6. 一句话

把 `design-system.html` 内部四个标签改干净，让 `node ai/validate.mjs . --exclude ai/selfcheck/fixtures` 报 0——S1 就收完了。
