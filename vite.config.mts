import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { frontendRelease, productionApiUrl } from "./scripts/frontend-release";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode, command, isPreview }) => {
  const env = loadEnv(mode, projectRoot, "VITE_");
  const isProductionBuild = command === "build" || isPreview;
  if (isProductionBuild && Object.keys(env).some(key => key !== "VITE_API_URL")) {
    throw new Error("Only VITE_API_URL is permitted in the public build environment. Never prefix secrets with VITE_.");
  }
  const configuredApi = isProductionBuild ? productionApiUrl(env.VITE_API_URL) : env.VITE_API_URL?.trim();
  const apiBase = configuredApi || (!isProductionBuild && mode !== "static" ? "/api" : "");
  return {
  base: "/",
  plugins: [react(), frontendRelease(projectRoot)],
  define: {
    __CODEKITA_API_BASE__: JSON.stringify(apiBase),
    __CODEKITA_BACKEND_ENABLED__: JSON.stringify(Boolean(apiBase)),
  },
  resolve: {
    alias: {
      "@codekita/shared": path.resolve(projectRoot, "./packages/shared/src/index.ts"),
      "@": path.resolve(projectRoot, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      treeshake: {
        // This module only constructs backend schemas. Its unused re-export must
        // not pull server environment defaults into a browser bundle.
        moduleSideEffects: (id) => path.normalize(id) !== path.resolve(projectRoot, "packages/shared/src/schemas/env.ts"),
      },
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
  };
});