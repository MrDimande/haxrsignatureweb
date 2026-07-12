import type {
  PortalApprovalType,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";

export async function markPortalTimelinePhaseDone(
  eventId: string,
  category: PortalTimelineItem["category"]
): Promise<void> {
  await portalPremiumRepo.markTimelineCategoryDone(eventId, category);
}

/** Cliente aprovou proforma no portal. */
export async function onPortalProformaApproved(eventId: string): Promise<void> {
  await markPortalTimelinePhaseDone(eventId, "proposal");
}

/** Sinal/comprovativo validado — confirma fase de depósito. */
export async function onPortalDepositConfirmed(eventId: string): Promise<void> {
  await markPortalTimelinePhaseDone(eventId, "deposit");
  await portalPremiumRepo.clearEventDateHold(eventId);
}

/** Cliente aprovou criativo (convite, entrega, etc.). */
export async function onPortalCreativeApprovalApproved(
  eventId: string,
  approvalType: PortalApprovalType
): Promise<void> {
  if (approvalType === "invite") {
    await markPortalTimelinePhaseDone(eventId, "invite");
    return;
  }
  if (approvalType === "delivery") {
    await markPortalTimelinePhaseDone(eventId, "delivery");
  }
}
