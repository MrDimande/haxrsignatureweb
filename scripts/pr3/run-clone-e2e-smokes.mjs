/**
 * PR.3 — smokes E2E exclusivamente no clone rkkxfrwtmsqzpnbkshnd.
 * Nunca executa contra producao. Pode aplicar 036–043 no clone se em falta.
 *
 * Uso (com PGPASSWORD + PR4_DATABASE_URL na sessao):
 *   node scripts/pr3/run-clone-e2e-smokes.mjs
 *   node scripts/pr3/run-clone-e2e-smokes.mjs --skip-migrate
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { withClient, queryOne } from "../pr4/lib/pr4-db.mjs";
import { PRODUCTION_REF, CLONE_REF } from "./lib/pr3-guards.mjs";

const skipMigrate = process.argv.includes("--skip-migrate");
const reportPath = resolve(
  process.cwd(),
  "backups/pr3-production-pre036/pr3-clone-e2e-smoke-report.json",
);

const report = {
  phase: "pr3-clone-e2e-smokes",
  startedAt: new Date().toISOString(),
  targetRef: CLONE_REF,
  productionRef: PRODUCTION_REF,
  productionTouched: false,
  phases: [],
  pass: false,
};

function logPhase(name, data) {
  report.phases.push({ name, at: new Date().toISOString(), ...data });
}

function runNode(script, args = [], extraEnv = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  return result.status ?? 1;
}

function fail(reason, extra = {}) {
  logPhase("ABORT", { pass: false, reason, ...extra });
  report.finishedAt = new Date().toISOString();
  report.pass = false;
  mkdirSync(resolve(process.cwd(), "backups/pr3-production-pre036"), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exit(1);
}

const url = process.env.PR4_DATABASE_URL?.trim() ?? "";
if (!url || url.includes(PRODUCTION_REF) || !url.includes(CLONE_REF)) {
  fail("invalid_or_missing_PR4_DATABASE_URL", {
    hint: "postgresql://postgres.rkkxfrwtmsqzpnbkshnd@aws-0-eu-central-1.pooler.supabase.com:5432/postgres",
  });
}

if (!process.env.PGPASSWORD?.trim()) {
  fail("missing_PGPASSWORD");
}

const pre = await withClient(async (client) => {
  const db = await queryOne(client, `SELECT current_database() AS db, current_user AS usr`);
  const objects = await queryOne(
    client,
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') AS profiles,
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_events') AS client_events`,
  );
  return { db, objects };
});

logPhase("preflight_clone", { pass: true, ...pre });

if (!skipMigrate && (!pre.objects?.profiles || !pre.objects?.client_events)) {
  logPhase("apply_migrations_036_043", { note: "clone only — production untouched" });
  if (runNode("scripts/pr4/dry-run-migrations.mjs") !== 0) {
    fail("dry_run_migrations_failed");
  }
  logPhase("apply_migrations_036_043", { pass: true });
} else if (pre.objects?.profiles && pre.objects?.client_events) {
  logPhase("apply_migrations_036_043", { pass: true, skipped: true, reason: "already_present" });
} else {
  logPhase("apply_migrations_036_043", { skipped: true, reason: "skip_migrate_flag" });
}

const baseChecks = [
  ["verify_post_036", "scripts/pr4/verify-post-036.mjs"],
  ["verify_post_038_meta", "scripts/pr4/verify-post-038.mjs"],
  ["verify_rpcs_meta", "scripts/pr4/verify-rpcs.mjs"],
];

for (const [name, script] of baseChecks) {
  const code = runNode(script);
  logPhase(name, { pass: code === 0 });
  if (code !== 0) fail(`${name}_failed`);
}

const isolationCode = runNode("scripts/pr3/clone-db-isolation-smoke.mjs");
logPhase("clone_db_isolation", { pass: isolationCode === 0 });
if (isolationCode !== 0) fail("clone_db_isolation_failed");

const fixtureRow = await withClient(async (client) =>
  queryOne(client, `SELECT id FROM public.client_events ORDER BY created_at DESC LIMIT 1`),
);
const fixtureClientEventId = fixtureRow?.id;
if (!fixtureClientEventId) {
  fail("no_client_event_for_provision_fixture");
}

const provisionEnv = { PR4_CLIENT_EVENT_ID: fixtureClientEventId };
if (runNode("scripts/pr4/verify-post-038.mjs", [], provisionEnv) !== 0) {
  fail("provision_idempotency_failed");
}
logPhase("provision_idempotency", { pass: true, fixtureClientEventId });

if (runNode("scripts/pr4/verify-rpcs.mjs", [], provisionEnv) !== 0) {
  fail("rpc_payloads_failed");
}
logPhase("rpc_payloads", {
  pass: true,
  fixtureClientEventId,
  domains: ["guests", "payments", "vendors", "checklist", "documents"],
});

report.finishedAt = new Date().toISOString();
report.pass = true;
mkdirSync(resolve(process.cwd(), "backups/pr3-production-pre036"), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pass: true, reportPath, productionTouched: false }, null, 2));
