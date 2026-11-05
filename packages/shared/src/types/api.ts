/**
 * CodeKita shared API contracts.
 * These types are consumed by both the frontend and the backend.
 */

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "INSTRUCTOR" | "STUDENT";

export const ALL_ROLES: RoleName[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "INSTRUCTOR",
  "STUDENT",
];

export interface CourseDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoursesResponse {
  data: CourseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthDto {
  status: "ok" | "degraded";
  timestamp: string;
  services: {
    application: "up";
    database: "connected" | "disconnected";
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: RoleName[];
}

export interface SessionPayload {
  userId: string;
  email: string;
  roles: RoleName[];
}