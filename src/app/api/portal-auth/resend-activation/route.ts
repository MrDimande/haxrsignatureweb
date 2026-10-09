import { NextResponse } from "next/server";
import { executePortalResendActivation } from "@/lib/portal-auth/portal-resend-activation.server";
import { normalizePortalEmail, hashPortalSecret } from "@/lib/portal-auth/credentials";
import {
  getRequestIp,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";

function isTrustedSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  try {
    const originUrl = new URL(origin);
    if (host && (originUrl.host === host || originUrl.host === host.split(":")[0])) {
      return true;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (siteUrl && originUrl.origin === new URL(siteUrl).origin) return true;
    if (process.env.VERCEL_URL && originUrl.host === process.env.VERCEL_URL) return true;
    if (process.env.VERCEL_BRANCH_URL && originUrl.host === process.env.VERCEL_BRANCH_URL) return true;
    if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json(
      { error: "Origem não autorizada." },
      { status: 403 },
    );
  }

  const ip = getRequestIp(request);
  const ipLimit = await persistentRateLimit(
    `portal-resend-activation-ip:${ip}`,
    RATE_LIMITS.portalResendActivationIp,
    { failClosed: true },
  );
  if (!ipLimit.allowed) {
    return rateLimitResponse(ipLimit, { error: "too_many_attempts" });
  }

  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const normalizedEmail = normalizePortalEmail(rawEmail);
  if (!normalizedEmail) {
    return NextResponse.json(
      { error: "Introduza um endereço de email válido." },
      { status: 400 },
    );
  }

  const emailHash = hashPortalSecret(normalizedEmail);
  const emailLimit = await persistentRateLimit(
    `portal-resend-activation-email:${emailHash}`,
    RATE_LIMITS.portalResendActivationEmail,
    { failClosed: true },
  );
  if (!emailLimit.allowed) {
    return rateLimitResponse(emailLimit, { error: "too_many_attempts" });
  }

  try {
    const result = await executePortalResendActivation({ email: normalizedEmail });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[portal-auth:resend-activation-route-exception]", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "O serviço está temporariamente indisponível." },
      { status: 503 },
    );
  }
}
