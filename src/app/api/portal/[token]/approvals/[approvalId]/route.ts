import { NextResponse } from "next/server";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import { onPortalCreativeApprovalApproved } from "@/lib/portal/services/portal-timeline-progression.service";

type RouteContext = {
  params: Promise<{ token: string; approvalId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token, approvalId } = await context.params;
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    status?: "approved" | "changes_requested";
    note?: string;
  };

  if (body.status !== "approved" && body.status !== "changes_requested") {
    return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
  }

  const approvals = await portalPremiumRepo.listCreativeApprovalsForClient(
    client.id
  );
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || approval.status !== "pending") {
    return NextResponse.json({ error: "Aprovação não encontrada." }, { status: 400 });
  }

  if (body.status === "changes_requested" && !body.note?.trim()) {
    return NextResponse.json(
      { error: "Descreva as alterações pretendidas." },
      { status: 400 }
    );
  }

  await portalPremiumRepo.decideCreativeApproval(
    approvalId,
    body.status,
    body.note
  );

  if (body.status === "approved" && approval.eventId) {
    await onPortalCreativeApprovalApproved(approval.eventId, approval.approvalType);
  }

  return NextResponse.json({ success: true });
}
