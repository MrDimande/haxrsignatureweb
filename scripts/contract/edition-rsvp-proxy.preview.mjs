#!/usr/bin/env node
/**
 * P1.1 Preview gate — Edition proxy vs Core autenticado.
 *
 *   EDITION_BASE_URL=https://edition-preview.vercel.app
 *   CORE_BASE_URL=https://core-preview.vercel.app
 *   HAXR_EDITION_PROXY_SECRET=<shared>
 *   npm run contract:edition-rsvp:proxy:preview
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  resolveCoreProtectionBypass,
  resolveEditionProtectionBypass,
} from "./resolve-preview-bypass.mjs";

const editionBase = process.env.EDITION_BASE_URL?.replace(/\/$/, "");
const coreBase = process.env.CORE_BASE_URL?.replace(/\/$/, "");
const proxySecret = process.env.HAXR_EDITION_PROXY_SECRET?.trim();

if (!editionBase || !coreBase) {
  console.error(
    "EDITION_BASE_URL and CORE_BASE_URL are required.\n" +
      "  EDITION_BASE_URL=https://... CORE_BASE_URL=https://... npm run contract:edition-rsvp:proxy:preview"
  );
  process.exit(2);
}

if (!proxySecret) {
  console.error("HAXR_EDITION_PROXY_SECRET is required.");
  process.exit(2);
}

const coreBypass = resolveCoreProtectionBypass(coreBase);
const editionBypass = resolveEditionProtectionBypass(editionBase);

if (coreBase.includes("vercel.app") && !coreBypass) {
  console.error("Could not resolve Core preview protection bypass.");
  process.exit(2);
}

if (editionBase.includes("vercel.app") && !editionBypass) {
  console.error(
    "Could not resolve Edition preview protection bypass. Set EDITION_VERCEL_PROJECT_ID."
  );
  process.exit(2);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractScript = path.join(scriptDir, "edition-rsvp.contract.mjs");
const coreRoot = path.resolve(scriptDir, "../..");

async function assertCoreRejectsWithoutSecret() {
  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    "X-Forwarded-For": "203.0.113.254",
  };
  if (coreBypass) {
    headers["x-vercel-protection-bypass"] = coreBypass;
  }

  const response = await fetch(`${coreBase}/api/v1/edition/rsvp`, {
    method: "POST",
    headers,
    body: JSON.stringify({ attending: true, guests: 1 }),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (response.status !== 401) {
    console.log(
      `✗ core rejects unauthenticated direct calls (got ${response.status})`
    );
    process.exit(1);
  }

  if (
    !json ||
    typeof json !== "object" ||
    /** @type {Record<string, unknown>} */ (json).success !== false
  ) {
    console.log("✗ core 401 missing success envelope");
    process.exit(1);
  }

  console.log("✓ core rejects unauthenticated direct calls (401)");
}

function runBatch(offset, limit, label) {
  console.log(`\n--- Preview proxy batch ${label} ---\n`);
  return spawnSync(process.execPath, [contractScript], {
    stdio: "inherit",
    env: {
      ...process.env,
      CONTRACT_PHASE: "proxy-preview",
      CONTRACT_CASE_OFFSET: String(offset),
      CONTRACT_CASE_LIMIT: String(limit),
      EDITION_BASE_URL: editionBase,
      CORE_BASE_URL: coreBase,
      CORE_PROTECTION_BYPASS: coreBypass ?? "",
      EDITION_PROTECTION_BYPASS: editionBypass ?? "",
      HAXR_EDITION_PROXY_SECRET: proxySecret,
    },
  });
}

console.log("P1.1 Preview proxy gate — Edition → Core");
console.log(`  Edition: ${editionBase}/api/rsvp (proxy)`);
console.log(`  Core:    ${coreBase}/api/v1/edition/rsvp`);

async function main() {
  await assertCoreRejectsWithoutSecret();

  const batchA = runBatch(0, 4, "A (cases 1-4)");
  if (batchA.status !== 0) {
    process.exit(batchA.status ?? 1);
  }

  const batchB = runBatch(4, 3, "B (cases 5-7)");
  process.exit(batchB.status ?? 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
