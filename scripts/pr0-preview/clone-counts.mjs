/**
 * Read-only clone counts for PR0 write-gate.
 * Requires PR4_DATABASE_URL + PGPASSWORD (never prints secrets).
 */
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";
import pg from "pg";

const SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167";
const PROTECTED = [
  // Jessica/Samuel protected events — count guests only, never mutate
];

const client = new pg.Client(buildPgClientConfig());
await client.connect();

try {
  const url = process.env.PR4_DATABASE_URL || "";
  if (!url.includes("rkkxfrwtmsqzpnbkshnd") || url.includes("oxsrdmydlqyvnueedgtl")) {
    throw new Error("ABORT bad ref");
  }

  const { rows } = await client.query(
    `
    select json_build_object(
      'events', (select count(*)::int from public.events),
      'guests', (select count(*)::int from public.guests),
      'smoke_guests', (select count(*)::int from public.guests where event_id = $1::uuid),
      'migrations', (select count(*)::int from supabase_migrations.schema_migrations),
      'rpc11_service', (
        select has_function_privilege('service_role', p.oid, 'EXECUTE')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'submit_edition_rsvp' and p.pronargs = 11
        limit 1
      ),
      'rpc11_anon', (
        select has_function_privilege('anon', p.oid, 'EXECUTE')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'submit_edition_rsvp' and p.pronargs = 11
        limit 1
      ),
      'rpc11_authenticated', (
        select has_function_privilege('authenticated', p.oid, 'EXECUTE')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'submit_edition_rsvp' and p.pronargs = 11
        limit 1
      )
    ) as report
    `,
    [SMOKE]
  );

  console.log(JSON.stringify(rows[0].report, null, 2));
} finally {
  await client.end();
}
