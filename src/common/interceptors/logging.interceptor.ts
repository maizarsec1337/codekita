import { CallHandler, NestInterceptor, LoggerService } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService = new Logger(LoggingInterceptor.name)) {}

  intercept(context: any, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap((data) => {
        const context = context.switchToHttp();
        const request = context.getRequest();
        const method = request.method;
        const url = request.url;
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} ${responseTime}ms`);
      }),
    );
  }
}