import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { invokePersistentRateLimit as invokePersistentRateLimitNeon } from "@/lib/security/persistent-rate-limit.neon";
import { invokePersistentRateLimit as invokePersistentRateLimitSupabase } from "@/lib/security/persistent-rate-limit.supabase";
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

/** Rate limit persistente no backend activo; fallback em memória se indisponível. */
export async function persistentRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const invokePersistentRateLimit = shouldUseNeonServerDatabase()
      ? invokePersistentRateLimitNeon
      : invokePersistentRateLimitSupabase;

    const data = await invokePersistentRateLimit(
      key,
      config.max,
      windowSeconds,
    );
    const parsed = parseRpcResult(data);
    if (parsed) return parsed;
  } catch (err) {
    console.warn("[rate-limit] fallback em memória:", err);
  }

  return rateLimit(key, config);
}
