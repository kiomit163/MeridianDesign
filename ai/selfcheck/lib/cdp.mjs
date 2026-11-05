/**
 * 共享 CDP 驱动器（Chrome + DevTools Protocol，零 Playwright 依赖）。
 * 供 runtime-a11y / runtime-behavior / runtime-l10n 三个门禁复用。
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(fileURLToPath(new URL("../../../", import.meta.url)));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  `${process.env.LOCALAPPDATA ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEYS = {
  Tab: [9, "Tab"],
  Enter: [13, "Enter"],
  Escape: [27, "Escape"],
  ArrowDown: [40, "ArrowDown"],
  ArrowUp: [38, "ArrowUp"],
  ArrowLeft: [37, "ArrowLeft"],
  ArrowRight: [39, "ArrowRight"],
  Home: [36, "Home"],
  End: [35, "End"],
  // v1.6 · 撤销栈用例需要 ⌘Z / ⇧⌘Z
  z: [90, "KeyZ"],
};

export async function launch({ port = 9336, width = 1280, height = 900 } = {}) {
  const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chromePath) {
    console.error("未找到 Chrome/Chromium。设置 CHROME_PATH 后重试。");
    process.exit(2);
  }
  const profile = mkdtempSync(join(tmpdir(), "meridian-cdp-"));
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, "about:blank",
  ], { stdio: "ignore" });

  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) wsUrl = page.webSocketDebuggerUrl;
    } catch {}
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) {
    chrome.kill();
    throw new Error("Chrome CDP endpoint not ready");
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

  async function evaluate(expression, awaitPromise = false) {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.bringToFront");

  async function navigate(rel) {
    const file = resolve(root, rel);
    await send("Page.navigate", { url: `file:///${file.replace(/\\/g, "/").replace(/ /g, "%20")}` });
    for (let i = 0; i < 80; i++) {
      await sleep(100);
      if (await evaluate("document.readyState === 'complete'")) { await sleep(120); return; }
    }
    throw new Error(`page load timeout: ${rel}`);
  }

  async function press(key, { shift = false, ctrl = false, meta = false } = {}) {
    const [vk, code] = KEYS[key] ?? [];
    if (!vk) throw new Error(`unsupported key: ${key}`);
    // CDP modifiers 位掩码：Alt=1 · Ctrl=2 · Meta=4 · Shift=8
    const modifiers = (shift ? 8 : 0) | (ctrl ? 2 : 0) | (meta ? 4 : 0);
    const common = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers };
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...common });
    await send("Input.dispatchKeyEvent", { type: "keyUp", ...common });
    await sleep(30);
  }

  async function type(text) {
    await send("Input.insertText", { text });
    await sleep(40);
  }

  async function viewport(w, h = 800) {
    if (w == null) { await send("Emulation.clearDeviceMetricsOverride"); return; }
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false, screenWidth: w, screenHeight: h });
    await sleep(150);
  }

  async function close() {
    ws.close();
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }

  return { send, evaluate, navigate, press, type, viewport, close, root };
}
