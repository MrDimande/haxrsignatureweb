import { NextResponse } from "next/server";

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  serviceUnavailable?: boolean;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function getBucketPrefix(key: string): string {
  const colonIndex = key.indexOf(":");
  return colonIndex === -1 ? key : key.slice(0, colonIndex);
}

export function refundRateLimit(key: string): void {
  const bucket = buckets.get(key);
  if (bucket && bucket.count > 0) {
    bucket.count -= 1;
  }
}

export const RATE_LIMITS = {
  adminLogin: { max: 5, windowMs: 15 * 60 * 1000 },
  portalLogin: { max: 5, windowMs: 15 * 60 * 1000 },
  portalRegister: { max: 5, windowMs: 15 * 60 * 1000 },
  portalActivate: { max: 10, windowMs: 15 * 60 * 1000 },
  portalResendActivationIp: { max: 5, windowMs: 15 * 60 * 1000 },
  portalResendActivationEmail: { max: 3, windowMs: 15 * 60 * 1000 },
  findSeat: { max: 10, windowMs: 60 * 1000 },
  findSeatPerEvent: { max: 15, windowMs: 60 * 1000 },
  findSeatPerCode: { max: 30, windowMs: 60 * 1000 },
  eventAction: { max: 30, windowMs: 60 * 1000 },
  /** Edition open RSVP — aligned with projecto_haxrsignature */
  editionRsvp: { max: 8, windowMs: 15 * 60 * 1000 },
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
  const candidates = [
    request.headers.get("x-real-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && value.length <= 128) return value;
  }

  // A missing proxy identity must never turn all affected visitors into one
  // shared "unknown" bucket. This key is intentionally single-request: the
  // platform edge remains the fallback abuse control when no client IP exists.
  return `unattributed:${globalThis.crypto.randomUUID()}`;
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

/** Edition API envelope — matches projecto_haxrsignature/app/api/rsvp */
export function editionRateLimitResponse(
  result: RateLimitResult,
  body?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
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
