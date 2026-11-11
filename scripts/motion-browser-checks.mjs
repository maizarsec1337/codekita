// Run after npm run build with Node 22+ and a local Chrome/Chromium installation.
// CHROME_PATH optionally selects the executable. No account or live API is used.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer, preview } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].find(candidate => candidate && existsSync(candidate));
assert.ok(chromePath, 'Set CHROME_PATH to a local Chrome/Chromium executable.');
assert.equal(typeof WebSocket, 'function', 'Run these browser checks with Node 22+.');
// Isolated animation fixture only; production content always comes from NestJS.
const paths = [{ id: 'motion-path', slug: 'motion-path', title: 'Motion fixture', description: 'Isolated animation test', academy: 'programming', difficulty: 'Beginner', estimatedMinutes: 60, skills: [], prerequisites: [], moduleCount: 1, lessonCount: 1, modules: [{ id: 'motion-module', slug: 'motion-module', title: 'Motion module', order: 0, lessons: [{ id: 'motion-lesson', slug: 'motion-lesson', title: 'Motion lesson', order: 0 }] }] }];
const counts = [0, 1, 2, 4, 0, 3, 1];
const dashboard = {
  xp: 50,
  level: 1,
  streak: 1,
  weeklyStreak: 1,
  completedModules: 0,
  overallProgress: 25,
  achievements: [],
  certificates: [],
  activity: counts.map((count, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, '0')}`,
    count,
  })),
  enrollments: [
    {
      id: 'motion-test-enrollment',
      path: paths[0],
      progress: 25,
      completedLessonIds: [],
      next: {
        moduleSlug: paths[0].modules[0].slug,
        sectionSlug: paths[0].modules[0].lessons[0].slug,
      },
    },
  ],
};
const fixture = `
  import React, { useState } from 'react';
  import { createRoot } from 'react-dom/client';
  import { BrowserRouter, useNavigate } from 'react-router-dom';
  import { Reveal, RouteTransition } from '/src/components/motion.tsx';
  import { ProgressBar } from '/src/components/academy/shared.tsx';
  import '/src/lib/i18n.ts';
  import '/src/index.css';
  import '/src/styles/legacy-base.css';
  const h = React.createElement;
  function Probe() {
    const [value, setValue] = useState(25);
    const navigate = useNavigate();
    window.setProgress = setValue;
    return h(React.Fragment, null,
      h('input', { id: 'state', defaultValue: 'keep me', 'aria-label': 'State probe' }),
      h('button', { id: 'navigate', onClick: () => navigate('/__motion-next') }, 'Navigate'),
      h(ProgressBar, { value }),
      h(Reveal, null, h('div', { style: { height: 12000 }, id: 'tall' }, 'Tall content')),
      h(Reveal, { delay: 999 }, h('button', { id: 'offscreen' }, 'Offscreen control'))
    );
  }
  const app = createRoot(document.getElementById('root'));
  window.unmountProbe = () => app.unmount();
  app.render(h(React.StrictMode, null, h(BrowserRouter, null, h(RouteTransition, null, h(Probe)))));
`;

const profile = mkdtempSync(join(tmpdir(), 'codekita-motion-chrome-'));
let server, production, chrome, socket;
const pending = new Map();
const exceptions = [];
let nextId = 0;
let passed = 0;

async function until(probe, message, timeout = 20000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeout) {
    try {
      const result = await probe();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await delay(80);
  }
  throw new Error(`Timed out: ${message}${lastError ? ` (${lastError.message})` : ''}`);
}

function send(method, params = {}) {
  return new Promise((resolveCommand, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 20000);
    pending.set(id, { resolve: resolveCommand, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}

const wait = expression => until(() => evaluate(expression), expression);
async function check(name, expression) {
  assert.equal(await evaluate(expression), true, name);
  console.log(`PASS ${++passed}: ${name}`);
}
async function go(base, pathname, selector) {
  await send('Page.navigate', { url: base + pathname });
  await wait(
    `location.href === ${JSON.stringify(base + pathname)} && document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(selector)})`
  );
}
async function viewport(width, height, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}
async function reduced(value) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  });
}

try {
  server = await createServer({
    root,
    mode: 'test',
    define: { __CODEKITA_API_BASE__: JSON.stringify('/api') },
    server: { host: '127.0.0.1', port: 0, strictPort: false, open: false },
    plugins: [
      {
        name: 'isolated-motion-checks',
        resolveId(id) {
          if (id === '/__motion-fixture.js') return '\0motion-fixture.js';
        },
        load(id) {
          if (id === '\0motion-fixture.js') return fixture;
        },
        configureServer(vite) {
          vite.middlewares.use(async (request, response, next) => {
            const pathname = request.url?.split('?')[0];
            if (pathname === '/__motion-check') {
              try {
                const html = await vite.transformIndexHtml(
                  pathname,
                  '<html><head></head><body><div id="root"></div><script type="module" src="/__motion-fixture.js"></script></body></html>'
                );
                response.setHeader('Content-Type', 'text/html');
                response.end(html);
              } catch (error) {
                next(error);
              }
              return;
            }
            if (!pathname?.startsWith('/api/')) return next();
            let body;
            if (pathname === '/api/auth/me')
              body = {
                user: {
                  userId: 'motion-test',
                  email: 'motion@example.invalid',
                  roles: ['STUDENT'],
                },
              };
            else if (pathname === '/api/paths') body = paths;
            else if (pathname.startsWith('/api/paths/'))
              body = paths.find(item => pathname === `/api/paths/${item.slug}`);
            else if (pathname === '/api/learning/dashboard') body = dashboard;
            response.statusCode = body ? 200 : 404;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(body ?? { message: 'No test fixture for this endpoint' }));
          });
        },
      },
    ],
  });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  let launchError;
  chrome.on('error', error => {
    launchError = error;
  });
  const port = await until(() => {
    if (launchError) throw launchError;
    const filename = join(profile, 'DevToolsActivePort');
    return existsSync(filename) && readFileSync(filename, 'utf8').split('\n')[0];
  }, 'Chrome debugging port');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown')
      exceptions.push(
        message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text
      );
    const command = pending.get(message.id);
    if (!command) return;
    clearTimeout(command.timer);
    pending.delete(message.id);
    if (message.error) command.reject(new Error(message.error.message));
    else command.resolve(message.result);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    localStorage.setItem('i18nextLng', 'en');
    window.motionObservers = new Set();
    const Original = window.IntersectionObserver;
    window.IntersectionObserver = class extends Original {
      observe(target) { window.motionObservers.add(this); return super.observe(target); }
      disconnect() { window.motionObservers.delete(this); return super.disconnect(); }
    };
  `,
  });
  await viewport(1440, 900);
  await reduced('no-preference');
  await go(base, '/__motion-check', '#offscreen');
  await wait(`document.querySelector('#tall').parentElement.classList.contains('motion-visible')`);
  await check(
    'very tall content reveals on first intersection',
    `document.querySelector('#tall').parentElement.classList.contains('motion-visible')`
  );
  await check(
    'offscreen content waits and delay is capped at 240ms',
    `document.querySelector('#offscreen').parentElement.classList.contains('motion-pending') && document.querySelector('#offscreen').parentElement.style.getPropertyValue('--reveal-delay') === '240ms'`
  );
  await evaluate(`document.querySelector('#offscreen').focus({preventScroll: true})`);
  console.log('Focus diagnostic', await evaluate(`(() => {const button = document.querySelector('#offscreen'); const node = button.parentElement; const style = getComputedStyle(node); return {active: document.activeElement.id, focused: document.hasFocus(), classes: node.className, focusWithin: node.matches(':focus-within'), opacity: style.opacity, transition: style.transition, styles: document.styleSheets.length};})()`));
  await check(
    'keyboard focus exposes offscreen content immediately',
    `getComputedStyle(document.querySelector('#offscreen').parentElement).opacity === '1' && !document.querySelector('#offscreen').parentElement.classList.contains('motion-pending')`
  );
  await evaluate(
    `document.querySelector('#state').value = 'preserved'; window.oldState = document.querySelector('#state'); document.querySelector('#navigate').click()`
  );
  await wait(`location.pathname === '/__motion-next'`);
  await check(
    'pathname transitions preserve child DOM and input state',
    `window.oldState === document.querySelector('#state') && document.querySelector('#state').value === 'preserved'`
  );
  await wait(`document.querySelector('.route-transition').getAnimations().length === 0`);
  await check(
    'finished route transition leaves no persistent transform',
    `getComputedStyle(document.querySelector('.route-transition')).transform === 'none'`
  );
  for (const [value, expected] of [
    ['0', 0],
    ['55', 55],
    ['100', 100],
    ['-20', 0],
    ['200', 100],
    ['NaN', 0],
  ]) {
    await evaluate(`window.setProgress(${value})`);
    await wait(
      `document.querySelector('[role=progressbar]').getAttribute('aria-valuenow') === '${expected}' && Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.progress-indicator')).transform).a - ${expected / 100}) < 0.001`
    );
  }
  await check(
    'progress values are clamped, accessible, and scaled correctly',
    `document.querySelector('[role=progressbar]').getAttribute('aria-valuenow') === '0'`
  );
  await evaluate('window.unmountProbe()');
  await check('unmount disconnects reveal observers', 'window.motionObservers.size === 0');

  for (const mode of ['os', 'app']) {
    await reduced('no-preference');
    await go(base, '/__motion-check', '#offscreen');
    await wait(
      `document.querySelector('#offscreen').parentElement.classList.contains('motion-pending')`
    );
    if (mode === 'os') await reduced('reduce');
    else await evaluate(`document.documentElement.dataset.reducedMotion = 'true'`);
    await wait(
      `document.querySelectorAll('.motion-pending').length === 0 && window.motionObservers.size === 0`
    );
    await evaluate(`document.querySelector('#navigate').click()`);
    await wait(`location.pathname === '/__motion-next'`);
    await check(
      `${mode} reduced motion reveals pending content and skips route animation`,
      `document.querySelector('.route-transition').getAnimations().length === 0 && getComputedStyle(document.querySelector('#offscreen').parentElement).opacity === '1'`
    );
  }

  await reduced('no-preference');
  const fallback = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'delete window.IntersectionObserver; Element.prototype.animate = undefined;',
  });
  await go(base, '/__motion-check', '#offscreen');
  await check(
    'content remains visible without motion browser APIs',
    `document.querySelectorAll('.motion-pending').length === 0 && getComputedStyle(document.querySelector('#offscreen').parentElement).opacity === '1'`
  );
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fallback.identifier });

  await go(base, '/dashboard', '[title$="completions"]');
  await check(
    'dashboard graph shows zero as zero and preserves proportions',
    `(() => {
    const bars = [...document.querySelectorAll('[title$="completions"]')];
    return bars.length === 7 && bars.every((bar, i) => Math.abs(bar.getBoundingClientRect().height / bar.parentElement.getBoundingClientRect().height - ${JSON.stringify(counts)}[i] / 4) < 0.015 && getComputedStyle(bar).animationName === 'none');
  })()`
  );
  await wait(`document.querySelector('[role=progressbar]').getAttribute('aria-valuenow') === '25'`);
  await check(
    'dashboard enrollment progress is not reset by reveals',
    `Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.progress-indicator')).transform).a - .25) < .001`
  );
  dashboard.activity = dashboard.activity.map(day => ({ ...day, count: 0 }));
  await go(base, '/dashboard?zero', '[title$="completions"]');
  await check(
    'all-zero activity stays empty without invalid heights',
    `[...document.querySelectorAll('[title$="completions"]')].every(bar => bar.style.height === '0%' && bar.getBoundingClientRect().height === 0)`
  );

  await go(base, `/paths/${paths[0].slug}`, 'aside');
  await wait(`document.querySelector('aside').parentElement.classList.contains('motion-visible')`);
  await evaluate(`window.scrollTo({top: 350, behavior: 'instant'})`);
  await wait(
    `Math.abs(document.querySelector('aside').parentElement.getBoundingClientRect().top - 112) < 2`
  );
  await check(
    'desktop path sidebar remains sticky after reveal',
    `getComputedStyle(document.querySelector('aside').parentElement).position === 'sticky'`
  );
  await go(base, '/paths', 'input');
  await evaluate(
    `window.searchInput = document.querySelector('input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(window.searchInput, 'program'); window.searchInput.dispatchEvent(new Event('input', {bubbles: true}));`
  );
  await wait(`location.search.includes('q=program')`);
  await check(
    'catalogue query updates retain the search control',
    `window.searchInput === document.querySelector('input') && document.querySelector('input').value === 'program'`
  );
  await go(base, '/academy', '.motion-card');
  await wait(`document.querySelectorAll('.motion-pending').length === 0`);
  await evaluate(
    `document.querySelector('.motion-card').scrollIntoView({block:'center',behavior:'instant'})`
  );
  const point = await evaluate(
    `(() => {const r = document.querySelector('.motion-card').getBoundingClientRect(); return {x:r.x+20, y:r.y+20};})()`
  );
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await wait(`getComputedStyle(document.querySelector('.motion-card')).transform !== 'none'`);
  await check(
    'desktop card hover provides motion feedback',
    `getComputedStyle(document.querySelector('.motion-card')).transform !== 'none'`
  );
  for (const mode of ['os', 'app']) {
    if (mode === 'os') await reduced('reduce');
    else {
      await reduced('no-preference');
      await evaluate(`document.documentElement.dataset.reducedMotion = 'true'`);
    }
    await wait(`getComputedStyle(document.querySelector('.motion-card')).transform === 'none'`);
    await check(
      `${mode} preference suppresses card and image hover transforms`,
      `getComputedStyle(document.querySelector('.motion-card img')).transform === 'none'`
    );
  }
  await evaluate(`document.documentElement.dataset.reducedMotion = 'false'`);
  await reduced('no-preference');
  await viewport(390, 844, true);
  await go(base, '/academy', '.motion-card');
  await check(
    'touch viewport has no hover transform or horizontal overflow',
    `!matchMedia('(hover: hover) and (pointer: fine)').matches && getComputedStyle(document.querySelector('.motion-card')).transform === 'none' && document.documentElement.scrollWidth <= innerWidth`
  );
  await evaluate(`document.querySelector('header button[aria-haspopup="dialog"]').click()`);
  await wait(`!!document.querySelector('[role=dialog]')`);
  await evaluate(`document.querySelector('[role=dialog] a[href="/paths"]').click()`);
  await wait(`location.pathname === '/paths' && !document.querySelector('[role=dialog]')`);
  await check('mobile menu still navigates and closes', `!!document.querySelector('input')`);

  production = await preview({
    root,
    preview: { host: '127.0.0.1', port: 0, strictPort: false, open: false },
  });
  const release = `http://127.0.0.1:${production.httpServer.address().port}`;
  await viewport(1440, 900);
  await go(release, '/', '.terminal-cursor');
  await check(
    'production hero has a bounded decorative caret only',
    `getComputedStyle(document.querySelector('.terminal-cursor'), '::after').animationIterationCount === '3' && document.querySelector('.terminal-cursor').getAttribute('aria-hidden') === 'true' && !document.querySelector('.hero-workspace, .status-live')`
  );
  await check(
    'main content remains a growing flex child',
    `getComputedStyle(document.querySelector('main')).flexGrow === '1' && getComputedStyle(document.querySelector('main').parentElement).display === 'flex'`
  );
  await evaluate(`localStorage.setItem('ck-reduced-motion', 'true')`);
  await go(release, '/?reduced', '.terminal-cursor');
  await wait(`document.documentElement.dataset.reducedMotion === 'true'`);
  await check(
    'stored app preference disables caret and route animations',
    `getComputedStyle(document.querySelector('.terminal-cursor'), '::after').animationName === 'none' && document.querySelector('.route-transition').getAnimations().length === 0 && !document.querySelector('.motion-pending')`
  );
  for (const [pathname, selector] of [
    ['/academy', '.motion-card'],
    ['/paths', 'article'],
    [`/paths/${paths[0].slug}`, 'aside'],
    ['/dashboard', '[role=status]'],
  ]) {
    await go(release, pathname, selector);
    await check(
      `production route ${pathname} renders`,
      `!!document.querySelector('main') && document.documentElement.scrollWidth <= innerWidth`
    );
  }
  assert.deepEqual(exceptions, [], 'No uncaught browser exceptions');
  console.log(
    `PASS: ${passed} motion/browser checks; no uncaught browser exceptions. Dashboard API responses were isolated test fixtures.`
  );
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    await send('Browser.close').catch(() => {});
    socket.close();
  }
  for (const command of pending.values()) clearTimeout(command.timer);
  if (chrome && chrome.exitCode === null) {
    await Promise.race([new Promise(done => chrome.once('exit', done)), delay(3000)]);
    if (chrome.exitCode === null) chrome.kill();
  }
  if (server) await server.close();
  if (production) await new Promise(done => production.httpServer.close(done));
  // Only remove the isolated temporary profile created by this process.
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
  } catch {
    console.warn(`Chrome profile could not be cleaned up: ${profile}`);
  }
}
