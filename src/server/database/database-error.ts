import { Prisma } from "@prisma/client";

const diagnostics: Record<string, string> = {
  P1000: "Database authentication failed",
  P1001: "Database server could not be reached",
  P1002: "Database connection timed out",
  P1003: "Configured database does not exist",
  P1008: "Database operation timed out",
  P1010: "Database access denied",
  P1011: "Database TLS connection failed",
  P1012: "Database configuration is invalid",
  P1013: "Database connection URL is invalid",
  P1017: "Database connection was closed",
  P2021: "A required database table is missing",
  P2022: "A required database column is missing",
  P2024: "Database connection pool timed out",
  P2037: "Database connection limit exceeded",
};

/** Only return fixed diagnostics and Prisma codes, never messages, metadata or stacks. */
export function safeDatabaseError(error: unknown): { code: string; message: string } {
  const candidate = error instanceof Prisma.PrismaClientInitializationError ? error.errorCode
    : error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
  const code = candidate && /^P\d{4}$/.test(candidate) ? candidate : "DATABASE_ERROR";
  return { code, message: diagnostics[code] ?? "Database operation failed" };
}