import { ExceptionFilter, Catch, ArgumentsHost, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof Error ? 500 : 500;

    this.logger.error(exception instanceof Error ? exception.stack : String(exception), "Unhandled exception");

    response.status(status).json({
      statusCode: status,
      message: "Internal Server Error",
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}