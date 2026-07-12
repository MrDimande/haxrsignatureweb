#!/usr/bin/env node
/**
 * Phase 2 — staging parity (Edition prod vs Core preview).
 * Runs in 2 batches (max 4 cases each) to respect 8 req/15 min on real IP.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resolveCoreProtectionBypass } from "./resolve-preview-bypass.mjs";

const corePreview = process.env.CORE_PREVIEW_URL?.replace(/\/$/, "");
if (!corePreview) {
  console.error(
    "CORE_PREVIEW_URL is required.\n" +
      "  CORE_PREVIEW_URL=https://your-preview.vercel.app npm run contract:edition-rsvp:staging"
  );
  process.exit(2);
}

const editionBase =
  process.env.EDITION_BASE_URL?.replace(/\/$/, "") ||
  "https://edition.haxrsignature.com";

const bypass = resolveCoreProtectionBypass(corePreview);
if (corePreview.includes("vercel.app") && !bypass) {
  console.error(
    "Could not resolve Vercel Deployment Protection bypass for Core preview."
  );
  process.exit(2);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractScript = path.join(scriptDir, "edition-rsvp.contract.mjs");
const coreRoot = path.resolve(scriptDir, "../..");

function runBatch(offset, limit, label) {
  console.log(`\n--- Staging batch ${label} ---\n`);
  return spawnSync(process.execPath, [contractScript], {
    stdio: "inherit",
    env: {
      ...process.env,
      CONTRACT_PHASE: "staging",
      CONTRACT_CASE_OFFSET: String(offset),
      CONTRACT_CASE_LIMIT: String(limit),
      EDITION_BASE_URL: editionBase,
      CORE_BASE_URL: corePreview,
      CORE_PROTECTION_BYPASS: bypass ?? "",
      HAXR_CORE_CWD: coreRoot,
    },
  });
}

console.log("Staging parity — Edition (production) vs Core (preview)");
console.log(`  Edition: ${editionBase}`);
console.log(`  Core:    ${corePreview}`);
console.log("  Core bypass: resolved via Vercel CLI");

const batchA = runBatch(0, 4, "A (cases 1-4)");
if (batchA.status !== 0) {
  process.exit(batchA.status ?? 1);
}

const batchB = runBatch(4, 3, "B (cases 5-7)");
process.exit(batchB.status ?? 1);
