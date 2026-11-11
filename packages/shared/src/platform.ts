import { z } from "zod";
import { academySchema } from "./academy";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().max(3000), isActive: z.boolean(),
}).strict();
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export interface CategoryDto extends CategoryInput { id: string }
export const profileInputSchema = z.object({
  firstName: z.string().trim().max(100), lastName: z.string().trim().max(100),
  displayName: z.string().trim().max(100), bio: z.string().trim().max(2000),
}).strict();
export type ProfileInput = z.infer<typeof profileInputSchema>;
export interface ProfileDto extends ProfileInput { userId: string; email: string }
export const userUpdateSchema = z.object({
  isActive: z.boolean(), roles: z.array(z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"])).min(1).max(3),
}).strict();
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export interface AdminUser { id: string; email: string; firstName: string | null; lastName: string | null; isActive: boolean; roles: string[] }
export const labInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), academy: academySchema,
  title: z.string().min(3).max(200), language: z.string().min(1).max(30),
  duration: z.string().max(50), description: z.string().max(3000), starter: z.string().max(100000),
  sample: z.string().max(10000), objectives: z.array(z.string().max(500)).max(20),
  hint: z.string().max(3000), isPublished: z.boolean(),
}).strict();
export type LabDto = z.infer<typeof labInputSchema>;
export interface AdminStatistics { users: number; courses: number; enrollments: number; certificates: number; quizAttempts: number }