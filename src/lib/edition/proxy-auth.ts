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
