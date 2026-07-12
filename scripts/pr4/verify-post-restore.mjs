/**
 * PR.4.1 — validação pós-restore do dump no clone dry-run.
 * Dump public-only: supabase_migrations pode estar ausente (não é erro).
 */
import { queryOne, withClient } from "./lib/pr4-db.mjs";
import { resolveClientMigrationHistory } from "./lib/pr4-migration-history.mjs";

const RESTORE_SHAPE_SQL = `
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'public'
  ) AS public_schema,
  (SELECT COUNT(*)::int FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS public_table_count,
  (SELECT COUNT(*)::int FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f') AS public_function_count,
  (SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public') AS public_policy_count,
  (SELECT COUNT(*)::int FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true) AS public_rls_table_count;
`;

const report = {
  pass: false,
  schemaExists: false,
  publicTableCount: 0,
  publicFunctionCount: 0,
  publicPolicyCount: 0,
  publicRlsTableCount: 0,
  migrationHistoryAvailable: false,
  clientMigrationsCount: 0,
  migrationHistoryNote: null,
  error: null,
};

try {
  await withClient(async (client) => {
    const shape = await queryOne(client, RESTORE_SHAPE_SQL);
    const history = await resolveClientMigrationHistory(client);

    report.schemaExists = shape.public_schema === true;
    report.publicTableCount = shape.public_table_count ?? 0;
    report.publicFunctionCount = shape.public_function_count ?? 0;
    report.publicPolicyCount = shape.public_policy_count ?? 0;
    report.publicRlsTableCount = shape.public_rls_table_count ?? 0;
    report.migrationHistoryAvailable = history.migrationHistoryAvailable;
    report.clientMigrationsCount = history.clientMigrationsCount;
    report.migrationHistoryNote = history.migrationHistoryNote;

    report.pass =
      report.schemaExists &&
      report.publicTableCount > 0 &&
      report.publicFunctionCount > 0 &&
      report.publicPolicyCount > 0 &&
      report.publicRlsTableCount > 0 &&
      report.clientMigrationsCount === 0;
  });
} catch (error) {
  report.error = error.message;
  report.pass = false;
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
