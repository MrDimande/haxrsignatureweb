import { NextResponse } from "next/server";
import { marketingContactSchema } from "@/lib/email/email-schemas";
import { syncMarketingContact } from "@/lib/email/marketing/marketing-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** POST /api/marketing/contacts — sync contacto com consentimento */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const parsed = marketingContactSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const result = await syncMarketingContact({
      ...parsed.data,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/marketing/contacts]", err);
    return NextResponse.json(
      { error: "Falha ao sincronizar contacto." },
      { status: 500 }
    );
  }
}
