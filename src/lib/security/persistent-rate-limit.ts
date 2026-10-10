import {
  invokePersistentRateLimit as invokePersistentRateLimitNeon,
  queryPersistentRateLimitState as queryPersistentRateLimitStateNeon,
  refundPersistentRateLimitNeon,
} from "@/lib/security/persistent-rate-limit.neon";
import {
  getBucketPrefix,
  rateLimit,
  refundRateLimit,
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
  const row = data as Partial<RpcRateLimitRow>;
  if (typeof row.allowed !== "boolean") return null;

  const remaining = Number(row.remaining);
  const retryAfter = Number(row.retry_after_seconds);
  if (!Number.isFinite(remaining) || !Number.isFinite(retryAfter)) return null;

  return {
    allowed: row.allowed,
    remaining: Math.max(0, remaining),
    retryAfterSeconds: Math.max(0, retryAfter),
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
 *   sanitizado (sem expor o IP em claro) e recorre graciosamente ao limitador em memória
 *   (`rateLimit`), preservando a disponibilidade sem bloquear utilizadores legítimos.
 * - Se `failClosed: true`, recusa preventivamente com status 503 e Retry-After curto (30s)
 *   para evitar punição desproporcional a clientes por avarias de infra-estrutura.
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
  const bucketPrefix = getBucketPrefix(key);

  try {
    const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const data = increment
      ? await invokeNeon(key, config.max, windowSeconds)
      : await queryNeonState(key, config.max, windowSeconds);

    const parsed = parseRpcResult(data);
    if (parsed) return parsed;

    // Resultado nulo ou malformado da função sem lançar erro de rede
    console.warn("[rate-limit:persistent-malformed-result]", {
      bucket: bucketPrefix,
      data: typeof data === "object" ? "[object]" : String(data),
    });

    if (failClosed) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 30,
        serviceUnavailable: true,
      };
    }
  } catch (err) {
    console.warn("[rate-limit:persistent-fallback-to-memory]", {
      bucket: bucketPrefix,
      error: err instanceof Error ? err.message : String(err),
    });

    if (failClosed) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 30,
        serviceUnavailable: true,
      };
    }
  }

  return memoryFallback(key, config, { increment });
}

export type RefundPersistentRateLimitDependencies = {
  refundNeon?: typeof refundPersistentRateLimitNeon;
  memoryRefund?: typeof refundRateLimit;
};

export async function refundPersistentRateLimit(
  key: string,
  options?: { dependencies?: RefundPersistentRateLimitDependencies },
): Promise<void> {
  const refundNeon = options?.dependencies?.refundNeon ?? refundPersistentRateLimitNeon;
  const memoryRefund = options?.dependencies?.memoryRefund ?? refundRateLimit;

  try {
    await refundNeon(key);
  } catch (err) {
    console.warn("[rate-limit:refund-failed]", {
      bucket: getBucketPrefix(key),
      error: err instanceof Error ? err.message : String(err),
    });
  }

  memoryRefund(key);
}
