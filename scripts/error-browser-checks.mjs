import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Run in the existing real-Chrome smoke harness, against dev or production. */
export async function checkErrorPages({ send, evaluate, until, origin }) {
  const artifacts = resolve("dist/qa-errors");
  await mkdir(artifacts, { recursive: true });
  const routes = [["/missing/deep/page?from=test#content", 404], ["/dashboard/not-a-route", 404], ["/403", 403], ["/404", 404], ["/500", 500], ["/503", 503]];
  const headings = {
    en: { 403: "This space is protected.", 404: "A little off the learning path.", 500: "Something went wrong.", 503: "A short pause. Not the end." },
    id: { 403: "Ruang ini dilindungi.", 404: "Sedikit keluar dari jalur belajar.", 500: "Terjadi kendala tak terduga.", 503: "Jeda sejenak. Bukan akhir perjalanan." },
  };
  const setLanguage = async (language) => {
    await evaluate(`(() => { const select = document.querySelector('select'); select.value = '${language}'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await until(() => evaluate(`document.documentElement.lang === '${language}'`));
  };
  const checkLayout = async (code) => {
    const result = await evaluate(`(() => {
      const visible = el => el.getClientRects().length > 0;
      const actions = [...document.querySelectorAll('.ck-error-action')].filter(visible);
      return { width: innerWidth, content: document.documentElement.scrollWidth, main: document.querySelectorAll('main').length, headings: document.querySelectorAll('h1').length,
        title: document.title, code: (document.querySelector('.ck-error-code [aria-hidden]') || document.querySelector('.ck-error-code'))?.textContent, robots: document.querySelector('meta[name=robots]')?.content,
        actions: actions.map(el => ({ name: el.textContent.trim(), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
        logo: document.querySelector('header a')?.getAttribute('aria-label'),
        foreground: getComputedStyle(document.querySelector('.ck-error-description')).color, background: getComputedStyle(document.querySelector('.ck-error')).backgroundColor };
    })()`);
    assert.ok(result.content <= result.width + 1, `Error page overflow: ${result.content}/${result.width}`);
    assert.equal(result.main, 1);
    assert.equal(result.headings, 1);
    assert.equal(result.code.trim(), String(code));
    assert.ok(result.title.includes(String(code)));
    assert.equal(result.robots, "noindex, nofollow");
    assert.ok(result.logo);
    for (const action of result.actions) { assert.ok(action.name); assert.ok(action.height >= 44 && action.width >= 44, "Recovery target must be at least 44px"); }
    const luminance = value => {
      const channels = value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => { const s = channel / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const ratio = (luminance(result.foreground) + .05) / (luminance(result.background) + .05);
    assert.ok(ratio >= 4.5, `Description contrast must meet AA: ${ratio}`);
  };

  for (const width of [320, 390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    for (const [path, code] of routes) {
      await send("Page.navigate", { url: `${origin}${path}` });
      await until(() => evaluate("document.readyState === 'complete' && !!document.querySelector('.ck-error')"));
      for (const language of ["id", "en"]) {
        const previous = await evaluate("({url:location.href, time:performance.timeOrigin})");
        await setLanguage(language);
        await until(() => evaluate(`document.querySelector('h1')?.textContent === ${JSON.stringify(headings[language][code])}`));
        assert.equal(await evaluate("location.href"), previous.url);
        assert.equal(await evaluate("performance.timeOrigin"), previous.time);
        await checkLayout(code);
        await send("Page.reload");
        await until(() => evaluate(`document.readyState === 'complete' && document.documentElement.lang === '${language}' && document.querySelector('h1')?.textContent === ${JSON.stringify(headings[language][code])}`));
      }
      if ([390, 1440].includes(width) && path === `/${code}`) {
        await new Promise(done => setTimeout(done, 550));
        const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
        await writeFile(resolve(artifacts, `${code}-${width}.png`), Buffer.from(screenshot.data, "base64"));
      }
    }
  }

  await evaluate("document.querySelector('.ck-error-actions a[href=\"/dashboard\"]').click()");
  await until(() => evaluate("location.pathname === '/dashboard' && document.body.innerText.includes('Welcome back')"));
  await evaluate("(() => { const a = document.createElement('a'); a.href = '/missing-after-dashboard'; document.body.append(a); a.click(); })()");
  await until(() => evaluate("!!document.querySelector('.ck-error')"));
  await evaluate("document.querySelector('.ck-error-actions a[href=\"/\"]').click()");
  await until(() => evaluate("location.pathname === '/' && document.body.innerText.includes('Become an Engineer')"));

  await evaluate("localStorage.setItem('ck-reduced-motion','true')");
  await send("Page.navigate", { url: `${origin}/404` });
  await until(() => evaluate("!!document.querySelector('.ck-error-layout') && document.documentElement.dataset.reducedMotion === 'true'"));
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.ck-error-layout')).animationName"), "none");
  await evaluate("localStorage.setItem('ck-reduced-motion','false')");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.reload");
  await until(() => evaluate("!!document.querySelector('.ck-error-layout') && document.documentElement.dataset.reducedMotion === 'false'"));
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.ck-error-layout')).animationName"), "none");
  await send("Emulation.setEmulatedMedia", { features: [] });

  await evaluate("document.querySelector('header a').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  assert.equal(await evaluate("document.activeElement.tagName"), "SELECT");
  assert.ok(await evaluate("document.activeElement.getAttribute('aria-label')"));

  for (const width of [320, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    for (const code of [403, 404, 500, 503]) {
      await send("Page.navigate", { url: `${origin}/status/${code}.html` });
      await until(() => evaluate(`document.readyState === 'complete' && document.querySelector('.ck-error-code')?.textContent === '${code}'`));
      for (const language of ["id", "en"]) { await setLanguage(language); await checkLayout(code); }
      assert.equal(await evaluate("performance.getEntriesByType('resource').filter(r => !r.name.startsWith('data:')).length"), 0, "Standalone documents must not need any network resources");
    }
  }

  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Page.navigate", { url: `${origin}/status/404.html` });
  await until(() => evaluate("document.readyState === 'complete' && !!document.querySelector('noscript h2')"));
  assert.ok(await evaluate("document.body.innerText.includes('A little off the learning path.')"), "English recovery must be readable with scripts disabled");
  assert.ok(await evaluate("document.body.innerText.includes('Sedikit keluar dari jalur belajar.')"), "Indonesian must work without scripts");
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  console.log("PASS: error pages at 320/390/768/1440px; ID/EN switching and refresh; recovery links; metadata, contrast, focus and reduced motion; standalone documents with/without JavaScript. Screenshots: dist/qa-errors.");
}