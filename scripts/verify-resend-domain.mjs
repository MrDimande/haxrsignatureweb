import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const DOMAIN = "haxrsignature.com";

function loadApiKey() {
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("RESEND_API_KEY=")) continue;
    return trimmed.slice("RESEND_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("RESEND_API_KEY em falta");
}

async function api(path, options = {}) {
  const apiKey = loadApiKey();
  const response = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${response.status}: ${text}`);
  return body;
}

async function main() {
  if (!existsSync(ENV_FILE)) throw new Error(".env.local não encontrado");

  const { data: domains } = await api("/domains");
  const domain = domains.find((item) => item.name === DOMAIN);
  if (!domain) throw new Error(`${DOMAIN} não encontrado no Resend`);

  console.log(`Estado actual: ${domain.status} (id: ${domain.id})`);

  if (domain.status !== "verified") {
    console.log("A pedir verificação ao Resend...");
    await api(`/domains/${domain.id}/verify`, { method: "POST" });
    await new Promise((r) => setTimeout(r, 3000));
  }

  const detail = await api(`/domains/${domain.id}`);
  console.log(`Estado após verificação: ${detail.status}`);

  if (detail.records?.length) {
    console.log("\nRegistos:");
    for (const record of detail.records) {
      console.log(`  ${record.status === "verified" ? "✓" : "○"} ${record.type} ${record.name} — ${record.status}`);
    }
  }

  if (detail.status === "verified") {
    console.log("\n✓ Domínio verificado. Próximo: RESEND_BRAND_DOMAIN=true");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
