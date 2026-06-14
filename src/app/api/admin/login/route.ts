import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getSessionMaxAge,
  isAdminConfigured,
  validateCredentials,
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
        { status: 503 }
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

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!validateCredentials(email, password)) {
      rateLimit(limitKey, RATE_LIMITS.adminLogin);
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não foi possível iniciar sessão." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSessionMaxAge(),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Pedido inválido." },
      { status: 400 }
    );
  }
}
