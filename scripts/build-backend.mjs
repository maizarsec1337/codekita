import { spawn } from "node:child_process";
import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, ".server-build");
const runtime = join(output, "runtime");
const shared = join(runtime, "packages", "shared", "src", "index.js");

function run(cli, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, "node_modules", cli), ...args], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${cli} exited with code ${code}`)));
  });
}

async function rewriteAliases(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await rewriteAliases(file);
    else if (entry.name.endsWith(".js")) {
      const source = await readFile(file, "utf8");
      const target = relative(dirname(file), shared).replaceAll("\\", "/");
      const replacement = target.startsWith(".") ? target : `./${target}`;
      const updated = source.replaceAll('require("@codekita/shared")', `require(${JSON.stringify(replacement)})`);
      if (updated !== source) await writeFile(file, updated);
    }
  }
}

// This dedicated compiler output is never the frontend document root.
await rm(output, { recursive: true, force: true });
await mkdir(runtime, { recursive: true });
await run("typescript/bin/tsc", ["-p", "tsconfig.server.json"]);
await rewriteAliases(runtime);
await writeFile(join(output, "server.js"), 'require("./runtime/src/server/main.js");\n');
console.log("Backend compiled to .server-build/server.js. Do not upload this directory to InfinityFree.");

