import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { safeDatabaseError } from "./database-error";

/**
 * Prisma client lifecycle tied to the NestJS application lifecycle.
 * Connects on module init, disconnects on module destroy (graceful shutdown).
 * Connection errors are surfaced so the health endpoint can report readiness.
 */

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({ datasources: { db: { url: config.getOrThrow<string>("DATABASE_URL") } } });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Database connected");
    } catch (error) {
      // Degraded mode: keep the application running so liveness works and the
      // health endpoint can report database unavailability clearly.
      const diagnostic = safeDatabaseError(error);
      this.logger.error(`${diagnostic.code}: ${diagnostic.message}; running in degraded mode`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}