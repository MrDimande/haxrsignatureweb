/**
 * Teste de envio transaccional Brevo (funil boas-vindas).
 * Uso: node scripts/test-brevo-funnel-email.mjs [email]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const testEmail = process.argv[2]?.trim() || "aludimande@gmail.com";

function loadEnv() {
  const values = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) values[t.slice(0, i)] = t.slice(i + 1).trim();
  }
  return values;
}

const env = loadEnv();
const apiKey = env.BREVO_API_KEY?.trim();
if (!apiKey) throw new Error("BREVO_API_KEY em falta");

const sender = {
  name: env.BREVO_SENDER_NAME?.trim() || "HAXR Signature",
  email: env.BREVO_SENDER_EMAIL?.trim() || "hello@haxrsignature.com",
};

const html = `<!DOCTYPE html><html lang="pt"><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif;"><table width="100%"><tr><td align="center" style="padding:40px 16px;"><table width="600" style="max-width:600px;background:#111;border:1px solid #2a2418;"><tr><td style="padding:48px 40px;text-align:center;border-bottom:1px solid #2a2418;"><p style="margin:0;font-size:11px;letter-spacing:.35em;text-transform:uppercase;color:#c9a962;">HAXR Signature · Teste</p><h1 style="margin:16px 0 0;font-size:28px;font-weight:400;color:#f5f0e8;">Funil automático activo.</h1></td></tr><tr><td style="padding:32px 40px;"><p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#d4cfc6;">Olá Alberto,</p><p style="margin:0;font-size:16px;line-height:1.7;color:#d4cfc6;">Este é um email de teste do funil transaccional Brevo. Se recebeu isto, o disparo automático no sync de leads está pronto para produção.</p></td></tr></table></td></tr></table></body></html>`;

const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": apiKey,
  },
  body: JSON.stringify({
    sender,
    to: [{ email: testEmail, name: "Alberto Dimande" }],
    replyTo: sender,
    subject: "[TESTE] Funil HAXR — boas-vindas transaccional",
    htmlContent: html,
    tags: ["haxr-test-funnel"],
  }),
});

const body = await response.text();
if (!response.ok) {
  console.error("FAIL", response.status, body);
  process.exit(1);
}

console.log("OK   Email de teste enviado para", testEmail);
console.log(body);
