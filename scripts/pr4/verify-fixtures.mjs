/**
 * PR.4 — validação read-only das fixtures mínimas no clone dry-run.
 * Confirma business/client/event, FKs e ausência de objectos 036–043.
 */
import { queryOne, withClient } from "./lib/pr4-db.mjs";

const FIXTURE_BUSINESS_ID = "haxr-signature";
const FIXTURE_CLIENT_ID = "11111111-1111-4111-8111-111111111101";
const FIXTURE_EVENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01";

const FIXTURES_SQL = `
SELECT
  EXISTS (SELECT 1 FROM public.businesses WHERE id = $1) AS business_exists,
  EXISTS (SELECT 1 FROM public.clients WHERE id = $2::uuid) AS client_exists,
  EXISTS (SELECT 1 FROM public.events WHERE id = $3::uuid) AS event_exists,
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = $3::uuid
      AND e.business_id = $1
      AND e.client_id = $2::uuid
  ) AS event_fks_ok,
  (SELECT COUNT(*)::int FROM public.guests WHERE event_id = $3::uuid) AS guest_count,
  (SELECT COUNT(*)::int FROM public.payments WHERE event_id = $3::uuid AND business_id = $1) AS payment_count,
  (SELECT COUNT(*)::int FROM public.event_vendors WHERE event_id = $3::uuid) AS vendor_count,
  (SELECT COUNT(*)::int FROM public.event_checklist_items WHERE event_id = $3::uuid) AS checklist_count,
  EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = 'ffffffff-ffff-4fff-8fff-fffffffffff1'::uuid
      AND d.business_id = $1
      AND d.event_id = $3::uuid
      AND d.client_id = $2::uuid
  ) AS document_fks_ok,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'businesses'
      AND column_name = 'slug'
  ) AS businesses_slug_column,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AS profiles_table,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_events'
  ) AS client_events_table,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_members'
  ) AS event_members_table,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_onboarding_snapshots'
  ) AS snapshots_table,
  (SELECT COUNT(*)::int FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'provision_client_operational_event',
        'get_client_event_guests',
        'get_client_event_payments',
        'get_client_event_vendors',
        'get_client_event_checklist',
        'get_client_event_documents'
      )
  ) AS rpc_count;
`;

const report = {
  pass: false,
  businessExists: false,
  clientExists: false,
  eventExists: false,
  eventFksOk: false,
  guestCount: 0,
  paymentCount: 0,
  vendorCount: 0,
  checklistCount: 0,
  documentFksOk: false,
  no036Objects: false,
  error: null,
};

try {
  await withClient(async (client) => {
    const row = await queryOne(client, FIXTURES_SQL, [
      FIXTURE_BUSINESS_ID,
      FIXTURE_CLIENT_ID,
      FIXTURE_EVENT_ID,
    ]);

    report.businessExists = row.business_exists === true;
    report.clientExists = row.client_exists === true;
    report.eventExists = row.event_exists === true;
    report.eventFksOk = row.event_fks_ok === true;
    report.guestCount = row.guest_count ?? 0;
    report.paymentCount = row.payment_count ?? 0;
    report.vendorCount = row.vendor_count ?? 0;
    report.checklistCount = row.checklist_count ?? 0;
    report.documentFksOk = row.document_fks_ok === true;

    const no036Objects =
      row.businesses_slug_column === false &&
      row.profiles_table === false &&
      row.client_events_table === false &&
      row.event_members_table === false &&
      row.snapshots_table === false &&
      (row.rpc_count ?? 0) === 0;

    report.no036Objects = no036Objects;

    report.pass =
      report.businessExists &&
      report.clientExists &&
      report.eventExists &&
      report.eventFksOk &&
      report.guestCount >= 2 &&
      report.paymentCount >= 2 &&
      report.vendorCount >= 2 &&
      report.checklistCount >= 3 &&
      report.documentFksOk &&
      report.no036Objects;
  });
} catch (error) {
  report.error = error.message;
  report.pass = false;
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
