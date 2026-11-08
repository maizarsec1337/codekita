import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@codekita/shared": path.resolve(projectRoot, "./packages/shared/src/index.ts"),
      "@": path.resolve(projectRoot, "./src"),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-i18n": ["i18next", "i18next-browser-languagedetector", "react-i18next"],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: mode === "static" ? undefined : {
      "/api": {
        target: `http://127.0.0.1:${process.env.PORT ?? loadEnv(mode, projectRoot, "").PORT ?? "3000"}`,
        changeOrigin: true,
      },
    },
  },
}));