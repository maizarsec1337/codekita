import { spawn } from "node:child_process";
import { delimiter, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
// pnpm keeps runtime packages under the backend workspace, not root/node_modules.
const child = spawn(process.execPath, [resolve(root, "dist/server/main.js")], {
  cwd: root, stdio: "inherit",
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? "production", NODE_PATH: [resolve(root, "backend/node_modules"), process.env.NODE_PATH].filter(Boolean).join(delimiter) },
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));