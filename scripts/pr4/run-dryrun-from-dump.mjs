/**
 * PR.4.1 — dry-run a partir do dump local (sem produção).
 * Requer PR4_DATABASE_URL → rkkxfrwtmsqzpnbkshnd e dump em backups/.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { validateDryRunDest } from "./validate-dryrun-dest.mjs";
import { buildPgClientConfig, resolveLibpqDatabaseUrl, resolvePsqlBin } from "./lib/pr4-db.mjs";
import { evaluateSmokeReadiness } from "./smokes-preflight.mjs";

const PSQL = resolvePsqlBin();
const DUMP_PATH = resolve(process.cwd(), "backups/production-public-pre036-schema.sql");
const REPORT_PATH = resolve(process.cwd(), "backups/pr4-dry-run-report.json");
const DRY_RUN_REF = "rkkxfrwtmsqzpnbkshnd";

/** PR.4.1 — smokes preview são opcionais por contrato. */
const SMOKES_REQUIRED = false;

const LEGITIMATE_SMOKE_SKIP_REASONS = new Set([
  "build_failed",
  "credentials_missing",
  "preview_environment_invalid",
  "server_unavailable",
]);

const SMOKE_SCRIPTS = [
  "scripts/test-c1-post-events-preview.mjs",
  "scripts/test-d-onboarding-sync-preview.mjs",
  "scripts/test-e1-dashboard-preview.mjs",
  "scripts/test-e4-guests-preview.mjs",
  "scripts/test-e4-payments-preview.mjs",
  "scripts/test-e4-vendors-preview.mjs",
  "scripts/test-e4-checklist-preview.mjs",
  "scripts/test-e4-documents-preview.mjs",
];

/** Smokes que importam módulos TypeScript — requerem tsx. */
const TSX_SMOKE_SCRIPTS = new Set(["scripts/test-d-onboarding-sync-preview.mjs"]);

const report = {
  startedAt: new Date().toISOString(),
  mode: "dryrun_from_local_dump",
  cloneRef: DRY_RUN_REF,
  productionTouched: false,
  dryRunWasPrepared: false,
  restoreCompleted: false,
  databaseRehearsalPass: false,
  coreRehearsalPass: false,
  unitTestsPass: false,
  buildPass: false,
  smokesPass: false,
  smokesSkipped: false,
  smokesRequired: SMOKES_REQUIRED,
  smokesSkipReason: null,
  rollbackPass: false,
  status: "fail",
  overallPass: false,
  phases: [],
};

let rollbackAttempted = false;

function phase(name, data = {}) {
  const entry = { name, at: new Date().toISOString(), ...data };
  report.phases.push(entry);
  console.log(`\n==> ${name}`);
  if (Object.keys(data).length) console.log(JSON.stringify(data, null, 2));
  return entry;
}

function computeReportStatus() {
  report.coreRehearsalPass =
    report.databaseRehearsalPass === true &&
    report.unitTestsPass === true &&
    report.buildPass === true &&
    report.productionTouched === false;

  const mandatoryPass =
    report.coreRehearsalPass === true && report.rollbackPass === true;

  if (!mandatoryPass) {
    report.status = "fail";
    report.overallPass = false;
    return;
  }

  if (report.smokesPass === true) {
    report.status = "pass";
    report.overallPass = true;
    return;
  }

  if (report.smokesSkipped === true) {
    const legitimate = LEGITIMATE_SMOKE_SKIP_REASONS.has(report.smokesSkipReason);
    if (!legitimate) {
      report.status = "fail";
      report.overallPass = false;
      return;
    }

    if (!SMOKES_REQUIRED) {
      report.status = "pass_with_optional_checks_skipped";
      report.overallPass = true;
      return;
    }

    report.status = "partial_pass";
    report.overallPass = false;
    return;
  }

  report.status = "fail";
  report.overallPass = false;
}

function writeReport() {
  computeReportStatus();
  report.finishedAt = new Date().toISOString();
  report.pass = report.overallPass;

  mkdirSync(resolve(process.cwd(), "backups"), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        status: report.status,
        overallPass: report.overallPass,
        coreRehearsalPass: report.coreRehearsalPass,
        databaseRehearsalPass: report.databaseRehearsalPass,
        unitTestsPass: report.unitTestsPass,
        buildPass: report.buildPass,
        smokesPass: report.smokesPass,
        smokesSkipped: report.smokesSkipped,
        smokesRequired: report.smokesRequired,
        smokesSkipReason: report.smokesSkipReason,
        rollbackPass: report.rollbackPass,
        productionTouched: report.productionTouched,
        reportPath: "backups/pr4-dry-run-report.json",
      },
      null,
      2,
    ),
  );
}

function exitWithReport(exitCode = null) {
  writeReport();
  const code = exitCode ?? (report.overallPass ? 0 : 1);
  process.exit(code);
}

function abort(reason, data = {}) {
  phase("ABORT", { pass: false, reason, ...data });
  exitWithReport(1);
}

async function ensureRollback() {
  if (!report.databaseRehearsalPass || rollbackAttempted) return;
  rollbackAttempted = true;

  if (runNode("scripts/pr4/dry-run-migrations.mjs", ["--rollback"]) !== 0) {
    report.rollbackPass = false;
    phase("rollback_failed", { pass: false });
    return;
  }

  try {
    const legacy = await queryDest(`
      SELECT
        (SELECT COUNT(*)::int FROM public.events) AS events_count,
        (SELECT COUNT(*)::int FROM public.guests) AS guests_count,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') AS profiles_remain
    `);
    const legacyPass = legacy[0]?.events_count > 0 && legacy[0]?.profiles_remain === false;
    report.rollbackPass = legacyPass;

    phase("rollback_legacy_intact", {
      pass: legacyPass,
      destructive_drop: "profiles/client_events/event_members/snapshots — apenas ensaio",
      ...legacy[0],
    });
  } catch (error) {
    report.rollbackPass = false;
    phase("rollback_legacy_intact", {
      pass: false,
      error: error.message,
    });
  }
}

function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
  return r.status ?? 1;
}

function runSmokeScript(script) {
  const args = TSX_SMOKE_SCRIPTS.has(script)
    ? ["--import", "tsx", script]
    : [script];

  const r = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });

  return r.status ?? 1;
}

function runPsql(file, label, { singleTransaction = false } = {}) {
  const libpqUrl = resolveLibpqDatabaseUrl();
  const started = Date.now();
  const args = ["-X", "-v", "ON_ERROR_STOP=1"];
  if (singleTransaction) args.push("--single-transaction");
  args.push("-f", file, libpqUrl);
  const r = spawnSync(PSQL, args, {
    encoding: "utf8",
    stdio: "pipe",
    env: process.env,
  });
  return {
    label,
    ok: r.status === 0,
    ms: Date.now() - started,
    singleTransaction,
    stderr: r.status === 0 ? undefined : (r.stderr || r.stdout || "").slice(0, 2500),
  };
}

function validateDump() {
  if (!existsSync(DUMP_PATH)) return { ok: false, reason: "dump_missing" };
  const content = readFileSync(DUMP_PATH, "utf8");
  const sizeBytes = statSync(DUMP_PATH).size;
  const hasCopy = /^COPY\s+/m.test(content);
  const hasInsert = /^INSERT INTO/m.test(content);
  const hasConn = /postgresql:\/\//i.test(content);
  const createSchemaMatches =
    content.match(/^\s*CREATE\s+SCHEMA\s+public\s*;/gim) ?? [];
  const createSchemaPublicCount = createSchemaMatches.length;
  return {
    ok: sizeBytes > 0 && !hasCopy && !hasInsert && !hasConn,
    sizeBytes,
    hasCopy,
    hasInsert,
    hasConn,
    createSchemaPublicCount,
    createSchemaPublicOk: createSchemaPublicCount === 1,
  };
}

async function queryDest(sql, params = []) {
  const client = new pg.Client(buildPgClientConfig());
  await client.connect();
  try {
    return (await client.query(sql, params)).rows;
  } finally {
    await client.end();
  }
}

// --- 1. Destino ---
const dest = validateDryRunDest();
phase("dest_check", dest);
if (dest.abort) abort(dest.reason ?? "invalid_dest", dest);

// --- 2. Dump local ---
const dump = validateDump();
phase("dump_local", dump);
if (!dump.ok) abort("dump_invalid", dump);

const gitIgnore = spawnSync("git", ["check-ignore", "-v", DUMP_PATH], { encoding: "utf8" });
phase("dump_gitignored", { pass: gitIgnore.status === 0 });

// --- 2b. Preflight Node + psql (antes de DROP SCHEMA) ---
if (runNode("scripts/pr4/test-dryrun-connection-node.mjs") !== 0) {
  abort("dryrun_node_connection_failed");
}
phase("dryrun_connection_node", { pass: true });

if (runNode("scripts/pr4/test-dryrun-connection-psql.mjs") !== 0) {
  abort("dryrun_psql_connection_failed");
}
phase("dryrun_connection_psql", { pass: true });

// --- 2c. Dump contém exactamente um CREATE SCHEMA public (antes do prepare) ---
if (!dump.createSchemaPublicOk) {
  abort("dump_create_schema_public_invalid", {
    createSchemaPublicCount: dump.createSchemaPublicCount,
  });
}
phase("dump_create_schema_public", {
  pass: true,
  createSchemaPublicCount: dump.createSchemaPublicCount,
});

// --- 3. Preparar public no clone (DROP only — idempotente) ---
const prepare = runPsql("scripts/pr4/prepare-clone-public.sql", "prepare");
phase("prepare_public", prepare);
if (!prepare.ok) abort("prepare_failed", prepare);
report.dryRunWasPrepared = true;

// --- 4. Restore (single transaction, URL libpq, PGPASSWORD da sessão) ---
const restore = runPsql(DUMP_PATH, "restore", { singleTransaction: true });
phase("restore_schema", restore);
if (!restore.ok) {
  report.restoreCompleted = false;
  abort("restore_failed", restore);
}
report.restoreCompleted = true;

// --- 4b. Validar objectos restaurados ---
if (runNode("scripts/pr4/verify-post-restore.mjs") !== 0) {
  abort("post_restore_validation_failed");
}
phase("verify_post_restore", { pass: true });

// --- 5. Fixtures fictícias (transacção única — para no primeiro erro) ---
const fixtures = runPsql("scripts/pr4/fixtures-minimal.sql", "fixtures", {
  singleTransaction: true,
});
phase("fixtures", fixtures);
if (!fixtures.ok) abort("fixtures_failed", fixtures);

// --- 5b. Validar fixtures + FKs + ausência de objectos 036–043 ---
if (runNode("scripts/pr4/verify-fixtures.mjs") !== 0) {
  abort("verify_fixtures_failed");
}
phase("verify_fixtures", { pass: true });

// --- 6. Baseline pré-036 ---
if (runNode("scripts/pr4/verify-pre-migration.mjs") !== 0) {
  abort("pre_migration_failed");
}
phase("verify_pre_migration", { pass: true });

// --- 7. Migrations 036–043 ---
const steps = ["036", "037", "038", "039", "040", "041", "042", "043"];
for (const version of steps) {
  const started = Date.now();
  if (runNode("scripts/pr4/apply-migration.mjs", [version]) !== 0) {
    abort(`migration_${version}_failed`, { version, ms: Date.now() - started });
  }
  const ms = Date.now() - started;
  let verify = { pass: true, skipped: true };
  if (version === "036") {
    verify = { pass: runNode("scripts/pr4/verify-post-036.mjs") === 0 };
  } else if (version === "038") {
    verify = { pass: runNode("scripts/pr4/verify-post-038.mjs") === 0 };
  } else if (version === "043") {
    verify = { pass: runNode("scripts/pr4/verify-rpcs.mjs") === 0 };
  }
  phase(`migration_${version}`, { pass: verify.pass !== false, ms, verify });
  if (verify.pass === false) abort(`verify_after_${version}_failed`, { version });
}

// --- 8. ACL/RLS snapshot pós-043 ---
const acl = await queryDest(`
  SELECT
    (SELECT COUNT(*)::int FROM pg_policies WHERE schemaname='public'
      AND tablename IN ('profiles','client_events','event_members','event_onboarding_snapshots')) AS client_policies,
    (SELECT COUNT(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname IN (
        'provision_client_operational_event','get_client_event_guests',
        'get_client_event_payments','get_client_event_vendors',
        'get_client_event_checklist','get_client_event_documents'
      )) AS rpc_count
`);
phase("acl_rls_snapshot", { pass: true, ...acl[0] });
report.databaseRehearsalPass = true;

try {
  // --- 9. npm test ---
  const testCode = spawnSync("npm", ["test"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  }).status ?? 1;
  report.unitTestsPass = testCode === 0;
  phase("npm_test", { pass: report.unitTestsPass, exitCode: testCode });

  // --- 10. npm run build (NODE_ENV normalizado em scripts/run-production-build.mjs) ---
  const buildCode = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  }).status ?? 1;
  report.buildPass = buildCode === 0;
  phase("npm_build", { pass: report.buildPass, exitCode: buildCode, buildPass: report.buildPass });

  // --- 11. Smokes (preview + API local) — só após build PASS ---
  if (!report.buildPass) {
    report.smokesSkipped = true;
    report.smokesSkipReason = "build_failed";
    report.smokesPass = false;
    phase("smokes", {
      pass: false,
      skipped: true,
      smokesSkipped: true,
      smokesPass: false,
      reason: "build_failed",
      note: "Smokes não iniciados porque npm run build falhou.",
    });
  } else {
    const smokeReadiness = await evaluateSmokeReadiness();
    phase("smokes_preflight", {
      pass: smokeReadiness.ready && smokeReadiness.serverOk,
      ready: smokeReadiness.ready,
      serverOk: smokeReadiness.serverOk,
      missingKeys: smokeReadiness.missing,
      apiBase: smokeReadiness.apiBase,
      reason: smokeReadiness.reason,
    });

    if (!smokeReadiness.ready || !smokeReadiness.serverOk) {
      report.smokesSkipped = true;
      report.smokesSkipReason = smokeReadiness.reason ?? "credentials_missing";
      report.smokesPass = false;
      phase("smokes", {
        pass: false,
        skipped: true,
        smokesSkipped: true,
        smokesPass: false,
        reason: report.smokesSkipReason,
        missingKeys: smokeReadiness.missing,
        note: "Smokes não iniciados — pré-requisitos em falta.",
      });
    } else {
      const smokeResults = SMOKE_SCRIPTS.map((script) => {
        const code = runSmokeScript(script);
        return { script, pass: code === 0, exitCode: code };
      });

      report.smokesPass = smokeResults.every((s) => s.pass);
      report.smokesSkipped = false;
      report.smokesSkipReason = null;

      phase("smokes", {
        pass: report.smokesPass,
        skipped: false,
        smokesSkipped: false,
        smokesPass: report.smokesPass,
        results: smokeResults,
        note: "Smokes exigem preview uxleigndoomoezwsxlan + next start local.",
      });
    }
  }
} finally {
  await ensureRollback();
  exitWithReport();
}
