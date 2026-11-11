import { z } from "zod";

/**
 * Environment validation schema shared by the backend.
 * Invalid configuration prevents the application from starting.
 */

const boolean = (fallback: boolean) => z.preprocess((value) => value === "false" ? false : value === "true" ? true : value, z.boolean().default(fallback));

const postgresUrl = (field: "DATABASE_URL" | "DIRECT_URL") => z.string().url().superRefine((value, ctx) => {
  const invalid = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  let url: URL;
  try { url = new URL(value); } catch { return; }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
    invalid("Use a PostgreSQL connection URL with a database name");
    return;
  }

  // Inspect the original authority: URL normalizes some unescaped characters.
  const authority = value.slice(value.indexOf("://") + 3).split(/[/?#]/)[0];
  const userinfo = authority.includes("@") ? authority.slice(0, authority.lastIndexOf("@")) : "";
  const password = userinfo.includes(":") ? userinfo.slice(userinfo.indexOf(":") + 1) : "";
  if (url.hash || /\s/.test(value) || !/^(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})*$/.test(password)) {
    invalid("Percent-encode special characters in the database password");
  }

  const sharedPooler = url.hostname.endsWith(".pooler.supabase.com");
  const supabase = sharedPooler || url.hostname.endsWith(".supabase.co");
  if (supabase && url.searchParams.get("sslmode") !== "require") {
    invalid("Supabase connections require sslmode=require");
  }
  if (sharedPooler && field === "DIRECT_URL" && url.port !== "5432") {
    invalid("DIRECT_URL must use the Supabase session pooler on port 5432");
  }
  if (supabase && url.port === "6543" && url.searchParams.get("pgbouncer") !== "true") {
    invalid("Transaction pooling requires pgbouncer=true for Prisma");
  }
});

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: postgresUrl("DATABASE_URL"),
  // Runtime only needs DATABASE_URL; Prisma CLI uses DIRECT_URL separately.
  DIRECT_URL: postgresUrl("DIRECT_URL").optional(),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_MAX_AGE: z.coerce.number().positive().default(86400000),
  SESSION_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default("codekita_session"),
  COOKIE_SECURE: boolean(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CORS_ORIGIN: z.string().url().refine(value => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && value === url.origin;
    } catch { return false; }
  }, "CORS_ORIGIN must be one exact browser origin without a trailing slash or path").default("http://localhost:5173"),
  ENABLE_SWAGGER: boolean(false),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  OIDC_ISSUER_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_CALLBACK_URL: z.string().url().optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && !value.CORS_ORIGIN.startsWith("https://")) {
    context.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "Production CORS requires an HTTPS frontend origin" });
  }
  if (value.NODE_ENV !== "production" && value.COOKIE_SAME_SITE === "none" && !value.COOKIE_SECURE) {
    context.addIssue({ code: "custom", path: ["COOKIE_SECURE"], message: "SameSite=None requires Secure cookies" });
  }
});

export type Env = z.infer<typeof envSchema>;