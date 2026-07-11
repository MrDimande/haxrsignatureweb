/**
 * PR.4 — verificação read-only do estado pré-036 no clone de ensaio.
 * Fingerprints de objectos 036–043 + histórico Supabase quando disponível.
 */
import { queryOne, withClient } from "./lib/pr4-db.mjs";
import { resolveClientMigrationHistory } from "./lib/pr4-migration-history.mjs";

const PRE_STATE_SQL = `
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') AS profiles,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_events') AS client_events,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_members') AS event_members,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_onboarding_snapshots') AS snapshots,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_events' AND column_name='operational_event_id'
  ) AS operational_event_id_col,
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
      )
  ) AS rpc_count,
  EXISTS (SELECT 1 FROM public.businesses WHERE id='haxr-signature') AS haxr_business,
  EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='event_type') AS event_type_enum,
  (SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema='public'
    AND table_name IN ('events','guests','payments','event_vendors','event_checklist_items','documents')
  ) AS core_tables_count,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='auth' AND table_name='users') AS auth_users,
  (SELECT COUNT(*)::int FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='auth' AND c.relname='users' AND t.tgname='on_auth_user_created') AS auth_trigger_count;
`;

const row = await withClient(async (client) => {
  const preState = await queryOne(client, PRE_STATE_SQL);
  const history = await resolveClientMigrationHistory(client);
  return { preState, history };
});

const fingerprintsPass =
  row.preState.profiles === false &&
  row.preState.client_events === false &&
  row.preState.event_members === false &&
  row.preState.snapshots === false &&
  row.preState.operational_event_id_col === false &&
  row.preState.rpc_count === 0 &&
  row.preState.haxr_business === true &&
  row.preState.event_type_enum === true &&
  row.preState.core_tables_count === 6 &&
  row.preState.auth_users === true &&
  row.preState.auth_trigger_count === 0;

const migrationHistoryPass =
  !row.history.migrationHistoryAvailable || row.history.clientMigrationsCount === 0;

const pass = fingerprintsPass && migrationHistoryPass;

console.log(
  JSON.stringify(
    {
      pass,
      preState: row.preState,
      migrationHistoryAvailable: row.history.migrationHistoryAvailable,
      clientMigrationsCount: row.history.clientMigrationsCount,
      migrationHistoryNote: row.history.migrationHistoryNote,
      fingerprintsPass,
      migrationHistoryPass,
    },
    null,
    2,
  ),
);
process.exit(pass ? 0 : 1);
