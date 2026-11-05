import { z } from "zod";
import type { CourseDto, CoursesResponse, PaginationQuery } from "../types/api";

export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CourseDtoSchema = z.infer<typeof courseSchema>;

export const coursesResponseSchema = z.object({
  data: z.array(courseSchema),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type CoursesResponseSchema = z.infer<typeof coursesResponseSchema>;

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CourseQueryInput = z.infer<typeof courseQuerySchema>;

export function parseCoursesResponse(
  input: unknown,
): CoursesResponse {
  return coursesResponseSchema.parse(input) as CoursesResponse;
}

export function parseCourseDto(input: unknown): CourseDto {
  return courseSchema.parse(input) as CourseDto;
}

export function parsePaginationQuery(
  input: unknown,
): PaginationQuery {
  return courseQuerySchema.parse(input) as unknown as PaginationQuery;
}