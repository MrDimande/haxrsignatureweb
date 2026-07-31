import { createHash } from "crypto";
import { z } from "zod";
import {
  FIND_SEAT_MAX_CODE_LENGTH,
  FIND_SEAT_MIN_NAME_LENGTH,
  normalizeFindSeatCode,
} from "@/lib/events/find-seat-code";
import type { FindSeatSearchResponse } from "@/lib/events/types";
import type {
  RateLimitConfig,
  RateLimitResult,
} from "@/lib/security/rate-limit";

const MAX_BODY_BYTES = 2_048;

const requestSchema = z
  .object({
    eventId: z.string().uuid(),
    query: z.string().trim().min(FIND_SEAT_MIN_NAME_LENGTH).max(80),
    accessCode: z.string().trim().min(4).max(FIND_SEAT_MAX_CODE_LENGTH),
  })
  .strict();

export const FIND_SEAT_GENERIC_ERROR = {
  ok: false,
  error: "not_found",
  message:
    "Código ou nome incorrectos. Verifique os dados ou dirija-se à recepção.",
} as const;

type FindSeatRateLimits = {
  ip: RateLimitConfig;
  event: RateLimitConfig;
  code: RateLimitConfig;
};

export type FindSeatApiDependencies = {
  search: (
    eventId: string,
    query: string,
    accessCode: string
  ) => Promise<FindSeatSearchResponse>;
  rateLimit: (
    key: string,
    config: RateLimitConfig
  ) => Promise<RateLimitResult>;
  getIp: (request: Request) => string;
  limits: FindSeatRateLimits;
  reportUnavailable?: () => void;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {}
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function rateLimited(result: RateLimitResult): Response {
  return jsonResponse(FIND_SEAT_GENERIC_ERROR, 429, {
    "Retry-After": String(Math.max(1, result.retryAfterSeconds)),
  });
}

function opaqueCodeBucket(accessCode: string): string {
  return createHash("sha256")
    .update(normalizeFindSeatCode(accessCode), "utf8")
    .digest("hex")
    .slice(0, 32);
}

export function createFindSeatPostHandler(
  dependencies: FindSeatApiDependencies
): (request: Request) => Promise<Response> {
  return async function findSeatPost(request: Request): Promise<Response> {
    try {
      const contentLength = Number(request.headers.get("content-length") ?? "0");
      if (
        !Number.isFinite(contentLength) ||
        contentLength < 0 ||
        contentLength > MAX_BODY_BYTES
      ) {
        return jsonResponse(FIND_SEAT_GENERIC_ERROR, 413);
      }

      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        return jsonResponse(FIND_SEAT_GENERIC_ERROR, 400);
      }

      const parsed = requestSchema.safeParse(raw);
      if (!parsed.success) {
        return jsonResponse(FIND_SEAT_GENERIC_ERROR, 400);
      }

      const { eventId, query, accessCode } = parsed.data;
      const normalizedCode = normalizeFindSeatCode(accessCode);
      const ip = dependencies.getIp(request);

      const ipLimit = await dependencies.rateLimit(
        `find-seat:ip:${ip}`,
        dependencies.limits.ip
      );
      if (!ipLimit.allowed) return rateLimited(ipLimit);

      const eventLimit = await dependencies.rateLimit(
        `find-seat:event:${eventId}:${ip}`,
        dependencies.limits.event
      );
      if (!eventLimit.allowed) return rateLimited(eventLimit);

      const codeLimit = await dependencies.rateLimit(
        `find-seat:code:${eventId}:${opaqueCodeBucket(normalizedCode)}`,
        dependencies.limits.code
      );
      if (!codeLimit.allowed) return rateLimited(codeLimit);

      const result = await dependencies.search(eventId, query, normalizedCode);
      if (!result.ok) {
        return jsonResponse(FIND_SEAT_GENERIC_ERROR, 404);
      }

      return jsonResponse(result as unknown as Record<string, unknown>, 200);
    } catch {
      dependencies.reportUnavailable?.();
      return jsonResponse(
        {
          ok: false,
          error: "unavailable",
          message: "Serviço temporariamente indisponível. Tente novamente.",
        },
        503
      );
    }
  };
}
