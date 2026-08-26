import {
  getNeonAuthUrl,
  isNeonAuthServerConfigured,
  shouldUseNeonAuthForAppSession,
  shouldUseNeonServerDatabase,
} from "@/lib/neon/config";
import { shouldUseNeonAuthInBrowser } from "@/lib/neon/browser-config";

export const dynamic = "force-dynamic";

const MIGRATION_BRANCH = "migration/supabase-to-neon";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH
  );
}

export async function GET(): Promise<Response> {
  if (!isMigrationPreview()) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const neonAuthBaseUrlConfigured = Boolean(getNeonAuthUrl());
  const neonAuthCookieSecretConfigured = Boolean(
    process.env.NEON_AUTH_COOKIE_SECRET?.trim(),
  );
  const serverProviderRequested =
    process.env.HAXR_AUTH_PROVIDER?.trim().toLowerCase() === "neon";
  const browserProviderRequested =
    process.env.NEXT_PUBLIC_HAXR_AUTH_PROVIDER?.trim().toLowerCase() === "neon";

  return Response.json(
    {
      environment: {
        vercelPreview: process.env.VERCEL_ENV === "preview",
        migrationBranch: process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH,
      },
      database: {
        configured: databaseUrlConfigured,
        neonProviderActive: shouldUseNeonServerDatabase(),
      },
      auth: {
        baseUrlConfigured: neonAuthBaseUrlConfigured,
        cookieSecretConfigured: neonAuthCookieSecretConfigured,
        serverConfigured: isNeonAuthServerConfigured(),
        serverProviderRequested,
        browserProviderRequested,
        serverProviderActive: shouldUseNeonAuthForAppSession(),
        browserProviderActive: shouldUseNeonAuthInBrowser(),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
