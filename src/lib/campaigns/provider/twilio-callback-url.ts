/**
 * Resolução proxy-safe da URL do StatusCallback Twilio.
 * A assinatura X-Twilio-Signature é calculada sobre a URL pública exacta.
 */

export function resolveReceivedCallbackUrl(request: Request): string {
  const incoming = new URL(request.url);
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host =
    forwardedHost ||
    request.headers.get("host")?.split(",")[0]?.trim() ||
    incoming.host;
  const proto =
    forwardedProto ||
    incoming.protocol.replace(":", "") ||
    "https";

  return `${proto}://${host}${incoming.pathname}${incoming.search}`;
}

/**
 * Escolhe a URL para validar a assinatura:
 * 1) Se a URL recebida (proxy-safe) coincide com a configurada → configurada
 * 2) Se o path coincide → usar configurada (Twilio assina a URL registada)
 * 3) Caso contrário → URL recebida (fail-closed se assinatura não bater)
 */
export function resolveSignatureCallbackUrl(input: {
  request: Request;
  configuredUrl: string;
}): { url: string; receivedUrl: string; usedConfigured: boolean } {
  const receivedUrl = resolveReceivedCallbackUrl(input.request);
  const configured = input.configuredUrl.trim();

  if (!configured) {
    return { url: receivedUrl, receivedUrl, usedConfigured: false };
  }

  if (normalizeUrlForCompare(receivedUrl) === normalizeUrlForCompare(configured)) {
    return { url: configured, receivedUrl, usedConfigured: true };
  }

  try {
    const receivedPath = new URL(receivedUrl).pathname.replace(/\/$/, "");
    const configuredPath = new URL(configured).pathname.replace(/\/$/, "");
    if (receivedPath === configuredPath) {
      return { url: configured, receivedUrl, usedConfigured: true };
    }
  } catch {
    // fall through
  }

  return { url: receivedUrl, receivedUrl, usedConfigured: false };
}

function normalizeUrlForCompare(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
}
