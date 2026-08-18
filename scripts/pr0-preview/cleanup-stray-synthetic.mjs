import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const CLONE = "rkkxfrwtmsqzpnbkshnd";
const PROD = "oxsrdmydlqyvnueedgtl";
const SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167";
const url = process.env.PR4_DATABASE_URL || "";
if (!url.includes(CLONE) || url.includes(PROD)) throw new Error("ABORT identity");

const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  const before = await c.query(`
    select id, event_id, guest_source, status, created_at
    from public.guests
    where email ilike 'pr0-integration-preview+%'
    order by created_at
  `);
  console.log(
    JSON.stringify(
      {
        strayBefore: before.rowCount,
        rows: before.rows.map((r) => ({
          id: r.id,
          event_id: r.event_id,
          onSmoke: r.event_id === SMOKE,
          guest_source: r.guest_source,
          status: r.status,
        })),
      },
      null,
      2
    )
  );

  // Only delete synthetic emails; prefer smoke event, abort if any off-smoke
  const offSmoke = before.rows.filter((r) => r.event_id !== SMOKE);
  if (offSmoke.length > 0) {
    throw new Error("ABORT: synthetic guest exists outside Smoke Event A");
  }

  const del = await c.query(
    `delete from public.guests
     where email ilike 'pr0-integration-preview+%'
       and event_id = $1::uuid
     returning id`,
    [SMOKE]
  );

  const counts = await c.query(`select
    (select count(*)::int from public.guests) as guests,
    (select count(*)::int from public.events) as events,
    (select count(*)::int from supabase_migrations.schema_migrations) as migrations,
    (select count(*)::int from public.guests where email ilike 'pr0-integration-preview+%') as stray_after
  `);

  console.log(
    JSON.stringify(
      {
        deleted: del.rowCount,
        counts: counts.rows[0],
      },
      null,
      2
    )
  );
} finally {
  await c.end();
}
