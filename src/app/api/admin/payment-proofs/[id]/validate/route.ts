import { NextResponse } from "next/server";
import type { BusinessId } from "@/lib/admin/types";
import { validatePortalPaymentProof } from "@/lib/portal/services/portal-payment.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    approve?: boolean;
    note?: string;
    businessId?: BusinessId;
  };

  try {
    await validatePortalPaymentProof(id, {
      approve: body.approve !== false,
      note: body.note,
      businessId: body.businessId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao validar." },
      { status: 400 }
    );
  }
}
