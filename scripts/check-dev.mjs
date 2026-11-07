import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const child = spawn(process.execPath, ["scripts/dev.mjs"], {
  env: { ...process.env, PORT: "3231", DATABASE_URL: "postgresql://validation_only@127.0.0.1:1/validation?connect_timeout=1", SESSION_SECRET: "temporary-validation-secret-only", CORS_ORIGIN: "http://localhost:5173", ENABLE_SWAGGER: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
child.stdout.on("data", (chunk) => { logs += chunk; });
child.stderr.on("data", (chunk) => { logs += chunk; });
let passed = false;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Dev process exited: ${child.exitCode}`);
    try {
      const [ui, api] = await Promise.all([fetch("http://localhost:5173/"), fetch("http://localhost:5173/api/health")]);
      if (ui.ok && api.ok && (await api.json()).services.database === "disconnected") { passed = true; break; }
    } catch { /* Wait for both servers. */ }
    await delay(1000);
  }
  if (!passed) throw new Error("Development servers did not become ready");
  console.log("PASS: Vite and API development servers started; test database reported disconnected.");
} catch (error) {
  console.error(error, logs.slice(-5000));
  process.exitCode = 1;
} finally {
  if (process.platform === "win32" && child.pid) {
    const cleanup = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    await new Promise((resolve) => cleanup.once("exit", resolve));
  } else child.kill();
}