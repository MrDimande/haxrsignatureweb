import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const SMOKE = process.env.HAXR_SMOKE_EVENT;
const email = (process.env.HAXR_RSVP_EMAIL || "").toLowerCase();

const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  const { rows } = await c.query(
    `select id, event_id, guest_source, status, created_at, updated_at
     from public.guests
     where event_id = $1::uuid and lower(coalesce(email,'')) = $2
     order by created_at desc`,
    [SMOKE, email]
  );
  const counts = await c.query(
    `select
      (select count(*)::int from public.guests) as guests,
      (select count(*)::int from public.events) as events,
      (select count(*)::int from public.guests where event_id = $1::uuid) as smoke_guests`,
    [SMOKE]
  );
  console.log(
    JSON.stringify(
      {
        matchCount: rows.length,
        guest: rows[0]
          ? {
              id: rows[0].id,
              event_id: rows[0].event_id,
              guest_source: rows[0].guest_source,
              status: rows[0].status,
              onSmoke: rows[0].event_id === SMOKE,
              created_at: rows[0].created_at,
              updated_at: rows[0].updated_at,
            }
          : null,
        counts: counts.rows[0],
      },
      null,
      2
    )
  );
} finally {
  await c.end();
}
