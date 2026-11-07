import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { SessionPayload } from "@codekita/shared";

/**
 * Injects the validated server-side session payload into a route handler.
 */

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    const request = ctx.switchToHttp().getRequest<any>();
    return request.user as SessionPayload;
  },
);