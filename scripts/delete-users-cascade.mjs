import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const values = {};
  const ENV_FILES = [resolve(".env.development.local"), resolve(".env.local")];
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

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL || env.POSTGRES_URL;

if (!dbUrl) {
  console.log("Sem conexão direta postgres");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

const targetEmails = ["aldimande@outlook.com", "aludimande@gmail.com"];

for (const email of targetEmails) {
  console.log(`\n--- A processar remoção de: ${email} ---`);
  const res = await client.query("SELECT id, email FROM auth.users WHERE email = $1", [email]);
  if (res.rows.length === 0) {
    console.log(`Utilizador ${email} não encontrado em auth.users.`);
    continue;
  }

  const userId = res.rows[0].id;
  console.log(`User ID: ${userId}`);

  // Find all foreign keys referencing auth.users
  const fkQuery = `
    SELECT
      tc.table_schema, 
      tc.table_name, 
      kcu.column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'users'
      AND ccu.table_schema = 'auth';
  `;

  const fkRes = await client.query(fkQuery);
  console.log(`Tabelas com FK para auth.users:`, fkRes.rows.map(r => `${r.table_schema}.${r.table_name}(${r.column_name})`));

  for (const r of fkRes.rows) {
    try {
      const del = await client.query(`DELETE FROM "${r.table_schema}"."${r.table_name}" WHERE "${r.column_name}" = $1`, [userId]);
      if (del.rowCount > 0) {
        console.log(`  - Apagados ${del.rowCount} registos de ${r.table_schema}.${r.table_name}`);
      }
    } catch (err) {
      console.warn(`  - Aviso ao limpar ${r.table_schema}.${r.table_name}: ${err.message}`);
    }
  }

  // Also check public.profiles or client_events if not FK
  try {
    const pDel = await client.query("DELETE FROM public.profiles WHERE id = $1", [userId]);
    if (pDel.rowCount > 0) console.log(`  - Apagado perfil em public.profiles`);
  } catch (e) {
    // ignore
  }

  // Now delete from auth.users
  try {
    const finalDel = await client.query("DELETE FROM auth.users WHERE id = $1", [userId]);
    console.log(`✅ Utilizador ${email} apagado com sucesso de auth.users! (Linhas: ${finalDel.rowCount})`);
  } catch (err) {
    console.error(`❌ Erro final ao apagar de auth.users: ${err.message}`);
  }
}

await client.end();
