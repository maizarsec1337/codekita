import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    alias: {
      "@codekita/shared": path.resolve(__dirname, "../packages/shared/src/index.ts"),
      "@prisma/client": path.resolve(__dirname, "node_modules/@prisma/client"),
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
    pool: "forks",
  },
});