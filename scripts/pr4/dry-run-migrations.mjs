/**
 * PR.4 — orquestrador do ensaio 036–043 no clone isolado.
 * Requer PR4_DATABASE_URL. Bloqueia produção por defeito.
 *
 * Uso:
 *   PR4_DATABASE_URL=... node scripts/pr4/dry-run-migrations.mjs
 *   PR4_DATABASE_URL=... node scripts/pr4/dry-run-migrations.mjs --rollback
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveDatabaseUrl, withClient } from "./lib/pr4-db.mjs";

const rollback = process.argv.includes("--rollback");
resolveDatabaseUrl(); // fail fast

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function applySqlFile(relativePath) {
  const sql = readFileSync(resolve(process.cwd(), relativePath), "utf8");
  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

if (rollback) {
  console.log("==> PR.4 rollback 036–043");
  await applySqlFile("scripts/pr4/rollback-036-043.sql");
  runNode("scripts/pr4/verify-pre-migration.mjs");
  console.log(JSON.stringify({ pass: true, phase: "rollback" }));
  process.exit(0);
}

console.log("==> PR.4 pre-migration");
runNode("scripts/pr4/verify-pre-migration.mjs");

const steps = ["036", "037", "038", "039", "040", "041", "042", "043"];
for (const step of steps) {
  console.log(`==> apply ${step}`);
  runNode("scripts/pr4/apply-migration.mjs", [step]);
  if (step === "036") runNode("scripts/pr4/verify-post-036.mjs");
  if (step === "038") runNode("scripts/pr4/verify-post-038.mjs");
  if (step === "043") runNode("scripts/pr4/verify-rpcs.mjs");
}

console.log(JSON.stringify({ pass: true, phase: "apply", steps }, null, 2));
