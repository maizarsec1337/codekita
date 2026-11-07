import { Injectable, NestMiddleware, ForbiddenException } from "@nestjs/common";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const EXEMPT_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/csrf-token"];

/**
 * Double-submit CSRF mitigation for session-based authentication.
 * State-changing requests must present a matching X-CSRF-TOKEN header and
 * csrf_token cookie. Safe methods are exempt.
 */

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(
    request: any,
    _reply: any,
    next: (error?: unknown) => void,
  ): void {
    const isExempt = EXEMPT_PATHS.includes(request.url);
    if (!UNSAFE_METHODS.has(request.method) || isExempt) {
      return next();
    }

    const cookieToken = request.cookies?.["csrf_token"];
    const headerToken = request.headers["x-csrf-token"];

    if (
      !cookieToken ||
      typeof headerToken !== "string" ||
      cookieToken !== headerToken
    ) {
      throw new ForbiddenException("CSRF token mismatch");
    }

    next();
  }
}