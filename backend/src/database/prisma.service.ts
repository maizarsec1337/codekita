import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client lifecycle tied to the NestJS application lifecycle.
 * Connects on module init, disconnects on module destroy (graceful shutdown).
 * Connection errors are surfaced so the health endpoint can report readiness.
 */

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Database connected");
    } catch (error) {
      // Degraded mode: keep the application running so liveness works and the
      // health endpoint can report database unavailability clearly.
      this.logger.error(
        "Database not reachable — running in degraded mode",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}