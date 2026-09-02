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
  const checks = [
    {
      name: "neon-schema-readiness",
      script: "scripts/neon-health-check.mjs",
      args: [],
    },
    {
      name: "gate-2c-gifts-preflight",
      script: "scripts/gate-2c-gifts-photos-migration.mjs",
      args: [
        "preflight-gifts",
        "--expected-source-ref=oxsrdmydlqyvnueedgtl",
        "--expected-gifts=42",
        "--expected-gifts-checksum=7ff1cf6590b6d4e3989e0070fa61b619d23f5dfcae3a71f4e604f4ecdaf4a5d2",
      ],
    },
    {
      name: "gate-2c-event-dependencies-audit",
      script: "scripts/gate-2c-gifts-photos-migration.mjs",
      args: [
        "audit-event-dependencies",
        "--expected-source-ref=oxsrdmydlqyvnueedgtl",
        "--expected-gifts=42",
        "--expected-gifts-checksum=7ff1cf6590b6d4e3989e0070fa61b619d23f5dfcae3a71f4e604f4ecdaf4a5d2",
      ],
    },
    {
      name: "gate-2c-gift-event-bindings-preflight",
      script: "scripts/gate-2c-gifts-photos-migration.mjs",
      args: [
        "preflight-gift-bindings",
        "--expected-source-ref=oxsrdmydlqyvnueedgtl",
        "--expected-gifts=42",
        "--expected-gifts-checksum=7ff1cf6590b6d4e3989e0070fa61b619d23f5dfcae3a71f4e604f4ecdaf4a5d2",
      ],
    },
  ];

  for (const check of checks) {
    const result = spawnSync(
      process.execPath,
      [resolve(process.cwd(), check.script), ...check.args],
      { stdio: "inherit", env: process.env },
    );
    if ((result.status ?? 1) !== 0) {
      console.error(`[build] ${check.name} blocked the migration Preview build.`);
      process.exit(result.status ?? 1);
    }
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
