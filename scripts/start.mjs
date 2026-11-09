import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLocalSessionSecret } from "./ensure-environment.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const serverEntry = resolve(root, ".server-build", "server.js");

if (!existsSync(serverEntry)) {
  console.error("[start] Backend build not found. Run `npm run build:backend` before `npm start` on your Node.js host.");
  process.exit(1);
}

const environment = { ...process.env, NODE_ENV: process.env.NODE_ENV ?? "production" };

try {
  const result = await ensureLocalSessionSecret({ root, environment });
  if (result.generated) {
    console.log(`[start] Generated missing SESSION_SECRET in ${basename(result.filePath)} (value hidden).`);
  }
} catch (error) {
  console.error("[start] Unable to prepare local environment:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const child = spawn(process.execPath, [serverEntry], {
  cwd: root, stdio: "inherit",
  env: environment,
});

let forwardedSignal = null;
child.once("error", (error) => { console.error(error); process.exitCode = 1; });
child.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal && signal === forwardedSignal ? 0 : 1);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    forwardedSignal = signal;
    child.kill(signal);
  });
}