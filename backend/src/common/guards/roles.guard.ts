import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RoleName } from "@codekita/shared";

/**
 * Role-based access control guard.
 * Access is granted only when the server-side session holds one of the
 * required roles. Client-supplied roles are never consulted.
 */

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<RoleName[]>("roles", context.getHandler());
    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<any>();
    const user = request.user as { roles?: string[] } | undefined;

    if (!user || !user.roles) {
      throw new ForbiddenException("No authenticated user");
    }

    const hasRole = roles.some((role) => user.roles?.includes(role) ?? false);
    if (!hasRole) {
      throw new ForbiddenException("Insufficient role");
    }

    return true;
  }
}