import { spawn } from "node:child_process";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLocalSessionSecret } from "./ensure-environment.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const environment = { ...process.env, NODE_ENV: "development" };
const result = await ensureLocalSessionSecret({ root, environment });
if (result.generated) {
  console.log(`[dev] Generated missing SESSION_SECRET in ${basename(result.filePath)} (value hidden).`);
}

const options = { cwd: root, stdio: "inherit", env: environment };
const build = spawn(process.execPath, [join(root, "scripts", "unified-build.mjs")], options);
const buildCode = await new Promise((resolve, reject) => {
  build.once("error", reject);
  build.once("exit", resolve);
});
if (buildCode !== 0) process.exit(buildCode ?? 1);

const children = [
  spawn(process.execPath, [join(root, "dist", "server.js")], options),
  spawn(process.execPath, [join(root, "node_modules", "vite", "bin", "vite.js"), "--port", "5173"], options),
];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const child of children) {
  child.once("error", (error) => { console.error(error); stop(1); });
  child.once("exit", (code) => stop(code ?? 1));
}
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => stop(0));