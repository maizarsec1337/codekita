import { z } from "zod";

/**
 * Environment validation schema shared by the backend.
 * Invalid configuration prevents the application from starting.
 */

const boolean = (fallback: boolean) => z.preprocess((value) => value === "false" ? false : value === "true" ? true : value, z.boolean().default(fallback));

// Empty optional settings in .env.example must not enable an integration.
// Preserve nonempty credentials exactly as supplied rather than trimming them.
const optionalSetting = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  schema.optional(),
);

const integrationUrl = (originOnly = false) => optionalSetting(z.string().url().refine(value => {
  try {
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (url.protocol === "https:" || (url.protocol === "http:" && loopback)) &&
      !url.username && !url.password && !/[\s?#]/.test(value) &&
      (!originOnly || url.pathname === "/");
  } catch { return false; }
}, "Use HTTPS without embedded credentials, queries or fragments; HTTP is local-development only"));

const r2Credential = optionalSetting(z.string().min(1).refine(
  value => !/\s/.test(value) && !/^your-r2-(?:access-key-id|secret-access-key)$/i.test(value),
  "Use real R2 credentials or leave the integration unconfigured",
));

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
  TRUST_PROXY: z.coerce.number().int().min(0).max(1).default(0),
  OIDC_ISSUER_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_CALLBACK_URL: z.string().url().optional(),

  // Optional server-only configuration; does not enable uploads by itself.
  R2_ACCOUNT_ID: optionalSetting(z.string().regex(/^[a-f0-9]{32}$/i)),
  R2_ENDPOINT: integrationUrl(true),
  R2_ACCESS_KEY_ID: r2Credential,
  R2_SECRET_ACCESS_KEY: r2Credential,
  R2_BUCKET: optionalSetting(z.string().min(1).refine(value => !/\s/.test(value), "Bucket names cannot contain whitespace")),

  // Prisma and the existing session authentication do not require these keys.
  SUPABASE_URL: integrationUrl(true),
  SUPABASE_PUBLISHABLE_KEY: optionalSetting(z.string().min(1)),
  SUPABASE_SECRET_KEY: optionalSetting(z.string().min(1)),
  SUPABASE_JWKS_URL: integrationUrl(),
}).superRefine((value, context) => {
  // Metadata alone is allowed while the operator obtains storage credentials.
  if (value.R2_ACCESS_KEY_ID || value.R2_SECRET_ACCESS_KEY) {
    for (const field of ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const) {
      if (!value[field]) context.addIssue({ code: "custom", path: [field], message: "Required when configuring R2 credentials" });
    }
  }
  if ((value.SUPABASE_PUBLISHABLE_KEY || value.SUPABASE_SECRET_KEY) && !value.SUPABASE_URL) {
    context.addIssue({ code: "custom", path: ["SUPABASE_URL"], message: "Required when configuring Supabase API keys" });
  }
  if (value.NODE_ENV === "production") {
    if (value.SESSION_SECRET.length < 32) {
      context.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "Production requires at least 32 characters" });
    }
    for (const field of ["R2_ENDPOINT", "SUPABASE_URL", "SUPABASE_JWKS_URL"] as const) {
      if (value[field] && !value[field].startsWith("https://")) {
        context.addIssue({ code: "custom", path: [field], message: "Production integration endpoints require HTTPS" });
      }
    }
  }
  if (value.NODE_ENV === "production" && !value.CORS_ORIGIN.startsWith("https://")) {
    context.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "Production CORS requires an HTTPS frontend origin" });
  }
  if (value.NODE_ENV !== "production" && value.COOKIE_SAME_SITE === "none" && !value.COOKIE_SECURE) {
    context.addIssue({ code: "custom", path: ["COOKIE_SECURE"], message: "SameSite=None requires Secure cookies" });
  }
});

export type Env = z.infer<typeof envSchema>;