import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const url = process.env.PR4_DATABASE_URL || "";
if (!url.includes(CLONE) || url.includes(PROD)) throw new Error("ABORT identity");

const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  const { rows } = await c.query(`
    select json_build_object(
      'seats_select', has_table_privilege('service_role', 'public.seats', 'SELECT'),
      'seats_insert', has_table_privilege('service_role', 'public.seats', 'INSERT'),
      'checkins_select', has_table_privilege('service_role', 'public.checkins', 'SELECT'),
      'guest_groups_select', has_table_privilege('service_role', 'public.guest_groups', 'SELECT'),
      'guests_select', has_table_privilege('service_role', 'public.guests', 'SELECT'),
      'events', (select count(*)::int from public.events),
      'guests', (select count(*)::int from public.guests),
      'migrations', (select count(*)::int from supabase_migrations.schema_migrations),
      'synthetic_stray', (
        select count(*)::int from public.guests
        where email ilike 'pr0-integration-preview+%'
      )
    ) as report
  `);
  console.log(JSON.stringify(rows[0].report, null, 2));
} finally {
  await c.end();
}
