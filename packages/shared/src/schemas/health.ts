import { z } from "zod";
import type { HealthDto } from "../types/api";

export const healthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  timestamp: z.string().datetime(),
  services: z.object({
    application: z.literal("up"),
    database: z.enum(["connected", "disconnected"]),
  }),
});

export type HealthDtoSchema = z.infer<typeof healthSchema>;

export function parseHealthDto(input: unknown): HealthDto {
  return healthSchema.parse(input) as HealthDto;
}