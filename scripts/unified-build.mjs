import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.cwd());
const dist = join(root, "dist");

async function run(command, args, cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(command + " " + args.join(" ") + " exited with code " + code));
    });
    child.on("error", reject);
  });
}

async function main() {
  console.log("=== CodeKita Unified Build ===");

  // Clean dist
  if (existsSync(dist)) {
    try {
      await run("rmdir", ["/s", "/q", dist]);
    } catch {
      try { await run("rm", ["-rf", dist]); } catch {}
    }
  }
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

