import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdminUser,
  getSessionMaxAge,
  isAdminConfigured,
} from "@/lib/admin/auth";
import {
  getRequestIp,
  rateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Área de administração não configurada." },
        { status: 503 },
      );
    }

    const ip = getRequestIp(request);
    const limitKey = `admin-login:${ip}`;
    const blocked = rateLimit(limitKey, RATE_LIMITS.adminLogin, {
      increment: false,
    });

    if (!blocked.allowed) {
      return rateLimitResponse(blocked, {
        error: "too_many_login_attempts",
        message: "Demasiadas tentativas de login. Aguarde e tente novamente.",
      });
    }

    let body: { email?: string; password?: string };
    try {
      body = (await request.json()) as {
        email?: string;
        password?: string;
      };
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const userAgent = request.headers.get("user-agent");

    const authResult = await authenticateAdminUser(email, password, {
      userAgent,
      ipAddress: ip,
    });

    if (!authResult.success) {
      rateLimit(limitKey, RATE_LIMITS.adminLogin);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, authResult.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSessionMaxAge(),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "A autenticação está temporariamente indisponível." },
      { status: 503 },
    );
  }
}
