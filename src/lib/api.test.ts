import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("Frontend API transport (mock HTTP, no database writes)", () => {
  it.each(["login", "register"] as const)("connects %s to the API with cookies and CSRF", async (action) => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: "synthetic-csrf-token" }))
      .mockResolvedValueOnce(Response.json({ user: { userId: "fixture-user" } }));
    vi.stubGlobal("fetch", fetch);
    await api.auth[action]("fixture@example.test", "fixture-password");
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/auth/csrf-token", { credentials: "include" });
    expect(fetch.mock.calls[1][0]).toBe(`/api/auth/${action}`);
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: "POST", credentials: "include" });
    expect(fetch.mock.calls[1][1].headers.get("X-CSRF-TOKEN")).toBe("synthetic-csrf-token");
  });
  it("stops before login when CSRF initialization fails", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    await expect(api.auth.login("fixture@example.test", "fixture-password")).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("propagates an unauthenticated API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ statusCode: 401, message: "Missing session cookie", error: "Unauthorized", timestamp: new Date().toISOString() }, { status: 401 })));
    await expect(api.auth.me()).rejects.toMatchObject({ statusCode: 401, message: "Missing session cookie" });
  });
  it("handles non-JSON failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("upstream unavailable", { status: 502, statusText: "Bad Gateway" })));
    await expect(api.auth.me()).rejects.toMatchObject({ statusCode: 502, message: "Bad Gateway" });
  });
  it("handles JSON that does not match the API error contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ unexpected: true }, { status: 503 })));
    await expect(api.auth.me()).rejects.toMatchObject({ statusCode: 503, message: "API error 503" });
  });
});