// Uses the installed Chromium browser and its debugging protocol; no new packages.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';
export async function browserPersistence({ base, origin, email, password, userId, prisma }) {
  const executable = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(file => file && existsSync(file));
  assert.ok(executable, 'A Chromium browser is required for browser persistence verification');
  const profile = mkdtempSync(join(tmpdir(), 'codekita-live-browser-'));
  const pending = new Map();
  let browser, socket, vite, id = 0;
  async function until(fn, label) {
    for (let i = 0; i < 100; i++) { const value = await fn(); if (value) return value; await delay(200); }
    throw new Error('Browser timeout: ' + label);
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => { pending.delete(key); reject(new Error('Browser command timed out')); }, 15000);
    pending.set(key, { resolve, reject, timer }); socket.send(JSON.stringify({ id: key, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error('Browser script failed');
    return result.result.value;
  };
  const setInput = (selector, value) => evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  try {
    vite = await createServer({ define: { __CODEKITA_API_BASE__: JSON.stringify(base + '/api') }, server: { host: '127.0.0.1', port: Number(new URL(origin).port), strictPort: true } });
    await vite.listen();
    browser = spawn(executable, ['--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
    const port = await until(() => existsSync(join(profile, 'DevToolsActivePort')) && readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0], 'debugger startup');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data), task = pending.get(message.id);
      if (!task) return;
      clearTimeout(task.timer); pending.delete(message.id);
      if (message.error) task.reject(new Error('Browser protocol command failed')); else task.resolve(message.result);
    });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: origin + '/login' });
    await until(() => evaluate(`!!document.querySelector('#identifier') && !document.querySelector('fieldset')?.disabled`), 'login form');
    await setInput('#identifier', email); await setInput('#password', password);
    await evaluate(`document.querySelector('form').requestSubmit()`);
    await until(() => evaluate(`location.pathname === '/dashboard'`), 'login completion');
    await send('Page.navigate', { url: origin + '/profile' });
    await until(() => evaluate(`document.querySelectorAll('form input').length === 3`), 'profile form');
    await setInput('form input:nth-of-type(1)', 'Browser');
    await evaluate(`(() => { const input = document.querySelectorAll('form input')[2]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Browser persisted profile'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await evaluate(`document.querySelector('form').requestSubmit()`);
    await until(async () => (await prisma.profile.findUnique({ where: { userId } }))?.displayName === 'Browser persisted profile', 'independent PostgreSQL read');
    await send('Page.reload', { ignoreCache: true });
    await until(() => evaluate(`document.querySelectorAll('form input')[2]?.value === 'Browser persisted profile'`), 'persisted profile after reload');
    assert.equal(await evaluate(`document.cookie.includes('codekita_session')`), false, 'Session is not JavaScript-readable');
  } finally {
    socket?.close();
    for (const task of pending.values()) clearTimeout(task.timer);
    if (browser && browser.exitCode === null) { const exit = new Promise(resolve => browser.once('exit', resolve)); browser.kill(); await exit; }
    await vite?.close();
    // Exact OS-generated temporary browser profile, never an application path.
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}