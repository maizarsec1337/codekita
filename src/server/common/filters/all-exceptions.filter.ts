import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  LoggerService,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { safeDatabaseError } from "../../database/database-error";

/**
 * Global exception filter.
 * Every error leaves the application as a JSON response with a stable shape.
 * Raw server errors and stack traces must never reach clients or logs.
 */

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const path = request.url.split("?")[0];

    const status = exception instanceof HttpException ? exception.getStatus() :
      typeof exception === "object" && exception !== null && "statusCode" in exception &&
      typeof exception.statusCode === "number" && exception.statusCode >= 400 && exception.statusCode < 500
        ? exception.statusCode : 500;

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
    } else if (status === 429) {
      message = "Too many requests. Please try again later.";
      errorCode = "TooManyRequests";
    }

    const isClientError = status >= 400 && status < 500;
    if (!isClientError) {
      this.logger.error({
        context: "AllExceptionsFilter", status, path,
        diagnostic: safeDatabaseError(exception),
      });
    }

    const body = {
      statusCode: status,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    response.status(status).send(body);
  }
}