/**
 * PR.4.1 - preflight psql (libpq) com PR4_DATABASE_URL original (sem uselibpqcompat).
 */
import { spawnSync } from "node:child_process";
import { resolveLibpqDatabaseUrl, resolvePsqlBin } from "./lib/pr4-db.mjs";
import { validateDryRunDest } from "./validate-dryrun-dest.mjs";

const dest = validateDryRunDest();
if (dest.abort) {
  console.log(JSON.stringify({ pass: false, client: "psql", phase: "validate", ...dest }, null, 2));
  process.exit(2);
}

const libpqUrl = resolveLibpqDatabaseUrl();
const psql = resolvePsqlBin();

const started = Date.now();
const result = spawnSync(
  psql,
  [
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "SELECT current_database() AS database, current_user, session_user",
    libpqUrl,
  ],
  { encoding: "utf8", stdio: "pipe", env: process.env },
);

const report = {
  pass: result.status === 0,
  client: "psql",
  ms: Date.now() - started,
  error: result.status === 0 ? null : (result.stderr || result.stdout || "").trim().slice(0, 1500),
  note: "libpq URL sem uselibpqcompat; PGPASSWORD via env.",
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
