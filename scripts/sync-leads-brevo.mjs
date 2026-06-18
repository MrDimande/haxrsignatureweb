/**
 * Sincroniza leads existentes (Supabase) para o Brevo.
 * Uso: node scripts/sync-leads-brevo.mjs [--dry-run] [--newsletter-only]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");

const dryRun = process.argv.includes("--dry-run");
const newsletterOnly = process.argv.includes("--newsletter-only");

function loadEnv() {
  const values = {};
  if (!existsSync(ENV_FILE)) throw new Error(".env.local não encontrado");
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function splitName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "Convidado", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function main() {
  const env = loadEnv();
  const apiKey = env.BREVO_API_KEY?.trim();
  const leadsList = Number.parseInt(env.BREVO_LIST_LEADS ?? "", 10);
  const newsletterList = Number.parseInt(env.BREVO_LIST_NEWSLETTER ?? "", 10);

  if (!apiKey) throw new Error("BREVO_API_KEY em falta");
  if (!leadsList && !newsletterList) {
    throw new Error("Defina BREVO_LIST_LEADS e/ou BREVO_LIST_NEWSLETTER");
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let query = supabase
    .from("contact_inquiries")
    .select("*")
    .order("created_at", { ascending: true });

  if (newsletterOnly) {
    query = query.eq("marketing_opt_in", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  console.log(
    `\n${rows.length} lead(s)${newsletterOnly ? " com opt-in" : ""}${dryRun ? " [dry-run]" : ""}\n`
  );

  let ok = 0;
  let fail = 0;

  for (const row of rows) {
    const listIds = new Set();
    if (leadsList) listIds.add(leadsList);
    if (row.marketing_opt_in && newsletterList) listIds.add(newsletterList);
    if (!listIds.size) continue;

    const { firstName, lastName } = splitName(row.name);
    const payload = {
      email: row.email.toLowerCase(),
      listIds: [...listIds],
      updateEnabled: true,
      attributes: {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
        PROJECT_TYPE: row.project_type,
        PACKAGE: row.package_label ?? "",
        LEAD_SOURCE: row.source ?? "website",
        INQUIRY_ID: row.id,
        MARKETING_OPT_IN: row.marketing_opt_in ? "yes" : "no",
        CLIENT_INTENT: (row.intent ?? row.message ?? "").slice(0, 500),
      },
    };

    if (dryRun) {
      console.log(`DRY   ${row.email} → listas [${[...listIds].join(", ")}]`);
      ok++;
      continue;
    }

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      ok++;
      console.log(`OK    ${row.email}`);
    } else {
      fail++;
      const body = await response.text();
      console.log(`FAIL  ${row.email} — ${response.status} ${body}`);
    }
  }

  console.log(`\nConcluído: ${ok} OK, ${fail} falhas`);
  if (fail) process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
