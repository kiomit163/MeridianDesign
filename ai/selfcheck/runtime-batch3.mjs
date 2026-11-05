#!/usr/bin/env node
/**
 * Batch 3 真浏览器验收（CDP）：
 *   3.1 display 三档在真实计算样式里成立且有序；
 *   3.2 [data-theme="auto"] 跟随 OS 且与显式深色逐值相等，默认舞台仍为 light；
 *   3.6 三个前台组件在 240/480/720px 容器内不溢出，容器查询真实生效；
 *   3.5 reduced-motion 分级：位移关闭、透明度/颜色过渡保留、.rv 停在终态。
 *
 * 静态门（tokens-sync / auto-theme-parity / R07）只证明"写对了"，
 * 这里证明浏览器"算对了"——两者缺一，契约就还是自述。
 */
import { launch, sleep } from "./lib/cdp.mjs";

const cdp = await launch({ port: 9337 });
let pass = 0;
const failures = [];
const check = (name, ok, detail) => {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}${detail === undefined ? "" : " — " + JSON.stringify(detail)}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name} — ${JSON.stringify(detail)}`);
  }
};
const media = async (features) => {
  await cdp.send("Emulation.setEmulatedMedia", { features });
  await sleep(150);
};

try {
  /* ---------- 3.1 display 三档 ---------- */
  await cdp.navigate("prototypes/08-home.html");
  await cdp.viewport(1280, 900);
  const type = await cdp.evaluate(`(() => {
    const px = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    return { lg: px('.sf-display-lg'), d: px('.sf-display'), sm: px('.sf-display-sm') };
  })()`);
  check("3.1 display-lg 落在 44–96px", type.lg >= 44 && type.lg <= 96, type);
  check("3.1 三档字阶有序（lg ≥ display ≥ sm）", type.lg >= type.d && type.d >= type.sm, type);

  /* ---------- 3.2 auto 主题 ---------- */
  const defaultScheme = await cdp.evaluate(`(() => {
    localStorage.removeItem('m-theme');
    document.documentElement.classList.remove('theme-dark','theme-auto');
    document.documentElement.removeAttribute('data-theme');
    return getComputedStyle(document.documentElement).colorScheme;
  })()`);
  check('3.2 默认舞台仍是 light（auto 为 opt-in）', defaultScheme === "light", defaultScheme);

  await media([{ name: "prefers-color-scheme", value: "dark" }]);
  const darkVars = await cdp.evaluate(`(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      return { scheme: cs.colorScheme, page: cs.getPropertyValue('--m-bg-page').trim(), body: getComputedStyle(document.body).backgroundColor };
    };
    MeridianBehavior.theme.set('dark');
    const explicit = read();
    MeridianBehavior.theme.set('auto');
    const auto = read();
    return { explicit, auto };
  })()`);
  check("3.2 auto 声明 color-scheme: light dark", darkVars.auto.scheme === "light dark", darkVars.auto.scheme);
  check("3.2 自动深色与显式深色逐值相等", darkVars.auto.page === darkVars.explicit.page && darkVars.auto.body === darkVars.explicit.body, darkVars);

  await media([{ name: "prefers-color-scheme", value: "light" }]);
  const lightVars = await cdp.evaluate(`(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      return { scheme: cs.colorScheme, page: cs.getPropertyValue('--m-bg-page').trim(), body: getComputedStyle(document.body).backgroundColor };
    };
    MeridianBehavior.theme.set('light');
    const explicit = read();
    MeridianBehavior.theme.set('auto');
    const auto = read();
    return { explicit, auto };
  })()`);
  check("3.2 自动浅色与显式浅色逐值相等", lightVars.auto.page === lightVars.explicit.page && lightVars.auto.body === lightVars.explicit.body, lightVars);
  check("3.2 auto 随 OS 在深浅之间真实切换", lightVars.auto.body !== darkVars.auto.body, { dark: darkVars.auto.body, light: lightVars.auto.body });
  await media([]);

  /* ---------- 3.6 容器查询 ---------- */
  const usp = await cdp.evaluate(`(() => {
    const host = document.querySelector('.sf-usp');
    const item = host.querySelector('.sf-usp__item');
    const out = {};
    for (const w of [240, 480, 720]) {
      host.style.width = w + 'px';
      host.style.maxWidth = w + 'px';
      void host.offsetWidth;
      out[w] = { dir: getComputedStyle(item).flexDirection, overflow: host.scrollWidth - host.clientWidth };
    }
    host.style.width = '';
    host.style.maxWidth = '';
    return out;
  })()`);
  check("3.6 信任条 240px 切横向紧凑排", usp[240].dir === "row", usp[240]);
  check("3.6 信任条 480/720px 保持纵向", usp[480].dir === "column" && usp[720].dir === "column", usp);
  check("3.6 信任条 240/480/720 无溢出", [240, 480, 720].every((w) => usp[w].overflow <= 1), usp);

  await cdp.navigate("prototypes/09-plp.html");
  await cdp.viewport(1280, 900);
  const pcard = await cdp.evaluate(`(() => {
    const host = document.querySelector('.sf-pcard');
    const qa = host.querySelector('.quickadd');
    const out = {};
    for (const w of [160, 240, 480]) {
      host.style.width = w + 'px';
      host.style.maxWidth = w + 'px';
      void host.offsetWidth;
      out[w] = { inset: getComputedStyle(qa).insetInlineStart, overflow: host.scrollWidth - host.clientWidth };
    }
    host.style.width = '';
    host.style.maxWidth = '';
    return out;
  })()`);
  check("3.6 商品卡 160px quick-add 改全幅（inset 0）", pcard[160].inset === "0px", pcard[160]);
  check("3.6 商品卡 240/480px quick-add 保留内缩", pcard[240].inset !== "0px" && pcard[480].inset !== "0px", pcard);
  check("3.6 商品卡 160/240/480 无溢出", [160, 240, 480].every((w) => pcard[w].overflow <= 1), pcard);

  await cdp.navigate("prototypes/10-pdp.html");
  await cdp.viewport(1280, 900);
  const pdp = await cdp.evaluate(`(() => {
    const host = document.querySelector('.sf-pdp');
    const gallery = host.querySelector('.sf-gallery');
    const out = {};
    for (const w of [240, 480, 720, 800]) {
      host.style.width = w + 'px';
      host.style.maxWidth = w + 'px';
      void host.offsetWidth;
      out[w] = {
        cols: getComputedStyle(gallery).gridTemplateColumns.split(' ').length,
        overflow: gallery.scrollWidth - gallery.clientWidth,
      };
    }
    host.style.width = '';
    host.style.maxWidth = '';
    return out;
  })()`);
  check("3.6 PDP ≤720px 图组切单列", [240, 480, 720].every((w) => pdp[w].cols === 1), pdp);
  check("3.6 PDP 800px 恢复双列", pdp[800].cols === 2, pdp[800]);
  check("3.6 PDP 240/480/720 无溢出", [240, 480, 720].every((w) => pdp[w].overflow <= 1), pdp);

  /* ---------- 3.5 reduced-motion 分级 ---------- */
  await media([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await cdp.navigate("prototypes/08-home.html");
  const rm = await cdp.evaluate(`(() => {
    const rv = document.createElement('div');
    rv.className = 'rv';
    rv.textContent = 'rv probe';
    document.body.appendChild(rv);
    const cs = getComputedStyle(rv);
    const btn = document.querySelector('.m-btn, button');
    const bs = getComputedStyle(btn);
    return {
      opacity: cs.opacity, animation: cs.animationName, translate: cs.translate,
      transitionProperty: bs.transitionProperty, transitionDuration: bs.transitionDuration,
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
    };
  })()`);
  check("3.5 .rv 停在终态（可见）", rm.opacity === "1" && rm.animation === "none" && rm.translate === "none", rm);
  check("3.5 颜色/透明度过渡保留", /opacity/.test(rm.transitionProperty) && !/transform|translate|scale/.test(rm.transitionProperty), rm.transitionProperty);
  check("3.5 过渡时长取最短档 100ms", rm.transitionDuration === "0.1s", rm.transitionDuration);
  check("3.5 平滑滚动关闭", rm.scroll === "auto", rm.scroll);
  await media([]);
} finally {
  await cdp.close();
}

if (failures.length) {
  console.log(`\nbatch3: FAIL (${failures.length} failing, ${pass} passing)`);
  process.exit(1);
}
console.log(`\nbatch3: PASS (${pass} checks)`);
