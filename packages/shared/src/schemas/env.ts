import { z } from "zod";

/**
 * Environment validation schema shared by the backend.
 * Invalid configuration prevents the application from starting.
 */

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid PostgreSQL connection string" }),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_MAX_AGE: z.coerce.number().positive().default(86400000),
  SESSION_NAME: z.string().default("codekita_session"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
  OIDC_ISSUER_URL: z.string().url().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_CALLBACK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;