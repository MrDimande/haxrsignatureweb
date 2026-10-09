import "server-only";

function parseValidOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
    if (parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Resolves the canonical base origin for portal auth emails and flows,
 * strictly segregated by environment without ever inspecting request host headers.
 *
 * 1. Explicit PORTAL_AUTH_BASE_URL overrides all environments.
 * 2. Vercel Preview (VERCEL_ENV === "preview"): isolated to VERCEL_BRANCH_URL / VERCEL_URL.
 * 3. Production: NEXT_PUBLIC_SITE_URL or safe canonical fallback https://haxrsignature.com.
 * 4. Local development / tests: http://localhost:3000.
 */
export function getPortalAuthBaseUrl(): string {
  const explicitOverride = parseValidOrigin(process.env.PORTAL_AUTH_BASE_URL);
  if (explicitOverride) {
    return explicitOverride;
  }

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview") {
    const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
    const previewOrigin = parseValidOrigin(previewHost);
    if (previewOrigin) {
      return previewOrigin;
    }
  }

  if (process.env.NODE_ENV === "production" && vercelEnv !== "preview") {
    const configuredOrigin = parseValidOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    if (configuredOrigin) {
      return configuredOrigin;
    }
    throw new Error("portal_auth_base_url_missing_in_production");
  }

  const devOrigin = parseValidOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (devOrigin) {
    return devOrigin;
  }

  return "http://localhost:3000";
}
