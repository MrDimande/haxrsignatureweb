import { Pool, type QueryResult, type QueryResultRow } from "pg";

import {
    AYLLA_GIFT_ISSUER_ROLE,
    AYLLA_GIFT_RUNTIME_ROLE,
    validateAyllaGiftDatabaseEnvironment,
} from "./aylla-gift-config";

type AyllaGiftPoolGlobal = typeof globalThis & {
  __haxrAyllaGiftIssuerPool?: Pool;
  __haxrAyllaGiftPool?: Pool;
};

function getIssuerPool(): Pool {
  const environment = validateAyllaGiftDatabaseEnvironment();
  if (!environment.ok) throw new Error(environment.message);
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftIssuerPool) {
    globalState.__haxrAyllaGiftIssuerPool = new Pool({ connectionString: environment.issuerDatabaseUrl, max: 5 });
  }
  return globalState.__haxrAyllaGiftIssuerPool;
}

function getRuntimePool(): Pool {
  const environment = validateAyllaGiftDatabaseEnvironment();
  if (!environment.ok) throw new Error(environment.message);
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftPool) {
    globalState.__haxrAyllaGiftPool = new Pool({ connectionString: environment.runtimeDatabaseUrl, max: 5 });
  }
  return globalState.__haxrAyllaGiftPool;
}

export async function assertRuntimeIdentity(
  client: { query: Pool["query"] },
  expectedRole: string = AYLLA_GIFT_RUNTIME_ROLE
): Promise<void> {
  const result = await client.query<{
    current_user: string;
    rolcanlogin: boolean;
    rolsuper: boolean;
    rolcreaterole: boolean;
    rolcreatedb: boolean;
    rolbypassrls: boolean;
  }>(`
    SELECT current_user, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
    FROM pg_roles WHERE rolname = current_user
  `);

  const role = result.rows[0];
  if (
    !role ||
    role.current_user !== expectedRole ||
    !role.rolcanlogin ||
    role.rolsuper ||
    role.rolcreaterole ||
    role.rolcreatedb ||
    role.rolbypassrls
  ) {
    throw new Error(`Gift Registry PostgreSQL runtime identity is not permitted (expected ${expectedRole}, got ${role?.current_user}).`);
  }
}

export async function ayllaGiftIssuerQuery<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<TRow>> {
  const pool = getIssuerPool();
  const client = await pool.connect();
  try {
    await assertRuntimeIdentity(client, AYLLA_GIFT_ISSUER_ROLE);
    return await client.query<TRow>(text, [...values]);
  } finally {
    client.release();
  }
}

export async function ayllaGiftQuery<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<TRow>> {
  const pool = getRuntimePool();
  const client = await pool.connect();
  try {
    await assertRuntimeIdentity(client, AYLLA_GIFT_RUNTIME_ROLE);
    return await client.query<TRow>(text, [...values]);
  } finally {
    client.release();
  }
}

export async function closeAyllaGiftPoolForTests(): Promise<void> {
  const globalState = globalThis as AyllaGiftPoolGlobal;
  await globalState.__haxrAyllaGiftIssuerPool?.end();
  delete globalState.__haxrAyllaGiftIssuerPool;
  await globalState.__haxrAyllaGiftPool?.end();
  delete globalState.__haxrAyllaGiftPool;
}
