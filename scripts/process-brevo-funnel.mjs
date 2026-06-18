/**
 * Processa follow-ups do funil via API cron (requer `npm run dev` ou produção).
 * Uso: npm run brevo:funnel
 * Alternativa sem servidor: npm run brevo:funnel:direct
 */
import { resolve } from "node:path";
import { loadEnvFile } from "./lib/parse-env.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const env = loadEnvFile(resolve(ROOT, ".env.local"));
const secret = env.CRON_SECRET?.trim();

if (!secret) {
  console.error("CRON_SECRET em falta em .env.local");
  console.error("Gere um: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  process.exit(1);
}

const baseUrl =
  process.env.BREVO_FUNNEL_CRON_URL?.trim() || "http://localhost:3000";

try {
  const response = await fetch(`${baseUrl}/api/cron/brevo-funnel`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await response.text();
  console.log(response.status, body);
  if (!response.ok) process.exit(1);
} catch (err) {
  console.error("Não foi possível ligar a", baseUrl);
  console.error(err.message ?? err);
  console.error("\nUse: npm run brevo:funnel:direct  (sem servidor)");
  process.exit(1);
}
