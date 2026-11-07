import { SetMetadata } from "@nestjs/common";

/**
 * Marks a route handler as publicly accessible (no session required).
 * The AuthGuard skips validation for these routes.
 */

export const IsPublic = () => SetMetadata("isPublic", true);