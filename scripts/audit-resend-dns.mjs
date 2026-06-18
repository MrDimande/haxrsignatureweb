/**
 * Auditoria DNS Resend — SPF, DKIM (API) e DMARC (lookup DNS público).
 * Uso: npm run verify:resend
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { promises as dns } from "node:dns";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const DOMAIN = "haxrsignature.com";

function loadEnv() {
  const values = {};
  if (!existsSync(ENV_FILE)) return values;
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    let v = trimmed.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    values[trimmed.slice(0, i).trim()] = v;
  }
  return values;
}

function loadApiKey() {
  const key = loadEnv().RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY em falta");
  return key;
}

async function resendApi(path) {
  const response = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${loadApiKey()}` },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  return body;
}

async function lookupTxt(name) {
  try {
    const records = await dns.resolveTxt(name);
    return records.map((parts) => parts.join("")).join(" | ");
  } catch {
    return null;
  }
}

function statusMark(ok) {
  return ok ? "OK" : "PENDENTE";
}

async function main() {
  console.log(`\n═══ Auditoria DNS Resend · ${DOMAIN} ═══\n`);

  const brandDomain = loadEnv().RESEND_BRAND_DOMAIN === "true";
  const { data: domains } = await resendApi("/domains");
  const domain = domains.find((item) => item.name === DOMAIN);

  if (!domain) {
    console.log(`FAIL  Domínio ${DOMAIN} não encontrado no Resend`);
    console.log("      https://resend.com/domains → Add domain");
    process.exit(1);
  }

  const detail = await resendApi(`/domains/${domain.id}`);
  const records = detail.records ?? [];

  console.log(`Domínio:     ${detail.name}`);
  console.log(`Estado:      ${detail.status}`);
  console.log(`Brand env:   RESEND_BRAND_DOMAIN=${brandDomain ? "true" : "false"}`);

  let failed = 0;

  const spfOk = records.some(
    (r) =>
      r.status === "verified" &&
      r.type === "TXT" &&
      /spf|v=spf1/i.test(String(r.value ?? ""))
  );
  const dkimOk = records.some(
    (r) =>
      r.status === "verified" &&
      /domainkey|dkim/i.test(`${r.name ?? ""} ${r.value ?? ""}`)
  );

  for (const record of records) {
    const ok = record.status === "verified";
    if (!ok) failed++;
    console.log(
      `${statusMark(ok).padEnd(8)} ${record.type} ${record.name} — ${record.status}`
    );
  }

  const dmarcTxt = await lookupTxt(`_dmarc.${DOMAIN}`);
  const dmarcOk = dmarcTxt && /v=DMARC1/i.test(dmarcTxt);
  console.log(
    `${statusMark(dmarcOk).padEnd(8)} DMARC _dmarc.${DOMAIN}${dmarcTxt ? "" : " — registo não encontrado"}`
  );
  if (dmarcTxt) console.log(`         ${dmarcTxt.slice(0, 120)}${dmarcTxt.length > 120 ? "…" : ""}`);
  if (!dmarcOk) failed++;

  const domainOk = detail.status === "verified";

  console.log("\n─── Resumo ───");
  console.log(`SPF:         ${statusMark(spfOk)}`);
  console.log(`DKIM:        ${statusMark(dkimOk)}`);
  console.log(`DMARC:       ${statusMark(dmarcOk)}`);
  console.log(`Domínio:     ${statusMark(domainOk)}`);

  if (domainOk && brandDomain) {
    console.log("\nRemetente de marca activo — emails saem de hello@haxrsignature.com");
  } else if (domainOk && !brandDomain) {
    console.log("\nDomínio verificado. Define RESEND_BRAND_DOMAIN=true na Vercel.");
  } else {
    console.log("\nAdiciona os registos DNS no painel do domínio e aguarda propagação.");
    failed++;
  }

  if (failed > 0 && !domainOk) process.exit(1);
  if (!dmarcOk) {
    console.log("\nWARN  DMARC recomendado: v=DMARC1; p=none; rua=mailto:hello@haxrsignature.com");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
