import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@codekita/shared": path.resolve(__dirname, "packages/shared/src/index.ts"), "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/**/*.test.tsx", "jsdom"]],
    include: ["src/**/*.test.{ts,tsx}", "packages/shared/src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});