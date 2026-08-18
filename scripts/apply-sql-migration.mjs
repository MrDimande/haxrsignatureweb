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
const customEnvArg = process.argv.find((a) => a.startsWith("--env="));
const customEnv = customEnvArg ? customEnvArg.slice(6) : null;

const ENV_FILES = customEnv
  ? [resolve(ROOT, customEnv)]
  : [
      resolve(ROOT, ".env.development.local"),
      resolve(ROOT, ".env.local"),
    ];

const sqlFile = process.argv.find((a) => !a.startsWith("--") && a !== process.argv[0] && a !== process.argv[1]);

if (!sqlFile) {
  console.error("Uso: node scripts/apply-sql-migration.mjs <ficheiro.sql> [--env=.env.preview|--env=.env.production]");
  process.exit(1);
}

const absSql = resolve(ROOT, sqlFile);
if (!existsSync(absSql)) {
  console.error(`Ficheiro não encontrado: ${absSql}`);
  process.exit(1);
}

function loadEnv() {
  const values = {};
  for (const envFile of ENV_FILES) {
    if (!existsSync(envFile)) continue;
    for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
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
      const key = trimmed.slice(0, i).trim();
      if (!values[key]) values[key] = v;
    }
  }
  return values;
}

const envValues = loadEnv();
const dbUrl = envValues.SUPABASE_DB_URL || envValues.DATABASE_URL || envValues.POSTGRES_URL;
if (!dbUrl) {
  console.error(
    `SUPABASE_DB_URL em falta nos ficheiros configurados (${ENV_FILES.join(", ")}).\n` +
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
