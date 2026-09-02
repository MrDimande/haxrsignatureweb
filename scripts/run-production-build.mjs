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
      name: "gate-2c-apply-edition-events",
      script: "scripts/gate-2c-gifts-photos-migration.mjs",
      args: [
        "apply-events",
        "--expected-source-ref=oxsrdmydlqyvnueedgtl",
        "--expected-gifts=42",
        "--expected-gifts-checksum=7ff1cf6590b6d4e3989e0070fa61b619d23f5dfcae3a71f4e604f4ecdaf4a5d2",
        "--expected-events=2",
        "--expected-event-id-checksum=0f882860a3a4290c5a1469b20f6b3b1a40255b0722ebee024420de1d8eb8d747",
        "--expected-business-references=1",
        "--expected-business-reference-checksum=0d8acf2d3557c142c8705b17b3c7acd45379b74ec3c9e58c9b7d31369ed75040",
        "--expected-client-references=1",
        "--expected-client-reference-checksum=1241998d464282503ac0c8a62beb9af90d5eddd6e5892f0d61206d4e15631be0",
        "--expected-existing-event-bindings=0",
        "--expected-existing-event-ids=0",
        "--expected-non-empty-registry-keys=0",
        "--expected-neon-host=ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech",
        "--confirm=GATE_2C_PREVIEW_EVENTS_WRITE",
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
