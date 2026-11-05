import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 2.8：外部基线表是"每批发版前先核对"的常驻工件。
// 日期只登记在 docs/00（唯一事实源），docs/11 不得重复——两处日期必然漂移。

const LAST_CHECKED = /基线表最后核对日期[：:]\s*`?(\d{4}-\d{2}-\d{2})`?/.exec(
  readFileSync("docs/00-open-decisions.md", "utf8"),
)?.[1];

const TABLE = readFileSync("docs/11-external-baseline.md", "utf8");

const DAY = 86400000;
const STALE_DAYS = 90;

function utcDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function ageDays(iso, now = Date.now()) {
  const t = new Date(now);
  const today = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  return Math.round((today - utcDay(iso)) / DAY);
}

function isStale(iso, now = Date.now(), limit = STALE_DAYS) {
  return ageDays(iso, now) > limit;
}

function tableRows(md) {
  return md
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\*\*B\d{2}/.test(line))
    .map((line) => {
      const [object, date, verdict, landing] = line.split("|").slice(1, -1).map((c) => c.trim());
      return { object, date, verdict, landing };
    });
}

test("docs/00 登记了基线表最后核对日期，且不超过 90 天", () => {
  assert.ok(LAST_CHECKED, "docs/00 缺少「基线表最后核对日期：YYYY-MM-DD」");
  assert.match(LAST_CHECKED, /^\d{4}-\d{2}-\d{2}$/);
  const age = ageDays(LAST_CHECKED);
  assert.ok(age >= -1, `核对日期晚于今天：${LAST_CHECKED}`);
  assert.ok(!isStale(LAST_CHECKED), `基线表已 ${age} 天未核对（上限 ${STALE_DAYS} 天）：${LAST_CHECKED}`);
});

test("docs/11 基线表：必备对标项齐全，每行四列且日期不晚于最后核对日期", () => {
  const rows = tableRows(TABLE);
  assert.ok(rows.length >= 6, `基线表行数不足：${rows.length}`);

  for (const [id, key] of [
    ["B01", "Shopify"],
    ["B02", "Apple"],
    ["B03", "M3 Expressive"],
    ["B04", "Baseline"],
    ["B05", "Baymard"],
    ["B06", "Chrome"],
  ]) {
    assert.ok(
      rows.some((r) => r.object.includes(id) && r.object.includes(key)),
      `基线表缺少 ${id}（${key}）`
    );
  }

  for (const row of rows) {
    assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/, `「${row.object}」的日期格式不合法：${row.date}`);
    assert.ok(row.verdict, `「${row.object}」缺少结论`);
    assert.ok(row.landing, `「${row.object}」缺少落点`);
    assert.ok(ageDays(row.date) >= -1, `「${row.object}」的日期晚于今天：${row.date}`);
    assert.ok(
      utcDay(row.date) <= utcDay(LAST_CHECKED),
      `「${row.object}」的日期 ${row.date} 晚于 docs/00 的最后核对日期 ${LAST_CHECKED}`
    );
  }
});

test("docs/11 不重复登记最后核对日期（唯一事实源在 docs/00）", () => {
  assert.doesNotMatch(TABLE, /基线表最后核对日期[：:]\s*`?\d{4}-\d{2}-\d{2}/, "最后核对日期只允许出现在 docs/00");
});

test("90 天陈旧检测的边界有效：91 天红、90 天仍绿", () => {
  const now = Date.UTC(2026, 10, 5); // 2026-11-05
  assert.equal(ageDays("2026-11-05", now), 0);
  assert.equal(isStale("2026-08-07", now), false, "第 90 天不应报红");
  assert.equal(isStale("2026-08-06", now), true, "第 91 天必须报红");
});
