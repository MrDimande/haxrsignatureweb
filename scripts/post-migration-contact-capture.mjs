/**
 * Post-migration validation — captura de contactos HAXR.
 * Uso: node scripts/post-migration-contact-capture.mjs [--base http://localhost:3000]
 *
 * Não envia campanhas. Usa emails @haxr-qa.invalid.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      out[m[1].trim()] = v;
    }
  }
  return out;
}

const env = { ...process.env, ...loadEnvLocal() };
const ts = Date.now();
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const icon = ok ? "PASS" : "FAIL";
  console.log(`[${icon}] ${name}: ${detail}`);
}

function envStatus(key) {
  return env[key]?.trim() ? "configured" : "MISSING";
}

console.log("\n=== Post-migration validation — HAXR contact capture ===\n");
console.log(`Base URL: ${baseUrl}\n`);

// --- 1. Environment ---
console.log("-- Environment --");
const envKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BREVO_API_KEY",
  "BREVO_LIST_LEADS",
  "BREVO_LIST_NEWSLETTER",
  "BREVO_MARKETING_LIST_ID",
  "BREVO_SUPPLIERS_LIST_ID",
  "BREVO_CLIENTS_LIST_ID",
  "EMAIL_SEND_MODE",
  "CRON_SECRET",
];
for (const key of envKeys) {
  const status = envStatus(key);
  console.log(`  ${key}: ${status}`);
  if (["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BREVO_API_KEY", "BREVO_LIST_LEADS", "BREVO_LIST_NEWSLETTER", "EMAIL_SEND_MODE"].includes(key) && status === "MISSING") {
    record(`env-${key}`, false, "obrigatório em falta");
  }
}

// --- 2. Supabase table + insert probe ---
console.log("\n-- Supabase --");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;

if (supabaseUrl && serviceKey && /^https?:\/\//i.test(supabaseUrl)) {
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: tableErr } = await supabase
    .from("marketing_contacts")
    .select("id")
    .limit(1);

  if (tableErr) {
    record(
      "supabase-table-exists",
      false,
      `${tableErr.message} — se schema cache: NOTIFY pgrst, 'reload schema';`
    );
  } else {
    record("supabase-table-exists", true, "public.marketing_contacts acessível");
  }
} else {
  record("supabase-table-exists", false, "Supabase URL/service key inválidos");
}

async function post(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function assertRow(email, expected) {
  if (!supabase) return { ok: false, detail: "sem cliente Supabase" };
  const { data, error } = await supabase
    .from("marketing_contacts")
    .select(
      "email, segment, source, consent_status, consent_text, consent_at, phone, brevo_synced_at"
    )
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, detail: error.message };
  if (!data) return { ok: false, detail: "registo não encontrado" };

  for (const [key, value] of Object.entries(expected)) {
    if (data[key] !== value) {
      return {
        ok: false,
        detail: `${key}: esperado ${value}, obtido ${data[key]}`,
      };
    }
  }
  if (!data.consent_at) {
    return { ok: false, detail: "consent_at vazio" };
  }
  if (!data.consent_text) {
    return { ok: false, detail: "consent_text vazio" };
  }
  return { ok: true, detail: `segment=${data.segment} source=${data.source}` };
}

// --- 3. API positive tests ---
console.log("\n-- API positive tests --");
const tracked = [];

const newsEmail = `qa-news-${ts}@haxr-qa.invalid`;
tracked.push({ email: newsEmail, path: "newsletter" });
{
  const { status, data } = await post("/api/marketing/newsletter", {
    name: "QA Newsletter",
    email: newsEmail,
    marketingConsent: true,
    gotcha: "",
  });
  record(
    "api-newsletter-200",
    status === 200 && data?.success,
    `HTTP ${status}`
  );
  const row = await assertRow(newsEmail, {
    segment: "newsletter",
    source: "newsletter_signup",
    consent_status: "granted",
  });
  record("api-newsletter-supabase", row.ok, row.detail);
}

const wedEmail = `qa-wed-${ts}@haxr-qa.invalid`;
tracked.push({ email: wedEmail, path: "quote-casamento" });
{
  const { status } = await post("/api/marketing/quote", {
    name: "QA Casamento",
    email: wedEmail,
    phone: "+244923456789",
    eventType: "casamento",
    city: "Luanda",
    marketingConsent: true,
    gotcha: "",
  });
  record("api-quote-casamento-200", status === 200, `HTTP ${status}`);
  const row = await assertRow(wedEmail, {
    segment: "casais_noivos",
    source: "quote_request",
    consent_status: "granted",
  });
  record("api-quote-casamento-supabase", row.ok, row.detail);
}

const corpEmail = `qa-corp-${ts}@haxr-qa.invalid`;
tracked.push({ email: corpEmail, path: "quote-corporativo" });
{
  const { status } = await post("/api/marketing/quote", {
    name: "QA Corporativo",
    email: corpEmail,
    phone: "923456789",
    eventType: "corporativo",
    city: "Maputo",
    marketingConsent: true,
    gotcha: "",
  });
  record("api-quote-corporativo-200", status === 200, `HTTP ${status}`);
  const row = await assertRow(corpEmail, {
    segment: "prospects_corporativos",
    source: "quote_request",
    consent_status: "granted",
  });
  record("api-quote-corporativo-supabase", row.ok, row.detail);
}

const supEmail = `qa-sup-${ts}@haxr-qa.invalid`;
tracked.push({ email: supEmail, path: "supplier" });
{
  const { status } = await post("/api/marketing/supplier-leads", {
    supplierName: "QA Fornecedor",
    responsibleName: "Resp QA",
    email: supEmail,
    phone: "+258841234567",
    category: "fotografia",
    city: "Maputo",
    marketingConsent: true,
    gotcha: "",
  });
  record("api-supplier-200", status === 200, `HTTP ${status}`);
  const row = await assertRow(supEmail, {
    segment: "fornecedores",
    source: "supplier_join_form",
    consent_status: "granted",
  });
  record("api-supplier-supabase", row.ok, row.detail);
}

// --- 4. Negative tests ---
console.log("\n-- API negative tests --");
{
  const { status } = await post("/api/marketing/newsletter", {
    name: "QA No Consent",
    email: `qa-noconsent-${ts}@haxr-qa.invalid`,
    marketingConsent: false,
    gotcha: "",
  });
  record("negative-no-consent-400", status === 400, `HTTP ${status}`);
}

{
  const honeypotEmail = `qa-honeypot-${ts}@haxr-qa.invalid`;
  const { status } = await post("/api/marketing/newsletter", {
    name: "Bot",
    email: honeypotEmail,
    marketingConsent: true,
    gotcha: "spam",
  });
  const row = await assertRow(honeypotEmail, { segment: "newsletter" });
  record(
    "negative-honeypot-silent-200",
    status === 200 && !row.ok,
    `HTTP ${status}, sem registo Supabase`
  );
}

{
  const { status, data } = await post("/api/marketing/newsletter", {
    name: "X",
    email: "not-an-email",
    marketingConsent: true,
    gotcha: "",
  });
  record(
    "negative-invalid-email-400",
    status === 400 && Boolean(data?.error),
    `HTTP ${status}`
  );
}

{
  const rateEmail = `qa-rate-${ts}@haxr-qa.invalid`;
  let lastStatus = 200;
  for (let i = 0; i < 6; i++) {
    const { status } = await post("/api/marketing/newsletter", {
      name: `Rate ${i}`,
      email: rateEmail,
      marketingConsent: true,
      gotcha: "",
    });
    lastStatus = status;
  }
  record("negative-rate-limit-429", lastStatus === 429, `último HTTP ${lastStatus}`);
}

// --- Summary ---
const failed = results.filter((r) => !r.ok);
console.log("\n-- Summary --");
console.log(`Total checks: ${results.length}`);
console.log(`Passed: ${results.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
if (failed.length) {
  console.log("\nFailures:");
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
} else {
  console.log("\nVeredito: post-migration validation PASSED");
}
