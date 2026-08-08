#!/usr/bin/env node
/**
 * Local migration version-set guard (no remote credentials required).
 *
 * - Detects duplicate local versions
 * - Rejects new short/non-timestamp versions outside the explicit legacy allowlist
 * - Ignores supabase/rollbacks and *.down.sql
 *
 * Exit 0 = pass, 1 = fail.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(repoRoot, "supabase", "migrations");

/** Explicit allowlist for pre-timestamp legacy versions already shipped. */
const LEGACY_VERSION_ALLOWLIST = new Set([
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
  "014",
  "015",
  "016",
  "017",
  "018",
  "019",
  "020",
  "021",
  "022",
  "023",
  "024",
  "025",
  "026",
  "027",
  "028",
  "0281",
  "029",
  "0301",
  "0302",
  "031",
  "032",
  "033",
  "034",
  "035",
  "036",
  "037",
  "038",
  "039",
  "040",
  "041",
  "042",
  "043",
  "044",
  "045",
  "046",
]);

/** Full UTC timestamp versions: YYYYMMDDHHmmss (14 digits). */
const TIMESTAMP_VERSION_RE = /^\d{14}$/;

function extractVersion(filename) {
  const base = path.basename(filename);
  if (!base.endsWith(".sql")) return null;
  if (base.endsWith(".down.sql")) return null;
  const underscore = base.indexOf("_");
  if (underscore <= 0) return null;
  return base.slice(0, underscore);
}

function isAllowedVersion(version) {
  if (LEGACY_VERSION_ALLOWLIST.has(version)) return true;
  return TIMESTAMP_VERSION_RE.test(version);
}

function main() {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`FAIL: migrations directory missing: ${migrationsDir}`);
    process.exit(1);
  }

  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".sql") && !d.name.endsWith(".down.sql"))
    .map((d) => d.name)
    .sort();

  const byVersion = new Map();
  const errors = [];

  for (const name of entries) {
    const version = extractVersion(name);
    if (!version) {
      errors.push(`unparseable migration filename: ${name}`);
      continue;
    }

    if (!byVersion.has(version)) byVersion.set(version, []);
    byVersion.get(version).push(name);

    if (!isAllowedVersion(version)) {
      errors.push(
        `rejected version "${version}" in ${name}: new migrations must use a 14-digit UTC timestamp (YYYYMMDDHHmmss); short legacy-style versions require an explicit allowlist entry`,
      );
    }
  }

  for (const [version, files] of byVersion.entries()) {
    if (files.length > 1) {
      errors.push(`duplicate local version "${version}": ${files.join(", ")}`);
    }
  }

  // Safety: rollbacks must not live under migrations/
  const rollbackLeak = entries.filter((n) => n.includes(".down."));
  for (const name of rollbackLeak) {
    errors.push(`rollback-looking file inside migrations/: ${name}`);
  }

  const versions = [...byVersion.keys()].sort();
  console.log(`migrations_scanned=${entries.length}`);
  console.log(`unique_versions=${versions.length}`);
  console.log(`legacy_allowlist_size=${LEGACY_VERSION_ALLOWLIST.size}`);
  console.log(`028_present=${byVersion.has("028")}`);
  console.log(`0281_present=${byVersion.has("0281")}`);

  if (errors.length > 0) {
    console.error("FAIL: migration version-set check");
    for (const err of errors) console.error(` - ${err}`);
    process.exit(1);
  }

  console.log("PASS: migration version-set check");
  process.exit(0);
}

main();
