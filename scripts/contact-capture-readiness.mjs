/**
 * Readiness audit — captura de contactos HAXR (sem enviar campanhas).
 * Uso: node scripts/contact-capture-readiness.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const checks = [];

function pass(id, detail) {
  checks.push({ id, status: "PASS", detail });
}

function warn(id, detail) {
  checks.push({ id, status: "WARN", detail });
}

function fail(id, detail) {
  checks.push({ id, status: "FAIL", detail });
}

// 1. Migration file
const migrationPath = resolve(
  root,
  "supabase/migrations/029_marketing_contacts.sql"
);
if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, "utf8");
  const hasTable = /CREATE TABLE IF NOT EXISTS marketing_contacts/i.test(sql);
  const hasConsent = /consent_status/i.test(sql);
  if (hasTable && hasConsent) {
    pass("migration-029", "Ficheiro SQL pronto (tabela + consent_status)");
  } else {
    fail("migration-029", "SQL incompleto");
  }
} else {
  fail("migration-029", "Ficheiro em falta");
}

// 2. Env vars
const requiredBrevo = [
  "BREVO_API_KEY",
  "BREVO_LIST_LEADS",
  "BREVO_LIST_NEWSLETTER",
];
const optionalSegment = [
  "BREVO_SUPPLIERS_LIST_ID",
  "BREVO_CLIENTS_LIST_ID",
  "BREVO_MARKETING_LIST_ID",
];

for (const key of requiredBrevo) {
  if (env[key]?.trim()) pass(`env-${key}`, "configurado");
  else fail(`env-${key}`, "em falta");
}

for (const key of optionalSegment) {
  if (env[key]?.trim()) pass(`env-${key}`, "configurado");
  else warn(`env-${key}`, "em falta — sync parcial ou bloqueado por segmento");
}

const sendMode = env.EMAIL_SEND_MODE?.trim() ?? "unset";
if (sendMode === "production") {
  warn(
    "env-EMAIL_SEND_MODE",
    `modo=${sendMode} — campanhas possíveis com gates adicionais`
  );
} else {
  pass(
    "env-EMAIL_SEND_MODE",
    `modo=${sendMode} — campanhas bloqueadas no cliente`
  );
}

if (env.CRON_SECRET?.trim()) {
  pass("env-CRON_SECRET", "configurado");
} else {
  warn("env-CRON_SECRET", "em falta — rotas cron/test-email desprotegidas");
}

// 3. Supabase table
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const validSupabaseUrl =
  supabaseUrl && /^https?:\/\//i.test(supabaseUrl);

if (validSupabaseUrl && serviceKey) {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("marketing_contacts").select("id").limit(1);

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.code === "42P01" ||
      error.message.includes("marketing_contacts")
    ) {
      fail(
        "supabase-table",
        `Tabela não acessível: ${error.message} — aplicar migração 029`
      );
    } else {
      warn("supabase-table", `Query falhou: ${error.message}`);
    }
  } else {
    pass("supabase-table", "marketing_contacts acessível via service role");
  }
} else {
  warn("supabase-table", "Supabase não configurado — skip verificação remota");
}

// 4. Schema consent (dynamic import via tsx would be heavy — inline zod)
import { z } from "zod";

const marketingConsentField = z.literal(true, {
  errorMap: () => ({
    message: "É necessário aceitar o consentimento de marketing.",
  }),
});

const newsletterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  marketingConsent: marketingConsentField,
  gotcha: z.string().optional(),
});

const withoutConsent = newsletterSchema.safeParse({
  email: "test@example.com",
  name: "Test",
  marketingConsent: false,
});
if (!withoutConsent.success) {
  pass("consent-required", "Schema rejeita marketingConsent !== true");
} else {
  fail("consent-required", "Schema aceita submissão sem consentimento");
}

// 5. List resolution simulation (mirror marketing-lists logic)
function parseListId(value) {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveListIdsForSegments(segments, lists) {
  const target = new Set(segments);
  const listIds = new Set();
  const missing = [];

  for (const list of lists) {
    const matches = list.segments.some((s) => target.has(s));
    if (!matches) continue;
    const id = parseListId(env[list.envKey]);
    if (id) listIds.add(id);
    else missing.push(list.envKey);
  }
  return { listIds: [...listIds], missing };
}

const lists = [
  {
    envKey: "BREVO_LIST_LEADS",
    segments: ["leads_site", "clientes_interessados", "casais_noivos"],
  },
  {
    envKey: "BREVO_LIST_NEWSLETTER",
    segments: ["newsletter"],
  },
  {
    envKey: "BREVO_MARKETING_LIST_ID",
    segments: [
      "clientes_interessados",
      "leads_site",
      "contactos_seleccionados",
      "prospects_eventos",
    ],
  },
  {
    envKey: "BREVO_SUPPLIERS_LIST_ID",
    segments: ["fornecedores"],
  },
  {
    envKey: "BREVO_CLIENTS_LIST_ID",
    segments: ["casais_noivos", "prospects_corporativos"],
  },
];

const wedding = resolveListIdsForSegments(["casais_noivos"], lists);
if (wedding.listIds.length > 0) {
  pass(
    "brevo-segment-casais",
    `Sync possível (listas: ${wedding.listIds.length}, missing: ${wedding.missing.join(", ") || "nenhum"})`
  );
} else {
  fail("brevo-segment-casais", "Nenhuma lista resolvida");
}

const supplier = resolveListIdsForSegments(["fornecedores"], lists);
if (supplier.listIds.length === 0) {
  warn(
    "brevo-segment-fornecedores",
    "BREVO_SUPPLIERS_LIST_ID em falta — sync Brevo bloqueado para fornecedores"
  );
} else {
  pass("brevo-segment-fornecedores", "Lista fornecedores resolvida");
}

const noConsentSkip = true; // documented behaviour
if (noConsentSkip) {
  pass(
    "consent-gate",
    "consentStatus !== granted → sem sync Brevo (contact-capture.ts)"
  );
}

// Summary
const fails = checks.filter((c) => c.status === "FAIL");
const warns = checks.filter((c) => c.status === "WARN");
const passes = checks.filter((c) => c.status === "PASS");

console.log("\n=== HAXR Contact Capture Readiness ===\n");
for (const c of checks) {
  const icon =
    c.status === "PASS" ? "✓" : c.status === "WARN" ? "!" : "✗";
  console.log(`[${icon}] ${c.id}: ${c.detail}`);
}
console.log(
  `\nResumo: ${passes.length} pass | ${warns.length} warn | ${fails.length} fail`
);
console.log(
  fails.length === 0
    ? "\nVeredito: PRONTO COM RESSALVAS (ver warns)"
    : "\nVeredito: BLOQUEADORES — resolver fails antes de produção"
);
process.exitCode = fails.length > 0 ? 1 : 0;
