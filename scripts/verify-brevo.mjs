/**
 * Verifica integração Brevo — API, listas e atributos personalizados.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");

const REQUIRED_CUSTOM_ATTRS = [
  "PROJECT_TYPE",
  "PACKAGE",
  "LEAD_SOURCE",
  "INQUIRY_ID",
  "MARKETING_OPT_IN",
  "CLIENT_INTENT",
];

function loadEnv() {
  const values = {};
  if (!existsSync(ENV_FILE)) return values;
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function brevoGet(apiKey, path) {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    headers: { accept: "application/json", "api-key": apiKey },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data };
}

async function main() {
  const env = loadEnv();
  const apiKey = env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    console.log("SKIP  BREVO_API_KEY não configurada — integração opcional.");
    console.log("\nConfigure no .env.local:");
    console.log("  BREVO_API_KEY=xkeysib-...");
    console.log("  BREVO_LIST_LEADS=2");
    console.log("  BREVO_LIST_NEWSLETTER=3");
    return 0;
  }

  let failed = 0;

  const account = await brevoGet(apiKey, "/account");
  if (!account.ok) {
    const msg = JSON.stringify(account.data ?? "");
    if (account.status === 401 && /IP address|authorised_ips/i.test(msg)) {
      console.log(
        "WARN  IP não autorizado no Brevo — adicionar em Security → Authorised IPs"
      );
      console.log("      https://app.brevo.com/security/authorised_ips");
      console.log("      (A chave pode estar correcta; o bloqueio é por IP.)");
      return 0;
    }
    if (account.status === 401) {
      console.log("WARN  BREVO_API_KEY inválida (401) — corrigir no painel Brevo");
      return 0;
    }
    console.log(`FAIL  API Brevo (${account.status})`);
    return 1;
  }
  const company = account.data?.companyName ?? account.data?.email ?? "conta OK";
  console.log(`OK    API · ${company}`);

  const listIds = [
    ["BREVO_LIST_LEADS", env.BREVO_LIST_LEADS],
    ["BREVO_LIST_NEWSLETTER", env.BREVO_LIST_NEWSLETTER],
  ];

  const listsRes = await brevoGet(apiKey, "/contacts/lists?limit=50");
  const knownLists = new Map(
    (listsRes.data?.lists ?? []).map((item) => [item.id, item.name])
  );

  for (const [envKey, rawId] of listIds) {
    const id = Number.parseInt(String(rawId ?? "").trim(), 10);
    if (!Number.isFinite(id) || id <= 0) {
      console.log(`WARN  ${envKey} não definida`);
      continue;
    }
    const name = knownLists.get(id);
    if (name) {
      console.log(`OK    ${envKey}=${id} · ${name}`);
    } else {
      failed++;
      console.log(`FAIL  ${envKey}=${id} — lista não encontrada na conta`);
    }
  }

  const attrsRes = await brevoGet(apiKey, "/contacts/attributes");
  const normalAttrs = new Set(
    (attrsRes.data?.attributes ?? [])
      .filter((a) => a.category === "normal")
      .map((a) => a.name)
  );

  for (const attr of REQUIRED_CUSTOM_ATTRS) {
    if (normalAttrs.has(attr)) {
      console.log(`OK    atributo ${attr}`);
    } else {
      failed++;
      console.log(
        `FAIL  atributo ${attr} em falta — criar em Brevo → Contacts → Settings`
      );
    }
  }

  if (failed) {
    console.log(`\n${failed} problema(s) — corrigir no painel Brevo antes de produção.`);
    return 1;
  }

  console.log("\nBrevo pronto para sync de leads e newsletter.");

  if (env.BREVO_FUNNEL_ENABLED === "false") {
    console.log("INFO  BREVO_FUNNEL_ENABLED=false — funil transaccional desactivado");
  } else {
    console.log("OK    funil transaccional activo (boas-vindas + cron follow-ups)");
  }

  if (!env.CRON_SECRET?.trim()) {
    console.log("WARN  CRON_SECRET em falta — follow-ups automáticos não correm em produção");
  }
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
