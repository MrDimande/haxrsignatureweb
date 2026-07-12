import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const DRY_RUN_REF = "rkkxfrwtmsqzpnbkshnd";

/** URL libpq (psql/pg_dump/pg_restore) — nunca uselibpqcompat, nunca password embebida. */
export function resolveLibpqDatabaseUrl() {
  const url = process.env.PR4_DATABASE_URL?.trim();

  if (!url) {
    throw new Error("Defina PR4_DATABASE_URL apontando para o clone de ensaio.");
  }

  if (url.includes(PRODUCTION_REF)) {
    throw new Error("ABORT: URL aponta para produção.");
  }

  if (!url.includes(DRY_RUN_REF)) {
    throw new Error("ABORT: URL não aponta para o clone dry-run.");
  }

  if (/uselibpqcompat/i.test(url)) {
    throw new Error("ABORT: PR4_DATABASE_URL (libpq) não deve conter uselibpqcompat.");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("ABORT: PR4_DATABASE_URL inválida.");
  }

  if (parsed.password) {
    throw new Error("ABORT: password embebida na URL. Usar PGPASSWORD.");
  }

  return url;
}

/** URL node-postgres — deriva de PR4_DATABASE_URL + uselibpqcompat=true. */
export function buildNodeConnectionString() {
  const parsed = new URL(resolveLibpqDatabaseUrl());
  parsed.searchParams.set("uselibpqcompat", "true");
  return parsed.toString();
}

/** @deprecated Prefer resolveLibpqDatabaseUrl ou buildNodeConnectionString. */
export function resolveDatabaseUrl() {
  return resolveLibpqDatabaseUrl();
}

/** Config pg (Node): URL derivada + PGPASSWORD obrigatório. */
export function buildPgClientConfig() {
  const password = process.env.PGPASSWORD?.trim();
  if (!password) {
    throw new Error("ABORT: PGPASSWORD em falta para ligação Node.");
  }

  return {
    connectionString: buildNodeConnectionString(),
    password,
  };
}

export function resolvePsqlBin() {
  const pg17 = "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe";
  if (existsSync(pg17)) {
    return pg17;
  }

  const result = spawnSync("psql", ["--version"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  const version = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (
    result.status === 0 &&
    version.includes("psql (PostgreSQL)") &&
    !version.includes("EnterpriseDB")
  ) {
    return "psql";
  }

  throw new Error(
    "ABORT: psql PostgreSQL 17 não encontrado e PATH não aponta para psql (PostgreSQL).",
  );
}

export async function withClient(fn) {
  const client = new pg.Client(buildPgClientConfig());
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
