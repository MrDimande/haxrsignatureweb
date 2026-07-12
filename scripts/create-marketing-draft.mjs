/**
 * Cria rascunho de campanha no Brevo — NÃO envia emails.
 *
 * Uso: npm run email:draft -- campaign_services_intro
 */
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "./lib/parse-env.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const envPath = resolve(ROOT, ".env");
const envLocalPath = resolve(ROOT, ".env.local");

if (existsSync(envPath)) loadEnvFile(envPath);
if (existsSync(envLocalPath)) loadEnvFile(envLocalPath);

const campaignId = process.argv[2]?.trim();

if (!campaignId) {
  console.error("Uso: npm run email:draft -- <campaign_id>");
  console.error("Ex.: npm run email:draft -- campaign_services_intro");
  process.exit(1);
}

const { createCampaignDraftFromDefinition } = await import(
  "../src/lib/email/marketing/marketing-service.ts"
);
const { getEmailSendMode } = await import(
  "../src/lib/email/email-config.ts"
);

console.log("HAXR — criar rascunho Brevo (sem envio)");
console.log("─".repeat(48));
console.log("Campaign ID:", campaignId);
console.log("EMAIL_SEND_MODE:", getEmailSendMode());
console.log("");

const result = await createCampaignDraftFromDefinition(campaignId, "Convidado");

if (!result.ok) {
  console.error("FAIL", result.error);
  if (result.missingLists?.length) {
    console.error("Listas em falta:", result.missingLists.join(", "));
  }
  process.exit(1);
}

console.log("OK   Rascunho criado no Brevo");
console.log("     Brevo campaign ID:", result.campaignId);
console.log("     Nome:", result.name);
console.log("     List IDs:", result.listIds.join(", "));
console.log("");
console.log("Próximo passo: rever no painel Brevo antes de qualquer envio.");
console.log("Envio em produção requer EMAIL_SEND_MODE=production + SEND_HAXR_MARKETING.");
