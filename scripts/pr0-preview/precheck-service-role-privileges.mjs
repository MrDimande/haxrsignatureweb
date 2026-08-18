/**
 * Read-only privilege audit for clone service_role RSVP path.
 * Requires PR4_DATABASE_URL + PGPASSWORD. Never prints secrets.
 */
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";
import pg from "pg";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";

const url = process.env.PR4_DATABASE_URL || "";
if (!url.includes(CLONE) || url.includes(PROD)) {
  throw new Error("ABORT: identity check failed");
}

const client = new pg.Client(buildPgClientConfig());
await client.connect();

try {
  const { rows: idRows } = await client.query(`
    select
      current_database() as db,
      current_user as current_user,
      session_user as session_user,
      inet_server_addr()::text as server_addr
  `);

  const { rows: privRows } = await client.query(`
    select json_build_object(
      'schema_usage_service_role', has_schema_privilege('service_role', 'public', 'USAGE'),
      'guests_select', has_table_privilege('service_role', 'public.guests', 'SELECT'),
      'guests_insert', has_table_privilege('service_role', 'public.guests', 'INSERT'),
      'guests_update', has_table_privilege('service_role', 'public.guests', 'UPDATE'),
      'guests_delete', has_table_privilege('service_role', 'public.guests', 'DELETE'),
      'events_select', has_table_privilege('service_role', 'public.events', 'SELECT'),
      'events_insert', has_table_privilege('service_role', 'public.events', 'INSERT'),
      'events_update', has_table_privilege('service_role', 'public.events', 'UPDATE'),
      'events_delete', has_table_privilege('service_role', 'public.events', 'DELETE'),
      'guest_audit_select', has_table_privilege('service_role', 'public.guest_audit_log', 'SELECT'),
      'guest_audit_insert', has_table_privilege('service_role', 'public.guest_audit_log', 'INSERT'),
      'event_contact_profiles_select', has_table_privilege('service_role', 'public.event_contact_profiles', 'SELECT'),
      'event_contact_profiles_insert', has_table_privilege('service_role', 'public.event_contact_profiles', 'INSERT'),
      'event_contact_profiles_update', has_table_privilege('service_role', 'public.event_contact_profiles', 'UPDATE'),
      'api_rate_limits_select', has_table_privilege('service_role', 'public.api_rate_limits', 'SELECT'),
      'api_rate_limits_insert', has_table_privilege('service_role', 'public.api_rate_limits', 'INSERT'),
      'api_rate_limits_update', has_table_privilege('service_role', 'public.api_rate_limits', 'UPDATE')
    ) as privileges
  `);

  const { rows: rpcRows } = await client.query(`
    select
      p.oid::int as oid,
      p.pronargs,
      pg_get_function_identity_arguments(p.oid) as args,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_exec,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_exec,
      has_function_privilege('public', p.oid, 'EXECUTE') as public_exec
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'submit_edition_rsvp'
    order by p.pronargs, p.oid
  `);

  const { rows: countRows } = await client.query(`
    select json_build_object(
      'events', (select count(*)::int from public.events),
      'guests', (select count(*)::int from public.guests),
      'migrations', (select count(*)::int from supabase_migrations.schema_migrations)
    ) as counts
  `);

  console.log(
    JSON.stringify(
      {
        identity: {
          cloneRefExpected: CLONE,
          urlContainsClone: url.includes(CLONE),
          urlContainsProd: url.includes(PROD),
          ...idRows[0],
        },
        privileges: privRows[0].privileges,
        rpcOverloads: rpcRows,
        counts: countRows[0].counts,
      },
      null,
      2
    )
  );
} finally {
  await client.end();
}
