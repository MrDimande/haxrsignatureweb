import { NextResponse } from "next/server";

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const RATE_LIMITS = {
  adminLogin: { max: 5, windowMs: 15 * 60 * 1000 },
  findSeat: { max: 10, windowMs: 60 * 1000 },
  findSeatPerEvent: { max: 15, windowMs: 60 * 1000 },
  eventAction: { max: 30, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < 500) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getBucket(key: string, windowMs: number, now: number): Bucket {
  pruneExpiredBuckets(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return bucket;
  }

  return existing;
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
  options?: { increment?: boolean }
): RateLimitResult {
  const increment = options?.increment ?? true;
  const now = Date.now();
  const bucket = getBucket(key, config.windowMs, now);

  if (bucket.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      ),
    };
  }

  if (increment) {
    bucket.count += 1;
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.max - bucket.count),
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
  body?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: "rate_limited",
      message: "Demasiados pedidos. Tente novamente mais tarde.",
      ...body,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
