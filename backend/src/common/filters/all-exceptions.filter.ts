import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  LoggerService,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Global exception filter.
 * Every error leaves the application as a JSON response with a stable shape.
 * Stack traces are only included in development.
 */

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    let message: string | object = "Internal server error";
    let errorCode = status >= 500 ? "InternalServerError" : "Error";

    if (exception instanceof HttpException) {
      const responsePayload = exception.getResponse();
      message =
        typeof responsePayload === "string"
          ? responsePayload
          : (responsePayload as Record<string, unknown>).message ??
            "Internal server error";
      errorCode = (responsePayload as Record<string, unknown>)?.error as string ?? errorCode;
    }

    const isClientError = status >= 400 && status < 500;
    if (!isClientError) {
      this.logger.error(
        { context: "AllExceptionsFilter", status, path: request.url },
        exception instanceof Error ? exception : String(exception),
      );
    }

    const body = {
      statusCode: status,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV === "development" && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    };

    response.status(status).send(body);
  }
}