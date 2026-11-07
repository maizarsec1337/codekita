import { Logger, LogLevel } from "@nestjs/common";

export class PinoLogger implements Logger {
  private readonly logger = console;

  log(message: string, context?: string): void {
    this.logger.log(`[${context || "CodeKita"}] ${message}`);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(`[${context || "CodeKita"}] ${message}`, trace);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(`[${context || "CodeKita"}] ${message}`);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(`[${context || "CodeKita"}] ${message}`);
  }

  setLogLevel(level: LogLevel): void {
    // No-op for console-based logging
  }
}