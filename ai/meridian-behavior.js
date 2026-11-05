/*!
 * Meridian behavior layer · v1.4
 * 零依赖参考实现。契约见 docs/06-accessibility-compliance.md §八。
 * 加载即自动绑定：
 *   [data-overlay-open="id"]  打开带焦点陷阱的浮层（.m-drawer / .m-lightbox），Esc 关闭并归还焦点
 *   [data-overlay-close]      关闭最近的已打开浮层
 *   [data-tabs]               标签页：roving tabindex + 方向键（RTL 自动镜像）
 *   [data-seg]                分段控件：aria-pressed + roving + 方向键（RTL 自动镜像）
 *   [data-combobox]           组合框：过滤、方向键、Enter 选中、Esc 收起
 *   [data-side-rail]          后台侧栏图标轨：.is-rail + aria-pressed + localStorage 持久化
 *   [data-theme-cycle]        三态主题：浅色 → 深色 → 跟随系统 → 浅色（localStorage 持久化）
 * 浮层打开时：兄弟节点 inert、body 锁滚动、焦点进入第一个可聚焦件。
 */
(function () {
  "use strict";

  var FOCUSABLE = [
    "a[href]", "button:not([disabled])", "input:not([disabled]):not([type=hidden])",
    "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  function focusable(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) {
      return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
    });
  }

  /* 遮罩与 toast 区域保持可交互/可播报，不能被 inert */
  function keep(el) {
    return el.hasAttribute("data-overlay-keep") || el.id === "toasts" ||
      el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK";
  }

  function siblingsOf(el) {
    if (!el.parentElement) return [];
    return Array.prototype.filter.call(el.parentElement.children, function (n) {
      return n !== el && !n.contains(el) && !keep(n);
    });
  }

  var overlays = new Map();

  function openOverlay(overlay, trigger) {
    if (!overlay || overlays.has(overlay)) return;
    var returnTo = trigger instanceof HTMLElement ? trigger : document.activeElement;
    var inerted = siblingsOf(overlay);
    inerted.forEach(function (el) { el.inert = true; });
    document.body.classList.add("is-overlay-open");
    overlay.inert = false;
    overlay.classList.add("is-open");
    if (!overlay.hasAttribute("role")) overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    if (!overlay.hasAttribute("tabindex")) overlay.setAttribute("tabindex", "-1");
    overlays.set(overlay, { returnTo: returnTo, inerted: inerted });
    var first = focusable(overlay)[0] || overlay;
    first.focus({ preventScroll: true });
    overlay.dispatchEvent(new CustomEvent("meridian:open", { detail: { trigger: trigger } }));
  }

  function closeOverlay(overlay) {
    var rec = overlays.get(overlay);
    if (!rec) return;
    overlay.classList.remove("is-open");
    overlay.removeAttribute("aria-modal");
    overlay.inert = true;
    rec.inerted.forEach(function (el) { el.inert = false; });
    overlays.delete(overlay);
    if (!overlays.size) document.body.classList.remove("is-overlay-open");
    if (rec.returnTo && rec.returnTo.isConnected) rec.returnTo.focus({ preventScroll: true });
    overlay.dispatchEvent(new CustomEvent("meridian:close"));
  }

  /* 焦点陷阱：Tab 在浮层内循环，Esc 关闭 */
  document.addEventListener("keydown", function (e) {
    if (!overlays.size) return;
    var overlay = Array.prototype.pop.call(Array.from(overlays.keys()));
    if (e.key === "Escape") { e.preventDefault(); closeOverlay(overlay); return; }
    if (e.key !== "Tab") return;
    var list = focusable(overlay);
    if (!list.length) { e.preventDefault(); overlay.focus(); return; }
    var first = list[0], last = list[list.length - 1], now = document.activeElement;
    if (!overlay.contains(now)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && now === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && now === last) { e.preventDefault(); first.focus(); }
  }, true);

  document.addEventListener("click", function (e) {
    var themeToggle = e.target.closest("[data-theme-cycle]");
    if (themeToggle) { e.preventDefault(); cycleTheme(); return; }
    var opener = e.target.closest("[data-overlay-open]");
    if (opener) {
      var target = document.getElementById(opener.getAttribute("data-overlay-open"));
      if (target) { e.preventDefault(); openOverlay(target, opener); }
      return;
    }
    var closer = e.target.closest("[data-overlay-close]");
    if (closer) {
      var overlay = closer.closest(".is-open");
      if (overlay && overlays.has(overlay)) closeOverlay(overlay);
    }
  });

  function mirror(scope) {
    return getComputedStyle(scope).direction === "rtl" ? -1 : 1;
  }

  function initTabs(scope) {
    var tabs = Array.prototype.slice.call(scope.querySelectorAll(".m-tab, [role=tab]"))
      .filter(function (t) { return t.tagName === "BUTTON"; });
    if (!tabs.length) return;
    scope.setAttribute("role", "tablist");
    var activate = function (i) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.classList.toggle("is-active", on);
        t.setAttribute("role", "tab");
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
    };
    var initial = tabs.findIndex(function (x) { return x.classList.contains("is-active"); });
    activate(initial < 0 ? 0 : initial);
    tabs.forEach(function (t, i) {
      if (!t.id) t.id = (scope.id || "tabs") + "-tab-" + i;
      t.addEventListener("click", function () { activate(i); });
    });
    scope.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var dir = mirror(scope), next = null;
      if (e.key === "ArrowRight") next = tabs[(i + dir + tabs.length) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - dir + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      next.focus();
      next.click();
    });
  }

  function initSeg(scope) {
    var btns = Array.prototype.slice.call(scope.querySelectorAll("button"));
    if (!btns.length) return;
    scope.setAttribute("role", "group");
    var activate = function (i) {
      btns.forEach(function (b, j) {
        var on = i === j;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
    };
    btns.forEach(function (b, i) { b.addEventListener("click", function () { activate(i); }); });
    activate(Math.max(0, btns.findIndex(function (b) { return b.classList.contains("is-active"); })));
    scope.addEventListener("keydown", function (e) {
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      var dir = mirror(scope), next = null;
      if (e.key === "ArrowRight") next = btns[(i + dir + btns.length) % btns.length];
      else if (e.key === "ArrowLeft") next = btns[(i - dir + btns.length) % btns.length];
      else if (e.key === "Home") next = btns[0];
      else if (e.key === "End") next = btns[btns.length - 1];
      if (!next) return;
      e.preventDefault();
      next.focus();
      next.click();
    });
  }

  function initCombobox(scope) {
    var input = scope.querySelector("input");
    var list = scope.querySelector("[role=listbox]");
    if (!input || !list) return;
    var options = Array.prototype.slice.call(list.querySelectorAll("[role=option]"));
    var empty = list.querySelector(".m-combobox__empty");
    if (!list.id) list.id = "combobox-list";
    /* v1.6 修复：异步搜索的列表初始就是空的。原实现在这里直接 return，
       导致 role / aria-expanded / aria-controls / 键盘全部缺失 —— 异步场景等于没实现，
       而 storefront/12 恰恰要求地址与商品走异步补全。现在语义先就位，选项到达后再补齐。 */
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-expanded", "false");
    function scan() {
      options = Array.prototype.slice.call(list.querySelectorAll("[role=option]"));
      options.forEach(function (o, i) {
        if (!o.id) o.id = list.id + "-opt-" + i;
        if (!o.dataset.bound) {
          o.dataset.bound = "1";
          o.addEventListener("mousedown", function (e) { e.preventDefault(); choose(o); });
        }
      });
      return options;
    }

    var active = Math.max(0, options.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; }));

    function isOpen() { return scope.classList.contains("is-open"); }
    function setOpen(on) {
      scope.classList.toggle("is-open", on);
      input.setAttribute("aria-expanded", on ? "true" : "false");
    }
    function setActive(i) {
      active = i;
      options.forEach(function (o, j) { o.classList.toggle("is-active", j === i); });
      if (options[i]) input.setAttribute("aria-activedescendant", options[i].id);
      else input.removeAttribute("aria-activedescendant");
    }
    function choose(opt) {
      input.value = opt.textContent.trim();
      options.forEach(function (o) { o.setAttribute("aria-selected", o === opt ? "true" : "false"); });
      setOpen(false);
      input.focus();
    }

    setOpen(isOpen());
    setActive(active);
    scan();

    input.addEventListener("input", function () {
      scan();
      var q = input.value.trim().toLowerCase(), shown = 0;
      options.forEach(function (o) {
        var hit = !q || o.textContent.toLowerCase().indexOf(q) > -1;
        o.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      setOpen(true);
      setActive(options.indexOf(options.find(function (o) { return !o.hidden; })));
    });

    input.addEventListener("keydown", function (e) {
      var visible = options.filter(function (o) { return !o.hidden; });
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen()) { setOpen(true); return; }
        var idx = visible.indexOf(options[active]);
        var step = e.key === "ArrowDown" ? 1 : -1;
        var next = visible[Math.min(visible.length - 1, Math.max(0, idx + step))];
        if (next) setActive(options.indexOf(next));
      } else if (e.key === "Enter") {
        if (isOpen() && options[active] && !options[active].hidden) {
          e.preventDefault();
          choose(options[active]);
        }
      } else if (e.key === "Escape") {
        if (isOpen()) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
      } else if (e.key === "Home" || e.key === "End") {
        if (!isOpen() || !visible.length) return;
        e.preventDefault();
        setActive(options.indexOf(e.key === "Home" ? visible[0] : visible[visible.length - 1]));
      }
    });
  }

  /* v1.6 · 表格键盘模型（roving tabindex）。
     后台表格常见几十到上百行、每行一个复选框；朴素 Tab 需要逐行按到底才能离开表格。
     模型：每行首个可聚焦控件组成一个 roving 组，方向键在行间移动，Home/End 到首末行。
     不做整行聚焦（role=grid）——行内已有交互控件，行焦点会与之争夺焦点。 */
  function initDataGrid(table) {
    var stops = Array.prototype.slice.call(table.querySelectorAll("tbody tr")).map(function (tr) {
      return tr.querySelector("input:not([type=hidden]), button, a[href], [tabindex]");
    });
    if (!stops.length || stops.some(function (s) { return !s; })) return;
    stops.forEach(function (s, i) { s.setAttribute("tabindex", i === 0 ? "0" : "-1"); });
    function moveTo(i) {
      stops[i].setAttribute("tabindex", "0");
      stops.forEach(function (s, j) { if (j !== i) s.setAttribute("tabindex", "-1"); });
      stops[i].focus();
    }
    table.addEventListener("keydown", function (e) {
      var i = stops.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === "ArrowDown") n = Math.min(stops.length - 1, i + 1);
      else if (e.key === "ArrowUp") n = Math.max(0, i - 1);
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = stops.length - 1;
      if (n === null) return;
      e.preventDefault();
      moveTo(n);
    });
  }

  /* v1.7 · 粘性头部收缩（配套 .sf-header.is-stuck）。
     CSS 早就写好了 is-stuck 的分割线与 --m-header-h-stuck，但全仓没有任何行为去
     加这个类——样式是死的，原型只能各写一份内联 header。此处补上唯一的写入点。 */
  function initStickyHeader(root) {
    var headers = Array.prototype.slice.call(root.querySelectorAll(".sf-header"));
    if (!headers.length) return;
    var running = false;
    var update = function () {
      running = false;
      // rect.top 归零即已吸附：公告条滑出后 top 恒为 0（sticky top:0）
      headers.forEach(function (h) { h.classList.toggle("is-stuck", h.getBoundingClientRect().top <= 0); });
    };
    window.addEventListener("scroll", function () {
      if (running) return;
      running = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (running) return;
      running = true;
      requestAnimationFrame(update);
    });
    update();
  }

  /* v1.7 · 后台侧栏图标轨（admin/14 §2.2：≥1024 可手动收成 64px，状态持久化）。
     .is-rail 此前是一段没有挂载方的 CSS：规格里写着"状态持久化"，全仓没有一处写过这个状态，
     于是 O10 的折叠裁定只能靠人眼在浏览器 devtools 里手动加类来验证。 */
  var RAIL_KEY = "meridian.side-rail";
  function initSideRail(root) {
    var rails = Array.prototype.slice.call(root.querySelectorAll(".ad-sidenav"));
    var btns = Array.prototype.slice.call(root.querySelectorAll("[data-side-rail]"));
    if (!rails.length || !btns.length) return;
    function set(on) {
      rails.forEach(function (r) { r.classList.toggle("is-rail", on); });
      btns.forEach(function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); });
      localStorage.setItem(RAIL_KEY, on ? "1" : "0");
    }
    // 只在存过"收成轨道"时恢复；没存过就让静态标记的展开态成立，不在加载时无谓写一次存储。
    if (localStorage.getItem(RAIL_KEY) === "1") set(true);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        set(!rails[0].classList.contains("is-rail"));
      });
    });
  }

  /* [data-theme-cycle] 三态主题。默认仍是浅色；auto 只在用户显式选择后生效，
     OS 跟随由 tokens.css 的 AUTO THEME 媒体查询承担（默认翻转 = v2 MAJOR，O11）。 */
  var THEME_KEY = "m-theme", THEME_MODES = ["light", "dark", "auto"];
  var THEME_LABEL = { light: "浅色", dark: "深色", auto: "跟随系统" };
  function getTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    return THEME_MODES.indexOf(saved) >= 0 ? saved : "light";
  }
  function setTheme(mode) {
    if (THEME_MODES.indexOf(mode) < 0) mode = "light";
    var root = document.documentElement;
    root.classList.toggle("theme-dark", mode === "dark");
    root.classList.toggle("theme-auto", mode === "auto");
    if (mode === "light") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
    var next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-cycle]"), function (b) {
      b.setAttribute("aria-label", "主题：" + THEME_LABEL[mode] + "（点击切换到" + THEME_LABEL[next] + "）");
      b.setAttribute("title", "主题：" + THEME_LABEL[mode]);
    });
    return mode;
  }
  function cycleTheme() {
    return setTheme(THEME_MODES[(THEME_MODES.indexOf(getTheme()) + 1) % THEME_MODES.length]);
  }

  function init(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-tabs]"), initTabs);
    Array.prototype.forEach.call(root.querySelectorAll("[data-seg]"), initSeg);
    Array.prototype.forEach.call(root.querySelectorAll("[data-combobox]"), initCombobox);
    Array.prototype.forEach.call(root.querySelectorAll("table[data-grid]"), initDataGrid);
    initStickyHeader(root);
    initSideRail(root);
    setTheme(getTheme());
  }

  /* v1.6 · 撤销栈（配套 admin/16 破坏性确认矩阵）。
     此前只有"10 秒 undo toast"——那是一次可撤销机会，不是一个撤销模型：
     第二次删除会覆盖第一次的机会，且没有任何 ⌘Z 语义。
     模型：应用级历史栈，深度 50；push 后清空 redo 支；编辑态一律交还原生撤销。 */
  var historyDone = [], historyUndone = [], HISTORY_MAX = 50;
  function historyPush(label, undo, redo) {
    historyDone.push({ label: label, undo: undo, redo: redo });
    if (historyDone.length > HISTORY_MAX) historyDone.shift();
    historyUndone.length = 0;
  }
  function historyUndo() {
    var e = historyDone.pop();
    if (!e) return false;
    e.undo();
    historyUndone.push(e);
    return true;
  }
  function historyRedo() {
    var e = historyUndone.pop();
    if (!e) return false;
    e.redo();
    historyDone.push(e);
    return true;
  }
  function inEditable(el) {
    if (!el) return false;
    if (el.isContentEditable === true) return true;
    var tag = el.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag !== "INPUT") return false;
    // 只有"可输入文字"的 input 才交还原生撤销。
    // checkbox/radio/range/button 没有原生撤销语义，若一并排除，
    // 焦点停在表格复选框上时全局撤销就会失效。
    var t = String(el.type || "text").toLowerCase();
    return t === "text" || t === "search" || t === "url" || t === "tel" ||
      t === "email" || t === "password" || t === "number";
  }
  document.addEventListener("keydown", function (e) {
    if (!(e.metaKey || e.ctrlKey) || String(e.key).toLowerCase() !== "z") return;
    // 编辑态不接管：插件的撤销栈与输入框的文字撤销是两件事，抢过来会毁掉后者
    if (inEditable(document.activeElement)) return;
    e.preventDefault();
    if (e.shiftKey) historyRedo(); else historyUndo();
  });

  window.MeridianBehavior = {
    open: openOverlay, close: closeOverlay, init: init,
    theme: { get: getTheme, set: setTheme, cycle: cycleTheme },
    history: {
      push: historyPush, undo: historyUndo, redo: historyRedo,
      canUndo: function () { return historyDone.length > 0; },
      canRedo: function () { return historyUndone.length > 0; },
      size: function () { return historyDone.length; },
      clear: function () { historyDone.length = 0; historyUndone.length = 0; }
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(document); });
  else init(document);
})();
