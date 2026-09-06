import { neonQuery } from "@/lib/neon/server-db";

type PersistentRateLimitRow = { data: unknown };

export async function invokePersistentRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<unknown> {
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
