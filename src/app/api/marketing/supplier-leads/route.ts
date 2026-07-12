import { NextResponse } from "next/server";
import { supplierJoinSchema } from "@/lib/email/email-schemas";
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

const SUCCESS_MESSAGE = "Recebemos a candidatura do fornecedor.";

/** POST /api/marketing/supplier-leads — candidatura de fornecedor */
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = supplierJoinSchema.safeParse(raw);

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

    const { firstName, lastName } = splitFullName(parsed.data.responsibleName);
    const now = new Date().toISOString();

    const result = await captureMarketingContact({
      email,
      firstName,
      lastName,
      phone: parsed.data.phone,
      companyName: parsed.data.supplierName,
      segment: "fornecedores",
      source: "supplier_join_form",
      role: "supplier",
      consentStatus: "granted",
      consentText: MARKETING_CONSENT_TEXT,
      consentAt: now,
      city: parsed.data.city,
      message: parsed.data.message?.trim() || undefined,
      metadata: {
        category: parsed.data.category,
        portfolioUrl: parsed.data.portfolioUrl || null,
        supplierName: parsed.data.supplierName,
      },
    });

    if (!result.brevo.synced && result.brevo.skipped) {
      console.warn("[api/marketing/supplier-leads] Brevo:", result.brevo.skipped);
    }

    return NextResponse.json(publicFormSuccess(SUCCESS_MESSAGE));
  } catch (err) {
    console.error("[api/marketing/supplier-leads]", err);
    return NextResponse.json(
      { error: "Não foi possível enviar a candidatura. Tente novamente." },
      { status: 500 }
    );
  }
}
