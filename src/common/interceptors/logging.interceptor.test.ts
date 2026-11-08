import { describe, expect, it, vi } from "vitest";
import type { ExecutionContext, LoggerService } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";

describe("legacy request logging", () => {
  it("logs the request without shadowing its execution context or changing the response", async () => {
    const logger: LoggerService = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ method: "GET", url: "/example" }) }),
    } as unknown as ExecutionContext;
    const payload = { ok: true };
    const result = await lastValueFrom(new LoggingInterceptor(logger).intercept(context, { handle: () => of(payload) }));
    expect(result).toBe(payload);
    expect(logger.log).toHaveBeenCalledWith(expect.stringMatching(/^GET \/example \d+ms$/));
  });
});