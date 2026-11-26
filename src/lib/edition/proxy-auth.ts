import { timingSafeEqual } from "@/lib/security/timing-safe";

function readProxySecretFromRequest(request: Request): string {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }
  return request.headers.get("x-haxr-edition-proxy")?.trim() ?? "";
}

export type EditionProxyAuthResult =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: "missing" | "invalid" };

export function editionProxyUnauthorizedResponse(): {
  success: false;
  error: string;
} {
  return { success: false, error: "Não autorizado." };
}

export function isEditionProxyAuthRequired(): boolean {
  return (
    process.env.HAXR_REQUIRE_EDITION_PROXY_AUTH?.trim().toLowerCase() === "true"
  );
}

/** Produção (Vercel ou NODE_ENV) exige fail-closed sem secret. */
export function isEditionProxyProductionRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

export function validateEditionProxyRequest(
  request: Request
): EditionProxyAuthResult {
  const configured = process.env.HAXR_EDITION_PROXY_SECRET?.trim();
  const required =
    isEditionProxyAuthRequired() || isEditionProxyProductionRuntime();

  if (!configured) {
    if (required) {
      return { ok: false, reason: "missing" };
    }
    // Desenvolvimento / testes sem secret: permitido apenas fora de produção.
    return { ok: true, skipped: true };
  }

  const presented = readProxySecretFromRequest(request);
  if (!presented) {
    return { ok: false, reason: "missing" };
  }
  if (!timingSafeEqual(presented, configured)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, skipped: false };
}

let ayllaTestProxySecretOverride: string | null = null;

export function setAyllaProxySecretForTesting(secret: string | null): void {
  ayllaTestProxySecretOverride = secret;
}

/**
 * Strict header parser for Baby Aylla Gift & Identity routes.
 * Rejects malformed schemes, empty header values, duplicate values, or contradictory
 * Authorization vs x-haxr-edition-proxy credentials.
 */
function readStrictAyllaProxySecretFromRequest(
  request: Request
): { ok: true; secret: string } | { ok: false; reason: "missing" | "invalid" } {
  const hasAuthorization = request.headers.has("authorization");
  const rawAuthorization = request.headers.get("authorization")?.trim() ?? "";
  const hasProxyHeader = request.headers.has("x-haxr-edition-proxy");
  const rawProxyHeader = request.headers.get("x-haxr-edition-proxy")?.trim() ?? "";

  let bearerSecret = "";
  if (hasAuthorization) {
    const bearerMatch = /^bearer\s+(\S+)$/i.exec(rawAuthorization);
    if (!bearerMatch || bearerMatch[1].includes(",")) {
      return { ok: false, reason: "invalid" };
    }
    bearerSecret = bearerMatch[1];
  }

  let proxySecret = "";
  if (hasProxyHeader) {
    if (!rawProxyHeader || /[\s,]/.test(rawProxyHeader)) {
      return { ok: false, reason: "invalid" };
    }
    proxySecret = rawProxyHeader;
  }

  if (bearerSecret && proxySecret && !timingSafeEqual(bearerSecret, proxySecret)) {
    return { ok: false, reason: "invalid" };
  }

  const presented = bearerSecret || proxySecret;
  if (!presented) {
    return { ok: false, reason: "missing" };
  }

  return { ok: true, secret: presented };
}

/**
 * Strict fail-closed validator for Baby Aylla Gift & Identity routes.
 * Uses HAXR_AYLLA_GIFT_PROXY_SECRET exclusively (never falls back to
 * HAXR_EDITION_PROXY_SECRET) and requires mutual authentication in ALL environments.
 */
export function validateAyllaProxyRequest(
  request: Request
): EditionProxyAuthResult {
  const configured =
    ayllaTestProxySecretOverride !== null
      ? ayllaTestProxySecretOverride.trim()
      : process.env.HAXR_AYLLA_GIFT_PROXY_SECRET?.trim();

  if (!configured) {
    return { ok: false, reason: "missing" };
  }

  const presented = readStrictAyllaProxySecretFromRequest(request);
  if (!presented.ok) {
    return { ok: false, reason: presented.reason };
  }

  if (!timingSafeEqual(presented.secret, configured)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, skipped: false };
}

const MAX_EDITION_RSVP_BODY_BYTES = 32_768;

export type EditionProxyBodyCheck =
  | { ok: true }
  | {
      ok: false;
      status: 400 | 413 | 415;
      error: string;
    };

/** Validação de Content-Type e tamanho do body (fail-closed). */
export function validateEditionProxyJsonBody(
  request: Request
): EditionProxyBodyCheck {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      status: 415,
      error: "Content-Type inválido.",
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (Number.isFinite(size) && size > MAX_EDITION_RSVP_BODY_BYTES) {
      return {
        ok: false,
        status: 413,
        error: "Pedido demasiado grande.",
      };
    }
  }

  return { ok: true };
}

export const EDITION_RSVP_MAX_BODY_BYTES = MAX_EDITION_RSVP_BODY_BYTES;
