/**
 * E.4.1 preview smoke — GET /api/events/[eventId]/guests with real auth.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PREVIEW_REF = "uxleigndoomoezwsxlan";
const STAGING_USER_ID = "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee";
const FOREIGN_EVENT_ID_FALLBACK = "00000000-0000-4000-8000-000000000001";
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3000";

function resolveStagingConfig(fileEnv) {
  const email = process.env.STAGING_TEST_EMAIL?.trim() || fileEnv.STAGING_TEST_EMAIL?.trim();
  const password =
    process.env.STAGING_TEST_PASSWORD?.trim() || fileEnv.STAGING_TEST_PASSWORD?.trim();
  const eventId =
    process.env.STAGING_TEST_EVENT_ID?.trim() || fileEnv.STAGING_TEST_EVENT_ID?.trim();

  return { email, password, eventId };
}

function loadEnv(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};

  const entries = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    entries[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return entries;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.development.local") };

if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes(PREVIEW_REF)) {
  console.error(`ABORT: preview ref ${PREVIEW_REF} required.`);
  process.exit(1);
}

if (env.NEXT_PUBLIC_SUPABASE_URL.includes("oxsrdmydlqyvnueedgtl")) {
  console.error("ABORT: production ref detected.");
  process.exit(1);
}

const staging = resolveStagingConfig(env);
if (!staging.email || !staging.password || !staging.eventId) {
  console.error(
    "ABORT: set STAGING_TEST_EMAIL, STAGING_TEST_PASSWORD and STAGING_TEST_EVENT_ID.",
  );
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: staging.email,
  password: staging.password,
});

if (authError || !auth.session?.access_token) {
  console.error("AUTH FAIL");
  process.exit(1);
}

const token = auth.session.access_token;

async function getGuests(eventId) {
  const response = await fetch(
    `${API_BASE}/api/events/${encodeURIComponent(eventId)}/guests`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const body = await response.json();
  return { status: response.status, body };
}

async function resolveForeignEventId() {
  if (process.env.FOREIGN_EVENT_ID?.trim()) {
    return process.env.FOREIGN_EVENT_ID.trim();
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from("client_events")
    .select("id")
    .neq("owner_user_id", STAGING_USER_ID)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("WARN: foreign event lookup failed:", error.message);
    return null;
  }

  return data?.id ?? null;
}

const own = await getGuests(staging.eventId);
const foreignEventId = await resolveForeignEventId();
const foreign = await getGuests(foreignEventId ?? FOREIGN_EVENT_ID_FALLBACK);
const missing = await getGuests("00000000-0000-4000-8000-000000009999");
const unauth = await fetch(
  `${API_BASE}/api/events/${encodeURIComponent(staging.eventId)}/guests`,
  { cache: "no-store" },
).then(async (response) => ({
  status: response.status,
  body: await response.json(),
}));
const demo = await fetch(
  `${API_BASE}/api/events/${encodeURIComponent("jessica-samuel")}/guests`,
  { cache: "no-store" },
).then(async (response) => ({
  status: response.status,
  body: await response.json(),
}));

const foreignPass = foreignEventId
  ? foreign.status === 403 && foreign.body.error === "forbidden"
  : foreign.status === 404 && foreign.body.error === "not_found";

const ownGuestsOk =
  own.status === 200 &&
  own.body.ok === true &&
  own.body.data?.context?.eventId === staging.eventId &&
  Array.isArray(own.body.data?.guests) &&
  typeof own.body.data?.summary?.total === "number";

const pass =
  ownGuestsOk &&
  foreignPass &&
  missing.status === 404 &&
  missing.body.error === "not_found" &&
  unauth.status === 401 &&
  unauth.body.error === "unauthorized" &&
  demo.status === 200 &&
  demo.body.ok === true;

const summarySnapshot = own.body.ok
  ? {
      total: own.body.data.summary.total,
      confirmed: own.body.data.summary.confirmed,
      pending: own.body.data.summary.pending,
      declined: own.body.data.summary.declined,
      plusOnes: own.body.data.summary.plusOnes,
      tablesAssigned: own.body.data.summary.tablesAssigned,
      tablesTotal: own.body.data.summary.tablesTotal,
      guestCount: own.body.data.guests.length,
    }
  : null;

console.log(
  JSON.stringify(
    {
      pass,
      own: {
        status: own.status,
        eventName: own.body.data?.context?.eventOverview?.name,
        summary: summarySnapshot,
      },
      foreign: {
        status: foreign.status,
        error: foreign.body.error,
        mode: foreignEventId ? "existing_foreign_event" : "missing_foreign_uuid",
        eventId: foreignEventId ?? FOREIGN_EVENT_ID_FALLBACK,
      },
      missing: { status: missing.status, error: missing.body.error },
      unauth: { status: unauth.status, error: unauth.body.error },
      demo: {
        status: demo.status,
        ok: demo.body.ok,
        guestCount: demo.body.data?.guests?.length ?? null,
      },
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);
