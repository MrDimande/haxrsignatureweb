/**
 * PR.3 — smoke DB de isolamento RLS no clone (pos 036–043).
 * Requer PR4_DATABASE_URL + PGPASSWORD (clone rkkxfrwtmsqzpnbkshnd).
 */
import { randomUUID } from "node:crypto";
import { withClient } from "../pr4/lib/pr4-db.mjs";

const USER_A = randomUUID();
const USER_B = randomUUID();
const EVENT_A = randomUUID();
const EVENT_B = randomUUID();

const report = { pass: false, tests: [], fixtureClientEventId: EVENT_A };

function log(id, status, detail = "") {
  report.tests.push({ id, status, detail });
}

await withClient(async (client) => {
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
       VALUES ($1, 'authenticated', 'authenticated', $2, crypt('smoke-only', gen_salt('bf')), now(), now(), now()),
              ($3, 'authenticated', 'authenticated', $4, crypt('smoke-only', gen_salt('bf')), now(), now(), now())
       ON CONFLICT (id) DO NOTHING`,
      [
        USER_A,
        `pr3-smoke-a-${USER_A.slice(0, 8)}@example.test`,
        USER_B,
        `pr3-smoke-b-${USER_B.slice(0, 8)}@example.test`,
      ],
    );

    await client.query(
      `INSERT INTO public.client_events (
         id, owner_user_id, slug, event_name, event_type, bride_name, groom_name, event_location, status
       )
       VALUES
         ($1, $3, $5, 'Smoke Event A', 'wedding', 'A', 'B', 'Maputo', 'planning'),
         ($2, $4, $6, 'Smoke Event B', 'wedding', 'C', 'D', 'Maputo', 'planning')
       ON CONFLICT (id) DO NOTHING`,
      [
        EVENT_A,
        EVENT_B,
        USER_A,
        USER_B,
        `smoke-a-${EVENT_A.slice(0, 8)}`,
        `smoke-b-${EVENT_B.slice(0, 8)}`,
      ],
    );

    await client.query(
      `INSERT INTO public.event_members (client_event_id, user_id, role)
       VALUES ($1, $3, 'owner'), ($2, $4, 'owner')
       ON CONFLICT DO NOTHING`,
      [EVENT_A, EVENT_B, USER_A, USER_B],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  await client.query("GRANT USAGE ON SCHEMA public TO authenticated");

  async function asUser(userId, sql, params = []) {
    await client.query("BEGIN");
    try {
      await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
      await client.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
      await client.query("SET LOCAL ROLE authenticated");
      const result = await client.query(sql, params);
      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  const ownA = await asUser(USER_A, `SELECT id FROM public.client_events WHERE id = $1`, [EVENT_A]);
  log("rls_user_a_sees_own_event", ownA.length === 1 ? "PASS" : "FAIL");

  const foreignA = await asUser(
    USER_A,
    `SELECT id FROM public.client_events WHERE id = $1`,
    [EVENT_B],
  );
  log("rls_user_a_blocked_foreign_event", foreignA.length === 0 ? "PASS" : "FAIL");

  const ownProfileB = await asUser(USER_B, `SELECT id FROM public.profiles WHERE id = $1`, [USER_B]);
  log("rls_user_b_sees_own_profile", ownProfileB.length === 1 ? "PASS" : "FAIL");

  const foreignProfileB = await asUser(
    USER_B,
    `SELECT id FROM public.profiles WHERE id = $1`,
    [USER_A],
  );
  log("rls_user_b_blocked_foreign_profile", foreignProfileB.length === 0 ? "PASS" : "FAIL");

  report.pass = report.tests.every((t) => t.status === "PASS");
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
