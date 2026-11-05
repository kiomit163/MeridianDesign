#!/usr/bin/env node
/**
 * 行为层门禁（Chrome CDP 真实键盘事件，零 Playwright）。
 * 覆盖：跳过导航、焦点可见、焦点陷阱与焦点归还、tabs/seg 方向键、combobox 键盘、
 *       原生 dialog、toast 播报、以及「键盘路径 = 视觉顺序」与标题层级；
 *       后台 Sidebar v2 图标轨 240/64/56px 的真实计算样式与 localStorage 持久化（G-231 2.2）。
 * 用法：npm run behavior
 */
import { launch } from "./lib/cdp.mjs";

const cdp = await launch({ port: 9337 });
let failures = 0;
let checks = 0;

function check(name, ok, detail = "") {
  checks++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
}

const active = () => cdp.evaluate(`(() => {
  const el = document.activeElement;
  return {
    tag: el.tagName, cls: String(el.className || ""), id: el.id,
    text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
    inMain: !!el.closest("#main"), inDrawer: !!el.closest("#drawer")
  };
})()`);

async function focusables(selector) {
  return cdp.evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
      .map(el => el.id || el.getAttribute("aria-label") || (el.textContent || "").trim().slice(0, 20));
  })()`);
}

try {
  /* ---------- design-system.html：跳过导航 / 组件行为 ---------- */
  await cdp.navigate("design-system.html");

  await cdp.press("Tab");
  const first = await active();
  check("跳过导航是首个焦点", first.cls.includes("m-skip-link"), JSON.stringify(first));
  const ring = await cdp.evaluate(`(() => { const cs = getComputedStyle(document.activeElement); return { w: parseFloat(cs.outlineWidth), s: cs.outlineStyle, off: cs.outlineOffset }; })()`);
  check("跳过导航焦点环可见", ring.w >= 2 && ring.s === "solid", JSON.stringify(ring));

  await cdp.press("Enter");
  const skipped = await cdp.evaluate(`({ hash: location.hash, focused: document.activeElement.id || document.activeElement.tagName, mainTabbable: document.getElementById("main").tabIndex })`);
  check("跳转后焦点落在主内容", skipped.hash === "#main" && (skipped.focused === "main" || skipped.focused === "MAIN"), JSON.stringify(skipped));

  /* tabs：roving tabindex + 方向键 + 选中态 */
  const tabsState = await cdp.evaluate(`(() => {
    const list = document.querySelector('[data-tabs]');
    const tabs = [...list.querySelectorAll('.m-tab')];
    return {
      role: list.getAttribute('role'),
      roles: tabs.map(t => t.getAttribute('role')),
      selected: tabs.map(t => t.getAttribute('aria-selected')),
      tabindex: tabs.map(t => t.tabIndex)
    };
  })()`);
  check("tabs 暴露 tablist/tab 语义", tabsState.role === "tablist" && tabsState.roles.every((r) => r === "tab"), JSON.stringify(tabsState.roles));
  check("tabs 初始 roving tabindex", tabsState.selected[0] === "true" && tabsState.tabindex[0] === 0 && tabsState.tabindex[1] === -1 && tabsState.tabindex[2] === -1, JSON.stringify(tabsState.tabindex));

  await cdp.evaluate(`document.querySelector('[data-tabs] .m-tab').focus()`);
  await cdp.press("ArrowRight");
  let t = await cdp.evaluate(`(() => { const tabs = [...document.querySelectorAll('[data-tabs] .m-tab')]; return { i: tabs.indexOf(document.activeElement), sel: tabs.map(x => x.getAttribute('aria-selected')) }; })()`);
  check("tabs → 右方向键移到下一项并激活", t.i === 1 && t.sel[1] === "true", JSON.stringify(t));
  await cdp.press("End");
  t = await cdp.evaluate(`(() => { const tabs = [...document.querySelectorAll('[data-tabs] .m-tab')]; return { i: tabs.indexOf(document.activeElement) }; })()`);
  check("tabs → End 跳到末项", t.i === 2, JSON.stringify(t));
  await cdp.press("Home");
  t = await cdp.evaluate(`(() => { const tabs = [...document.querySelectorAll('[data-tabs] .m-tab')]; return { i: tabs.indexOf(document.activeElement) }; })()`);
  check("tabs → Home 回到首项", t.i === 0, JSON.stringify(t));

  /* v1.6 · 表格键盘模型：roving tabindex + 方向键 + Home/End */
  const gridInit = await cdp.evaluate(`(() => {
    const rows = [...document.querySelectorAll('#demoTable tbody tr')];
    const stops = rows.map(r => r.querySelector('input'));
    return { n: rows.length, tabindex: stops.map(s => (s ? s.tabIndex : null)) };
  })()`);
  check(
    "表格 roving 初始态（仅首行可 Tab）",
    gridInit.n >= 3 && gridInit.tabindex[0] === 0 && gridInit.tabindex.slice(1).every((v) => v === -1),
    JSON.stringify(gridInit.tabindex)
  );

  const rowIndexOfActive = () => cdp.evaluate(`(() => {
    const rows = [...document.querySelectorAll('#demoTable tbody tr')];
    return { i: rows.findIndex(r => r.contains(document.activeElement)) };
  })()`);

  await cdp.evaluate(`document.querySelector('#demoTable tbody tr input').focus()`);
  await cdp.press("ArrowDown");
  check("表格 → ↓ 移到下一行", (await rowIndexOfActive()).i === 1, "");

  await cdp.press("End");
  check("表格 → End 跳到末行", (await rowIndexOfActive()).i === gridInit.n - 1, "");

  await cdp.press("Home");
  check("表格 → Home 回到首行", (await rowIndexOfActive()).i === 0, "");

  await cdp.press("ArrowUp");
  check("表格 → ↑ 在首行不越界", (await rowIndexOfActive()).i === 0, "");

  /* v1.6 · 撤销栈：⌘Z / ⇧⌘Z，编辑态交还原生撤销 */
  await cdp.evaluate(`(() => {
    window.__u = [];
    const H = window.MeridianBehavior.history;
    H.clear();
    H.push('a', () => window.__u.push('undo-a'), () => window.__u.push('redo-a'));
    H.push('b', () => window.__u.push('undo-b'), () => window.__u.push('redo-b'));
  })()`);

  await cdp.press("z", { ctrl: true });
  let u = await cdp.evaluate(`({ log: window.__u.slice(), size: window.MeridianBehavior.history.size() })`);
  check("撤销栈 → Ctrl+Z 撤销最近一次", JSON.stringify(u.log) === '["undo-b"]' && u.size === 1, JSON.stringify(u));

  await cdp.press("z", { ctrl: true });
  u = await cdp.evaluate(`({ log: window.__u.slice(), size: window.MeridianBehavior.history.size() })`);
  check("撤销栈 → 再按一次撤销更早一次", JSON.stringify(u.log) === '["undo-b","undo-a"]' && u.size === 0, JSON.stringify(u));

  await cdp.press("z", { ctrl: true, shift: true });
  u = await cdp.evaluate(`({ log: window.__u.slice(), size: window.MeridianBehavior.history.size() })`);
  check("撤销栈 → ⇧Ctrl+Z 重做", JSON.stringify(u.log) === '["undo-b","undo-a","redo-a"]' && u.size === 1, JSON.stringify(u));

  await cdp.evaluate(`(() => {
    const i = document.createElement('input');
    i.id = '__undoProbe'; i.type = 'text'; i.value = 'abc';
    document.body.appendChild(i); i.focus();
  })()`);
  await cdp.press("z", { ctrl: true });
  const inInput = await cdp.evaluate(`({ size: window.MeridianBehavior.history.size(), focused: document.activeElement.id })`);
  check("撤销栈 → 焦点在文本框时不接管 Ctrl+Z", inInput.focused === "__undoProbe" && inInput.size === 1, JSON.stringify(inInput));
  await cdp.evaluate(`document.getElementById('__undoProbe').remove()`);

  const depth = await cdp.evaluate(`(() => {
    const H = window.MeridianBehavior.history; H.clear();
    for (let i = 0; i < 60; i++) H.push('x' + i, () => {}, () => {});
    const s = H.size(); H.clear(); return s;
  })()`);
  check("撤销栈 → 深度上限 50（丢弃最早）", depth === 50, String(depth));

  /* v1.6 · 共享边缘卡片网格：相邻卡片共用一条线，而不是各自四条边 */
  const grid = await cdp.evaluate(`(() => {
    const g = document.createElement('div');
    g.id = '__cardGrid'; g.setAttribute('data-card-grid', '');
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('div');
      c.className = 'm-card';
      c.textContent = 'cell' + i;
      g.appendChild(c);
    }
    document.body.appendChild(g);
    const gs = getComputedStyle(g);
    const cs = getComputedStyle(g.firstElementChild);
    return {
      display: gs.display, gap: gs.gap,
      cols: gs.gridTemplateColumns.split(' ').length,
      cellBorder: cs.borderTopWidth,
      cellShadow: cs.boxShadow,
      containerShadow: gs.boxShadow
    };
  })()`);
  check(
    "卡片网格 → 单元无自身描边，改为左/上内嵌共用线",
    grid.display === "grid" && grid.gap === "0px" && grid.cellBorder === "0px" &&
      /inset/.test(grid.cellShadow) && grid.cols === 3,
    JSON.stringify({ gap: grid.gap, border: grid.cellBorder, cols: grid.cols })
  );
  check(
    "卡片网格 → 容器提供外环（box-shadow，不占布局）",
    /rgb/.test(grid.containerShadow) && !/inset/.test(grid.containerShadow),
    grid.containerShadow.slice(0, 60)
  );
  await cdp.evaluate(`document.getElementById('__cardGrid').remove()`);

  /* v1.6 · CJK 排版覆盖：行高按 :lang(zh) 生效，汉字标题零字距 */
  const cjk = await cdp.evaluate(`(() => {
    const b = getComputedStyle(document.body);
    const h1 = document.querySelector('h1');
    const hs = h1 ? getComputedStyle(h1) : null;
    return {
      lang: document.documentElement.lang,
      fs: parseFloat(b.fontSize),
      lh: parseFloat(b.lineHeight),
      h1Spacing: hs ? hs.letterSpacing : null
    };
  })()`);
  const lhRatio = cjk.lh / cjk.fs;
  check(
    "CJK → 正文行高按 1.75 生效（非拉丁 1.6）",
    cjk.lang.startsWith("zh") && Math.abs(lhRatio - 1.75) < 0.02,
    `ratio=${lhRatio.toFixed(2)} (${cjk.lh}/${cjk.fs})`
  );
  check(
    "CJK → 汉字标题零字距",
    cjk.h1Spacing === null || cjk.h1Spacing === "normal" || parseFloat(cjk.h1Spacing) === 0,
    String(cjk.h1Spacing)
  );

  /* 窄屏横滚容器：外环会被裁掉，必须改内嵌环（2.4.7 仍可见） */
  await cdp.viewport(320, 800);
  await cdp.evaluate(`document.querySelector('[data-tabs] .m-tab').focus()`);
  const offset = await cdp.evaluate(`getComputedStyle(document.activeElement).outlineOffset`);
  check("窄屏横滚标签栏焦点环内嵌", parseFloat(offset) < 0, String(offset));
  await cdp.viewport(null);

  /* segmented control */
  const segState = await cdp.evaluate(`(() => {
    const seg = document.querySelector('[data-seg]');
    return { role: seg.getAttribute('role'), pressed: [...seg.querySelectorAll('button')].map(b => b.getAttribute('aria-pressed')) };
  })()`);
  check("seg 暴露 group + aria-pressed", segState.role === "group" && segState.pressed[0] === "true" && segState.pressed[1] === "false", JSON.stringify(segState));
  await cdp.evaluate(`document.querySelector('[data-seg] button').focus()`);
  await cdp.press("ArrowRight");
  const segAfter = await cdp.evaluate(`(() => { const bs = [...document.querySelectorAll('[data-seg] button')]; return { i: bs.indexOf(document.activeElement), pressed: bs.map(b => b.getAttribute('aria-pressed')) }; })()`);
  check("seg → 右方向键切换选中", segAfter.i === 1 && segAfter.pressed[1] === "true", JSON.stringify(segAfter));

  /* combobox */
  await cdp.evaluate(`(() => { const i = document.querySelector('[data-combobox] input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); })()`);
  let combo = await cdp.evaluate(`(() => { const c = document.querySelector('[data-combobox]'); const i = c.querySelector('input'); return { open: i.getAttribute('aria-expanded'), act: i.getAttribute('aria-activedescendant') }; })()`);
  check("combobox 输入后展开并定位首项", combo.open === "true" && /opt-0$/.test(combo.act || ""), JSON.stringify(combo));
  await cdp.press("ArrowDown");
  combo = await cdp.evaluate(`document.querySelector('[data-combobox] input').getAttribute('aria-activedescendant')`);
  check("combobox → 下方向键移动活动项", /opt-1$/.test(combo || ""), String(combo));
  await cdp.press("Enter");
  combo = await cdp.evaluate(`(() => { const c = document.querySelector('[data-combobox]'); const i = c.querySelector('input'); return { value: i.value, open: i.getAttribute('aria-expanded') }; })()`);
  check("combobox → Enter 选中并收起", /Greece/.test(combo.value) && combo.open === "false", JSON.stringify(combo));
  await cdp.press("ArrowDown");
  await cdp.press("Escape");
  combo = await cdp.evaluate(`document.querySelector('[data-combobox] input').getAttribute('aria-expanded')`);
  check("combobox → Esc 收起", combo === "false", String(combo));

  /* 原生 dialog：焦点进入 / Tab 不逃逸 / Esc 关闭并归还 */
  await cdp.evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => /showModal/.test(x.getAttribute('onclick') || '') && /dlg2/.test(x.getAttribute('onclick'))); b.focus(); b.click(); })()`);
  await cdp.evaluate(`new Promise(r => setTimeout(r, 60))`, true);
  let dlg = await cdp.evaluate(`(() => { const d = document.getElementById('dlg2'); return { open: d.open, inside: d.contains(document.activeElement) }; })()`);
  check("dialog 打开后焦点进入", dlg.open && dlg.inside, JSON.stringify(dlg));
  let escaped = false;
  for (let i = 0; i < 8; i++) {
    await cdp.press("Tab");
    const where = await cdp.evaluate(`(() => {
      const d = document.getElementById('dlg2'), a = document.activeElement;
      if (a === document.body || a === document.documentElement) return 'chrome';
      return d.contains(a) ? 'inside' : 'outside';
    })()`);
    if (where === "outside") escaped = true;
  }
  check("dialog Tab 不落到背景页面", !escaped);
  await cdp.press("Escape");
  await cdp.evaluate(`new Promise(r => setTimeout(r, 60))`, true);
  dlg = await cdp.evaluate(`(() => { const d = document.getElementById('dlg2'); return { open: d.open, back: /Delete 3 products/.test(document.activeElement.textContent || '') }; })()`);
  check("dialog Esc 关闭并归还焦点", !dlg.open && dlg.back, JSON.stringify(dlg));

  /* 自定义抽屉：inert + 焦点陷阱 + Esc 归还 */
  await cdp.evaluate(`(() => { const b = document.querySelector('[data-overlay-open="drawer"]'); b.focus(); b.click(); })()`);
  await cdp.evaluate(`new Promise(r => setTimeout(r, 80))`, true);
  let drawer = await cdp.evaluate(`(() => {
    const d = document.getElementById('drawer'), m = document.querySelector('main');
    return { open: d.classList.contains('is-open'), modal: d.getAttribute('aria-modal'), inert: m.inert === true,
      locked: document.body.classList.contains('is-overlay-open'), inside: d.contains(document.activeElement), focusCount: 0 };
  })()`);
  check("抽屉打开：aria-modal + 背景 inert + 锁滚动 + 焦点进入", drawer.open && drawer.modal === "true" && drawer.inert && drawer.locked && drawer.inside, JSON.stringify(drawer));

  const drawerFocusables = await focusables("#drawer");
  let outside = false;
  for (let i = 0; i < drawerFocusables.length; i++) {
    await cdp.press("Tab");
    if (!(await cdp.evaluate(`document.getElementById('drawer').contains(document.activeElement)`))) outside = true;
  }
  check(`抽屉 Tab ×${drawerFocusables.length} 不逃逸`, !outside, `focusables=${drawerFocusables.length}`);
  await cdp.evaluate(`(() => { const list = [...document.querySelectorAll('#drawer a[href],#drawer button:not([disabled]),#drawer input:not([disabled]),#drawer [tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length); list[0].focus(); })()`);
  await cdp.press("Tab", { shift: true });
  const backInside = await cdp.evaluate(`document.getElementById('drawer').contains(document.activeElement)`);
  check("抽屉 Shift+Tab 从首项回绕到末项", backInside);

  await cdp.press("Escape");
  await cdp.evaluate(`new Promise(r => setTimeout(r, 80))`, true);
  drawer = await cdp.evaluate(`(() => {
    const d = document.getElementById('drawer'), m = document.querySelector('main');
    return { open: d.classList.contains('is-open'), modal: d.getAttribute('aria-modal'), inert: m.inert === true,
      selfInert: d.inert === true, locked: document.body.classList.contains('is-overlay-open'), returned: /Open drawer/.test(document.activeElement.textContent || '') };
  })()`);
  check("抽屉 Esc 关闭：退出可访问树 / 解除背景 inert / 解锁滚动 / 焦点归还", !drawer.open && !drawer.modal && !drawer.inert && drawer.selfInert && !drawer.locked && drawer.returned, JSON.stringify(drawer));

  /* 灯箱：无内部可聚焦件时焦点落在容器本身 */
  await cdp.evaluate(`(() => { const b = document.querySelector('[data-overlay-open="lightbox"]'); b.focus(); b.click(); })()`);
  await cdp.evaluate(`new Promise(r => setTimeout(r, 60))`, true);
  const lightbox = await cdp.evaluate(`(() => { const l = document.getElementById('lightbox'); return { open: l.classList.contains('is-open'), onSelf: document.activeElement === l, modal: l.getAttribute('aria-modal') }; })()`);
  check("灯箱打开：焦点落在容器 + aria-modal", lightbox.open && lightbox.onSelf && lightbox.modal === "true", JSON.stringify(lightbox));
  await cdp.press("Escape");
  await cdp.evaluate(`new Promise(r => setTimeout(r, 60))`, true);
  const lightboxClosed = await cdp.evaluate(`(() => { const l = document.getElementById('lightbox'); return { open: l.classList.contains('is-open'), returned: /Open lightbox/.test(document.activeElement.textContent || '') }; })()`);
  check("灯箱 Esc 关闭并归还焦点", !lightboxClosed.open && lightboxClosed.returned, JSON.stringify(lightboxClosed));

  /* toast 播报 */
  const toast = await cdp.evaluate(`(() => {
    showToast('已保存');
    const t = document.querySelector('#toasts [role=status]');
    return t ? { role: t.getAttribute('role'), atomic: t.getAttribute('aria-atomic'), text: t.textContent } : null;
  })()`);
  check("toast 以 role=status + aria-atomic 播报", toast && toast.role === "status" && toast.atomic === "true", JSON.stringify(toast));

  /* ---------- 原型：跳过导航 / 标题层级 / 键盘顺序 ---------- */
  for (const page of ["prototypes/08-home.html", "prototypes/09-plp.html", "prototypes/10-pdp.html", "prototypes/11-checkout.html", "prototypes/02-dashboard.html", "prototypes/06-builder.html"]) {
    await cdp.navigate(page);
    await cdp.press("Tab");
    const f = await active();
    check(`${page} 跳过导航是首个焦点`, f.cls.includes("m-skip-link"), JSON.stringify(f));
    await cdp.press("Enter");
    const jump = await cdp.evaluate(`({ hash: location.hash, mainFocused: document.activeElement.id === "main" })`);
    check(`${page} 跳转落到 #main`, jump.hash === "#main" && jump.mainFocused, JSON.stringify(jump));

    const doc = await cdp.evaluate(`(() => {
      const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
        .filter(h => h.getClientRects().length && !h.closest('[aria-hidden=true]'));
      return {
        h1: heads.filter(h => h.tagName === 'H1').length,
        mains: document.querySelectorAll('main').length,
        levels: heads.map(h => +h.tagName[1]),
        landmarks: ['header', 'main', 'footer'].filter(t => document.querySelector(t))
      };
    })()`);
    check(`${page} 恰好一个 h1`, doc.h1 === 1, `h1=${doc.h1}`);
    check(`${page} 标题层级不跳级`, doc.levels.length > 0 && doc.levels[0] === 1 && doc.levels.every((lv, i) => i === 0 || lv <= doc.levels[i - 1] + 1), JSON.stringify(doc.levels));
    check(`${page} 地标齐全（header + main）`, doc.landmarks.includes("header") && doc.landmarks.includes("main"), JSON.stringify(doc.landmarks));

    /* 顺序比对必须在固定滚动态下做：上一行的 Enter 会跳到 #main 并滚动页面，
       而 .sf-header 是 sticky——滚动后它在文档坐标系里的位置持续漂移，
       会与下方内容凑成"同排"，报出与阅读顺序无关的假违规（WCAG 2.4.3 不管粘性重排）。 */
    await cdp.evaluate(`window.scrollTo(0, 0)`);
    await cdp.evaluate(`new Promise(r => setTimeout(r, 120))`, true);
    const order = await cdp.evaluate(`(() => {
      const els = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert]'))
        .slice(0, 16);
      return els.map(el => { const r = el.getBoundingClientRect(); return { t: Math.round(r.top + scrollY), l: Math.round(r.left), r: Math.round(r.right), n: el.tagName + '.' + String(el.className).slice(0, 16) }; });
    })()`);
    const rtled = await cdp.evaluate(`getComputedStyle(document.body).direction === 'rtl'`);
    const bad = [];
    for (let i = 1; i < order.length; i++) {
      const a = order[i - 1], b = order[i];
      const overlap = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const narrower = Math.max(1, Math.min(a.r - a.l, b.r - b.l));
      const sameColumn = overlap > narrower * 0.5;
      const sameRow = Math.abs(b.t - a.t) <= 12;
      if (sameColumn && b.t < a.t - 12) bad.push(`${a.n}(${a.t}) → ${b.n}(${b.t})`);
      else if (!sameColumn && sameRow && (rtled ? b.l > a.l : b.l < a.l)) bad.push(`${a.n}.x${a.l} → ${b.n}.x${b.l}`);
    }
    check(`${page} 同列键盘顺序与视觉顺序一致`, bad.length === 0, bad.join(" | "));

    /* 移动菜单：<1023 才有入口，用 320px 打开--验证与桌面抽屉同一套模态契约 */
    const hasBurger = await cdp.evaluate(`!!document.querySelector('.sf-burger')`);
    if (hasBurger) {
      await cdp.viewport(320, 800);
      await cdp.evaluate(`(() => { const b = document.querySelector('.sf-burger'); b.focus(); b.click(); })()`);
      await cdp.evaluate(`new Promise(r => setTimeout(r, 80))`, true);
      const nav = await cdp.evaluate(`(() => {
        const n = document.querySelector('.sf-mobilenav');
        return { open: n.classList.contains('is-open'), modal: n.getAttribute('aria-modal'), inside: n.contains(document.activeElement), visible: getComputedStyle(n).visibility };
      })()`);
      check(`${page} 移动菜单打开：焦点入内 + aria-modal + 可见`, nav.open && nav.modal === "true" && nav.inside && nav.visible === "visible", JSON.stringify(nav));
      await cdp.press("Escape");
      await cdp.evaluate(`new Promise(r => setTimeout(r, 380))`, true);
      const navClosed = await cdp.evaluate(`(() => {
        const n = document.querySelector('.sf-mobilenav');
        return { open: n.classList.contains('is-open'), inert: n.inert === true, hidden: getComputedStyle(n).visibility === 'hidden', returned: document.activeElement === document.querySelector('.sf-burger') };
      })()`);
      check(`${page} 移动菜单 Esc 关闭：退出可访问树并归还焦点`, !navClosed.open && navClosed.inert && navClosed.hidden && navClosed.returned, JSON.stringify(navClosed));
      await cdp.viewport(null);
    }
  }

  /* ---------- Sidebar v2 图标轨：接线不是字符串，而是真实计算样式 ---------- */
  await cdp.navigate("prototypes/02-dashboard.html");
  const railIdle = await cdp.evaluate(`(() => {
    const nav = document.querySelector('.ad-sidenav');
    const btn = document.querySelector('[data-side-rail]');
    return { w: parseFloat(getComputedStyle(nav).width), pressed: btn.getAttribute('aria-pressed'), stored: localStorage.getItem('meridian.side-rail') };
  })()`);
  check("侧栏 ≥1024 默认展开 240px（静态标记即展开态）", railIdle.w === 240 && railIdle.pressed === "false" && railIdle.stored === null, JSON.stringify(railIdle));

  await cdp.evaluate(`document.querySelector('[data-side-rail]').click()`);
  const railOn = await cdp.evaluate(`(() => {
    const rails = [...document.querySelectorAll('.ad-sidenav')];
    const label = document.querySelector('.ad-sidenav .ad-navlink__label');
    const cs = getComputedStyle(label);
    return {
      w: parseFloat(getComputedStyle(rails[0]).width), pressed: document.querySelector('[data-side-rail]').getAttribute('aria-pressed'),
      stored: localStorage.getItem('meridian.side-rail'), railed: rails.filter(n => n.classList.contains('is-rail')).length, total: rails.length,
      labelW: parseFloat(cs.width), labelDisplay: cs.display, labelOverflow: cs.overflow
    };
  })()`);
  check("点击图标轨：64px + aria-pressed=true + 全部侧栏同步", railOn.w === 64 && railOn.pressed === "true" && railOn.railed === railOn.total, JSON.stringify(railOn));
  check("图标轨里的标签是 sr-clip（可读不可见），不是 display:none", railOn.labelDisplay !== "none" && railOn.labelW === 1 && railOn.labelOverflow === "hidden", JSON.stringify({ display: railOn.labelDisplay, width: railOn.labelW, overflow: railOn.labelOverflow }));
  check("图标轨状态写入 localStorage", railOn.stored === "1", String(railOn.stored));

  await cdp.navigate("prototypes/02-dashboard.html");
  const railReload = await cdp.evaluate(`(() => { const nav = document.querySelector('.ad-sidenav'); return { w: parseFloat(getComputedStyle(nav).width), railed: nav.classList.contains('is-rail') }; })()`);
  check("刷新后恢复收成 64px（持久化真实生效）", railReload.w === 64 && railReload.railed, JSON.stringify(railReload));

  await cdp.evaluate(`document.querySelector('[data-side-rail]').click()`);
  const railOff = await cdp.evaluate(`(() => {
    const nav = document.querySelector('.ad-sidenav');
    return { w: parseFloat(getComputedStyle(nav).width), pressed: document.querySelector('[data-side-rail]').getAttribute('aria-pressed'), stored: localStorage.getItem('meridian.side-rail') };
  })()`);
  check("再点一次回到 240px 并写回 0", railOff.w === 240 && railOff.pressed === "false" && railOff.stored === "0", JSON.stringify(railOff));

  await cdp.viewport(900, 900);
  const railNarrow = await cdp.evaluate(`(() => {
    const rails = [...document.querySelectorAll('.ad-sidenav')];
    const label = document.querySelector('.ad-sidenav .ad-navlink__label');
    return { widths: rails.map(n => parseFloat(getComputedStyle(n).width)), labelW: parseFloat(getComputedStyle(label).width) };
  })()`);
  check("≤1023 视口强制 56px 图标栏（与手动 64px 轨区分）", railNarrow.widths.every(w => w === 56), JSON.stringify(railNarrow.widths));
  check("56px 栏里的标签同样仅视觉隐藏", railNarrow.labelW === 1, String(railNarrow.labelW));
  await cdp.viewport(null);
  await cdp.evaluate(`localStorage.removeItem("meridian.side-rail")`);

  /* ---------- 06 构建器窄屏：图标轨不得漏出子导航；动作组换行而非逐字压缩 ---------- */
  await cdp.navigate("prototypes/06-builder.html");
  await cdp.viewport(375, 800);
  const builderNarrow = await cdp.evaluate(`(() => {
    const bar = document.querySelector('.ad-builder__bar');
    const sub = document.querySelector('.ad-sidenav .ad-subnav.is-open');
    return {
      barH: Math.round(bar.getBoundingClientRect().height),
      btnH: [...bar.querySelectorAll('.m-btn')].map(b => Math.round(b.getBoundingClientRect().height)),
      subnav: sub ? getComputedStyle(sub).display : "absent",
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  })()`);
  check("06 · 375px 动作组整体换行，中文标签不竖排", builderNarrow.barH > 44 && builderNarrow.btnH.every(h => h <= 36), JSON.stringify({ barH: builderNarrow.barH, btnH: builderNarrow.btnH }));
  check("06 · 375px 图标轨隐藏展开态子导航（.is-open 不得凭特异性漏出）", builderNarrow.subnav === "none", builderNarrow.subnav);
  check("06 · 375px 工具条换行后页面无横向溢出", builderNarrow.overflow <= 0, String(builderNarrow.overflow));
  await cdp.viewport(null);
} finally {
  await cdp.close();
}

console.log(`\nbehavior: ${failures ? "FAIL" : "PASS"} (${checks} checks, ${failures} failing)`);
process.exit(failures ? 1 : 0);
