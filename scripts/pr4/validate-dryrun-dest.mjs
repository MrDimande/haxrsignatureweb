/**
 * PR.4.1 - valida destino dry-run (sem origem/producao).
 * PR4_DATABASE_URL = libpq (sem uselibpqcompat). Node deriva uselibpqcompat internamente.
 */
const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const DRY_RUN_REF = "rkkxfrwtmsqzpnbkshnd";
const EXPECTED_POOLER_USER = `postgres.${DRY_RUN_REF}`;
const EXPECTED_HOST = "aws-0-eu-central-1.pooler.supabase.com";
const EXPECTED_PORT = "5432";
const EXPECTED_DATABASE = "postgres";

export function validateDryRunDest() {
  const dest = process.env.PR4_DATABASE_URL?.trim() ?? "";
  const pgPassword = process.env.PGPASSWORD?.trim() ?? "";
  const sourceSet = Boolean(process.env.PR4_SOURCE_DATABASE_URL?.trim());

  let connectionUser = null;
  let urlHasEmbeddedPassword = false;
  let host = null;
  let port = null;
  let database = null;

  try {
    const parsed = new URL(dest);
    connectionUser = decodeURIComponent(parsed.username);
    urlHasEmbeddedPassword = Boolean(parsed.password);
    host = parsed.hostname;
    port = parsed.port || "";
    database = parsed.pathname.replace(/^\//, "");
  } catch {
    connectionUser = null;
  }

  const result = {
    destSet: Boolean(dest),
    destHasDryRunRef: dest.includes(DRY_RUN_REF),
    destHasProductionRef: dest.includes(PRODUCTION_REF),
    sourceEnvSet: sourceSet,
    hasUselibpqcompat: /uselibpqcompat/i.test(dest),
    connectionUserOk: connectionUser === EXPECTED_POOLER_USER,
    connectionUser,
    expectedConnectionUser: EXPECTED_POOLER_USER,
    hostOk: host === EXPECTED_HOST,
    host,
    expectedHost: EXPECTED_HOST,
    portOk: port === EXPECTED_PORT,
    port,
    expectedPort: EXPECTED_PORT,
    databaseOk: database === EXPECTED_DATABASE,
    database,
    expectedDatabase: EXPECTED_DATABASE,
    urlHasEmbeddedPassword,
    pgPasswordSet: Boolean(pgPassword),
    abort: false,
  };

  if (sourceSet) {
    result.abort = true;
    result.reason = "production_source_env_present";
    return result;
  }

  if (!result.destSet) {
    result.abort = true;
    result.reason = "missing_PR4_DATABASE_URL";
    return result;
  }

  if (result.hasUselibpqcompat) {
    result.abort = true;
    result.reason = "uselibpqcompat_in_libpq_url";
    return result;
  }

  if (result.destHasProductionRef) {
    result.abort = true;
    result.reason = "dest_points_to_production";
    return result;
  }

  if (!result.destHasDryRunRef) {
    result.abort = true;
    result.reason = "dest_missing_dry_run_ref";
    return result;
  }

  if (!result.hostOk) {
    result.abort = true;
    result.reason = "host_mismatch";
    return result;
  }

  if (!result.portOk) {
    result.abort = true;
    result.reason = "port_mismatch";
    return result;
  }

  if (!result.databaseOk) {
    result.abort = true;
    result.reason = "database_mismatch";
    return result;
  }

  if (!result.connectionUserOk) {
    result.abort = true;
    result.reason = "connection_user_should_be_postgres_ref";
    return result;
  }

  if (result.urlHasEmbeddedPassword) {
    result.abort = true;
    result.reason = "password_embedded_in_url_use_pgpassword";
    return result;
  }

  if (!result.pgPasswordSet) {
    result.abort = true;
    result.reason = "missing_PGPASSWORD";
  }

  return result;
}

if (process.argv[1]?.endsWith("validate-dryrun-dest.mjs")) {
  const v = validateDryRunDest();
  console.log(
    JSON.stringify(
      {
        destSet: v.destSet,
        destHasDryRunRef: v.destHasDryRunRef,
        destHasProductionRef: v.destHasProductionRef,
        sourceEnvSet: v.sourceEnvSet,
        hasUselibpqcompat: v.hasUselibpqcompat,
        connectionUserOk: v.connectionUserOk,
        connectionUser: v.connectionUser,
        expectedConnectionUser: v.expectedConnectionUser,
        hostOk: v.hostOk,
        host: v.host,
        portOk: v.portOk,
        port: v.port,
        databaseOk: v.databaseOk,
        database: v.database,
        urlHasEmbeddedPassword: v.urlHasEmbeddedPassword,
        pgPasswordSet: v.pgPasswordSet,
        abort: v.abort,
        reason: v.reason ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(v.abort ? 2 : 0);
}
