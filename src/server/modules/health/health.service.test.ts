import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../database/prisma.service";
import { HealthService } from "./health.service";

describe("Health readiness contract (mock database)", () => {
  it("reports connected only after a successful read-only query", async () => {
    const $queryRaw = vi.fn().mockResolvedValue([{ value: 1 }]);
    const result = await new HealthService({ $queryRaw } as unknown as PrismaService).check();
    expect(result.status).toBe("ok");
    expect(result.services.database).toBe("connected");
    expect($queryRaw.mock.calls[0][0]).toEqual(["SELECT 1"]);
  });
  it("reports degraded when the query fails without exposing details", async () => {
    const $queryRaw = vi.fn().mockRejectedValue(new Error("sensitive-connection-error"));
    const result = await new HealthService({ $queryRaw } as unknown as PrismaService).check();
    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("disconnected");
    expect(JSON.stringify(result)).not.toContain("sensitive-");
  });
});