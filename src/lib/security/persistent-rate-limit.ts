import {
  invokePersistentRateLimit as invokePersistentRateLimitNeon,
  queryPersistentRateLimitState as queryPersistentRateLimitStateNeon,
} from "@/lib/security/persistent-rate-limit.neon";
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

export type PersistentRateLimitDependencies = {
  invokeNeon?: (key: string, maxRequests: number, windowSeconds: number) => Promise<unknown>;
  queryNeonState?: (key: string, maxRequests: number, windowSeconds: number) => Promise<unknown>;
  memoryFallback?: typeof rateLimit;
};

export type PersistentRateLimitOptions = {
  increment?: boolean;
  failClosed?: boolean;
  dependencies?: PersistentRateLimitDependencies;
};

/**
 * Rate limit persistente no Neon PostgreSQL partilhado entre instâncias serverless.
 *
 * Comportamento seguro em caso de indisponibilidade do banco:
 * - Em caso de erro/timeout da base de dados, emite um registo estruturado de aviso
 *   e recorre graciosamente ao limitador em memória (`rateLimit`), preservando a
 *   disponibilidade de serviço sem bloquear utilizadores legítimos.
 * - Se `failClosed: true`, recusa preventivamente com status 429.
 */
export async function persistentRateLimit(
  key: string,
  config: RateLimitConfig,
  options?: PersistentRateLimitOptions,
): Promise<RateLimitResult> {
  const increment = options?.increment ?? true;
  const failClosed = options?.failClosed ?? false;
  const invokeNeon = options?.dependencies?.invokeNeon ?? invokePersistentRateLimitNeon;
  const queryNeonState = options?.dependencies?.queryNeonState ?? queryPersistentRateLimitStateNeon;
  const memoryFallback = options?.dependencies?.memoryFallback ?? rateLimit;

  try {
    const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const data = increment
      ? await invokeNeon(key, config.max, windowSeconds)
      : await queryNeonState(key, config.max, windowSeconds);

    const parsed = parseRpcResult(data);
    if (parsed) return parsed;
  } catch (err) {
    console.warn("[rate-limit:persistent-fallback-to-memory]", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });

    if (failClosed) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(config.windowMs / 1000)),
      };
    }
  }

  return memoryFallback(key, config, { increment });
}
