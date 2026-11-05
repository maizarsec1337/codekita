import {
  Injectable,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { SessionPayload } from "@codekita/shared";
import { AuthService } from "../../modules/auth/auth.service";

/**
 * Session-based authentication guard.
 * Validates the session server-side on every request. Missing or invalid
 * sessions result in a 401. Routes marked @IsPublic() are exempt.
 * Never trusts client-submitted identity.
 */

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>("isPublic", context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<any>();
    const sessionName = this.configService.get<string>("SESSION_NAME", "codekita_session");

    const token = request.cookies?.[sessionName];
    if (!token) {
      throw new UnauthorizedException("Missing session cookie");
    }

    const session = await this.authService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException("Invalid or expired session");
    }

    request.user = session;
    return true;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}