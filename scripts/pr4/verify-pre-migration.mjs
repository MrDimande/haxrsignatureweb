/**
 * PR.4 — verificação read-only do estado pré-036 no clone de ensaio.
 * Requer PR4_DATABASE_URL (nunca produção sem PR4_ALLOW_PRODUCTION=1).
 */
import { queryOne, withClient } from "./lib/pr4-db.mjs";

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
  (SELECT COUNT(*)::int FROM supabase_migrations.schema_migrations WHERE name LIKE '%client_app%' OR name LIKE '%client_event%') AS client_migrations_count;
`;

const row = await withClient((client) => queryOne(client, PRE_STATE_SQL));

const pass =
  row.profiles === false &&
  row.client_events === false &&
  row.event_members === false &&
  row.snapshots === false &&
  row.operational_event_id_col === false &&
  row.rpc_count === 0 &&
  row.haxr_business === true &&
  row.event_type_enum === true &&
  row.core_tables_count === 6 &&
  row.client_migrations_count === 0;

console.log(JSON.stringify({ pass, preState: row }, null, 2));
process.exit(pass ? 0 : 1);
