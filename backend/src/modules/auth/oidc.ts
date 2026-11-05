/**
 * OIDC / OAuth 2.0 integration foundation.
 *
 * This file establishes the shape of a future OIDC/OAuth 2.0 integration
 * (issuer, client credentials, callback route). It is intentionally not wired
 * into the request flow unless OIDC_CLIENT_ID and OIDC_ISSUER_URL are
 * explicitly configured. Local session authentication (above) remains the
 * default and only enabled strategy.
 */

export interface OidcProviderConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes?: string[];
}

/**
 * Reads OIDC configuration from the environment. Returns null when OIDC is
 * not configured — the application then operates in local-session mode only.
 */
export function loadOidcConfig(env: NodeJS.ProcessEnv): OidcProviderConfig | null {
  if (!env.OIDC_CLIENT_ID || !env.OIDC_ISSUER_URL) {
    return null;
  }

  return {
    issuerUrl: env.OIDC_ISSUER_URL,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET ?? "",
    callbackUrl: env.OIDC_CALLBACK_URL ?? "/api/auth/oidc/callback",
    scopes: env.OIDC_SCOPES ? env.OIDC_SCOPES.split(",") : ["openid", "profile", "email"],
  };
}

/**
 * Skeleton strategy base. A concrete implementation (e.g. passport-oauth2 or
 * oidc4vc) should extend this when OIDC is enabled. Do not enable without
 * configuring OIDC_CLIENT_ID/OIDC_ISSUER_URL and reviewing the callback flow.
 */
export abstract class BaseOidcStrategy {
  protected constructor(protected readonly config: OidcProviderConfig) {}

  abstract authorizationUrl(state: string): string;

  abstract handleCallback(params: {
    code?: string;
    state?: string;
  }): Promise<unknown>;
}