import { NextResponse } from "next/server";
import { submitPortalPaymentProof } from "@/lib/portal/services/portal-payment.service";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    documentId?: string;
    eventId?: string;
    amount?: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    fileName?: string;
    mimeType?: string;
    fileBase64?: string;
  };

  const result = await submitPortalPaymentProof(token, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, proofId: result.proofId });
}
