/**
 * Smoke test: SELECT businesses via service_role no preview.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PREVIEW_REF = "uxleigndoomoezwsxlan";

function loadEnv(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};
  const entries = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    entries[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return entries;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.development.local") };

if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes(PREVIEW_REF)) {
  console.error(`ABORT: preview ref ${PREVIEW_REF} required.`);
  process.exit(1);
}

console.log("FULL SERVICE ROLE KEY:", env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const tables = [
  "businesses",
  "documents",
  "contact_inquiries",
  "events",
  "guests",
  "guest_groups",
  "seats",
];

for (const table of tables) {
  const { error } = await supabase.from(table).select("id").limit(1);
  console.log(
    JSON.stringify({
      table,
      ok: !error,
      error: error?.message ?? null,
    }),
  );
  if (error) process.exitCode = 1;
}
