import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";

export function resolveDatabaseUrl() {
  const url =
    process.env.PR4_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim();

  if (!url) {
    throw new Error(
      "Defina PR4_DATABASE_URL (ou DATABASE_URL) apontando para o clone de ensaio.",
    );
  }

  if (url.includes(PRODUCTION_REF) && process.env.PR4_ALLOW_PRODUCTION !== "1") {
    throw new Error(
      "ABORT: URL aponta para produção. Use um clone isolado ou PR4_ALLOW_PRODUCTION=1 (não recomendado).",
    );
  }

  return url;
}

export async function withClient(fn) {
  const client = new pg.Client({
    connectionString: resolveDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function queryRows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

export async function queryOne(client, sql, params = []) {
  const rows = await queryRows(client, sql, params);
  return rows[0] ?? null;
}

export function readMigration(relativePath) {
  const filePath = resolve(process.cwd(), relativePath);
  return readFileSync(filePath, "utf8");
}

export function migrationPath(version) {
  const map = {
    "036": "supabase/migrations/036_client_app_auth.sql",
    "037": "supabase/migrations/037_client_app_service_role_grants.sql",
    "038": "supabase/migrations/038_provision_client_operational_event.sql",
    "039": "supabase/migrations/039_client_event_guests_rpc.sql",
    "040": "supabase/migrations/040_client_event_payments_rpc.sql",
    "041": "supabase/migrations/041_client_event_vendors_rpc.sql",
    "042": "supabase/migrations/042_client_event_checklist_rpc.sql",
    "043": "supabase/migrations/043_client_event_documents_rpc.sql",
  };
  const path = map[version];
  if (!path) throw new Error(`Migration desconhecida: ${version}`);
  return path;
}

export async function timed(label, fn) {
  const started = Date.now();
  const result = await fn();
  return { label, ms: Date.now() - started, result };
}
