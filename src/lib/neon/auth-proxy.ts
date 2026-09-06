import { getNeonAuthUrl, shouldUseNeonAuthForAppSession } from "@/lib/neon/config";

const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth";
const NEON_AUTH_SESSION_CHALLENGE_COOKIE = `${NEON_AUTH_COOKIE_PREFIX}.session_challenge`;
const NEON_AUTH_LEGACY_CHALLENGE_COOKIE = `${NEON_AUTH_COOKIE_PREFIX}.session_challange`;
const NEON_AUTH_SESSION_VERIFIER_PARAM = "neon_auth_session_verifier";

const ALLOWED_AUTH_PATHS = new Set([
  "get-session",
  "sign-in/email",
  "sign-in/social",
  "sign-up/email",
  "sign-out",
  "email-otp/send-verification-otp",
  "email-otp/verify-email",
  "email-otp/passcode",
]);

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function splitCombinedSetCookie(value: string): string[] {
  const cookies: string[] = [];
  let start = 0;
  let inExpires = false;

  for (let index = 0; index < value.length; index += 1) {
    const remainder = value.slice(index).toLowerCase();
    if (remainder.startsWith("expires=")) {
      inExpires = true;
    }

    const char = value[index];
    if (char === ";" && inExpires) {
      inExpires = false;
      continue;
    }

    if (char !== "," || inExpires) continue;

    const tail = value.slice(index + 1);
    if (!/^\s*[^=;,\s]+=/.test(tail)) continue;

    cookies.push(value.slice(start, index).trim());
    start = index + 1;
  }

  const last = value.slice(start).trim();
  if (last) cookies.push(last);
  return cookies;
}

export function getSetCookieHeaders(headers: Headers): string[] {
  const getter = (headers as HeadersWithGetSetCookie).getSetCookie;
  if (typeof getter === "function") {
    return getter.call(headers);
  }

  const combined = headers.get("set-cookie");
  return combined ? splitCombinedSetCookie(combined) : [];
}

function sanitizeSetCookie(cookieHeader: string): string {
  const parts = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return cookieHeader;

  const [cookiePair, ...attributes] = parts;
  const kept: string[] = [];
  let hasSecure = false;

  for (const attribute of attributes) {
    const lower = attribute.toLowerCase();
    if (lower === "partitioned") continue;
    if (lower.startsWith("domain=")) continue;
    if (lower.startsWith("samesite=")) continue;
    if (lower === "secure") hasSecure = true;
    kept.push(attribute);
  }

  if (!hasSecure) kept.push("Secure");
  kept.push("SameSite=Lax");
  return [cookiePair, ...kept].join("; ");
}

function extractNeonCookieHeader(request: Request): string {
  const raw = request.headers.get("cookie") ?? "";
  return raw
    .split(";")
    .map((value) => value.trim())
    .filter((value) => value.startsWith(`${NEON_AUTH_COOKIE_PREFIX}.`))
    .join("; ");
}

function resolveRequestOrigin(request: Request): string {
  return (
    request.headers.get("origin") ||
    request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
    new URL(request.url).origin
  );
}

function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of ["user-agent", "authorization", "referer", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set("Origin", resolveRequestOrigin(request));
  const cookie = extractNeonCookieHeader(request);
  if (cookie) headers.set("Cookie", cookie);
  headers.set("x-neon-auth-middleware", "true");
  return headers;
}

export function isNeonAuthProxyEnabled(): boolean {
  return shouldUseNeonAuthForAppSession() && Boolean(getNeonAuthUrl());
}

export async function proxyNeonAuthRequest(
  request: Request,
  path: string,
): Promise<Response> {
  if (!isNeonAuthProxyEnabled()) {
    return Response.json(
      { error: "Neon Auth não está activo neste ambiente." },
      { status: 404 },
    );
  }

  if (!ALLOWED_AUTH_PATHS.has(path)) {
    return Response.json({ error: "Operação de autenticação não permitida." }, { status: 404 });
  }

  const authUrl = getNeonAuthUrl();
  if (!authUrl) {
    return Response.json({ error: "Neon Auth não configurado." }, { status: 503 });
  }

  const upstreamUrl = new URL(`${authUrl.replace(/\/$/, "")}/${path}`);
  upstreamUrl.search = new URL(request.url).search;

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: buildForwardHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    for (const name of ["set-auth-jwt", "set-auth-token", "x-neon-ret-request-id"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }

    for (const cookie of getSetCookieHeaders(upstream.headers)) {
      headers.append("Set-Cookie", sanitizeSetCookie(cookie));
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Erro de rede desconhecido.";
    console.warn("[neon-auth] upstream request failed", detail);
    return Response.json(
      { error: "Não foi possível contactar o serviço de autenticação." },
      { status: 502 },
    );
  }
}

function hasOAuthChallengeCookie(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return (
    cookie.includes(`${NEON_AUTH_SESSION_CHALLENGE_COOKIE}=`) ||
    cookie.includes(`${NEON_AUTH_LEGACY_CHALLENGE_COOKIE}=`)
  );
}

export type NeonOAuthExchangeResult =
  | { ok: true; cookies: string[] }
  | { ok: false; message: string };

export async function exchangeNeonOAuthVerifier(
  request: Request,
): Promise<NeonOAuthExchangeResult | null> {
  const url = new URL(request.url);
  if (!url.searchParams.has(NEON_AUTH_SESSION_VERIFIER_PARAM)) return null;
  if (!hasOAuthChallengeCookie(request)) {
    return { ok: false, message: "Desafio OAuth Neon ausente ou expirado." };
  }

  const response = await proxyNeonAuthRequest(request, "get-session");
  if (!response.ok) {
    return {
      ok: false,
      message: `Troca OAuth Neon falhou com HTTP ${response.status}.`,
    };
  }

  return { ok: true, cookies: getSetCookieHeaders(response.headers) };
}
