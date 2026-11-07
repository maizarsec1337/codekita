import { LoggerService } from "@nestjs/common";
import pino from "pino";
import type { Logger as PinoBaseLogger } from "pino";

/**
 * Sensitive fields are redacted automatically by pino so secrets never reach logs.
 */
const REDACTED_FIELDS = [
  "password",
  "passwordHash",
  "token",
  "sessionToken",
  "authorization",
  "cookie",
  "set-cookie",
  "csrf_token",
  "client_secret",
];

export class PinoLogger implements LoggerService {
  private readonly logger: PinoBaseLogger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? "info",
      redact: REDACTED_FIELDS,
      base: { pid: process.pid, hostname: require("os").hostname() },
    });
  }

  log(message: any, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string): void {
    if (message instanceof Error) this.logger.error({ err: message, context, trace }, message.message);
    else this.logger.error({ context, trace }, message);
  }

  warn(message: any, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: any, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: any, context?: string): void {
    this.logger.debug({ context }, message);
  }

  child(bindings: Record<string, unknown>): PinoBaseLogger {
    return this.logger.child(bindings);
  }
}