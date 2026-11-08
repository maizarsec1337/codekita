import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  framework: string; installCommand: string; buildCommand: string; outputDirectory: string;
  rewrites: { source: string; destination: string }[]; functions?: unknown;
};

describe("Static Vercel deployment configuration", () => {
  it("builds only the static frontend without install lifecycle scripts or functions", () => {
    expect(config.framework).toBe("vite");
    expect(config.installCommand).toBe("npm ci --ignore-scripts");
    expect(config.buildCommand).toBe("npm run build:static");
    expect(config.outputDirectory).toBe("dist/frontend-static");
    expect(config.functions).toBeUndefined();
  });
  it("routes SPA paths to the index without capturing assets, API or index itself", () => {
    const [{ source, destination }] = config.rewrites;
    const matches = new RegExp(`^${source}$`);
    for (const path of ["/", "/login", "/dashboard", "/paths/web-development-fundamentals"]) expect(matches.test(path)).toBe(true);
    for (const path of ["/index.html", "/assets/main.js", "/favicon.svg", "/api", "/api/health"]) expect(matches.test(path)).toBe(false);
    expect(destination).toBe("/index.html");
  });
});