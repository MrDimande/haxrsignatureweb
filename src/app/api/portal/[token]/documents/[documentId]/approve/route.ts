import { NextResponse } from "next/server";
import { approvePortalDocument } from "@/lib/portal/services/portal-approval.service";

type RouteContext = {
  params: Promise<{ token: string; documentId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { token, documentId } = await context.params;
  const result = await approvePortalDocument(token, documentId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    invoice: result.invoice ?? null,
  });
}
