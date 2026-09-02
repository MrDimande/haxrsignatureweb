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
      name: "gate-2c-cleanup-preview-photos",
      script: "scripts/gate-2c-gifts-photos-migration.mjs",
      args: [
        "cleanup-preview-photos",
        "--expected-source-ref=oxsrdmydlqyvnueedgtl",
        "--expected-gifts=42",
        "--expected-photos=147",
        "--expected-gifts-checksum=7ff1cf6590b6d4e3989e0070fa61b619d23f5dfcae3a71f4e604f4ecdaf4a5d2",
        "--expected-photos-checksum=36b8f471d851f7244a47f2b3070b03465d5415a1f7d42109f3fb7764054ecfd0",
        "--photo-table=wedding_photos",
        "--expected-neon-host=ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech",
        "--expected-target-only-photos=6",
        "--expected-target-only-photos-checksum=87ad3a48005b6092b71646fe8607ac38881bd47ac7d6aa7ed73b97610237b23d",
        "--confirm=GATE_2C_PREVIEW_CLEANUP",
      ],
    },
    {
      name: "gate-2c-preflight",
      script: "scripts/gate-2c-gifts-photos-migration.mjs",
      args: [
        "preflight",
        "--expected-source-ref=oxsrdmydlqyvnueedgtl",
        "--expected-gifts=42",
        "--expected-photos=147",
        "--expected-gifts-checksum=7ff1cf6590b6d4e3989e0070fa61b619d23f5dfcae3a71f4e604f4ecdaf4a5d2",
        "--expected-photos-checksum=36b8f471d851f7244a47f2b3070b03465d5415a1f7d42109f3fb7764054ecfd0",
        "--photo-table=wedding_photos",
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
