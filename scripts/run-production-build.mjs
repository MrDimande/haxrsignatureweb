/**
 * Garante next build com NODE_ENV=production.
 * Evita falhas de prerender (/500, /_error) quando a sessão herda
 * NODE_ENV=development|staging|preview.
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const isMigrationPreview =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH;

if (isMigrationPreview) {
  const authUrlConfigured = Boolean(
    process.env.NEON_AUTH_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_NEON_AUTH_URL?.trim(),
  );

  console.info(
    "[migration-readiness]",
    JSON.stringify({
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL?.trim()),
      authUrlConfigured,
      serverAuthProviderRequested:
        process.env.HAXR_AUTH_PROVIDER?.trim().toLowerCase() === "neon",
      browserAuthProviderRequested:
        process.env.NEXT_PUBLIC_HAXR_AUTH_PROVIDER?.trim().toLowerCase() === "neon",
    }),
  );

  const authCanary = spawnSync(
    process.execPath,
    [resolve(process.cwd(), "scripts/neon-auth-preview-canary.mjs")],
    {
      stdio: "inherit",
      env: process.env,
    },
  );
  if ((authCanary.status ?? 1) !== 0) {
    process.exit(authCanary.status ?? 1);
  }
}

const incoming = process.env.NODE_ENV?.trim();
const allowed = new Set(["production", "test", ""]);

if (incoming && !allowed.has(incoming)) {
  console.warn(
    `[build] Non-standard NODE_ENV=${JSON.stringify(incoming)}; forcing production for next build.`,
  );
}

process.env.NODE_ENV = "production";

try {
  rmSync(resolve(process.cwd(), ".next/cache"), { recursive: true, force: true });
} catch {
  // ignore
}

const nextBin = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
