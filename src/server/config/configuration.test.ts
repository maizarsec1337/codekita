import { describe, expect, it } from "vitest";
import { validateEnvironment } from "./configuration";

const fixture = { DATABASE_URL: "postgresql://localhost/unit_test", SESSION_SECRET: "unit-test-only-secret" };

describe("Safe environment configuration", () => {
  it("validates values and preserves the supplied session secret", () => {
    const env = validateEnvironment({ ...fixture, PORT: "3001", ENABLE_SWAGGER: "false" });
    expect(env.PORT).toBe(3001);
    expect(env.ENABLE_SWAGGER).toBe(false);
    expect(env.SESSION_SECRET).toBe(fixture.SESSION_SECRET);
  });
  it("identifies missing configuration without a dummy database", () => {
    expect(() => validateEnvironment({ SESSION_SECRET: fixture.SESSION_SECRET })).toThrow("DATABASE_URL: Required");
  });
  it("does not echo invalid values, including Zod enum input", () => {
    let message = "";
    try {
      validateEnvironment({ ...fixture, NODE_ENV: "sensitive-enum-input", DATABASE_URL: "sensitive-invalid-url", SESSION_SECRET: "short-secret" });
    } catch (error) { message = (error as Error).message; }
    expect(message).toContain("NODE_ENV: Invalid value");
    expect(message).toContain("DATABASE_URL: Invalid value");
    for (const secret of ["sensitive-enum-input", "sensitive-invalid-url", "short-secret"]) expect(message).not.toContain(secret);
  });
});