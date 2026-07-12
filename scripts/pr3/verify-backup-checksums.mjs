/**
 * PR.3 — valida SHA-256 dos artefactos de backup contra checksums.sha256.
 * Uso: node scripts/pr3/verify-backup-checksums.mjs [pasta-backup]
 */
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const defaultDir = resolve(
  process.cwd(),
  "backups/pr3-production-pre036/2026-07-12T06-48-00",
);
const dir = resolve(process.argv[2] ?? defaultDir);
const sumFile = join(dir, "checksums.sha256");

if (!existsSync(sumFile)) {
  console.error(JSON.stringify({ pass: false, reason: "checksums_file_missing", dir }));
  process.exit(1);
}

const lines = readFileSync(sumFile, "utf8")
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

const results = [];
let pass = true;

for (const line of lines) {
  const match = line.match(/^([A-Fa-f0-9]{64})\s{2}(.+)$/);
  if (!match) {
    pass = false;
    results.push({ file: line, status: "PARSE_FAIL" });
    continue;
  }

  const [, expected, name] = match;
  const filePath = join(dir, name);
  if (!existsSync(filePath)) {
    pass = false;
    results.push({ file: name, status: "MISSING" });
    continue;
  }

  const actual = crypto
    .createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex")
    .toUpperCase();
  const ok = actual === expected.toUpperCase();
  if (!ok) pass = false;
  results.push({
    file: name,
    status: ok ? "OK" : "MISMATCH",
    expected: expected.toUpperCase(),
    ...(ok ? {} : { actual }),
  });
}

const report = {
  pass,
  dir,
  checked: results.length,
  timestamp: new Date().toISOString(),
  results,
};

console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
