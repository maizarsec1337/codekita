import { envSchema, type Env } from "@codekita/shared";

/**
 * Validated application configuration.
 * Throws at bootstrap if required environment variables are missing or invalid.
 * Never log or return the values of sensitive variables (SESSION_SECRET, OIDC secrets).
 */

export function configuration(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const fieldErrors = Object.entries(result.error.flatten().fieldErrors)
      .map(function (entry) {
        const field = entry[0];
        const messages = entry[1] ?? [];
        return field + ": " + messages.join(", ");
      })
      .join("; ");
    throw new Error("Invalid environment configuration: " + fieldErrors);
  }

  return result.data;
}

export type { Env };
