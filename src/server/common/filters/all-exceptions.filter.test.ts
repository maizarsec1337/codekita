import type { ArgumentsHost } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AllExceptionsFilter } from "./all-exceptions.filter";

function setup() {
  const reply = { status: vi.fn(), send: vi.fn() };
  reply.status.mockReturnValue(reply);
  const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const host = { switchToHttp: () => ({ getResponse: () => reply, getRequest: () => ({ url: "/api/health?token=sensitive-query" }) }) } as unknown as ArgumentsHost;
  return { reply, logger, host, filter: new AllExceptionsFilter(logger) };
}

describe("Safe API error responses", () => {
  it("does not leak a database error, stack, metadata or query string", () => {
    const { reply, logger, host, filter } = setup();
    filter.catch(new Prisma.PrismaClientInitializationError("sensitive-connection", "6", "P1000"), host);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Internal server error", path: "/api/health" }));
    expect(reply.send.mock.calls[0][0]).not.toHaveProperty("stack");
    const output = JSON.stringify([reply.send.mock.calls, logger.error.mock.calls]);
    expect(output).toContain("P1000");
    expect(output).not.toContain("sensitive-");
  });
  it("preserves validation failures", () => {
    const { reply, logger, host, filter } = setup();
    filter.catch(new BadRequestException("Enter valid credentials"), host);
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Enter valid credentials" }));
    expect(logger.error).not.toHaveBeenCalled();
  });
  it("preserves rate-limit responses", () => {
    const { reply, host, filter } = setup();
    filter.catch({ statusCode: 429 }, host);
    expect(reply.status).toHaveBeenCalledWith(429);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ error: "TooManyRequests" }));
  });
});