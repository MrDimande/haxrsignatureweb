import { NextResponse } from "next/server";
import { activatePortalAccount } from "@/lib/portal-auth/portal-auth.server";
import { getRequestIp, rateLimitResponse, RATE_LIMITS } from "@/lib/security/rate-limit";
import { persistentRateLimit } from "@/lib/security/persistent-rate-limit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = await persistentRateLimit(`portal-activate:${ip}`, RATE_LIMITS.portalActivate);
  if (!limit.allowed) {
    return rateLimitResponse(limit, { error: "too_many_attempts" });
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.token !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const result = await activatePortalAccount({ token: body.token, password: body.password });
    if (!result.ok) {
      console.warn("[portal-auth:activate-rejected]", {
        reason: result.reason,
      });
      return NextResponse.json(
        {
          error:
            result.reason === "invalid_password"
              ? "A palavra-passe não cumpre os requisitos de segurança."
              : "O link de activação expirou ou já não é válido.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[portal-auth:activate-exception]", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "Não foi possível activar a conta." }, { status: 503 });
  }
}
