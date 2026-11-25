import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { logAyllaTrace } from "@/lib/edition/gifts/aylla/trace";

import {
    AYLLA_GIFT_ADMIN_ROLE,
    AYLLA_GIFT_ISSUER_ROLE,
    AYLLA_GIFT_RUNTIME_ROLE,
    validateAyllaGiftAdminEnvironment,
    validateAyllaGiftDatabaseEnvironment,
} from "./aylla-gift-config";

export const AYLLA_GIFT_POOL_CONFIG = {
  max: 5,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
  query_timeout: 15_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5_000,
} as const;

type AyllaGiftPoolGlobal = typeof globalThis & {
  __haxrAyllaGiftIssuerPool?: Pool;
  __haxrAyllaGiftPool?: Pool;
  __haxrAyllaGiftAdminPool?: Pool;
};

function createAyllaPool(connectionString: string, roleLabel: string): Pool {
  const pool = new Pool({
    connectionString,
    ...AYLLA_GIFT_POOL_CONFIG,
  });

  pool.on("error", (err) => {
    const code = (err as { code?: string })?.code ?? "UNKNOWN";
    console.error(
      JSON.stringify({
        scope: "core/aylla/pool",
        at: new Date().toISOString(),
        role: roleLabel,
        event: "pool_idle_error",
        code,
      })
    );
  });

  return pool;
}

function getIssuerPool(): Pool {
  const environment = validateAyllaGiftDatabaseEnvironment();
  if (!environment.ok) throw new Error(environment.message);
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftIssuerPool) {
    globalState.__haxrAyllaGiftIssuerPool = createAyllaPool(
      environment.issuerDatabaseUrl,
      AYLLA_GIFT_ISSUER_ROLE
    );
  }
  return globalState.__haxrAyllaGiftIssuerPool;
}

function getRuntimePool(): Pool {
  const environment = validateAyllaGiftDatabaseEnvironment();
  if (!environment.ok) throw new Error(environment.message);
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftPool) {
    globalState.__haxrAyllaGiftPool = createAyllaPool(
      environment.runtimeDatabaseUrl,
      AYLLA_GIFT_RUNTIME_ROLE
    );
  }
  return globalState.__haxrAyllaGiftPool;
}

function getAdminPool(): Pool {
  const environment = validateAyllaGiftAdminEnvironment();
  if (!environment.ok) throw new Error(environment.message);
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftAdminPool) {
    globalState.__haxrAyllaGiftAdminPool = createAyllaPool(
      environment.adminDatabaseUrl,
      AYLLA_GIFT_ADMIN_ROLE
    );
  }
  return globalState.__haxrAyllaGiftAdminPool;
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

async function executeAyllaRoleQuery<TRow extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  expectedRole: string,
  text: string,
  values: readonly unknown[]
): Promise<QueryResult<TRow>> {
  const connectStartedAt = Date.now();
  logAyllaTrace("pg_pool_connect_start", {
    role: expectedRole,
    poolTotal: pool.totalCount,
    poolIdle: pool.idleCount,
    poolWaiting: pool.waitingCount,
  });

  const client = await pool.connect();
  logAyllaTrace("pg_pool_connect_done", {
    role: expectedRole,
    durationMs: Date.now() - connectStartedAt,
    poolTotal: pool.totalCount,
    poolIdle: pool.idleCount,
    poolWaiting: pool.waitingCount,
  });

  let releaseError: Error | undefined;
  try {
    const idStartedAt = Date.now();
    await assertRuntimeIdentity(client, expectedRole);
    logAyllaTrace("pg_identity_ok", {
      role: expectedRole,
      durationMs: Date.now() - idStartedAt,
    });

    const queryStartedAt = Date.now();
    const res = await client.query<TRow>(text, [...values]);
    logAyllaTrace("pg_query_done", {
      role: expectedRole,
      durationMs: Date.now() - queryStartedAt,
      rowCount: res.rowCount ?? 0,
    });
    return res;
  } catch (err) {
    releaseError = err instanceof Error ? err : new Error(String(err));
    logAyllaTrace("pg_query_error", {
      role: expectedRole,
      sqlState: (err as { code?: string })?.code ?? "UNKNOWN",
      errorName: releaseError.name,
    });
    throw err;
  } finally {
    client.release(releaseError);
    logAyllaTrace("pg_pool_released", {
      role: expectedRole,
      destroyed: Boolean(releaseError),
      poolTotal: pool.totalCount,
      poolIdle: pool.idleCount,
    });
  }
}

export async function ayllaGiftIssuerQuery<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<TRow>> {
  return executeAyllaRoleQuery<TRow>(getIssuerPool(), AYLLA_GIFT_ISSUER_ROLE, text, values);
}

export async function ayllaGiftQuery<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<TRow>> {
  return executeAyllaRoleQuery<TRow>(getRuntimePool(), AYLLA_GIFT_RUNTIME_ROLE, text, values);
}

export async function ayllaGiftAdminQuery<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<TRow>> {
  return executeAyllaRoleQuery<TRow>(getAdminPool(), AYLLA_GIFT_ADMIN_ROLE, text, values);
}

export async function closeAyllaGiftPoolForTests(): Promise<void> {
  const globalState = globalThis as AyllaGiftPoolGlobal;
  await globalState.__haxrAyllaGiftIssuerPool?.end();
  delete globalState.__haxrAyllaGiftIssuerPool;
  await globalState.__haxrAyllaGiftPool?.end();
  delete globalState.__haxrAyllaGiftPool;
  await globalState.__haxrAyllaGiftAdminPool?.end();
  delete globalState.__haxrAyllaGiftAdminPool;
}
