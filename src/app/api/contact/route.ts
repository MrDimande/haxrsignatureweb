import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/contact/validation";
import {
  countRecentInquiriesByEmail,
  createInquiry,
} from "@/lib/contact/inquiries.repository";
import { sendContactEmails } from "@/lib/contact/emails";
import { MARKETING_CONSENT_TEXT } from "@/lib/email/marketing/marketing-contact";
import { captureMarketingContact } from "@/lib/email/marketing/contact-capture";
import {
  resolveSegmentFromEventType,
  splitFullName,
} from "@/lib/email/marketing/marketing-contact";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Serviço de contacto temporariamente indisponível." },
        { status: 503 }
      );
    }

    const raw = await request.json();
    const normalized = {
      ...raw,
      intent:
        typeof raw.intent === "string" && raw.intent.trim()
          ? raw.intent
          : typeof raw.message === "string"
            ? raw.message
            : "",
      message:
        typeof raw.message === "string" &&
        typeof raw.intent === "string" &&
        raw.intent.trim()
          ? raw.message
          : typeof raw.message === "string" && !raw.intent
            ? ""
            : (raw.message ?? ""),
    };
    const parsed = contactFormSchema.safeParse(normalized);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const { gotcha, packageLabel, marketingOptIn, ...data } = parsed.data;

    if (gotcha?.trim()) {
      return NextResponse.json({ success: true });
    }

    const email = data.email.toLowerCase();
    const recentCount = await countRecentInquiriesByEmail(
      email,
      RATE_LIMIT_WINDOW_MS
    );

    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          error:
            "Demasiados pedidos com este email. Tente novamente mais tarde.",
        },
        { status: 429 }
      );
    }

    const inquiry = await createInquiry({
      ...data,
      packageLabel: packageLabel ?? (raw as { packageLabel?: string }).packageLabel,
      marketingOptIn,
    });

    await sendContactEmails(inquiry);

    const { firstName, lastName } = splitFullName(inquiry.name);
    const capture = await captureMarketingContact({
      email: inquiry.email,
      firstName,
      lastName,
      segment: resolveSegmentFromEventType(inquiry.projectType),
      source: "site_contact_form",
      role: "lead",
      consentStatus: marketingOptIn ? "granted" : "pending",
      consentText: marketingOptIn ? MARKETING_CONSENT_TEXT : undefined,
      consentAt: marketingOptIn ? new Date().toISOString() : undefined,
      message: inquiry.intent,
      metadata: {
        projectType: inquiry.projectType,
        packageLabel: inquiry.packageLabel,
        inquiryId: inquiry.id,
      },
    });

    if (!capture.brevo.synced && capture.brevo.skipped) {
      console.warn("[api/contact] marketing capture:", capture.brevo.skipped);
    }

    if (marketingOptIn && capture.brevo.synced) {
      const { triggerLeadFunnelOnSync } = await import("@/lib/brevo/funnel");
      try {
        const funnel = await triggerLeadFunnelOnSync(inquiry);
        if (funnel.leadWelcome?.error) {
          console.warn(
            "[api/contact] Brevo funnel welcome:",
            funnel.leadWelcome.error
          );
        }
      } catch (err) {
        console.warn("[api/contact] Brevo funnel:", err);
      }
    }

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (err) {
    console.error("[api/contact]", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
