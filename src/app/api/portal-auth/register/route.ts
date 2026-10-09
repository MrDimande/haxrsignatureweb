import { NextResponse } from "next/server";
import { executePortalRegistration } from "@/lib/portal-auth/portal-registration.server";
import {
  getRequestIp,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

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
  const limit = rateLimit(`portal-register:${ip}`, RATE_LIMITS.portalRegister);
  if (!limit.allowed) {
    return rateLimitResponse(limit, { error: "too_many_registration_attempts" });
  }

  let body: { fullName?: unknown; email?: unknown; termsAccepted?: unknown };
  try {
    body = (await request.json()) as {
      fullName?: unknown;
      email?: unknown;
      termsAccepted?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const result = await executePortalRegistration({
      fullName: body.fullName,
      email: body.email,
      termsAccepted: body.termsAccepted,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch {
    return NextResponse.json(
      { error: "O serviço de registo está temporariamente indisponível." },
      { status: 503 },
    );
  }
}
