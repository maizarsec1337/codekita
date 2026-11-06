import { describe, expect, it } from "vitest";
import { assessmentSchema, pathInputSchema } from "./academy";
import { starterPaths } from "./starter-content";
import { envSchema } from "./schemas/env";
describe("Academy curriculum contracts", () => {
  it("validates all original starter curriculum", () => { for (const path of starterPaths) expect(pathInputSchema.safeParse(path).success).toBe(true); });
  it("rejects out-of-range answer keys", () => { expect(assessmentSchema.safeParse({ question: "A question?", options: ["a", "b"], correctIndex: 2 }).success).toBe(false); });
  it("rejects self prerequisites", () => { expect(pathInputSchema.safeParse({ ...starterPaths[0], prerequisites: [starterPaths[0].slug] }).success).toBe(false); });
  it("rejects duplicate module slugs", () => { expect(pathInputSchema.safeParse({ ...starterPaths[0], modules: [starterPaths[0].modules[0], starterPaths[0].modules[0]] }).success).toBe(false); });
  it("rejects duplicate sections within a module", () => {
    const path = structuredClone(starterPaths[0]); path.modules[0].lessons.push(path.modules[0].lessons[0]); expect(pathInputSchema.safeParse(path).success).toBe(false);
  });
  it("parses false environment strings as false, not truthy booleans", () => {
    const env = envSchema.parse({ DATABASE_URL: "postgresql://localhost/test", SESSION_SECRET: "test-only-secret-value", COOKIE_SECURE: "false", ENABLE_SWAGGER: "false", OIDC_ISSUER_URL: "" });
    expect(env.COOKIE_SECURE).toBe(false); expect(env.ENABLE_SWAGGER).toBe(false);
  });
});