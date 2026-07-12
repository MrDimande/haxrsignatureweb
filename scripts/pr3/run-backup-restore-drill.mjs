/**
 * PR.3 — backup lógico read-only (produção) + restore drill (clone).
 * Estratégia B. Produção nunca recebe SQL mutável.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertMutableTargetIsClone,
  CLONE_REF,
  PRODUCTION_REF,
  sanitizePoolerEndpoint,
  validatePr3Env,
} from "./lib/pr3-guards.mjs";
import { runPreflight } from "./lib/pr3-preflight.mjs";
import {
  buildPgClientConfig,
  fileMeta,
  resolvePgBin,
  runCapture,
  sanitizeCommand,
  sha256File,
  withPgClient,
  writeChecksumsManifest,
} from "./lib/pr3-tools.mjs";

const CORE_TABLES = [
  "businesses",
  "clients",
  "events",
  "guests",
  "payments",
  "documents",
  "event_vendors",
  "event_checklist_items",
];

const OBJECTS_036 = [
  { type: "table", name: "profiles" },
  { type: "table", name: "client_events" },
  { type: "table", name: "event_members" },
  { type: "table", name: "event_onboarding_snapshots" },
  { type: "function", name: "provision_client_operational_event" },
];

const report = {
  phase: "pr3-backup-restore-drill",
  startedAt: new Date().toISOString(),
  productionRef: PRODUCTION_REF,
  cloneRef: CLONE_REF,
  productionTouched: false,
  connectionFailureStage: null,
  failureReason: null,
  poolerEndpoints: null,
  preflight: null,
  backup: { pass: false, dir: null, artefacts: [], errors: [] },
  authStorageInventory: null,
  restore: { pass: false, errors: [] },
  validation: { pass: false, clone: {}, objects036Absent: null },
  compare: { pass: false, differences: [], restoreDifferencesCritical: null },
  gate: {
    backupAvailable: false,
    restoreProcedureKnown: true,
    restoreAuthorityIdentified: true,
    restoreTested: false,
    productionTouched: false,
    restoreDifferencesCritical: null,
    allPass: false,
  },
  pass: false,
  error: null,
};

function applyGateAliases() {
  report.backupAvailable = report.gate.backupAvailable;
  report.restoreProcedureKnown = report.gate.restoreProcedureKnown;
  report.restoreAuthorityIdentified = report.gate.restoreAuthorityIdentified;
  report.restoreTested = report.gate.restoreTested;
  report.restoreDifferencesCritical = report.gate.restoreDifferencesCritical;
}

function finishReport(exitCode) {
  applyGateAliases();
  if (report.backup.dir) {
    writeReport();
  }
  console.log(JSON.stringify(report, null, 2));
  process.exit(exitCode);
}

function abortBeforeBackup(stage, reason, message) {
  report.connectionFailureStage = stage;
  report.failureReason = reason;
  report.error = message;
  report.pass = false;
  report.productionTouched = false;
  report.gate.productionTouched = false;
  report.gate.backupAvailable = false;
  report.gate.restoreTested = false;
  report.gate.restoreDifferencesCritical = null;
  finishReport(1);
}

function fail(message, stage = "backup", reason = "backup_failed") {
  report.error = message;
  report.pass = false;
  if (!report.connectionFailureStage) {
    report.connectionFailureStage = stage;
  }
  if (!report.failureReason) {
    report.failureReason = reason;
  }
  finishReport(1);
}

function writeReport() {
  if (!report.backup.dir) return;
  writeFileSync(
    resolve(report.backup.dir, "drill-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
}

function timestampDir() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = resolve(process.cwd(), "backups", "pr3-production-pre036", ts);
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function collectAuthStorageInventory(client) {
  const triggers = await client.query(`
    SELECT t.tgname AS trigger_name,
           pg_get_triggerdef(t.oid, true) AS trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  `);

  const authPolicies = await client.query(`
    SELECT schemaname, tablename, policyname, cmd, roles::text
    FROM pg_policies WHERE schemaname = 'auth'
  `);

  const storagePolicies = await client.query(`
    SELECT schemaname, tablename, policyname, cmd, roles::text
    FROM pg_policies WHERE schemaname = 'storage'
  `);

  const buckets = await client.query(`
    SELECT id, name, public, file_size_limit, allowed_mime_types
    FROM storage.buckets ORDER BY name
  `);

  const objectCounts = await client.query(`
    SELECT bucket_id, COUNT(*)::int AS object_count
    FROM storage.objects GROUP BY bucket_id ORDER BY bucket_id
  `);

  return {
    collectedAt: new Date().toISOString(),
    sourceRef: PRODUCTION_REF,
    note: "Inventário read-only. Dados sensíveis de auth/storage não exportados.",
    authUsersTriggers: triggers.rows.map((r) => ({
      trigger_name: r.trigger_name,
      trigger_def: r.trigger_def,
    })),
    authPolicies: authPolicies.rows,
    storagePolicies: storagePolicies.rows,
    buckets: buckets.rows,
    objectCountsByBucket: objectCounts.rows,
    excludedFromLogicalBackup: [
      "auth schema data (users, identities, sessions)",
      "storage.objects binary payloads",
      "Supabase-managed roles/grants beyond dump scope",
    ],
  };
}

async function collectDbMetrics(client, label) {
  const tableCounts = {};
  for (const table of CORE_TABLES) {
    const row = await client.query(
      `SELECT COUNT(*)::int AS c FROM public.${table}`,
    );
    tableCounts[table] = row.rows[0]?.c ?? null;
  }

  const business = await client.query(
    `SELECT id FROM public.businesses WHERE id = 'haxr-signature' LIMIT 1`,
  );

  const migrationHistory = await client.query(`
    SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version
  `);

  const schemaFp = await client.query(`
    SELECT md5(string_agg(
      table_schema || '.' || table_name || ':' || column_name || ':' || data_type,
      '|' ORDER BY table_schema, table_name, ordinal_position
    )) AS fp
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);

  const funcCount = await client.query(`
    SELECT COUNT(*)::int AS c FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  `);

  const policyCount = await client.query(`
    SELECT COUNT(*)::int AS c FROM pg_policies WHERE schemaname = 'public'
  `);

  const objects036 = {};
  for (const obj of OBJECTS_036) {
    if (obj.type === "table") {
      const r = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) AS exists`,
        [obj.name],
      );
      objects036[obj.name] = r.rows[0]?.exists === true;
    } else {
      const r = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = $1
        ) AS exists`,
        [obj.name],
      );
      objects036[obj.name] = r.rows[0]?.exists === true;
    }
  }

  return {
    label,
    businessHaxrSignature: business.rows.length > 0,
    tableCounts,
    migrationHistoryCount: migrationHistory.rows.length,
    migrationHistory: migrationHistory.rows,
    publicSchemaFingerprintMd5: schemaFp.rows[0]?.fp ?? null,
    publicFunctionCount: funcCount.rows[0]?.c ?? 0,
    publicPolicyCount: policyCount.rows[0]?.c ?? 0,
    objects036Present: objects036,
  };
}

const SCHEMA_DUMP_FLAGS = ["--schema-only", "--no-owner", "--no-privileges"];

function sanitizeSchemaSqlForCloneRestore(inputPath, outputPath) {
  const filtered = readFileSync(inputPath, "utf8")
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/^\s*ALTER DEFAULT PRIVILEGES/i.test(line) &&
        !/^\s*(GRANT|REVOKE)\s/i.test(line),
    );
  writeFileSync(outputPath, `${filtered.join("\n")}\n`, "utf8");
}

function runPgDump(outFile, args, connectionString, password, manifestCommands) {
  const pgDump = resolvePgBin("pg_dump");
  // pg_dump does not support -X (psql-only: --no-psqlrc)
  const fullArgs = [...args, "-f", outFile, connectionString];
  manifestCommands.push(sanitizeCommand([pgDump, ...fullArgs]));
  const result = runCapture(pgDump, fullArgs, { PGPASSWORD: password });
  return result;
}

async function main() {
  const env = validatePr3Env();
  if (env.abort) {
    abortBeforeBackup("env_validation", env.reason, `Validação ambiente: ${env.reason}`);
  }

  const sourceUrl = process.env.PR3_SOURCE_DATABASE_URL.trim();
  const destUrl = process.env.PR3_DEST_DATABASE_URL.trim();
  const sourcePw = process.env.PR3_SOURCE_PGPASSWORD.trim();
  const destPw = process.env.PR3_DEST_PGPASSWORD.trim();

  report.poolerEndpoints = {
    source: sanitizePoolerEndpoint(
      process.env.PR3_SOURCE_POOLER_HOST,
      process.env.PR3_SOURCE_POOLER_USER,
    ),
    dest: sanitizePoolerEndpoint(
      process.env.PR3_DEST_POOLER_HOST,
      process.env.PR3_DEST_POOLER_USER,
    ),
  };

  try {
    report.preflight = await runPreflight({
      sourceUrl,
      destUrl,
      sourcePw,
      destPw,
    });
    if (!report.preflight.pass) {
      const failedSide = report.preflight.source.pass ? "dest" : "source";
      abortBeforeBackup(
        failedSide === "source" ? "source_preflight" : "dest_preflight",
        failedSide === "source"
          ? "source_preflight_identity_mismatch"
          : "dest_preflight_identity_mismatch",
        "Preflight identity check failed",
      );
    }
  } catch (error) {
    const message = error.message ?? String(error);
    const destPhase = /dest|clone|rkkx/i.test(message);
    let reason = destPhase ? "dest_pooler_connect_failed" : "source_pooler_connect_failed";
    if (/tenant\/user|ENOTFOUND/i.test(message)) {
      reason = destPhase ? "dest_pooler_tenant_not_found" : "source_pooler_tenant_not_found";
    }
    if (/could not translate host name|Name or service not known/i.test(message)) {
      reason = destPhase ? "dest_pooler_dns_failed" : "source_pooler_dns_failed";
    }
    abortBeforeBackup(
      destPhase ? "dest_preflight" : "source_preflight",
      reason,
      message,
    );
  }

  const backupDir = timestampDir();
  report.backup.dir = backupDir;
  const manifestCommands = [];
  const artefacts = [];

  const pgDumpVer = runCapture(resolvePgBin("pg_dump"), ["--version"], {});
  const psqlVer = runCapture(resolvePgBin("psql"), ["--version"], {});

  // --- BACKUP (read-only source) ---
  const rolesFile = resolve(backupDir, "roles.sql");
  const rolesResult = runPgDump(
    rolesFile,
    ["--roles-only", "--no-owner"],
    sourceUrl,
    sourcePw,
    manifestCommands,
  );
  if (rolesResult.status !== 0) {
    writeFileSync(
      rolesFile,
      `-- roles-only dump not fully available on Supabase managed Postgres\n-- stderr: ${rolesResult.stderr.slice(0, 500)}\n`,
      "utf8",
    );
    report.backup.errors.push("roles_dump_partial_or_failed");
  }
  artefacts.push({ name: "roles.sql", ...fileMeta(rolesFile) });

  const schemaFile = resolve(backupDir, "schema.sql");
  const schemaResult = runPgDump(
    schemaFile,
    [...SCHEMA_DUMP_FLAGS, "-n", "public"],
    sourceUrl,
    sourcePw,
    manifestCommands,
  );
  if (schemaResult.status !== 0) {
    fail(`schema dump failed: ${schemaResult.stderr.slice(0, 1500)}`);
  }
  artefacts.push({ name: "schema.sql", ...fileMeta(schemaFile) });

  const dataFile = resolve(backupDir, "data.sql");
  const dataResult = runPgDump(
    dataFile,
    ["--data-only", "--column-inserts", "-n", "public"],
    sourceUrl,
    sourcePw,
    manifestCommands,
  );
  if (dataResult.status !== 0) {
    fail(`data dump failed: ${dataResult.stderr.slice(0, 1500)}`);
  }
  artefacts.push({ name: "data.sql", ...fileMeta(dataFile) });

  const migSchemaFile = resolve(backupDir, "migration-history-schema.sql");
  const migSchemaResult = runPgDump(
    migSchemaFile,
    [...SCHEMA_DUMP_FLAGS, "-n", "supabase_migrations"],
    sourceUrl,
    sourcePw,
    manifestCommands,
  );
  if (migSchemaResult.status !== 0) {
    fail(`migration-history schema dump failed: ${migSchemaResult.stderr.slice(0, 1500)}`);
  }
  artefacts.push({ name: "migration-history-schema.sql", ...fileMeta(migSchemaFile) });

  const migDataFile = resolve(backupDir, "migration-history-data.sql");
  const migDataResult = runPgDump(
    migDataFile,
    ["--data-only", "--column-inserts", "-n", "supabase_migrations"],
    sourceUrl,
    sourcePw,
    manifestCommands,
  );
  if (migDataResult.status !== 0) {
    fail(`migration-history data dump failed: ${migDataResult.stderr.slice(0, 1500)}`);
  }
  artefacts.push({ name: "migration-history-data.sql", ...fileMeta(migDataFile) });

  report.authStorageInventory = await withPgClient(
    sourceUrl,
    sourcePw,
    true,
    collectAuthStorageInventory,
  );
  const inventoryFile = resolve(backupDir, "auth-storage-inventory.json");
  writeFileSync(
    inventoryFile,
    `${JSON.stringify(report.authStorageInventory, null, 2)}\n`,
    "utf8",
  );
  artefacts.push({ name: "auth-storage-inventory.json", ...fileMeta(inventoryFile) });

  const manifest = {
    timestamp: new Date().toISOString(),
    sourceProjectRef: PRODUCTION_REF,
    cloneProjectRef: CLONE_REF,
    toolVersions: {
      pg_dump: (pgDumpVer.stdout || pgDumpVer.stderr).trim(),
      psql: (psqlVer.stdout || psqlVer.stderr).trim(),
    },
    commandsSanitized: manifestCommands,
    artefacts: artefacts.map(({ name, bytes, sha256 }) => ({ name, bytes, sha256 })),
    excludedScopes: report.authStorageInventory.excludedFromLogicalBackup,
    credentialsIncluded: false,
  };
  writeFileSync(
    resolve(backupDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  artefacts.push({ name: "manifest.json", ...fileMeta(resolve(backupDir, "manifest.json")) });
  writeChecksumsManifest(backupDir, { artefacts });
  artefacts.push({
    name: "checksums.sha256",
    ...fileMeta(resolve(backupDir, "checksums.sha256")),
  });

  report.backup.pass = true;
  report.backup.artefacts = artefacts;
  report.gate.backupAvailable = true;

  const prodMetrics = await withPgClient(
    sourceUrl,
    sourcePw,
    true,
    (c) => collectDbMetrics(c, "production"),
  );

  // --- RESTORE (clone only) ---
  assertMutableTargetIsClone(destUrl, "restore");

  const psql = resolvePgBin("psql");
  const prepSql = `
BEGIN;
DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
DROP SCHEMA IF EXISTS public CASCADE;
COMMIT;
`;
  writeFileSync(resolve(backupDir, "_prepare-clone.sql"), prepSql, "utf8");
  const prepCmd = [psql, "-X", "-v", "ON_ERROR_STOP=1", "-f", resolve(backupDir, "_prepare-clone.sql"), destUrl];
  manifestCommands.push(sanitizeCommand(prepCmd));
  const prepResult = runCapture(psql, prepCmd.slice(1), { PGPASSWORD: destPw });
  if (prepResult.status !== 0) {
    fail(`clone prepare failed: ${prepResult.stderr.slice(0, 1500)}`);
  }

  const migSchemaRestore = resolve(backupDir, "_migration-history-schema-restore.sql");
  const schemaRestore = resolve(backupDir, "_schema-restore.sql");
  sanitizeSchemaSqlForCloneRestore(
    resolve(backupDir, "migration-history-schema.sql"),
    migSchemaRestore,
  );
  sanitizeSchemaSqlForCloneRestore(resolve(backupDir, "schema.sql"), schemaRestore);

  const restoreFiles = [
    { label: "migration-history-schema.sql", path: migSchemaRestore },
    { label: "schema.sql", path: schemaRestore },
    { label: "migration-history-data.sql", path: resolve(backupDir, "migration-history-data.sql") },
    { label: "data.sql", path: resolve(backupDir, "data.sql") },
  ];

  for (const { label, path: restorePath } of restoreFiles) {
    const restoreCmd = [
      psql,
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "--single-transaction",
      "-f",
      restorePath,
      destUrl,
    ];
    manifestCommands.push(sanitizeCommand(restoreCmd));
    const restoreResult = runCapture(psql, restoreCmd.slice(1), { PGPASSWORD: destPw });
    if (restoreResult.status !== 0) {
      report.restore.errors.push({ file: label, stderr: restoreResult.stderr.slice(0, 1500) });
      fail(`restore failed on ${label}`, "restore", "restore_failed");
    }
  }

  report.restore.pass = true;
  report.gate.restoreTested = true;

  const cloneMetrics = await withPgClient(
    destUrl,
    destPw,
    true,
    (c) => collectDbMetrics(c, "clone-restored"),
  );

  report.validation.clone = cloneMetrics;
  const objects036Any = Object.values(cloneMetrics.objects036Present).some(Boolean);
  report.validation.objects036Absent = !objects036Any;

  report.validation.pass =
    cloneMetrics.businessHaxrSignature &&
    cloneMetrics.publicFunctionCount > 0 &&
    !objects036Any;

  // --- COMPARE ---
  const differences = [];
  if (prodMetrics.publicSchemaFingerprintMd5 !== cloneMetrics.publicSchemaFingerprintMd5) {
    differences.push({
      field: "publicSchemaFingerprintMd5",
      production: prodMetrics.publicSchemaFingerprintMd5,
      clone: cloneMetrics.publicSchemaFingerprintMd5,
      critical: true,
    });
  }
  if (prodMetrics.migrationHistoryCount !== cloneMetrics.migrationHistoryCount) {
    differences.push({
      field: "migrationHistoryCount",
      production: prodMetrics.migrationHistoryCount,
      clone: cloneMetrics.migrationHistoryCount,
      critical: true,
    });
  }
  for (const table of CORE_TABLES) {
    if (prodMetrics.tableCounts[table] !== cloneMetrics.tableCounts[table]) {
      differences.push({
        field: `count.public.${table}`,
        production: prodMetrics.tableCounts[table],
        clone: cloneMetrics.tableCounts[table],
        critical: true,
      });
    }
  }
  if (prodMetrics.publicFunctionCount !== cloneMetrics.publicFunctionCount) {
    differences.push({
      field: "publicFunctionCount",
      production: prodMetrics.publicFunctionCount,
      clone: cloneMetrics.publicFunctionCount,
      critical: true,
    });
  }
  if (prodMetrics.publicPolicyCount !== cloneMetrics.publicPolicyCount) {
    differences.push({
      field: "publicPolicyCount",
      production: prodMetrics.publicPolicyCount,
      clone: cloneMetrics.publicPolicyCount,
      critical: false,
    });
  }

  report.compare.differences = differences;
  report.compare.restoreDifferencesCritical = differences.some((d) => d.critical);
  report.compare.pass = differences.filter((d) => d.critical).length === 0;
  report.gate.restoreDifferencesCritical = report.compare.restoreDifferencesCritical;

  report.gate.productionTouched = false;
  report.productionTouched = false;

  report.gate.allPass =
    report.gate.backupAvailable &&
    report.gate.restoreProcedureKnown &&
    report.gate.restoreAuthorityIdentified &&
    report.gate.restoreTested &&
    report.gate.productionTouched === false &&
    report.gate.restoreDifferencesCritical === false;

  report.pass =
    report.backup.pass &&
    report.restore.pass &&
    report.validation.pass &&
    report.compare.pass;

  report.restoreDifferencesCritical = report.gate.restoreDifferencesCritical;

  finishReport(report.pass ? 0 : 1);
}

main().catch((error) => {
  report.error = error.message;
  if (!report.connectionFailureStage) {
    report.connectionFailureStage = "unexpected";
  }
  finishReport(1);
});
