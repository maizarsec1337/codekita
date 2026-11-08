import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ensureLocalSessionSecret } from "./ensure-environment.mjs";

async function temporaryProject(run) {
  const root = await mkdtemp(join(tmpdir(), "codekita-environment-"));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("generates a secure local secret without modifying the existing .env", async () => {
  await temporaryProject(async (root) => {
    const existing = "DATABASE_URL=postgresql://localhost/codekita\nDIRECT_URL=postgresql://localhost/codekita\n";
    await writeFile(join(root, ".env"), existing);
    const environment = {};

    const result = await ensureLocalSessionSecret({ root, environment });

    assert.equal(result.generated, true);
    assert.match(environment.SESSION_SECRET, /^[A-Za-z0-9_-]{64}$/);
    assert.equal(await readFile(join(root, ".env"), "utf8"), existing);
    assert.match(await readFile(join(root, ".env.local"), "utf8"), new RegExp(`SESSION_SECRET=${environment.SESSION_SECRET}`));
  });
});

test("respects an existing file secret and does not create .env.local", async () => {
  await temporaryProject(async (root) => {
    await writeFile(join(root, ".env"), "SESSION_SECRET=existing-file-secret-value\n");
    const environment = {};

    const result = await ensureLocalSessionSecret({ root, environment });

    assert.equal(result.generated, false);
    await assert.rejects(readFile(join(root, ".env.local"), "utf8"), { code: "ENOENT" });
  });
});

test("replaces only an empty local assignment and preserves other variables", async () => {
  await temporaryProject(async (root) => {
    const localPath = join(root, ".env.local");
    await writeFile(localPath, "PORT=4321\r\nSESSION_SECRET= # keep this comment\r\nCORS_ORIGIN=http://localhost:5173\r\n");
    await writeFile(join(root, ".env"), "SESSION_SECRET=lower-priority-secret-value\n");
    const environment = {};

    const result = await ensureLocalSessionSecret({ root, environment });
    const updated = await readFile(localPath, "utf8");

    assert.equal(result.generated, true);
    assert.match(updated, /^PORT=4321\r\n/);
    assert.match(updated, /SESSION_SECRET=\s*[A-Za-z0-9_-]{64} # keep this comment\r\n/);
    assert.match(updated, /CORS_ORIGIN=http:\/\/localhost:5173\r\n$/);
  });
});

test("keeps an explicitly configured process secret authoritative", async () => {
  await temporaryProject(async (root) => {
    const environment = { SESSION_SECRET: "runtime-session-secret-value", PRESERVED: "yes" };

    const result = await ensureLocalSessionSecret({ root, environment });

    assert.equal(result.generated, false);
    assert.equal(environment.SESSION_SECRET, "runtime-session-secret-value");
    assert.equal(environment.PRESERVED, "yes");
  });
});

test("removes an empty process override so an existing file value can load", async () => {
  await temporaryProject(async (root) => {
    await writeFile(join(root, ".env"), "SESSION_SECRET=existing-file-secret-value\n");
    const environment = { SESSION_SECRET: "", PRESERVED: "yes" };

    const result = await ensureLocalSessionSecret({ root, environment });

    assert.equal(result.generated, false);
    assert.equal("SESSION_SECRET" in environment, false);
    assert.equal(environment.PRESERVED, "yes");
  });
});

test("removes a whitespace-only process override", async () => {
  await temporaryProject(async (root) => {
    await writeFile(join(root, ".env"), "SESSION_SECRET=existing-file-secret-value\n");
    const environment = { SESSION_SECRET: "   ", PRESERVED: "yes" };

    const result = await ensureLocalSessionSecret({ root, environment });

    assert.equal(result.generated, false);
    assert.equal("SESSION_SECRET" in environment, false);
    assert.equal(environment.PRESERVED, "yes");
  });
});