import { CallHandler, ExecutionContext, Logger, NestInterceptor, LoggerService } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService = new Logger(LoggingInterceptor.name)) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const request = http.getRequest<{ method: string; url: string }>();
        const method = request.method;
        const url = request.url;
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} ${responseTime}ms`);
      }),
    );
  }
}