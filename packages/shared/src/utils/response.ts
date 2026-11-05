import type { CourseDto, CoursesResponse, HealthDto } from "../types/api";

/**
 * Small shared helpers for building consistent API responses.
 */

export function buildCoursesResponse({
  data,
  page,
  limit,
  total,
}: {
  data: CourseDto[];
  page: number;
  limit: number;
  total: number;
}): CoursesResponse {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

export function buildHealthDto(overrides: {
  status: HealthDto["status"];
  database: HealthDto["services"]["database"];
}): HealthDto {
  return {
    status: overrides.status,
    timestamp: new Date().toISOString(),
    services: {
      application: "up",
      database: overrides.database,
    },
  };
}