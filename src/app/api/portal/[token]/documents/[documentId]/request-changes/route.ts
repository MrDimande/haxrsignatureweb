import { NextResponse } from "next/server";
import { requestPortalDocumentChanges } from "@/lib/portal/services/portal-approval.service";

type RouteContext = {
  params: Promise<{ token: string; documentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token, documentId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  const result = await requestPortalDocumentChanges(
    token,
    documentId,
    body.note ?? ""
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
