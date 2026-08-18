#!/usr/bin/env node
/**
 * Imprime subject + HTML de um template Auth HAXR para colar no Supabase Dashboard.
 *
 * Usage:
 *   node scripts/print-auth-email-template.mjs recovery
 *   node scripts/print-auth-email-template.mjs confirmation
 *   node scripts/print-auth-email-template.mjs password-changed
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const TEMPLATES = {
  recovery: {
    file: "recovery.html",
    subject: "Recuperar palavra-passe — HAXR Signature",
    dashboard: "Reset password",
  },
  confirmation: {
    file: "confirmation.html",
    subject: "Confirme o vosso email — HAXR Signature",
    dashboard: "Confirm signup",
  },
  "password-changed": {
    file: "password-changed.html",
    subject: "Palavra-passe actualizada — HAXR Signature",
    dashboard: "Security notifications → Password changed",
  },
};

const key = process.argv[2]?.trim().toLowerCase();

if (!key || !(key in TEMPLATES)) {
  console.error(
    `Uso: node scripts/print-auth-email-template.mjs <${Object.keys(TEMPLATES).join("|")}>`,
  );
  process.exit(1);
}

const meta = TEMPLATES[key];
const html = readFileSync(join(ROOT, "supabase", "templates", meta.file), "utf8");

console.log(`\n=== Dashboard: ${meta.dashboard} ===`);
console.log(`Subject:\n${meta.subject}\n`);
console.log("--- HTML (colar no body do template) ---\n");
console.log(html);
console.log("\n--- fim ---\n");
