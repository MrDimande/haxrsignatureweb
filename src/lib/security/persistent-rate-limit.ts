import { createAdminClient } from "@/lib/supabase/server";
import {
  rateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/security/rate-limit";

type RpcRateLimitRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
};

function parseRpcResult(data: unknown): RateLimitResult | null {
  if (!data || typeof data !== "object") return null;
  const row = data as RpcRateLimitRow;
  if (typeof row.allowed !== "boolean") return null;

  return {
    allowed: row.allowed,
    remaining: Number(row.remaining ?? 0),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
  };
}

/** Rate limit persistente via Supabase; fallback em memória se RPC indisponível. */
export async function persistentRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const supabase = createAdminClient();
    const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const { data, error } = await supabase.rpc("check_api_rate_limit", {
      p_bucket_key: key,
      p_max_requests: config.max,
      p_window_seconds: windowSeconds,
    } as never);

    if (error) throw new Error(error.message);

    const parsed = parseRpcResult(data);
    if (parsed) return parsed;
  } catch (err) {
    console.warn("[rate-limit] fallback em memória:", err);
  }

  return rateLimit(key, config);
}
