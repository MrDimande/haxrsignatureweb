/**
 * PR.3 — verificação read-only: produção ainda pré-036 (objectos 036–043 ausentes).
 */
import { withProductionClient, queryOne } from "./lib/pr3-production-db.mjs";
import { PRODUCTION_REF } from "./lib/pr3-guards.mjs";

const row = await withProductionClient(async (client) => {
  const pre = await queryOne(
    client,
    `SELECT
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') AS profiles,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_events') AS client_events,
      (SELECT COUNT(*)::int FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public'
          AND p.proname IN (
            'provision_client_operational_event',
            'get_client_event_guests',
            'get_client_event_payments',
            'get_client_event_vendors',
            'get_client_event_checklist',
            'get_client_event_documents'
          )) AS rpc_count,
      current_database() AS db`,
  );

  const migrations = await queryOne(
    client,
    `SELECT COUNT(*)::int AS total
     FROM supabase_migrations.schema_migrations
     WHERE name LIKE '%036%' OR name LIKE '%037%' OR name LIKE '%038%'
        OR name LIKE '%039%' OR name LIKE '%040%' OR name LIKE '%041%'
        OR name LIKE '%042%' OR name LIKE '%043%'
        OR name LIKE '%client_app%'`,
  );

  return { pre, clientMigrations: migrations?.total ?? 0 };
});

const pass =
  row.pre?.profiles === false &&
  row.pre?.client_events === false &&
  row.pre?.rpc_count === 0 &&
  row.clientMigrations === 0;

console.log(
  JSON.stringify(
    {
      pass,
      productionRef: PRODUCTION_REF,
      pre036: row.pre,
      clientMigrationRows: row.clientMigrations,
    },
    null,
    2,
  ),
);
process.exit(pass ? 0 : 1);
