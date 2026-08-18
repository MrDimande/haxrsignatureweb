import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const SMOKE =
  process.env.HAXR_SMOKE_EVENT || "64b791b4-49c4-4b55-a8a0-99424c3d7167";
const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  const before = await c.query(
    `select count(*)::int as guests from public.guests`
  );
  const found = await c.query(
    `select id, event_id, guest_source, status, created_at
     from public.guests
     where email ilike 'pr0-phase1b%'
     order by created_at desc`
  );
  console.log(
    JSON.stringify(
      {
        guestsBefore: before.rows[0].guests,
        matches: found.rows.map((r) => ({
          id: r.id,
          onSmoke: r.event_id === SMOKE,
          guest_source: r.guest_source,
          status: r.status,
          created_at: r.created_at,
        })),
      },
      null,
      2
    )
  );

  const del = await c.query(
    `delete from public.guests
     where email ilike 'pr0-phase1b%'
     returning id, event_id`
  );
  const after = await c.query(`select
    (select count(*)::int from public.guests) as guests,
    (select count(*)::int from public.events) as events,
    (select count(*)::int from public.guests where email ilike 'pr0-%') as stray_pr0`);
  console.log(
    JSON.stringify(
      {
        deleted: del.rowCount,
        deletedOnSmoke: del.rows.filter((r) => r.event_id === SMOKE).length,
        counts: after.rows[0],
      },
      null,
      2
    )
  );
} finally {
  await c.end();
}
