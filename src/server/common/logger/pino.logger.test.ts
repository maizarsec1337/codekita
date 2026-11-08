import { beforeEach, describe, expect, it, vi } from "vitest";

const error = vi.hoisted(() => vi.fn());
vi.mock("pino", () => ({ default: vi.fn(() => ({ error })) }));
import { PinoLogger } from "./pino.logger";

beforeEach(() => { error.mockClear(); });

describe("server error logging", () => {
  it("preserves structured diagnostics supplied by the exception filter", () => {
    const message = { context: "AllExceptionsFilter", status: 503, path: "/api/courses", diagnostic: { code: "UNAVAILABLE" } };
    new PinoLogger().error(message);
    expect(error).toHaveBeenCalledWith({ ...message, trace: undefined });
  });

  it("preserves Error serialization and string messages", () => {
    const logger = new PinoLogger();
    const failure = new Error("Example failure");
    logger.error(failure, "trace", "test");
    expect(error).toHaveBeenCalledWith({ err: failure, context: "test", trace: "trace" }, failure.message);
    logger.error("Example message", undefined, "test");
    expect(error).toHaveBeenCalledWith({ context: "test", trace: undefined }, "Example message");
  });
});