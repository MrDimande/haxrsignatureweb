import { NextResponse } from "next/server";
import { marketingTestEmailSchema } from "@/lib/email/email-schemas";
import { getEmailSendMode } from "@/lib/email/email-config";
import { sendMarketingTestEmail } from "@/lib/email/marketing/marketing-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** POST /api/marketing/test-email — protegido por CRON_SECRET */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = marketingTestEmailSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const result = await sendMarketingTestEmail(
      parsed.data.templateId,
      parsed.data.firstName
    );

    return NextResponse.json({
      ok: result.ok,
      mode: getEmailSendMode(),
      mock: "mock" in result ? result.mock : false,
      reason: "mock" in result ? result.reason : undefined,
      messageId: "messageId" in result ? result.messageId : undefined,
      error: !result.ok ? result.error : undefined,
    });
  } catch (err) {
    console.error("[api/marketing/test-email]", err);
    return NextResponse.json(
      { error: "Falha ao enviar email de teste." },
      { status: 500 }
    );
  }
}
