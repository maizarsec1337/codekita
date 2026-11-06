import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.cwd());
const dist = join(root, "dist");

async function run(command, args, cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const cli = command === "pnpm" ? process.env.npm_execpath : undefined;
    const child = cli ? spawn(process.execPath, [cli, ...args], { cwd, stdio: "inherit" }) : spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(command + " " + args.join(" ") + " exited with code " + code));
    });
    child.on("error", reject);
  });
}

async function main() {
  console.log("=== CodeKita Unified Build ===");

  // Each compiler owns its output directory. Never recursively delete the root build tree.
  mkdirSync(dist, { recursive: true });

  // 1. Build shared package
  console.log("\n--- Building shared package ---");
  await run("pnpm", ["--filter", "@codekita/shared", "build"]);

  // 2. Build frontend (outputs to dist/public via vite.config outDir)
  console.log("\n--- Building frontend ---");
  await run("pnpm", ["--filter", "@codekita/frontend", "build"]);

  // 3. Build backend (outputs to dist/server via tsconfig outDir)
  console.log("\n--- Building backend ---");
  await run("pnpm", ["--filter", "@codekita/backend", "build"]);

  console.log("\n=== Build complete ===");
  console.log("Server: " + join(dist, "server"));
  console.log("Public: " + join(dist, "public"));
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

