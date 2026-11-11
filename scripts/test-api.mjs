// Opt-in live integration test. Uses unique temporary records and deletes only
// those records in finally. Never runs migrations, resets, or edits real users.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';
import { PrismaClient } from '@prisma/client';
if (process.env.CODEKITA_LIVE_TESTS !== '1') throw new Error('Set CODEKITA_LIVE_TESTS=1 to allow temporary integration-test records in the configured database.');
for (const file of ['.env.local', '.env']) if (existsSync(file)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) process.env[key] ??= value;
}
const socket = createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const origin = 'http://127.0.0.1:5199';
const prisma = new PrismaClient();
const suffix = randomUUID();
const email = `migration-${suffix}@example.invalid`;
const password = randomBytes(24).toString('base64url');
const jar = new Map();
const records = { users: [], courses: [], categories: [] };
const checks = [];
const diagnostics = [];
writeFileSync('live-test-failure.log', 'No failure recorded for the current run.');
const checkpoint = () => writeFileSync('live-test-state.log', JSON.stringify({ pid: process.pid, serverPid: server?.pid, port, records, checks }, null, 2));
let server;
async function start() {
  server = spawn(process.execPath, ['.server-build/server.js'], { env: { ...process.env, NODE_ENV: 'test', PORT: String(port), CORS_ORIGIN: origin, COOKIE_SECURE: 'false', COOKIE_SAME_SITE: 'lax', ENABLE_SWAGGER: 'false' }, stdio: ['ignore', 'pipe', 'ignore'] });
  createInterface({ input: server.stdout }).on('line', line => {
    try {
      const entry = JSON.parse(line);
      if (entry.context === 'AllExceptionsFilter') {
        diagnostics.push({ status: entry.status, path: entry.path, diagnostic: entry.diagnostic });
        writeFileSync('live-test-diagnostics.log', JSON.stringify(diagnostics, null, 2));
      }
    } catch { /* Ignore non-JSON startup output; never persist raw server logs. */ }
  });
  checkpoint();
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error('Test backend exited before readiness');
    try { const res = await fetch(base + '/api/health', { signal: AbortSignal.timeout(1500) }); if (res.ok && (await res.json()).services.database === 'connected') return; } catch { /* wait for startup */ }
    await delay(250);
  }
  throw new Error('Test backend did not become ready');
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise(resolve => server.once('exit', resolve));
  server.kill(); await exited;
}
async function request(path, method = 'GET', body, expected = 200, options = {}) {
  let token;
  if (method !== 'GET' && !options.noCsrf) token = (await request('/auth/csrf-token')).token;
  const headers = { Accept: 'application/json', Origin: options.origin ?? origin, Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['X-CSRF-TOKEN'] = token;
  const res = await fetch(base + '/api' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(45000) });
  for (const cookie of res.headers.getSetCookie()) { const pair = cookie.split(';')[0]; const at = pair.indexOf('='); jar.set(pair.slice(0, at), pair.slice(at + 1)); }
  assert.equal(res.status, expected, `${method} ${path}: unexpected HTTP status`);
  const data = await res.json();
  if (options.cookieCheck) assert.ok(res.headers.getSetCookie().some(cookie => /HttpOnly/i.test(cookie) && cookie.startsWith('codekita_session=')), 'Session must be HttpOnly');
  return data;
}
try {
  await start();
  await request('/admin/paths', 'GET', undefined, 401);
  await request('/auth/register', 'POST', { email, password }, 403, { noCsrf: true });
  await request('/auth/register', 'POST', { email, password }, 403, { origin: 'https://untrusted.invalid' });
  checks.push('anonymous admin access and CSRF/origin rejection');
  const registered = await request('/auth/register', 'POST', { email, password }, 201, { cookieCheck: true });
  records.users.push(registered.user.userId);
  checkpoint();
  assert.deepEqual(registered.user.roles, ['STUDENT']);
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: registered.user.userId }, include: { sessions: true } });
  assert.match(stored.passwordHash, /^\$argon2id\$/);
  assert.ok(stored.sessions.every(session => session.token !== jar.get('codekita_session')));
  await request('/admin/paths', 'GET', undefined, 403);
  checks.push('registration, Argon2id, hashed session, student RBAC');
  await request('/profile', 'PATCH', { firstName: 'Integration', lastName: 'Check', displayName: 'Persistence check', bio: 'Temporary test profile' });
  assert.equal((await request('/profile')).displayName, 'Persistence check');
  await request('/auth/logout', 'POST', {}, 201);
  await request('/auth/me', 'GET', undefined, 401);
  await request('/auth/login', 'POST', { email, password: password + 'wrong' }, 401);
  await request('/auth/login', 'POST', { email, password }, 201);
  checks.push('profile CRUD, logout revocation, incorrect and correct password');
  const admin = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  await prisma.userRole.create({ data: { userId: stored.id, roleId: admin.id } });
  const category = await request('/admin/categories', 'POST', { name: 'Integration category', slug: 'integration-' + suffix, description: 'Temporary category', isActive: true }, 201);
  records.categories.push(category.id);
  checkpoint();
  await request('/admin/categories/' + category.id, 'PATCH', { name: 'Updated category', slug: category.slug, description: 'Updated', isActive: true });
  const input = { title: 'Integration curriculum', slug: 'integration-' + suffix, description: 'Temporary end-to-end curriculum verification', academy: 'programming', difficulty: 'Beginner', estimatedMinutes: 10, skills: ['Testing'], prerequisites: [], isPublished: true, categoryId: category.id, modules: [{ title: 'Integration module', slug: 'module-' + suffix, lessons: [{ title: 'Integration lesson', slug: 'first-section', content: '## Integration\n\nThis temporary lesson validates permanent storage.', objectives: ['Verify database writes'], assessment: { question: 'Which answer passes this integration check?', options: ['Correct', 'Incorrect'], correctIndex: 0 } }] }] };
  const course = await request('/admin/paths', 'POST', input, 201);
  records.courses.push(course.id);
  checkpoint();
  const saved = (await request('/admin/paths')).find(item => item.id === course.id);
  input.modules[0].id = saved.modules[0].id;
  input.modules[0].lessons[0].id = saved.modules[0].lessons[0].id;
  input.title = 'Updated integration curriculum';
  await request('/admin/paths/' + course.id, 'PATCH', input);
  assert.equal((await request('/paths/' + course.slug)).title, input.title);
  await request('/paths/' + course.slug + '/enroll', 'POST', {}, 201);
  const lesson = '/learn/' + input.modules[0].slug + '/first-section';
  await request(lesson, 'PATCH', { notes: 'Persist through server restart', bookmarked: true });
  await request(lesson + '/complete', 'POST', { answer: 1 }, 400);
  assert.equal(await prisma.quizResult.count({ where: { userId: stored.id, passed: false } }), 1);
  await request(lesson + '/complete', 'POST', { answer: 0 }, 201);
  const repeated = await request(lesson + '/complete', 'POST', { answer: 0 }, 201);
  assert.equal(repeated.xpAwarded, 0);
  const dashboard = await request('/learning/dashboard');
  assert.equal(dashboard.enrollments.find(item => item.path.id === course.id).progress, 100);
  assert.equal(dashboard.certificates.length, 1);
  checks.push('category/course/module/lesson CRUD, enrollment, failed and passed quiz results, idempotent XP, certificate');
  await stop(); await start();
  assert.equal((await request(lesson)).notes, 'Persist through server restart');
  assert.equal((await request('/profile')).displayName, 'Persistence check');
  assert.equal((await request('/learning/dashboard')).certificates.length, 1);
  checks.push('database persistence after backend restart and fresh HTTP reads');
  const instructor = await prisma.role.findUniqueOrThrow({ where: { name: 'INSTRUCTOR' } });
  await prisma.userRole.deleteMany({ where: { userId: stored.id } });
  await prisma.userRole.create({ data: { userId: stored.id, roleId: instructor.id } });
  const own = await request('/admin/paths'); assert.ok(own.some(item => item.id === course.id));
  const other = await prisma.course.findFirst({ where: { id: { not: course.id } } });
  if (other) await request('/admin/paths/' + other.id, 'PATCH', { ...input, slug: other.slug }, 403);
  await request('/admin/users', 'GET', undefined, 403);
  checks.push('instructor ownership isolation and users-admin denial');
  await prisma.userRole.create({ data: { userId: stored.id, roleId: admin.id } });
  await request('/admin/users/' + stored.id, 'PATCH', { isActive: false, roles: ['STUDENT'] }, 400);
  await request('/admin/paths/' + course.id, 'DELETE');
  await request('/paths/' + course.slug, 'GET', undefined, 404);
  assert.equal(await prisma.enrollment.count({ where: { courseId: course.id } }), 1);
  await request('/admin/categories/' + category.id, 'DELETE');
  checks.push('safe archive preserves learning history; self-admin changes denied');
  if (process.env.CODEKITA_BROWSER_TESTS === '1') {
    checkpoint();
    const { browserPersistence } = await import('./test-browser.mjs');
    await browserPersistence({ base, origin, email, password, userId: stored.id, prisma });
    checks.push('real browser login, profile form mutation, reload and independent PostgreSQL read');
  }
  console.log(`PASS: ${checks.length} live API/integration groups`);
  checkpoint();
} catch (error) {
  // Assertions contain only route/status diagnostics, never credentials or rows.
  writeFileSync('live-test-failure.log', String(error?.message ?? 'Integration failed').replaceAll(password, '[REDACTED]').replaceAll(email, '[TEST_EMAIL]'));
  process.exitCode = 1;
} finally {
  await stop();
  try {
    await prisma.quizResult.deleteMany({ where: { userId: { in: records.users } } });
    await prisma.user.deleteMany({ where: { id: { in: records.users } } });
    await prisma.course.deleteMany({ where: { id: { in: records.courses } } });
    await prisma.category.deleteMany({ where: { id: { in: records.categories } } });
    checks.push('temporary test records removed by exact IDs');
  } catch { checks.push('WARNING: temporary test record cleanup failed'); process.exitCode = 1; }
  checkpoint();
  await prisma.$disconnect();
  writeFileSync('live-test-results.log', JSON.stringify({ success: !process.exitCode, checks }, null, 2));
}