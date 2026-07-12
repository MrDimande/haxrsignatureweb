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

export function validateEditionProxyRequest(
  request: Request
): EditionProxyAuthResult {
  const configured = process.env.HAXR_EDITION_PROXY_SECRET?.trim();
  const required = isEditionProxyAuthRequired();

  if (!configured) {
    if (required) {
      return { ok: false, reason: "missing" };
    }
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
