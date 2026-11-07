import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const child = spawn(process.execPath, [resolve(root, "dist/server.js")], {
  cwd: root, stdio: "inherit",
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? "production" },
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));