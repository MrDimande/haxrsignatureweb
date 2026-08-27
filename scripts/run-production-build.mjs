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

const incoming = process.env.NODE_ENV?.trim();
const allowed = new Set(["production", "test", ""]);

if (incoming && !allowed.has(incoming)) {
  console.warn(
    `[build] Non-standard NODE_ENV=${JSON.stringify(incoming)}; forcing production for next build.`,
  );
}

process.env.NODE_ENV = "production";

if (isMigrationPreview) {
  const canaryScript = resolve(process.cwd(), "scripts/neon-api-events-canary.ts");
  const canary = spawnSync(process.execPath, ["--import", "tsx", canaryScript], {
    stdio: "inherit",
    env: process.env,
  });

  if ((canary.status ?? 1) !== 0) {
    process.exit(canary.status ?? 1);
  }
}

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
