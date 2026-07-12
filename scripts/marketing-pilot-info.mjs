/**
 * Relatório do piloto de email marketing — sem envio.
 *
 * Uso: npm run email:pilot
 */
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "./lib/parse-env.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const envPath = resolve(ROOT, ".env");
const envLocalPath = resolve(ROOT, ".env.local");

if (existsSync(envPath)) loadEnvFile(envPath);
if (existsSync(envLocalPath)) loadEnvFile(envLocalPath);

const { marketingCampaignDrafts } = await import(
  "../src/lib/email/marketing/marketing-campaigns.ts"
);
const { resolveListIdsForSegments } = await import(
  "../src/lib/email/marketing/marketing-lists.ts"
);
const { listMarketingTemplates } = await import(
  "../src/lib/email/marketing/marketing-templates.ts"
);
const {
  getEmailSendMode,
  MARKETING_SEND_CONFIRMATION,
  getBrevoSender,
  getBrevoTestRecipient,
  getBrevoMarketingListId,
  getBrevoSuppliersListId,
  getBrevoClientsListId,
} = await import("../src/lib/email/email-config.ts");
const { getBrevoLeadsListId, getBrevoNewsletterListId } = await import(
  "../src/lib/brevo/config.ts"
);
const { getEmailLogoDiagnostics } = await import(
  "../src/lib/brand/logo-url.ts"
);
const { getMarketingLaunchChecklist } = await import(
  "../src/lib/email/marketing/marketing-audit.ts"
);
const { brevoReady } = await import("../src/lib/email/brevo-client.ts");

const PILOT_CAMPAIGNS = [
  "campaign_services_intro",
  "campaign_haxr_concierge_educacao",
  "campaign_fornecedores_convite",
  "campaign_corporate_intro",
];

const listEnvStatus = [
  ["BREVO_LIST_LEADS", getBrevoLeadsListId()],
  ["BREVO_LIST_NEWSLETTER", getBrevoNewsletterListId()],
  ["BREVO_MARKETING_LIST_ID", getBrevoMarketingListId()],
  ["BREVO_SUPPLIERS_LIST_ID", getBrevoSuppliersListId()],
  ["BREVO_CLIENTS_LIST_ID", getBrevoClientsListId()],
];

console.log("HAXR — Piloto Email Marketing");
console.log("═".repeat(52));
console.log("");

console.log("GATES DE ENVIO");
console.log("─".repeat(52));
console.log("EMAIL_SEND_MODE:", getEmailSendMode());
console.log("Brevo API key:", brevoReady() ? "configurada" : "ausente");
console.log(
  "Produção bulk requer confirm:",
  `"${MARKETING_SEND_CONFIRMATION}"`
);
console.log(
  "Campanha bulk bloqueada se EMAIL_SEND_MODE !== production: SIM"
);
console.log("");

const logo = getEmailLogoDiagnostics();
console.log("LOGO EMAIL");
console.log("─".repeat(52));
console.log("Resolved URL:", logo.resolvedUrl ?? "(none)");
console.log("Safe for email:", logo.safeForEmail ? "yes" : "no");
console.log("Render mode:", logo.fallbackMode);
if (!logo.safeForEmail) {
  console.log("→ text-only fallback will be used");
}
console.log("");

console.log("LISTAS BREVO (env)");
console.log("─".repeat(52));
for (const [key, id] of listEnvStatus) {
  console.log(`  ${id ? "✓" : "○"} ${key}: ${id ?? "não configurado"}`);
}
console.log("");

console.log("TEMPLATES DISPONÍVEIS");
console.log("─".repeat(52));
for (const t of listMarketingTemplates()) {
  console.log(`  ${t.id} [${t.category}]`);
}
console.log("  Aliases: client_follow_up → soft_follow_up");
console.log("           rsvp_digital_education → digital_invitations_rsvp");
console.log("");

console.log("TODAS AS CAMPANHAS");
console.log("─".repeat(52));
for (const c of marketingCampaignDrafts) {
  const { listIds, missing } = resolveListIdsForSegments(c.audienceSegments);
  const pilot = PILOT_CAMPAIGNS.includes(c.id) ? " ★ PILOTO" : "";
  console.log(`\n  ${c.id}${pilot}`);
  console.log(`    Nome:     ${c.name}`);
  console.log(`    Template: ${c.templateId}`);
  console.log(`    Segmentos: ${c.audienceSegments.join(", ")}`);
  console.log(`    Env sugeridas: ${c.suggestedListEnvKeys.join(", ")}`);
  console.log(
    `    List IDs resolvidos: ${listIds.length ? listIds.join(", ") : "(nenhum)"}`
  );
  if (missing.length) {
    console.log(`    Listas em falta: ${missing.join(", ")}`);
  }
}
console.log("");

console.log("CAMPANHA RECOMENDADA PARA ARRANCAR");
console.log("─".repeat(52));
console.log("  campaign_services_intro");
console.log("  Template: haxr_services_intro");
console.log("  Audiência: contactos seleccionados / prospects eventos");
console.log("");

console.log("COMANDOS (sem envio de produção)");
console.log("─".repeat(52));
console.log("  npm run email:pilot");
console.log("  npm run email:test -- haxr_services_intro");
console.log("  npm run email:draft -- campaign_services_intro");
console.log("");

console.log("CHECKLIST RESUMIDO");
console.log("─".repeat(52));
for (const item of getMarketingLaunchChecklist()) {
  const icon =
    item.status === "ok" ? "✓" : item.status === "warning" ? "!" : "○";
  const detail = item.detail ? ` — ${item.detail}` : "";
  console.log(`  ${icon} ${item.label}${detail}`);
}
console.log("");
console.log("Documentação: docs/MARKETING_PILOT_LAUNCH.md");
console.log("Nenhum email foi enviado por este script.");
