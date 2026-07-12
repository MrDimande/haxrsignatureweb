/**
 * Teste seguro de email marketing Brevo.
 * - Usa BREVO_TEST_RECIPIENT
 * - Respeita EMAIL_SEND_MODE (disabled = simulação)
 * - Nunca envia para listas completas
 *
 * Uso: npm run email:test [templateId]
 */
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "./lib/parse-env.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const envPath = resolve(ROOT, ".env");
const envLocalPath = resolve(ROOT, ".env.local");

if (existsSync(envPath)) loadEnvFile(envPath);
if (existsSync(envLocalPath)) loadEnvFile(envLocalPath);

const templateId = process.argv[2]?.trim() || "haxr_launch";

const { sendMarketingTestEmail } = await import(
  "../src/lib/email/marketing/marketing-service.ts"
);
const { getEmailSendMode, getBrevoTestRecipient } = await import(
  "../src/lib/email/email-config.ts"
);
const { getMarketingLaunchChecklist } = await import(
  "../src/lib/email/marketing/marketing-audit.ts"
);

const { getEmailLogoDiagnostics } = await import(
  "../src/lib/brand/logo-url.ts"
);

const mode = getEmailSendMode();
const testRecipient = getBrevoTestRecipient();
const logoDiagnostics = getEmailLogoDiagnostics();

console.log("HAXR — teste de email marketing Brevo");
console.log("─".repeat(48));
console.log("EMAIL_SEND_MODE:", mode);
console.log("BREVO_TEST_RECIPIENT:", testRecipient ?? "(não configurado)");
console.log("Template:", templateId);
console.log("");
console.log("Email logo diagnostics:");
console.log("  Resolved URL:", logoDiagnostics.resolvedUrl ?? "(none)");
console.log(
  "  Safe for email:",
  logoDiagnostics.safeForEmail ? "yes" : "no"
);
console.log("  Asset path:", logoDiagnostics.assetPath);
console.log("  Source:", logoDiagnostics.source);
console.log("  Render mode:", logoDiagnostics.fallbackMode);
if (!logoDiagnostics.safeForEmail) {
  console.log("  → text-only fallback will be used");
}
console.log("");

if (mode === "disabled") {
  console.log("Modo disabled — simulação sem envio real.");
}

const result = await sendMarketingTestEmail(templateId, "Convidado");

if ("mock" in result && result.mock) {
  console.log("OK   Simulação:", result.reason);
} else if (result.ok) {
  console.log("OK   Email de teste enviado para", testRecipient);
  if (result.messageId) {
    console.log("     messageId:", result.messageId);
  }
} else {
  console.error("FAIL", result.error);
  process.exit(1);
}

console.log("");
console.log("Checklist resumido:");
for (const item of getMarketingLaunchChecklist().slice(0, 8)) {
  const icon =
    item.status === "ok" ? "✓" : item.status === "warning" ? "!" : "○";
  console.log(`  ${icon} ${item.label}`);
}
