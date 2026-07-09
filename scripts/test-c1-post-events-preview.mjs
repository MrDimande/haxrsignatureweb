/**
 * C.1 preview smoke test for POST /api/events (local dev server).
 * Uses preview auth only — never production.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PREVIEW_REF = "uxleigndoomoezwsxlan";

function trimEnv(value) {
  return value?.trim() || undefined;
}

function resolveStagingConfig(fileEnv) {
  const email =
    trimEnv(process.env.STAGING_TEST_EMAIL) || trimEnv(fileEnv.STAGING_TEST_EMAIL);
  const password =
    trimEnv(process.env.STAGING_TEST_PASSWORD) || trimEnv(fileEnv.STAGING_TEST_PASSWORD);
  const eventFingerprint =
    trimEnv(process.env.STAGING_TEST_EVENT_FINGERPRINT) ||
    trimEnv(fileEnv.STAGING_TEST_EVENT_FINGERPRINT);
  const baseUrl =
    trimEnv(process.env.STAGING_TEST_BASE_URL) ||
    trimEnv(process.env.API_BASE_URL) ||
    trimEnv(fileEnv.STAGING_TEST_BASE_URL) ||
    "http://localhost:3000";

  return { email, password, eventFingerprint, baseUrl };
}

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};

  const entries = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

const devEnv = loadEnvFile(".env.development.local");
const localEnv = loadEnvFile(".env.local");
const env = { ...localEnv, ...devEnv };

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl?.includes(PREVIEW_REF)) {
  console.error(
    `ABORT: NEXT_PUBLIC_SUPABASE_URL must point to preview ${PREVIEW_REF}.`,
  );
  process.exit(1);
}

if (supabaseUrl.includes("oxsrdmydlqyvnueedgtl")) {
  console.error("ABORT: production ref detected.");
  process.exit(1);
}

if (!anonKey) {
  console.error("ABORT: NEXT_PUBLIC_SUPABASE_ANON_KEY missing in dev env.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.warn(
    "WARN: SUPABASE_SERVICE_ROLE_KEY missing — POST may return 503 for snapshots.",
  );
}

const staging = resolveStagingConfig(env);
if (!staging.email || !staging.password || !staging.eventFingerprint) {
  console.error(
    "ABORT: set STAGING_TEST_EMAIL, STAGING_TEST_PASSWORD and STAGING_TEST_EVENT_FINGERPRINT " +
      "(env vars or .env.development.local).",
  );
  process.exit(1);
}

const payload = {
  eventType: "wedding",
  eventName: "Evento Teste Staging A",
  brideName: "Staging",
  groomName: "A",
  eventDate: "2026-12-20",
  eventLocation: "Maputo",
  estimatedGuests: 150,
  budgetMin: 80000,
  budgetMax: 150000,
  servicesInterested: ["convites_digitais", "rsvp"],
  phone: "+258840000000",
  source: "onboarding",
  localFingerprint: staging.eventFingerprint,
};

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: signInData, error: signInError } =
  await authClient.auth.signInWithPassword({
    email: staging.email,
    password: staging.password,
  });

if (signInError || !signInData.session?.access_token) {
  console.error("Sign-in failed:", signInError?.message ?? "no session");
  process.exit(1);
}

const accessToken = signInData.session.access_token;

const FAIL_STATUSES = new Set([400, 401, 403, 503]);

function validatePostResponse(result, label) {
  if (FAIL_STATUSES.has(result.status)) {
    return { valid: false, reason: `${label}: unexpected status ${result.status}` };
  }

  if (result.status !== 200 && result.status !== 201) {
    return { valid: false, reason: `${label}: unexpected status ${result.status}` };
  }

  if (result.body?.ok !== true) {
    return { valid: false, reason: `${label}: ok !== true` };
  }

  const eventId = result.body?.data?.eventId;
  if (!eventId || typeof eventId !== "string" || !eventId.trim()) {
    return { valid: false, reason: `${label}: missing eventId` };
  }

  return { valid: true, eventId };
}

function evaluateIdempotentSmoke(first, second) {
  const firstCheck = validatePostResponse(first, "first");
  if (!firstCheck.valid) return { pass: false, reason: firstCheck.reason };

  const secondCheck = validatePostResponse(second, "second");
  if (!secondCheck.valid) return { pass: false, reason: secondCheck.reason };

  if (firstCheck.eventId !== secondCheck.eventId) {
    return { pass: false, reason: "eventIds differ between calls" };
  }

  const scenarioA =
    first.status === 201 &&
    first.body?.created === true &&
    second.status === 200 &&
    second.body?.created === false;

  const scenarioB =
    first.status === 200 &&
    first.body?.created === false &&
    second.status === 200 &&
    second.body?.created === false;

  if (!scenarioA && !scenarioB) {
    return {
      pass: false,
      reason: "neither created_first_run nor idempotent_existing_event matched",
    };
  }

  return {
    pass: true,
    mode: scenarioA ? "created_first_run" : "idempotent_existing_event",
    eventId: firstCheck.eventId,
  };
}

async function postEvent(label) {
  const response = await fetch(`${staging.baseUrl}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  console.log(`\n[${label}] HTTP ${response.status}`);
  console.log(JSON.stringify(body, null, 2));
  return { status: response.status, body };
}

const first = await postEvent("create");
const second = await postEvent("idempotent-replay");

const outcome = evaluateIdempotentSmoke(first, second);

if (outcome.pass) {
  console.log(
    JSON.stringify(
      {
        pass: true,
        mode: outcome.mode,
        eventId: outcome.eventId,
        summary:
          outcome.mode === "created_first_run"
            ? "PASS: 201 + 200 idempotent"
            : "PASS: 200 + 200 idempotent (existing event)",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.error("\nFAIL:", outcome.reason);
process.exit(1);
