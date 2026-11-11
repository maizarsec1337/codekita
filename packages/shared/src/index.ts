/**
 * CodeKita shared package public API.
 * Frontend and backend import from here to keep API contracts in sync.
 */

export type {
  RoleName,
  ALL_ROLES,
  CourseDto,
  CoursesResponse,
  HealthDto,
  ApiError,
  PaginationQuery,
  AuthUser,
  SessionPayload,
} from "./types/api";

export {
  courseSchema,
  coursesResponseSchema,
  courseQuerySchema,
} from "./schemas/course";
export { healthSchema } from "./schemas/health";
export { apiErrorSchema } from "./schemas/error";
export { envSchema } from "./schemas/env";
export type { Env } from "./schemas/env";

export type {
  CourseDtoSchema,
  CoursesResponseSchema,
  CourseQueryInput,
} from "./schemas/course";
export type { HealthDtoSchema } from "./schemas/health";
export type { ApiErrorSchema } from "./schemas/error";

export { parseCoursesResponse, parseCourseDto, parsePaginationQuery } from "./schemas/course";
export { parseHealthDto } from "./schemas/health";
export { parseApiError, isApiError } from "./schemas/error";
export { buildCoursesResponse, buildHealthDto } from "./utils/response";
export * from "./academy";
export * from "./platform";
export { starterPaths } from "./starter-content";
export { publicCatalogueSchema, type PublicCatalogue } from "./public-catalogue";