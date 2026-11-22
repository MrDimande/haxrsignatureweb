import { Pool, type QueryResult, type QueryResultRow } from "pg";

import { AYLLA_GIFT_RUNTIME_ROLE, validateAyllaGiftDatabaseEnvironment } from "./aylla-gift-config";

type AyllaGiftPoolGlobal = typeof globalThis & {
  __haxrAyllaGiftPool?: Pool;
  __haxrAyllaGiftIdentity?: Promise<void>;
};

function getPool(): Pool {
  const environment = validateAyllaGiftDatabaseEnvironment();
  if (!environment.ok) throw new Error(environment.message);
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftPool) {
    globalState.__haxrAyllaGiftPool = new Pool({ connectionString: environment.databaseUrl, max: 5 });
  }
  return globalState.__haxrAyllaGiftPool;
}

async function assertRuntimeIdentity(pool: Pool): Promise<void> {
  const globalState = globalThis as AyllaGiftPoolGlobal;
  if (!globalState.__haxrAyllaGiftIdentity) {
    globalState.__haxrAyllaGiftIdentity = pool.query<{
      current_user: string;
      rolcanlogin: boolean;
      rolsuper: boolean;
      rolcreaterole: boolean;
      rolcreatedb: boolean;
      rolbypassrls: boolean;
    }>(`
      SELECT current_user, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
      FROM pg_roles WHERE rolname = current_user
    `).then((result) => {
      const role = result.rows[0];
      if (
        !role || role.current_user !== AYLLA_GIFT_RUNTIME_ROLE || !role.rolcanlogin || role.rolsuper ||
        role.rolcreaterole || role.rolcreatedb || role.rolbypassrls
      ) {
        throw new Error("Gift Registry PostgreSQL runtime identity is not permitted.");
      }
    });
  }
  await globalState.__haxrAyllaGiftIdentity;
}

export async function ayllaGiftQuery<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<QueryResult<TRow>> {
  const pool = getPool();
  await assertRuntimeIdentity(pool);
  return pool.query<TRow>(text, [...values]);
}

export async function closeAyllaGiftPoolForTests(): Promise<void> {
  const globalState = globalThis as AyllaGiftPoolGlobal;
  await globalState.__haxrAyllaGiftPool?.end();
  delete globalState.__haxrAyllaGiftPool;
  delete globalState.__haxrAyllaGiftIdentity;
}
