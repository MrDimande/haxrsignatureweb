import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const SMOKE = process.env.HAXR_SMOKE_EVENT;
const id = process.env.HAXR_GUEST_ID;

const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  const del = await c.query(
    "delete from public.guests where id = $1::uuid and event_id = $2::uuid returning id",
    [id, SMOKE]
  );
  const counts = await c.query(`select
    (select count(*)::int from public.guests) as guests,
    (select count(*)::int from public.events) as events,
    (select count(*)::int from supabase_migrations.schema_migrations) as migrations`);
  const stray = await c.query(
    `select count(*)::int as n from public.guests
     where email ilike 'pr0-integration-preview+%' `
  );
  console.log(
    JSON.stringify(
      {
        deleted: del.rowCount,
        guestId: id,
        counts: counts.rows[0],
        straySynthetic: stray.rows[0].n,
      },
      null,
      2
    )
  );
} finally {
  await c.end();
}
