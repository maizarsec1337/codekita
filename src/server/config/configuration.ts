import { envSchema, type Env } from "@codekita/shared";

/**
 * Validated application configuration.
 * Throws at bootstrap if required environment variables are missing or invalid.
 * Never log or return the values of sensitive variables (SESSION_SECRET, OIDC secrets).
 */

export function configuration(): Env {
  return validateEnvironment(process.env);
}

export function validateEnvironment(input: Record<string, unknown>): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    // Zod enum messages can contain the received value. Never echo input.
    const fieldErrors = [...new Set(result.error.issues.map((issue) => {
      const reason = issue.code === "invalid_type" && issue.received === "undefined"
        ? "Required" : "Invalid value";
      return `${issue.path.join(".")}: ${reason}`;
    }))].join("; ");
    throw new Error("Invalid environment configuration: " + fieldErrors +
      ". Configure the root .env or process environment; secret values are not logged.");
  }

  return result.data;
}

export type { Env };