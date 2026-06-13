import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/contact/validation";
import {
  countRecentInquiriesByEmail,
  createInquiry,
} from "@/lib/contact/inquiries.repository";
import { sendContactEmails } from "@/lib/contact/emails";
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
    const parsed = contactFormSchema.safeParse(raw);

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

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (err) {
    console.error("[api/contact]", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
