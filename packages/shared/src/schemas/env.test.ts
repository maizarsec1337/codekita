import { describe, expect, it } from "vitest";
import { envSchema } from "./env";

// Synthetic parser fixtures only: no network connections or environment changes.
const base = { DATABASE_URL: "postgresql://localhost/test", SESSION_SECRET: "unit-test-only-secret" };
const pooler = "postgresql://postgres.fixture:encoded%40password@aws-0-test.pooler.supabase.com";

describe("PostgreSQL environment validation", () => {
  it("requires the runtime URL without supplying a fallback", () => {
    expect(envSchema.safeParse({ SESSION_SECRET: base.SESSION_SECRET }).success).toBe(false);
  });
  it.each(["", "https://example.test/database", "postgresql://localhost", "not-a-url"])("rejects invalid database URLs: %s", (DATABASE_URL) => {
    expect(envSchema.safeParse({ ...base, DATABASE_URL }).success).toBe(false);
  });
  it("preserves local PostgreSQL support and parses defaults", () => {
    const env = envSchema.parse(base);
    expect(env.PORT).toBe(3000);
    expect(env.DIRECT_URL).toBeUndefined();
    expect(env.DATABASE_URL).toBe(base.DATABASE_URL);
  });
  it("accepts transaction runtime and session CLI connections with TLS", () => {
    expect(envSchema.safeParse({ ...base,
      DATABASE_URL: `${pooler}:6543/postgres?pgbouncer=true&sslmode=require`,
      DIRECT_URL: `${pooler}:5432/postgres?sslmode=require`,
    }).success).toBe(true);
  });
  it("requires transaction-pooler compatibility", () => {
    expect(envSchema.safeParse({ ...base, DATABASE_URL: `${pooler}:6543/postgres?sslmode=require` }).success).toBe(false);
  });
  it("requires TLS for Supabase", () => {
    expect(envSchema.safeParse({ ...base, DATABASE_URL: `${pooler}:6543/postgres?pgbouncer=true` }).success).toBe(false);
  });
  it("does not send CLI operations through the transaction pooler", () => {
    expect(envSchema.safeParse({ ...base, DIRECT_URL: `${pooler}:6543/postgres?pgbouncer=true&sslmode=require` }).success).toBe(false);
  });
  it.each(["raw@password", "raw:password", "raw%password", "raw password", "raw#password", "raw/password"])("rejects unencoded password characters: %s", (password) => {
    expect(envSchema.safeParse({ ...base, DATABASE_URL: `postgresql://user:${password}@localhost/test` }).success).toBe(false);
  });
  it("accepts percent-encoded special characters without changing the input", () => {
    const DATABASE_URL = "postgresql://user:p%40%23%3A%2F%3F%25%20@localhost/test";
    expect(envSchema.parse({ ...base, DATABASE_URL }).DATABASE_URL).toBe(DATABASE_URL);
  });
});