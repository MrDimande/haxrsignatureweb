/**
 * PR.3 — remoção exclusiva dos artefactos smoke identificados no inventário.
 * Requer PR3_SMOKE_DELETE_AUTHORIZED=PR3_SMOKE_DELETE_GO_CONFIRMED
 * e PR3_SOURCE_PGPASSWORD (ou PGPASSWORD) na sessão.
 * Nunca imprime secrets.
 */
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";

const SMOKE = {
  email: "pr3-http-smoke@provision.haxrsignature.internal",
  userId: "d7f1743c-69de-4e90-bd29-91f0fcd900d8",
  clientEventId: "3463d58b-b08b-40df-833b-4db261382096",
  memberId: "affc462c-d36b-40b6-af2b-9f3ccf0986ec",
  snapshotId: "ff6d9bff-b17a-4222-9592-d7d72f824d1f",
  operationalEventId: "7b3316ce-771d-4f30-9dec-b63820c3c0fc",
  fingerprint: "pr3-smoke-602d8f38-40e2-4249-a66b-a5831e1113dd",
};

if (process.env.PR3_SMOKE_DELETE_AUTHORIZED !== "PR3_SMOKE_DELETE_GO_CONFIRMED") {
  console.error("ABORT: PR3_SMOKE_DELETE_AUTHORIZED=PR3_SMOKE_DELETE_GO_CONFIRMED required.");
  process.exit(1);
}

function loadEnv(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return {};
  const entries = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    entries[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return entries;
}

const env = loadEnv(".env.local");
const password =
  process.env.PR3_SOURCE_PGPASSWORD?.trim() || process.env.PGPASSWORD?.trim();
const url =
  process.env.PR3_SOURCE_DATABASE_URL?.trim() ||
  `postgresql://postgres.${PRODUCTION_REF}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require`;

if (!password) {
  console.error("ABORT: PR3_SOURCE_PGPASSWORD or PGPASSWORD required.");
  process.exit(1);
}

if (!url.includes(PRODUCTION_REF)) {
  console.error("ABORT: database URL must target production ref.");
  process.exit(1);
}

const report = {
  phase: "pr3-smoke-artifact-removal",
  startedAt: new Date().toISOString(),
  smoke: SMOKE,
  preflight: {},
  deleted: {},
  pass: false,
};

const client = new pg.Client({ connectionString: url, password });

try {
  await client.connect();

  const pre = await client.query(
    `SELECT
      (SELECT COUNT(*)::int FROM auth.users WHERE email = $1) AS smoke_users,
      (SELECT COUNT(*)::int FROM public.profiles WHERE id = $2) AS smoke_profiles,
      (SELECT COUNT(*)::int FROM public.client_events WHERE id = $3) AS smoke_client_events,
      (SELECT COUNT(*)::int FROM public.event_members WHERE id = $4) AS smoke_members,
      (SELECT COUNT(*)::int FROM public.event_onboarding_snapshots WHERE id = $5) AS smoke_snapshots,
      (SELECT COUNT(*)::int FROM public.events WHERE id = $6) AS smoke_operational_events,
      (SELECT COUNT(*)::int FROM public.client_events WHERE owner_user_id = $2) AS client_events_by_owner,
      (SELECT COUNT(*)::int FROM public.guests WHERE event_id = $6) AS op_guests,
      (SELECT COUNT(*)::int FROM public.payments WHERE event_id = $6) AS op_payments,
      (SELECT onboarding_fingerprint FROM public.client_events WHERE id = $3) AS fingerprint`,
    [
      SMOKE.email,
      SMOKE.userId,
      SMOKE.clientEventId,
      SMOKE.memberId,
      SMOKE.snapshotId,
      SMOKE.operationalEventId,
    ],
  );

  report.preflight = pre.rows[0];

  const p = pre.rows[0];
  const preOk =
    p.smoke_users === 1 &&
    p.smoke_profiles === 1 &&
    p.smoke_client_events === 1 &&
    p.smoke_members === 1 &&
    p.smoke_snapshots === 1 &&
    p.smoke_operational_events === 1 &&
    p.client_events_by_owner === 1 &&
    p.op_guests === 0 &&
    p.op_payments === 0 &&
    p.fingerprint === SMOKE.fingerprint;

  if (!preOk) {
    console.error("ABORT: preflight inventory mismatch.", JSON.stringify(p, null, 2));
    process.exit(1);
  }

  await client.query("BEGIN");

  const steps = [
    {
      key: "event_onboarding_snapshots",
      sql: `DELETE FROM public.event_onboarding_snapshots WHERE id = $1`,
      params: [SMOKE.snapshotId],
      expect: 1,
    },
    {
      key: "event_members",
      sql: `DELETE FROM public.event_members WHERE id = $1`,
      params: [SMOKE.memberId],
      expect: 1,
    },
    {
      key: "profiles_active_null",
      sql: `UPDATE public.profiles SET active_client_event_id = NULL WHERE id = $1 AND active_client_event_id = $2`,
      params: [SMOKE.userId, SMOKE.clientEventId],
      expect: 1,
    },
    {
      key: "client_events",
      sql: `DELETE FROM public.client_events WHERE id = $1`,
      params: [SMOKE.clientEventId],
      expect: 1,
    },
    {
      key: "events_operational",
      sql: `DELETE FROM public.events WHERE id = $1`,
      params: [SMOKE.operationalEventId],
      expect: 1,
    },
    {
      key: "profiles",
      sql: `DELETE FROM public.profiles WHERE id = $1`,
      params: [SMOKE.userId],
      expect: 1,
    },
  ];

  for (const step of steps) {
    const res = await client.query(step.sql, step.params);
    report.deleted[step.key] = res.rowCount;
    if (res.rowCount !== step.expect) {
      await client.query("ROLLBACK");
      console.error(
        `ABORT: ${step.key} rowCount=${res.rowCount} expected=${step.expect}`,
      );
      process.exit(1);
    }
  }

  await client.query("COMMIT");
  report.dbTransactionPass = true;
} catch (e) {
  try {
    await client.query("ROLLBACK");
  } catch {
    /* ignore */
  }
  console.error("ABORT:", e.message);
  process.exit(1);
} finally {
  await client.end();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl?.includes(PRODUCTION_REF) || !serviceKey) {
  console.error("ABORT: Supabase admin env missing for auth user delete.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: deleteError } = await admin.auth.admin.deleteUser(SMOKE.userId);
if (deleteError) {
  console.error("ABORT: auth deleteUser failed.", deleteError.message);
  process.exit(1);
}

report.authUserDeleted = true;

const post = await (async () => {
  const c = new pg.Client({ connectionString: url, password });
  await c.connect();
  try {
    const r = await c.query(
      `SELECT
        (SELECT COUNT(*)::int FROM auth.users WHERE id = $1) AS smoke_users,
        (SELECT COUNT(*)::int FROM public.profiles WHERE id = $1) AS smoke_profiles,
        (SELECT COUNT(*)::int FROM public.client_events WHERE id = $2) AS smoke_client_events`,
      [SMOKE.userId, SMOKE.clientEventId],
    );
    return r.rows[0];
  } finally {
    await c.end();
  }
})();

report.postVerify = post;
report.pass =
  post.smoke_users === 0 &&
  post.smoke_profiles === 0 &&
  post.smoke_client_events === 0;
report.finishedAt = new Date().toISOString();

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
