import { NextResponse } from "next/server";
import { activatePortalAccount } from "@/lib/portal-auth/portal-auth.server";

export async function POST(request: Request) {
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
      return NextResponse.json(
        {
          error:
            result.reason === "invalid_password"
              ? "A palavra-passe não cumpre os requisitos de segurança."
              : "O link de activação expirou ou já não é válido.",
        },
        { status: result.reason === "invalid_password" ? 400 : 400 },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível activar a conta." }, { status: 503 });
  }
}
