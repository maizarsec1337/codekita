import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { starterPaths } from "../packages/shared/src/starter-content";
import { pathInputSchema } from "../packages/shared/src/academy";
import { publicCatalogueSchema } from "../packages/shared/src/public-catalogue";

export function frontendRelease(root: string): Plugin {
  const published = starterPaths.map(path => pathInputSchema.parse(path)).filter(path => path.isPublished);
  const slugs = new Set(published.map(path => path.slug));
  assert.equal(slugs.size, published.length, "Published path slugs must be unique");
  const moduleSlugs = new Set<string>();
  for (const path of published) {
    for (const prerequisite of path.prerequisites) assert.ok(slugs.has(prerequisite), "Public prerequisite is missing");
    for (const module of path.modules) {
      assert.ok(!moduleSlugs.has(module.slug), "Public lesson URLs require globally unique module slugs");
      moduleSlugs.add(module.slug);
    }
  }
  const catalogue = JSON.stringify(publicCatalogueSchema.parse({
    version: 1,
    source: "repository-starter-curriculum",
    paths: published.map(path => ({
      id: path.slug, slug: path.slug, title: path.title, description: path.description,
      academy: path.academy, difficulty: path.difficulty, estimatedMinutes: path.estimatedMinutes,
      skills: path.skills, prerequisites: path.prerequisites,
      moduleCount: path.modules.length,
      lessonCount: path.modules.reduce((sum, module) => sum + module.lessons.length, 0),
      modules: path.modules.map((module, order) => ({
        id: module.slug, slug: module.slug, title: module.title, order,
        lessons: module.lessons.map((lesson, index) => ({
          id: `${module.slug}/${lesson.slug}`, slug: lesson.slug, title: lesson.title, order: index,
          content: lesson.content, objectives: lesson.objectives,
          assessment: { question: lesson.assessment.question, options: lesson.assessment.options },
        })),
      })),
    })),
  }));
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
      this.emitFile({ type: "asset", fileName: "catalogue.json", source: catalogue });
      this.emitFile({ type: "asset", fileName: "favicon.jpg", source: favicon });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?")[0];
        if (!["GET", "HEAD"].includes(request.method ?? "") || !["/catalogue.json", "/favicon.jpg"].includes(pathname ?? "")) return next();
        response.setHeader("Content-Type", pathname === "/catalogue.json" ? "application/json" : "image/jpeg");
        response.setHeader("Cache-Control", "no-store");
        response.end(request.method === "HEAD" ? undefined : pathname === "/catalogue.json" ? catalogue : favicon);
      });
    },
  };
}

export function productionApiUrl(value: string | undefined): string {
  if (!value?.trim()) return "";
  const message = "VITE_API_URL must be a public HTTPS backend URL (including /api), without credentials, query, or fragment; InfinityFree cannot host /api.";
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error(message); }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      !hostname.includes(".") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":") ||
      /(?:^|\.)(?:localhost|local|internal|test|example|invalid)$/.test(hostname) ||
      /^(?:www\.)?codekita\.web\.id$/.test(hostname) || !url.pathname.replace(/\/+$/, "").endsWith("/api")) {
    throw new Error(message);
  }
  return url.href.replace(/\/+$/, "");
}