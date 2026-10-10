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
 * 1. Production (NODE_ENV=production && VERCEL_ENV!=preview): PORTAL_AUTH_BASE_URL prioritised,
 *    falling back to NEXT_PUBLIC_SITE_URL. Throws explicit error if missing.
 * 2. Vercel Preview (VERCEL_ENV=preview): strictly isolated to VERCEL_BRANCH_URL / VERCEL_URL,
 *    ignoring PORTAL_AUTH_BASE_URL to preserve branch preview isolation.
 * 3. Local development / tests: NEXT_PUBLIC_SITE_URL or fallback to http://localhost:3000.
 */
export function getPortalAuthBaseUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV;
  const isProduction = process.env.NODE_ENV === "production" && vercelEnv !== "preview";

  if (isProduction) {
    const explicitOverride = parseValidOrigin(process.env.PORTAL_AUTH_BASE_URL);
    if (explicitOverride) {
      return explicitOverride;
    }
    const configuredOrigin = parseValidOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    if (configuredOrigin) {
      return configuredOrigin;
    }
    throw new Error("portal_auth_base_url_missing_in_production");
  }

  if (vercelEnv === "preview") {
    const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
    const previewOrigin = parseValidOrigin(previewHost);
    if (previewOrigin) {
      return previewOrigin;
    }
    throw new Error("portal_auth_preview_url_missing");
  }

  const devOrigin = parseValidOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (devOrigin) {
    return devOrigin;
  }

  return "http://localhost:3000";
}
