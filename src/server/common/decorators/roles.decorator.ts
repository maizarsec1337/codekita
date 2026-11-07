import { SetMetadata } from "@nestjs/common";
import type { RoleName } from "@codekita/shared";

/**
 * Marks a route handler as requiring one of the listed roles.
 * Roles are evaluated server-side only; a role sent by the client is never trusted.
 */

export const Roles = (...roles: RoleName[]) => SetMetadata("roles", roles);