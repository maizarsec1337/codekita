import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { safeDatabaseError } from "./database-error";

describe("Credential-free database diagnostics", () => {
  it.each(["P1000", "P1001", "P1002", "P1011", "P1013"])("identifies %s without exposing the original error", (code) => {
    const error = new Prisma.PrismaClientInitializationError("sensitive-connection-details", "6", code);
    const diagnostic = safeDatabaseError(error);
    expect(diagnostic.code).toBe(code);
    expect(JSON.stringify(diagnostic)).not.toContain("sensitive-connection-details");
  });
  it("does not expose Prisma metadata", () => {
    const error = new Prisma.PrismaClientKnownRequestError("sensitive-query", { code: "P2024", clientVersion: "6", meta: { secret: "sensitive-metadata" } });
    expect(safeDatabaseError(error)).toEqual({ code: "P2024", message: "Database connection pool timed out" });
  });
  it.each([new Error("sensitive-error"), "sensitive-string", { code: "sensitive-code" }, null])("uses a fixed fallback for unrecognized errors", (error) => {
    expect(safeDatabaseError(error)).toEqual({ code: "DATABASE_ERROR", message: "Database operation failed" });
  });
});