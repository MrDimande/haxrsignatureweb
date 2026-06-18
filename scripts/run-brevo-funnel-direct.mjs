/**
 * Executa follow-ups do funil Brevo directamente (sem HTTP / dev server).
 */
import { resolve } from "node:path";
import { loadEnvFile } from "./lib/parse-env.mjs";

const ROOT = resolve(import.meta.dirname, "..");
loadEnvFile(resolve(ROOT, ".env.local"));

const { processScheduledFunnelEmails } = await import(
  "../src/lib/brevo/funnel.ts"
);

const result = await processScheduledFunnelEmails();
console.log("OK", JSON.stringify(result, null, 2));
