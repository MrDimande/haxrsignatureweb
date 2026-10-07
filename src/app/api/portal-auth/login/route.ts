import { NextResponse } from "next/server";
import { createPortalLoginResponse } from "@/lib/portal-auth/portal-auth.server";
import { getRequestIp, rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`portal-login:${ip}`, RATE_LIMITS.adminLogin, { increment: false });
  if (!limit.allowed) {
    return rateLimitResponse(limit, { error: "too_many_login_attempts" });
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

  try {
    const result = await createPortalLoginResponse({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe === true,
    });
    if (result.kind === "denied") rateLimit(`portal-login:${ip}`, RATE_LIMITS.adminLogin);
    return result.response;
  } catch (error) {
    console.error("portal_login_failed", {
      code: typeof error === "object" && error && "code" in error && typeof error.code === "string"
        ? error.code
        : null,
      name: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json(
      { error: "A autenticação está temporariamente indisponível." },
      { status: 503 },
    );
  }
}
