import { neonQuery } from "@/lib/neon/server-db";

type PersistentRateLimitRow = { data: unknown };

let lastPruneTimestamp = 0;

export async function pruneExpiredPersistentRateLimits(ttlSeconds: number = 86400): Promise<number> {
  try {
    const result = await neonQuery<{ count: string }>(
      `
        WITH deleted AS (
          DELETE FROM public.api_rate_limits
           WHERE window_start < now() - make_interval(secs => $1::integer)
          RETURNING 1
        )
        SELECT count(*)::text AS count FROM deleted
      `,
      [ttlSeconds],
    );
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    console.warn("[rate-limit:prune-expired-failed]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

function schedulePruneIfDue(): void {
  const now = Date.now();
  if (now - lastPruneTimestamp > 10 * 60 * 1000) {
    lastPruneTimestamp = now;
    pruneExpiredPersistentRateLimits().catch(() => {});
  }
}

export async function invokePersistentRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<unknown> {
  schedulePruneIfDue();
  const result = await neonQuery<PersistentRateLimitRow>(
    `
      SELECT public.check_api_rate_limit(
        $1::text,
        $2::integer,
        $3::integer
      ) AS data
    `,
    [key, maxRequests, windowSeconds],
  );

  return result.rows[0]?.data ?? null;
}

export async function queryPersistentRateLimitState(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<unknown> {
  const result = await neonQuery<{ request_count: number; window_start: string }>(
    `
      SELECT request_count, window_start
        FROM public.api_rate_limits
       WHERE bucket_key = $1::text
    `,
    [key],
  );

  const row = result.rows[0];
  if (!row) {
    return { allowed: true, remaining: maxRequests, retry_after_seconds: 0 };
  }

  const now = Date.now();
  const start = new Date(row.window_start).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000));

  if (elapsedSeconds >= windowSeconds) {
    return { allowed: true, remaining: maxRequests, retry_after_seconds: 0 };
  }

  if (row.request_count > maxRequests) {
    const retry = Math.max(1, windowSeconds - elapsedSeconds);
    return { allowed: false, remaining: 0, retry_after_seconds: retry };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - row.request_count),
    retry_after_seconds: 0,
  };
}
