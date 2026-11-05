import { z } from "zod";
import type { ApiError } from "../types/api";

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int().positive(),
  timestamp: z.string().datetime(),
  path: z.string().optional(),
});

export type ApiErrorSchema = z.infer<typeof apiErrorSchema>;

export function parseApiError(input: unknown): ApiError {
  return apiErrorSchema.parse(input) as ApiError;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "statusCode" in value &&
    "message" in value
  );
}