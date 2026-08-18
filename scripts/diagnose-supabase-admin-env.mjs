/**
 * Diagnóstico seguro do ambiente Supabase admin (sem imprimir secrets).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.development.local");
loadEnvFile(".env.local");

const { getSupabaseJwtRole, getSupabaseJwtProjectRef, getSupabaseProjectRef } =
  await import("../src/lib/supabase/config.ts");

const urlRef = getSupabaseProjectRef();
const serviceRole = getSupabaseJwtRole(process.env.SUPABASE_SERVICE_ROLE_KEY);
const serviceRef = getSupabaseJwtProjectRef(process.env.SUPABASE_SERVICE_ROLE_KEY);
const anonRef = getSupabaseJwtProjectRef(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const issues = [];
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) issues.push("NEXT_PUBLIC_SUPABASE_URL em falta");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) issues.push("SUPABASE_SERVICE_ROLE_KEY em falta");
if (serviceRole && serviceRole !== "service_role") {
  issues.push(`SUPABASE_SERVICE_ROLE_KEY tem role '${serviceRole}' (esperado service_role)`);
}
if (serviceRef && urlRef && serviceRef !== urlRef) {
  issues.push(`service_role ref (${serviceRef}) != URL ref (${urlRef})`);
}
if (anonRef && urlRef && anonRef !== urlRef) {
  issues.push(`anon key ref (${anonRef}) != URL ref (${urlRef})`);
}

console.log(
  JSON.stringify(
    {
      ok: issues.length === 0,
      urlRef,
      serviceRoleJwtRole: serviceRole,
      serviceRoleProjectRef: serviceRef,
      anonProjectRef: anonRef,
      keysAligned: serviceRef === urlRef,
      issues,
    },
    null,
    2,
  ),
);

process.exit(issues.length === 0 ? 0 : 1);
