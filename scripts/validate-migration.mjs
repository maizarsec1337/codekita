import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
for (const name of ['.env.local', '.env']) {
  if (existsSync(new URL('../' + name, import.meta.url))) {
    for (const [key, value] of Object.entries(parseEnv(readFileSync(new URL('../' + name, import.meta.url), 'utf8')))) env[key] ??= value;
  }
}
const secrets = Object.entries(env).filter(([key, value]) => value && /SECRET|PASSWORD|DATABASE_URL|DIRECT_URL|TOKEN|PRIVATE_KEY/i.test(key)).map(([, value]) => value);
const redact = text => secrets.reduce((s, value) => s.split(value).join('[REDACTED]'), String(text)).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[DATABASE_URL REDACTED]');
const tasks = {
  validate: ['node_modules/prisma/build/index.js', 'validate'],
  generate: ['node_modules/prisma/build/index.js', 'generate'],
  backend: ['scripts/build-backend.mjs'],
  frontend: ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--noEmit'],
  status: ['node_modules/prisma/build/index.js', 'migrate', 'status'],
  deploy: ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  seed: ['prisma/seed.mjs'],
  import: ['scripts/import-curriculum.mjs'],
  build: ['scripts/run-npm-build.cjs'],
  tests: ['--test', 'tests/platform.test.cjs'],
  api: ['scripts/test-api.mjs'],
};
const report = [];
for (const key of process.argv.slice(2)) {
  if (!tasks[key]) throw new Error('Unknown validation task');
  const result = spawnSync(process.execPath, tasks[key], { cwd: root, env, encoding: 'utf8', timeout: ['build', 'api'].includes(key) ? 600000 : 180000 });
  report.push({ task: key, exitCode: result.status, timedOut: result.error?.code === 'ETIMEDOUT', output: redact((result.stdout ?? '') + (result.stderr ?? '')) });
  writeFileSync(new URL('../validation-' + process.argv.slice(2).join('-') + '.log', import.meta.url), JSON.stringify(report, null, 2));
}
process.exitCode = report.every(r => r.exitCode === 0) ? 0 : 1;