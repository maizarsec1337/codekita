import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function frontendRelease(root: string): Plugin {
  const favicon = readFileSync(resolve(root, "src/assets/img/icon.jpg"));
  return {
    name: "codekita-frontend-release",
    configResolved(config) {
      assert.equal(resolve(config.root, config.build.outDir), resolve(root, "dist"), "Frontend output must be dist; --outDir overrides are not supported");
      assert.equal(config.base, "/", "InfinityFree deployment requires base /");
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        for (const module of Object.keys(output.modules)) {
          const normalized = module.replaceAll("\\", "/");
          assert.ok(!/\/src\/server\/|\/schemas\/env\.ts$|\/starter-content\.ts$|\/(?:@nestjs|@prisma)\//.test(normalized), "Server-only module entered the frontend bundle");
        }
      }
      this.emitFile({ type: "asset", fileName: "favicon.jpg", source: favicon });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?")[0];
        if (!["GET", "HEAD"].includes(request.method ?? "") || pathname !== "/favicon.jpg") return next();
        response.setHeader("Content-Type", "image/jpeg");
        response.setHeader("Cache-Control", "no-store");
        response.end(request.method === "HEAD" ? undefined : favicon);
      });
    },
  };
}

export function productionApiUrl(value: string | undefined): string {
  if (!value?.trim() || value.trim() === "/api") return "/api";
  const message = "Production VITE_API_URL must be an HTTPS backend origin (optionally ending /api), or /api behind a Node.js reverse proxy.";
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error(message); }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      !hostname.includes(".") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":") ||
      /(?:^|\.)(?:localhost|local|internal|test|example|invalid)$/.test(hostname) ||
      !["/", "/api", "/api/"].includes(url.pathname)) {
    throw new Error(message);
  }
  return url.origin + "/api";
}