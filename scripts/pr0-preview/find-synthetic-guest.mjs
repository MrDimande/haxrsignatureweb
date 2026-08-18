import pg from "pg";
import { buildPgClientConfig } from "../pr4/lib/pr4-db.mjs";

const SMOKE = "64b791b4-49c4-4b55-a8a0-99424c3d7167";
const c = new pg.Client(buildPgClientConfig());
await c.connect();
try {
  const r = await c.query(
    `select id, email, phone, guest_source, status
     from public.guests
     where event_id = $1::uuid
       and email ilike 'pr0-integration-preview+%'
     order by created_at desc
     limit 1`,
    [SMOKE]
  );
  const counts = await c.query(
    "select count(*)::int as guests from public.guests"
  );
  console.log(
    JSON.stringify({
      guest: r.rows[0] || null,
      guests: counts.rows[0].guests,
    })
  );
} finally {
  await c.end();
}
