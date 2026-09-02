import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { validateNeonServerEnvironment } from "@/lib/neon/config";

type NeonPoolGlobal = typeof globalThis & {
  __haxrNeonPool?: Pool;
};

function createPool(): Pool {
  const env = validateNeonServerEnvironment();
  if (!env.ok) {
    throw new Error(env.message);
  }

  return new Pool({
    connectionString: env.databaseUrl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

/**
 * Private backend connection. Never expose DATABASE_URL to browser code.
 *
 * This replaces Supabase `service_role` operations progressively. Server-only
 * repositories, jobs and admin actions should use this connection when they
 * intentionally need privileged PostgreSQL access outside the Data API/RLS path.
 */
export function getNeonPool(): Pool {
  const globalState = globalThis as NeonPoolGlobal;

  if (!globalState.__haxrNeonPool) {
    globalState.__haxrNeonPool = createPool();
  }

  return globalState.__haxrNeonPool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function neonQuery<TRow extends QueryResultRow = any>(
  text: string,
  values: readonly unknown[] = [],
): Promise<QueryResult<TRow>> {
  return getNeonPool().query<TRow>(text, [...values]);
}

export async function withNeonTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getNeonPool().connect();

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeNeonPoolForTests(): Promise<void> {
  const globalState = globalThis as NeonPoolGlobal;
  const pool = globalState.__haxrNeonPool;
  if (!pool) return;

  await pool.end();
  delete globalState.__haxrNeonPool;
}
