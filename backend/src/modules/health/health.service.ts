import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { buildHealthDto } from "@codekita/shared";

/**
 * Application health. Liveness (the process is running) is distinct from
 * database readiness (a real query round-trip against PostgreSQL).
 */

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    let database: "connected" | "disconnected" = "disconnected";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      // Database not reachable — report degraded, do not throw.
    }

    return buildHealthDto({
      status: database === "connected" ? "ok" : "degraded",
      database,
    });
  }
}