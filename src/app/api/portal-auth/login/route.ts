import { NextResponse } from "next/server";
import { createPortalLoginResponse } from "@/lib/portal-auth/portal-auth.server";
import { getRequestIp, rateLimitResponse, RATE_LIMITS } from "@/lib/security/rate-limit";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";
import { normalizePortalEmail, hashPortalSecret } from "@/lib/portal-auth/credentials";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const ipLimit = await persistentRateLimit(`portal-login:${ip}`, RATE_LIMITS.portalLogin, {
    increment: false,
    failClosed: true,
  });
  if (!ipLimit.allowed) {
    return rateLimitResponse(ipLimit, { error: "too_many_login_attempts" });
  }

  let body: { email?: unknown; password?: unknown; rememberMe?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown; rememberMe?: unknown };
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const normalizedEmail = normalizePortalEmail(body.email);
  const emailKey = normalizedEmail ? `portal-login-email:${hashPortalSecret(normalizedEmail)}` : null;

  if (emailKey) {
    const emailLimit = await persistentRateLimit(emailKey, RATE_LIMITS.portalLogin, {
      increment: false,
      failClosed: true,
    });
    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit, { error: "too_many_login_attempts" });
    }
  }

  try {
    const result = await createPortalLoginResponse({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe === true,
    });
    if (result.kind === "denied") {
      await persistentRateLimit(`portal-login:${ip}`, RATE_LIMITS.portalLogin, {
        increment: true,
        failClosed: true,
      });
      if (emailKey) {
        await persistentRateLimit(emailKey, RATE_LIMITS.portalLogin, {
          increment: true,
          failClosed: true,
        });
      }
    }
    return result.response;
  } catch {
    return NextResponse.json(
      { error: "A autenticação está temporariamente indisponível." },
      { status: 503 },
    );
  }
}

