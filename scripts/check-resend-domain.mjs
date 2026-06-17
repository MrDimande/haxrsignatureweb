import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const DOMAIN = "haxrsignature.com";

function loadApiKey() {
  if (!existsSync(ENV_FILE)) {
    throw new Error("Ficheiro .env.local não encontrado.");
  }

  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("RESEND_API_KEY=")) continue;
    const value = trimmed.slice("RESEND_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  }

  throw new Error("RESEND_API_KEY em falta no .env.local");
}

async function main() {
  const apiKey = loadApiKey();
  const response = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body}`);
  }

  const payload = await response.json();
  const domains = payload.data ?? [];
  const match = domains.find((item) => item.name === DOMAIN);

  console.log(`\nDomínios no Resend: ${domains.length}`);
  for (const item of domains) {
    const status = item.status ?? "unknown";
    const mark = item.name === DOMAIN ? "→" : " ";
    console.log(`${mark} ${item.name} — ${status}`);
  }

  if (!match) {
    console.log(`\n⚠ ${DOMAIN} ainda não foi adicionado no Resend.`);
    console.log("  https://resend.com/domains → Add domain");
    process.exitCode = 1;
    return;
  }

  if (match.status === "verified") {
    console.log(`\n✓ ${DOMAIN} verificado — define RESEND_BRAND_DOMAIN=true na Vercel.`);
    return;
  }

  console.log(`\n⚠ ${DOMAIN} existe mas está "${match.status}".`);
  console.log("  Adiciona os registos DNS (SPF/DKIM) na Spaceship e aguarda propagação.");
  if (match.records?.length) {
    console.log("\nRegistos pendentes:");
    for (const record of match.records) {
      console.log(`  • ${record.type} ${record.name} → ${record.value} (${record.status})`);
    }
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
