import { describe, expect, it } from "vitest";
import { cookies, csrfToken, validCsrf } from "./security";
describe("Session cookie and signed CSRF boundaries", () => {
  it("parses cookies without trusting object prototype properties", () => { expect(cookies("session=hello%20world; __proto__=invalid").session).toBe("hello world"); expect(Object.getPrototypeOf(cookies("__proto__=invalid"))).toBe(null); });
  it("ignores malformed cookies", () => { expect(cookies("bad=%XX; good=yes").good).toBe("yes"); expect(cookies("bad=%XX").bad).toBeUndefined(); });
  it("rejects missing CSRF tokens", () => { expect(validCsrf(undefined, undefined, "test-secret")).toBe(false); });
  it("accepts matching signed tokens", () => { const token = csrfToken("test-secret"); expect(validCsrf(token, token, "test-secret")).toBe(true); });
  it("rejects a forged double-submit pair", () => { const token = "a".repeat(64) + "." + "b".repeat(64); expect(validCsrf(token, token, "test-secret")).toBe(false); });
  it("rejects a token signed by another server secret", () => { const token = csrfToken("another-secret"); expect(validCsrf(token, token, "test-secret")).toBe(false); });
  it("rejects differing header and cookie tokens", () => { expect(validCsrf(csrfToken("test-secret"), csrfToken("test-secret"), "test-secret")).toBe(false); });
});