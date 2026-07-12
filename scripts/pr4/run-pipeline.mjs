/**
 * PR.4.1 — orquestrador completo do dry-run (dump → restore → migrations → testes).
 * Requer pr4-env.local ou variáveis PR4_* definidas. Nunca imprime secrets.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import "./load-env.mjs";
import { validatePr4Env } from "./validate-env.mjs";
import {
  buildPgClientConfig,
  resolveLibpqDatabaseUrl,
  resolvePsqlBin,
} from "./lib/pr4-db.mjs";

const PG_BIN = "C:\\Program Files\\edb\\as18\\bin";
const PG_DUMP = resolve(PG_BIN, "pg_dump.exe");
const PSQL = resolvePsqlBin();
const DUMP_PATH = resolve(process.cwd(), "backups/production-public-pre036-schema.sql");
const REPORT_PATH = resolve(process.cwd(), "backups/pr4-dry-run-report.json");

const DRY_RUN_REF = "rkkxfrwtmsqzpnbkshnd";
const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";

const report = {
  startedAt: new Date().toISOString(),
  cloneRef: DRY_RUN_REF,
  productionRef: PRODUCTION_REF,
  phases: [],
};

function logPhase(name, data) {
  const entry = { name, at: new Date().toISOString(), ...data };
  report.phases.push(entry);
  console.log(`==> ${name}`, data?.pass === false ? "(FAIL)" : "");
  if (data && Object.keys(data).length) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function runNode(script, args = [], extraEnv = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    cwd: process.cwd(),
  });
  return result.status ?? 1;
}

function runPsql(url, file, label) {
  const started = Date.now();
  const result = spawnSync(
    PSQL,
    ["-X", "-v", "ON_ERROR_STOP=1", "-f", file, url],
    { stdio: "pipe", encoding: "utf8", env: process.env },
  );
  const ms = Date.now() - started;
  const ok = result.status === 0;
  return {
    label,
    ok,
    ms,
    stderr: ok ? undefined : (result.stderr || result.stdout || "").slice(0, 2000),
  };
}

function validateDumpFile() {
  const content = readFileSync(DUMP_PATH, "utf8");
  const hasCopy = /^COPY\s+/m.test(content);
  const hasInsertData = /^INSERT INTO/m.test(content);
  const hasPassword = /postgresql:\/\/[^@\s]+:[^@\s]+@/i.test(content);
  const size = statSync(DUMP_PATH).size;
  return {
    ok: !hasCopy && !hasInsertData && !hasPassword && size > 0,
    sizeBytes: size,
    hasCopy,
    hasInsertData,
    hasPassword,
  };
}

async function queryDest(sql, params = []) {
  const client = new pg.Client(buildPgClientConfig());
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

function gitIgnoresDump() {
  const result = spawnSync("git", ["check-ignore", "-v", DUMP_PATH], {
    encoding: "utf8",
  });
  return result.status === 0;
}

function fail(reason, data = {}) {
  logPhase("ABORT", { pass: false, reason, ...data });
  report.finishedAt = new Date().toISOString();
  report.pass = false;
  mkdirSync(resolve(process.cwd(), "backups"), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  process.exit(1);
}

// --- 1. Validar env ---
const envCheck = validatePr4Env();
logPhase("env_check", {
  sourceSet: envCheck.sourceSet,
  destSet: envCheck.destSet,
  sourceHasProductionRef: envCheck.sourceHasProductionRef,
  destHasDryRunRef: envCheck.destHasDryRunRef,
  swapped: envCheck.swapped,
  pass: !envCheck.abort,
});
if (envCheck.abort) fail(envCheck.reason ?? "env_invalid", envCheck);

// --- 2. Teste read-only origem ---
if (runNode("scripts/pr4/test-source-readonly.mjs") !== 0) {
  fail("source_readonly_test_failed");
}
logPhase("source_readonly", { pass: true });

// --- 3. Dump schema-only (read-only) ---
mkdirSync(resolve(process.cwd(), "backups"), { recursive: true });
const dumpStarted = Date.now();
process.env.PGOPTIONS = "-c default_transaction_read_only=on";
const dumpResult = spawnSync(
  PG_DUMP,
  [
    process.env.PR4_SOURCE_DATABASE_URL,
    "--schema-only",
    "--schema=public",
    "--no-owner",
    "--no-privileges",
    "--file",
    DUMP_PATH,
  ],
  { stdio: "pipe", encoding: "utf8", env: process.env },
);
const dumpMs = Date.now() - dumpStarted;

if (dumpResult.status !== 0) {
  fail("pg_dump_failed", { ms: dumpMs, stderr: (dumpResult.stderr || "").slice(0, 1500) });
}

const dumpValidation = validateDumpFile();
logPhase("schema_dump", { pass: dumpValidation.ok, ms: dumpMs, ...dumpValidation });
if (!dumpValidation.ok) fail("dump_validation_failed", dumpValidation);

const gitIgnored = gitIgnoresDump();
logPhase("dump_gitignored", { pass: gitIgnored });
if (!gitIgnored) fail("dump_not_gitignored");

// --- 4. Preparar + restaurar clone ---
const libpqUrl = resolveLibpqDatabaseUrl();
const prepare = runPsql(libpqUrl, "scripts/pr4/prepare-clone-public.sql", "prepare");
logPhase("prepare_clone_public", prepare);
if (!prepare.ok) fail("prepare_clone_failed", prepare);

const restore = runPsql(libpqUrl, DUMP_PATH, "restore");
logPhase("restore_schema", restore);
if (!restore.ok) fail("restore_failed", restore);

const fixtures = runPsql(libpqUrl, "scripts/pr4/fixtures-minimal.sql", "fixtures");
logPhase("apply_fixtures", fixtures);
if (!fixtures.ok) fail("fixtures_failed", fixtures);

// --- 5. Baseline pré-036 ---
if (runNode("scripts/pr4/verify-pre-migration.mjs") !== 0) {
  fail("pre_migration_baseline_failed");
}

const baselineExtra = await queryDest(`
  SELECT
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='auth' AND table_name='users') AS auth_users,
    (SELECT COUNT(*)::int FROM pg_trigger t
      JOIN pg_class c ON c.oid=t.tgrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='auth' AND c.relname='users' AND t.tgname='on_auth_user_created') AS auth_trigger_count
`);
logPhase("baseline_extended", { pass: true, ...baselineExtra[0] });

// --- 6. Dry-run migrations 036-043 ---
const migrationStarted = Date.now();
if (runNode("scripts/pr4/dry-run-migrations.mjs") !== 0) {
  fail("dry_run_migrations_failed");
}
logPhase("dry_run_migrations", { pass: true, ms: Date.now() - migrationStarted });

// --- 7. npm test + build ---
const testStatus = spawnSync("npm", ["test"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
}).status;
logPhase("npm_test", { pass: testStatus === 0, exitCode: testStatus });

const buildStatus = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
}).status;
logPhase("npm_build", { pass: buildStatus === 0, exitCode: buildStatus });

// --- 8. Smokes (opcional — requer keys/API local) ---
const smokeScripts = [
  "scripts/test-c1-post-events-preview.mjs",
  "scripts/test-d-onboarding-sync-preview.mjs",
  "scripts/test-e1-dashboard-preview.mjs",
  "scripts/test-e4-guests-preview.mjs",
  "scripts/test-e4-payments-preview.mjs",
  "scripts/test-e4-vendors-preview.mjs",
  "scripts/test-e4-checklist-preview.mjs",
  "scripts/test-e4-documents-preview.mjs",
];
const smokeResults = [];
for (const script of smokeScripts) {
  const code = runNode(script);
  smokeResults.push({ script, pass: code === 0, exitCode: code });
}
logPhase("smokes", {
  pass: smokeResults.every((s) => s.pass),
  results: smokeResults,
  note: "Smokes exigem API local + preview keys; ver resultados individuais.",
});

// --- 9. Rollback ensaio ---
if (runNode("scripts/pr4/dry-run-migrations.mjs", ["--rollback"]) !== 0) {
  fail("rollback_failed");
}
logPhase("rollback", { pass: true });

const legacyIntact = await queryDest(`
  SELECT
    (SELECT COUNT(*)::int FROM public.events) AS events_count,
    (SELECT COUNT(*)::int FROM public.guests) AS guests_count,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') AS profiles_after_rollback
`);
logPhase("legacy_after_rollback", {
  pass: legacyIntact[0]?.events_count > 0 && legacyIntact[0]?.profiles_after_rollback === false,
  ...legacyIntact[0],
});

report.finishedAt = new Date().toISOString();
report.pass = report.phases.every((p) => p.pass !== false);
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pass: report.pass, reportPath: "backups/pr4-dry-run-report.json" }, null, 2));
process.exit(report.pass ? 0 : 1);
