/**
 * Aplica um ficheiro SQL ao Postgres do Supabase.
 * Requer SUPABASE_DB_URL no .env.local (Connection string → URI, modo Session).
 *
 * Uso: node scripts/apply-sql-migration.mjs supabase/migrations/020_fix_json_rpc_concat.sql
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Uso: node scripts/apply-sql-migration.mjs <ficheiro.sql>");
  process.exit(1);
}

const absSql = resolve(ROOT, sqlFile);
if (!existsSync(absSql)) {
  console.error(`Ficheiro não encontrado: ${absSql}`);
  process.exit(1);
}

function loadEnv() {
  const values = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    let v = trimmed.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    values[trimmed.slice(0, i).trim()] = v;
  }
  return values;
}

const dbUrl = loadEnv().SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "SUPABASE_DB_URL em falta no .env.local.\n" +
      "Supabase → Project Settings → Database → Connection string (URI, Session mode)."
  );
  process.exit(1);
}

const sql = readFileSync(absSql, "utf8");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`OK: ${sqlFile}`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
