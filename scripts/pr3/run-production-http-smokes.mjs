/**
 * PR.3 — smokes HTTP controlados contra produção (pós-schema + deploy).
 * Requer PR3_HTTP_SMOKE_AUTHORIZED=1 e GO registado.
 * Usa .env.local (produção) — nunca imprime secrets.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const SMOKE_EMAIL = "pr3-http-smoke@provision.haxrsignature.internal";
const REPORT_PATH = resolve(
  process.cwd(),
  "backups/pr3-production-pre036/production-http-smoke-report.json",
);

if (process.env.PR3_HTTP_SMOKE_AUTHORIZED !== "1") {
  console.error("ABORT: PR3_HTTP_SMOKE_AUTHORIZED=1 required.");
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
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
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

const env = loadEnv(".env.local");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl =
  process.env.PR3_HTTP_SMOKE_BASE_URL?.trim() ||
  env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://www.haxrsignature.com";

const report = {
  phase: "pr3-production-http-smokes",
  pass: false,
  baseUrl,
  productionRef: PRODUCTION_REF,
  startedAt: new Date().toISOString(),
  tests: [],
};

function log(id, pass, detail = "") {
  report.tests.push({ id, pass, detail });
}

function abort(reason) {
  report.pass = false;
  report.finishedAt = new Date().toISOString();
  report.abortReason = reason;
  mkdirSync(resolve(process.cwd(), "backups/pr3-production-pre036"), {
    recursive: true,
  });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!supabaseUrl?.includes(PRODUCTION_REF)) {
  abort("supabase_url_not_production");
}

if (!anonKey || !serviceRoleKey) {
  abort("missing_supabase_keys_in_env_local");
}

const root = baseUrl.replace(/\/$/, "");

// 1. Páginas públicas
try {
  const signIn = await fetch(`${root}/sign-in`, {
    method: "GET",
    redirect: "manual",
    headers: { Accept: "text/html" },
  });
  log("page_sign_in", signIn.status === 200, `status=${signIn.status}`);
} catch (e) {
  log("page_sign_in", false, e.message);
}

try {
  const appEvents = await fetch(`${root}/app/events`, {
    method: "GET",
    redirect: "manual",
    headers: { Accept: "text/html" },
  });
  const ok =
    appEvents.status === 307 ||
    appEvents.status === 308 ||
    appEvents.status === 302 ||
    appEvents.status === 401 ||
    appEvents.status === 403;
  log("page_app_events_unauth", ok, `status=${appEvents.status}`);
} catch (e) {
  log("page_app_events_unauth", false, e.message);
}

// 2. API sem auth — POST (rota expõe só POST)
try {
  const res = await fetch(`${root}/api/events`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: "{}",
  });
  log("api_events_unauth", res.status === 401, `status=${res.status}`);
} catch (e) {
  log("api_events_unauth", false, e.message);
}

// 3. Auth + POST autenticado (provisão efémera se necessário)
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const authClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const smokePassword =
  process.env.PR3_SMOKE_USER_PASSWORD?.trim() ||
  randomBytes(24).toString("base64url");

let provisioned = false;

const { data: existingUsers, error: listError } =
  await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

if (listError) {
  log("auth_admin_list", false, "list_failed");
  abort("auth_admin_list_failed");
}

log("auth_admin_list", true, `users=${existingUsers?.users?.length ?? 0}`);

const { data: created, error: createError } =
  await admin.auth.admin.createUser({
    email: SMOKE_EMAIL,
    password: smokePassword,
    email_confirm: true,
    user_metadata: { pr3_smoke: true, source: "pr3-http-smokes" },
  });

if (createError) {
  const alreadyExists =
    createError.message?.toLowerCase().includes("already") ||
    createError.status === 422;
  if (!alreadyExists) {
    log("auth_provision_user", false, "create_failed");
    abort("auth_provision_failed");
  }

  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = listed?.users?.find((u) => u.email === SMOKE_EMAIL);
  if (!existing?.id) {
    log("auth_provision_user", false, "existing_not_found");
    abort("auth_provision_existing_not_found");
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password: smokePassword,
    email_confirm: true,
  });
  if (updateError) {
    log("auth_provision_user", false, "password_reset_failed");
    abort("auth_provision_password_reset_failed");
  }
  log("auth_provision_user", true, "reused_existing");
} else {
  provisioned = Boolean(created.user?.id);
  log("auth_provision_user", true, provisioned ? "created" : "unknown");
}

const { data: signInData, error: signInError } =
  await authClient.auth.signInWithPassword({
    email: SMOKE_EMAIL,
    password: smokePassword,
  });

log(
  "auth_sign_in",
  !signInError && Boolean(signInData.session?.access_token),
  signInError ? "auth_failed" : "ok",
);

if (signInData.session?.access_token) {
  const token = signInData.session.access_token;
  const fingerprint = `pr3-smoke-${randomUUID()}`;
  const payload = {
    eventType: "wedding",
    eventName: "PR3 Smoke Event",
    brideName: "Smoke",
    groomName: "Test",
    eventDate: "2026-12-31",
    eventLocation: "Maputo",
    estimatedGuests: 50,
    budgetMin: 10000,
    budgetMax: 20000,
    servicesInterested: ["convites_digitais"],
    phone: "+258840000001",
    source: "onboarding",
    localFingerprint: fingerprint,
  };

  const authed = await fetch(`${root}/api/events`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": fingerprint,
    },
    body: JSON.stringify(payload),
  });

  let body;
  try {
    body = await authed.json();
  } catch {
    body = null;
  }

  const authedOk =
    (authed.status === 200 || authed.status === 201) &&
    body?.ok === true &&
    typeof body?.data?.eventId === "string";

  log(
    "api_events_authed_create",
    authedOk,
    authedOk
      ? `status=${authed.status}`
      : `status=${authed.status} error=${body?.error ?? "unknown"}`,
  );

  await authClient.auth.signOut();
  log("auth_sign_out", true);
} else {
  log("api_events_authed_create", false, "skipped_no_session");
}

report.pass = report.tests.every((t) => t.pass);
report.finishedAt = new Date().toISOString();
report.provisionedSmokeUser = provisioned;
report.smokeUserEmail = SMOKE_EMAIL;

mkdirSync(resolve(process.cwd(), "backups/pr3-production-pre036"), {
  recursive: true,
});
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
