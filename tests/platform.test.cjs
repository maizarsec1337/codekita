const test = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Reflector } = require('@nestjs/core');
const { ConfigService } = require('@nestjs/config');
const { cookies, csrfToken, validCsrf } = require('../.server-build/runtime/src/server/common/security.js');
const { validateEnvironment } = require('../.server-build/runtime/src/server/config/configuration.js');
const { RolesGuard } = require('../.server-build/runtime/src/server/common/guards/roles.guard.js');
const { AuthGuard } = require('../.server-build/runtime/src/server/common/guards/auth.guard.js');
const { AuthService } = require('../.server-build/runtime/src/server/modules/auth/auth.service.js');
const { categoryInputSchema, profileInputSchema, userUpdateSchema } = require('../.server-build/runtime/packages/shared/src/index.js');
const context = (handler, user, headers = {}) => ({ getHandler: () => handler, getClass: () => class Controller {}, switchToHttp: () => ({ getRequest: () => ({ user, headers }) }) });
test('CSRF verifies signature and matching cookie, rejects tampering', () => {
  const secret = 'unit-test-only-not-a-deployment-secret';
  const token = csrfToken(secret);
  assert.equal(validCsrf(token, token, secret), true);
  assert.equal(validCsrf(token, token, 'wrong-secret'), false);
  assert.equal(validCsrf(token, token + '0', secret), false);
  assert.equal(validCsrf(undefined, token, secret), false);
  assert.equal(cookies('a=%ZZ; b=valid').b, 'valid');
});
test('invalid environment does not expose credential values', () => {
  const secret = 'do-not-echo-this-value';
  assert.throws(() => validateEnvironment({ NODE_ENV: secret }), error => error.message.includes('DATABASE_URL') && error.message.includes('SESSION_SECRET') && !error.message.includes(secret));
});
test('RBAC denies student and permits instructor only on declared roles', () => {
  const handler = () => {};
  Reflect.defineMetadata('roles', ['ADMIN', 'INSTRUCTOR'], handler);
  const guard = new RolesGuard(new Reflector());
  assert.throws(() => guard.canActivate(context(handler, { roles: ['STUDENT'] })), /Insufficient role/);
  assert.equal(guard.canActivate(context(handler, { roles: ['INSTRUCTOR'] })), true);
  assert.throws(() => guard.canActivate(context(handler)), /No authenticated user/);
});
test('authentication fails closed without a session', async () => {
  const guard = new AuthGuard(new Reflector(), { validateSession: async () => null }, new ConfigService());
  await assert.rejects(guard.canActivate(context(() => {})), /Missing session/);
});
test('Argon2id hashes and verifies without storing plaintext', async () => {
  const service = new AuthService({}, new ConfigService());
  const hash = await service.hashPassword('unit-test-password');
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await service.verifyPassword(hash, 'unit-test-password'), true);
  assert.equal(await service.verifyPassword(hash, 'incorrect'), false);
});
test('profile/category input forbids role escalation and invalid category slugs', () => {
  assert.equal(profileInputSchema.safeParse({ firstName: '', lastName: '', displayName: '', bio: '', roles: ['ADMIN'] }).success, false);
  assert.equal(categoryInputSchema.safeParse({ name: 'Test', slug: '../secret', description: '', isActive: true }).success, false);
  assert.equal(userUpdateSchema.safeParse({ isActive: true, roles: ['SUPER_ADMIN'] }).success, false);
});