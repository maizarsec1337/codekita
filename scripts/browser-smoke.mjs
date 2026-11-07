import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, delimiter } from "node:path";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";

// Real Chrome + production application, with no browser automation dependency.
// A deliberately unreachable test-only DB exercises honest degraded states.
const root = resolve(process.cwd());
const port = 3217, debugPort = 9327;
const artifacts = join(root, "dist", "validation");
const chromeProfile = await mkdtemp(join(tmpdir(), "codekita-browser-"));
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const errors = [], serverLogs = [];
let chrome, server, socket;
async function until(fn, timeout = 25000) {
  const start = Date.now(); let failure;
  while (Date.now() - start < timeout) { try { const result = await fn(); if (result) return result; } catch (error) { failure = error; } await new Promise((resolvePromise) => setTimeout(resolvePromise, 200)); }
  throw new Error(`Timed out: ${failure?.message ?? "condition not met"}`);
}
try {
  await mkdir(artifacts, { recursive: true });
  server = spawn(process.execPath, [join(root, "dist", "server.js")], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: String(port), NODE_PATH: [join(root, "backend", "node_modules"), process.env.NODE_PATH].filter(Boolean).join(delimiter), DATABASE_URL: "postgresql://validation_only@127.0.0.1:1/validation?connect_timeout=1", SESSION_SECRET: randomBytes(32).toString("hex"), CORS_ORIGIN: `http://127.0.0.1:${port}`, ENABLE_SWAGGER: "false" }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => serverLogs.push(chunk.toString())); server.stderr.on("data", (chunk) => serverLogs.push(chunk.toString()));
  await until(async () => (await fetch(`http://127.0.0.1:${port}/api/health`)).ok);
  const csrfDenied = await fetch(`http://127.0.0.1:${port}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "training@example.test", password: "not-a-real-password" }) });
  assert.equal(csrfDenied.status, 403, "Auth mutations must reject missing CSRF");
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/learning/dashboard`)).status, 401, "Dashboard requires a real session");
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/admin/paths`)).status, 401, "Admin API must require a session");
  assert.equal((await fetch(`http://127.0.0.1:${port}/runtime/src/server/main.js`)).status, 404, "Server runtime must not be public");
  assert.equal((await fetch(`http://127.0.0.1:${port}/server.js`)).status, 404, "Server entry must not be public");
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/no-such-route`)).status, 404, "Unknown API routes must return 404");
  const health = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json(); assert.equal(health.services.database, "disconnected");
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${chromeProfile}`, "about:blank"], { stdio: "ignore" });
  const tabs = await until(async () => { const response = await fetch(`http://127.0.0.1:${debugPort}/json`); return response.json(); });
  socket = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => { socket.addEventListener("open", resolvePromise, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0; const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const promise = pending.get(message.id); pending.delete(message.id); if (message.error) promise?.reject(new Error(message.error.message)); else promise?.resolve(message.result); }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise((resolvePromise, reject) => { const id = ++sequence; pending.set(id, { resolve: resolvePromise, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  await send("Runtime.enable"); await send("Page.enable");
  const results = [];
  async function visit(path, width, expected) {
    console.log(`Checking ${path} at ${width}px`);
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Page.navigate", { url: `http://127.0.0.1:${port}${path}` });
    await until(() => evaluate(`document.readyState === 'complete' && document.body.innerText.includes(${JSON.stringify(expected)})`));
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 700));
    const layout = await evaluate(`({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, navs: document.querySelectorAll('nav[aria-label="Main navigation"]').length, heading: document.querySelector('h1')?.innerText, background: getComputedStyle(document.body).backgroundColor})`);
    assert.ok(layout.scrollWidth <= layout.width + 1, `${path} overflows at ${width}px: ${JSON.stringify(layout)}`);
    assert.equal(layout.background, "rgb(9, 13, 19)", "Semantic dark background must resolve to requested token");
    results.push({ path, width, ...layout });
    const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const name = path.replace(/[^a-z0-9]+/gi, "-") || "home";
    await writeFile(join(artifacts, `${name}-${width}.png`), Buffer.from(image.data, "base64"));
  }
  await visit("/", 1440, "Become an Engineer.");
  await evaluate(`document.querySelector('input[name="preview"]').click()`);
  assert.equal(await evaluate(`document.body.innerText.includes('Correct! map returns a new array')`), true, "Interactive preview must respond to actual input");
  await visit("/", 390, "Become an Engineer.");
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);
  await until(() => evaluate(`document.querySelector('[role="dialog"]') !== null`));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await until(() => evaluate(`document.querySelector('[role="dialog"]') === null`));
  await visit("/paths", 1440, "We couldn’t load the catalogue");
  await visit("/paths", 390, "We couldn’t load the catalogue");
  await visit("/labs", 1440, "Preview workspace");
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('Run code')).disabled`), true);
  await visit("/labs?academy=cybersecurity", 390, "Investigate an access log");
  await visit("/academy", 390, "Choose your academy");
  await visit("/leaderboard", 390, "Leaderboard unavailable");
  await visit("/login", 390, "Sign in");
  await visit("/register", 390, "Create an account");
  await visit("/dashboard", 390, "Sign in");
  await visit("/learn/unavailable/section", 1440, "Sign in");
  assert.equal(errors.length, 0, `Unexpected browser exceptions: ${errors.join("\n")}`);
  let rateLimited = false;
  for (let i = 0; i < 110; i++) {
    const response = await fetch(`http://127.0.0.1:${port}/api/labs`);
    if (response.status === 429) { rateLimited = true; break; }
  }
  assert.equal(rateLimited, true, "API requests must still be rate limited");
  assert.equal((await fetch(`http://127.0.0.1:${port}/login`)).status, 200, "API rate limit must not block the SPA");
  await writeFile(join(artifacts, "browser-report.json"), JSON.stringify({ mode: "production-with-unavailable-test-db", results, runtimeErrors: errors }, null, 2));
  console.log(`PASS: ${results.length} real-Chrome desktop/mobile route checks, CSRF rejection, auth gates, interactive preview, navigation dialog, disabled execution, and no horizontal overflow.`);
  console.log(`Validation artifacts: ${artifacts}`);
} catch (error) {
  await mkdir(artifacts, { recursive: true });
  await writeFile(join(artifacts, "failure.log"), [String(error), ...errors, ...serverLogs].join("\n"));
  console.error(error); console.error(serverLogs.join("\n").slice(-12000)); process.exitCode = 1;
} finally {
  socket?.close(); chrome?.kill(); server?.kill();
  // Only this script's freshly-created, random temporary browser profile is removed.
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  await rm(chromeProfile, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
  process.exit(process.exitCode ?? 0);
}