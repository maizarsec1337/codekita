import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@codekita/shared": path.resolve(__dirname, "./packages/shared/src/index.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: { emptyOutDir: false },
  server: {
    port: 5173,
    strictPort: true,
    proxy: mode === "static" ? undefined : {
      "/api": {
        target: `http://127.0.0.1:${process.env.PORT ?? loadEnv(mode, __dirname, "").PORT ?? "3000"}`,
        changeOrigin: true,
      },
    },
  },
}));