import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { checkErrorPages } from "./error-browser-checks.mjs";

// Uses the real Vite script or production preview and Chrome; never starts the backend.
const root = resolve(process.cwd());
const preview = process.argv.includes("--preview");
const serverPort = preview ? 4173 : 5173;
const origin = `http://localhost:${serverPort}`;
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(join(tmpdir(), "codekita-static-"));
const routes = [
  ["/", "Become an Engineer"], ["/login", "Sign in"], ["/register", "Create an account"],
  ["/dashboard", "Welcome back"], ["/admin-dashboard", "Curriculum management"],
  ["/courses", "Course catalog"], ["/paths", "Learning paths"],
  ["/paths/web-development-fundamentals", "Web Development Fundamentals"],
  ["/profile", "Profile"], ["/academy", "Choose your academy"], ["/labs", "Preview workspace"],
  ["/dashboard/my-learning", "My learning"], ["/dashboard/modules", "Your modules"],
  ["/achievements", "Your achievements"], ["/certificates", "Your certificates"],
  ["/settings", "Settings"], ["/leaderboard", "The learning leaderboard"],
  ["/learn/how-the-web-works/request-and-response", "The request"],
];
let vite, chrome, socket;
const failures = [], apiRequests = [], consoleErrors = [], networkFailures = [];
const until = async (fn, timeout = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { const result = await fn(); if (result) return result; } catch { /* Retry while processes start. */ } await new Promise((r) => setTimeout(r, 150)); }
  throw new Error("Timed out waiting for browser or Vite");
};
try {
  // Refuse to test a pre-existing server or stop another user's process.
  try { await fetch(origin, { signal: AbortSignal.timeout(1000) }); throw new Error(`Port ${serverPort} is already serving another process`); }
  catch (error) { if (error.message.includes("already serving")) throw error; }
  const command = process.platform === "win32" ? "powershell.exe" : "pnpm";
  const script = preview ? "preview:static" : "dev";
  const args = process.platform === "win32" ? ["-NoProfile", "-NonInteractive", "-Command", `pnpm run ${script}`] : ["run", script];
  vite = spawn(command, args, { cwd: root, stdio: "ignore", env: { ...process.env, DATABASE_URL: "", DIRECT_URL: "", SESSION_SECRET: "" } });
  await until(async () => { if (vite.exitCode !== null) throw new Error("Vite exited"); return (await fetch(origin)).ok; });
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const { readFile } = await import("node:fs/promises");
  const port = await until(async () => Number((await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]));
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => { socket.addEventListener("open", resolvePromise, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0; const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const { resolve: done, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(new Error(message.error.message)); else done(message.result); }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push("Uncaught browser exception");
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? "error").join(" ").slice(0, 500));
    if (message.method === "Network.requestWillBeSent" && new URL(message.params.request.url).pathname.startsWith("/api/")) apiRequests.push(new URL(message.params.request.url).pathname);
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400) networkFailures.push(`HTTP ${message.params.response.status}: ${new URL(message.params.response.url).pathname}`);
    if (message.method === "Network.loadingFailed" && !message.params.canceled) networkFailures.push(`Network failure: ${message.params.errorText}`);
  });
  const send = (method, params = {}) => new Promise((resolvePromise, reject) => { const requestId = ++id; pending.set(requestId, { resolve: resolvePromise, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  const evaluate = async (expression) => { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error("Browser evaluation failed"); return r.result.value; };
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
  await send("Page.navigate", { url: origin });
  await until(() => evaluate("document.readyState === 'complete' && !!document.querySelector('main')"));
  // Keep English route assertions deterministic on Indonesian host browsers.
  await evaluate("localStorage.setItem('codekita-language', 'en')");
  await send("Page.reload");
  await until(() => evaluate("document.documentElement.lang === 'en' && document.body.innerText.includes('Static demo')"));
  for (const width of [390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    for (const [path, expected] of routes) {
      await send("Page.navigate", { url: `${origin}${path}` });
      try {
        await until(() => evaluate(`document.readyState === 'complete' && document.body.innerText.includes(${JSON.stringify(expected)})`), 15000);
        const page = await evaluate(`({banner:document.body.innerText.includes('Static demo'), scrollWidth:document.documentElement.scrollWidth, width:innerWidth, failed:document.body.innerText.includes('Something went wrong'), disabled: Array.from(document.querySelectorAll('fieldset')).some(e=>e.disabled)})`);
        assert.ok(page.banner, "Demo banner missing");
        assert.ok(!page.failed, "Error fallback visible");
        assert.ok(page.scrollWidth <= page.width + 1, `horizontal overflow ${page.scrollWidth}/${page.width}`);
        if (["/login", "/register"].includes(path)) assert.equal(page.disabled, false, "Demo form must allow fictional input validation");
      } catch (error) { failures.push(`${width}px ${path}: ${error.message}`); }
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  for (const [path, identifier] of [["/login", "identifier"], ["/register", "email"]]) {
    await send("Page.navigate", { url: `${origin}${path}` });
    await until(() => evaluate("!!document.querySelector('form')"));
    await evaluate("document.querySelector('form').requestSubmit()");
    await until(() => evaluate("document.body.innerText.includes('Password must be at least 8 characters')"));
    const fill = (id, value) => `(() => {const e=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`;
    await evaluate(fill(identifier, "sample@example.test"));
    await evaluate(fill("password", "fictional-demo-password"));
    await evaluate("document.querySelector('form').requestSubmit()");
    await until(() => evaluate("document.body.innerText.includes('input validated')"));
    assert.equal(await evaluate("document.getElementById('password').value"), "", "Demo password must be cleared after validation");
  }
  await send("Page.navigate", { url: `${origin}/` });
  await until(() => evaluate("document.body.innerText.includes('Become an Engineer')"));
  await evaluate("document.querySelector('[aria-label=\"Open navigation\"]').click()");
  await until(() => evaluate("!!document.querySelector('[role=dialog]')"));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await until(() => evaluate("!document.querySelector('[role=dialog]')"));
  await send("Page.navigate", { url: `${origin}/courses` });
  await until(() => evaluate("!!document.querySelector('a[href=\"/paths/web-development-fundamentals\"]')"));
  await evaluate("document.querySelector('a[href=\"/paths/web-development-fundamentals\"]').click()");
  await until(() => evaluate("location.pathname === '/paths/web-development-fundamentals' && document.body.innerText.includes('Web Development Fundamentals')"));
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Preview lesson')).click()");
  await until(() => evaluate("location.pathname === '/learn/how-the-web-works/request-and-response' && document.body.innerText.includes('Knowledge check')"));
  assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Mark complete')).disabled"), true, "Demo completion must be disabled");
  assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Save progress')).disabled"), true, "Demo progress save must be disabled");
  await send("Page.navigate", { url: `${origin}/admin-dashboard` });
  await until(() => evaluate("document.body.innerText.includes('Curriculum management')"));
  assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Save curriculum')).disabled"), true, "Demo admin save must be disabled");

  // Exercise the actual desktop and mobile controls rather than calling i18n directly.
  for (const width of [320, 390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const [path, english, indonesian, menu] of [
      ["/dashboard?view=paths#learning", "Welcome back", "Selamat datang kembali", "Open workspace navigation"],
      ["/login", "Sign in", "Masuk", "Open navigation"],
      ["/settings", "Settings", "Pengaturan", "Open workspace navigation"],
    ]) {
      await send("Page.navigate", { url: `${origin}${path}` });
      await until(() => evaluate(`document.readyState === 'complete' && document.documentElement.lang === 'en' && document.body.innerText.includes(${JSON.stringify(english)})`));
      const before = await evaluate("({url:location.href, time:performance.timeOrigin})");
      if (width < 1024) {
        await evaluate(`document.querySelector('[aria-label="${menu}"]').click()`);
        await until(() => evaluate("!!document.querySelector('[role=dialog] select')"));
      }
      await evaluate(`(() => { const select = [...document.querySelectorAll('select[aria-label="Language"]')].find(e => e.getClientRects().length); if (!select) throw new Error('Visible language select missing'); select.value = 'id'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await until(() => evaluate(`document.documentElement.lang === 'id' && document.body.innerText.includes(${JSON.stringify(indonesian)})`));
      assert.equal(await evaluate("localStorage.getItem('codekita-language')"), "id");
      assert.equal(await evaluate("location.href"), before.url, "Language switch must preserve route, query and hash");
      assert.equal(await evaluate("performance.timeOrigin"), before.time, "Language switch must not reload");
      if (width < 1024) {
        assert.ok(await evaluate("!!document.querySelector('[role=dialog] [aria-label=\"Tutup\"]')"), "Mobile close button must be translated");
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await until(() => evaluate("!document.querySelector('[role=dialog]')"));
      }
      const size = await evaluate("({width:innerWidth, content:document.documentElement.scrollWidth})");
      assert.ok(size.content <= size.width + 1, `Indonesian overflow at ${width}px ${path}: ${size.content}/${size.width}`);
      await send("Page.reload");
      await until(() => evaluate(`document.readyState === 'complete' && document.documentElement.lang === 'id' && document.body.innerText.includes(${JSON.stringify(indonesian)})`));
      if (width < 1024) {
        const label = menu === "Open navigation" ? "Buka navigasi" : "Buka navigasi ruang belajar";
        await evaluate(`document.querySelector('[aria-label="${label}"]').click()`);
        await until(() => evaluate("!!document.querySelector('[role=dialog] select')"));
      }
      await evaluate(`(() => { const select = [...document.querySelectorAll('select[aria-label="Bahasa"]')].find(e => e.getClientRects().length); select.value = 'en'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await until(() => evaluate("document.documentElement.lang === 'en'"));
      if (width < 1024) {
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await until(() => evaluate("!document.querySelector('[role=dialog]')"));
      }
    }
  }
  await checkErrorPages({ send, evaluate, until, origin });
  assert.deepEqual(apiRequests, [], "Static pages must not request /api");
  assert.deepEqual(networkFailures, [], "No failed HTTP requests or network errors");
  assert.deepEqual(consoleErrors, [], "No console errors or uncaught exceptions");
  assert.deepEqual(failures, [], "Routes and responsive layout must pass");
  console.log(`PASS: ${routes.length} routes x 3 viewports; ID/EN switching and refresh persistence on 3 routes x 4 viewports (320-1440px); demo form validation, mobile and course navigation, disabled writes; no API requests, failed network requests, uncaught exceptions, console errors or page overflow.`);
} catch (error) {
  console.error(`Static browser smoke failed: ${error.message}`);
  if (failures.length) console.error(failures.join("\n"));
  if (apiRequests.length) console.error(`Unexpected API requests: ${apiRequests.join(", ")}`);
  if (networkFailures.length) console.error(`Network failures: ${[...new Set(networkFailures)].join(", ")}`);
  if (consoleErrors.length) console.error(`Browser errors: ${consoleErrors.length}; examples: ${[...new Set(consoleErrors)].slice(0, 3).join(" | ")}`);
  process.exitCode = 1;
} finally {
  socket?.close(); chrome?.kill();
  if (vite?.pid && process.platform === "win32") {
    const cleanup = spawn("taskkill", ["/pid", String(vite.pid), "/T", "/F"], { stdio: "ignore" });
    await new Promise((done) => { cleanup.once("exit", done); cleanup.once("error", done); });
  } else vite?.kill();
  await new Promise((done) => setTimeout(done, 500));
  await rm(profile, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
}