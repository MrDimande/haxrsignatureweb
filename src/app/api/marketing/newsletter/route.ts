import { NextResponse } from "next/server";
import { newsletterSignupSchema } from "@/lib/email/email-schemas";
import {
  isHoneypotFilled,
  isRateLimited,
  publicFormSuccess,
} from "@/lib/api/public-form-guard";
import {
  MARKETING_CONSENT_TEXT,
  splitFullName,
} from "@/lib/email/marketing/marketing-contact";
import { captureMarketingContact } from "@/lib/email/marketing/contact-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_MESSAGE =
  "Obrigado. O seu contacto foi registado com sucesso.";

/** POST /api/marketing/newsletter — subscrição newsletter */
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = newsletterSignupSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    if (isHoneypotFilled(parsed.data.gotcha)) {
      return NextResponse.json(publicFormSuccess(SUCCESS_MESSAGE));
    }

    const email = parsed.data.email.toLowerCase();
    if (isRateLimited(email)) {
      return NextResponse.json(
        { error: "Demasiados pedidos. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const { firstName, lastName } = splitFullName(parsed.data.name);
    const now = new Date().toISOString();

    const result = await captureMarketingContact({
      email,
      firstName,
      lastName,
      segment: "newsletter",
      source: "newsletter_signup",
      role: "newsletter",
      consentStatus: "granted",
      consentText: MARKETING_CONSENT_TEXT,
      consentAt: now,
    });

    if (!result.brevo.synced && result.brevo.skipped) {
      console.warn("[api/marketing/newsletter] Brevo:", result.brevo.skipped);
    }

    return NextResponse.json(publicFormSuccess(SUCCESS_MESSAGE));
  } catch (err) {
    console.error("[api/marketing/newsletter]", err);
    return NextResponse.json(
      { error: "Não foi possível concluir a subscrição. Tente novamente." },
      { status: 500 }
    );
  }
}
