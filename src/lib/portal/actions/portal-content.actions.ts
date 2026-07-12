"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import type { PortalApprovalType } from "@/lib/portal/portal-premium.types";

export async function createPortalMessageAction(input: {
  clientId: string;
  eventId: string;
  body: string;
  authorName?: string;
  isPinned?: boolean;
}) {
  const result = await runAction(() =>
    portalPremiumRepo.createPortalMessage({
      clientId: input.clientId,
      eventId: input.eventId,
      body: input.body,
      authorName: input.authorName,
      isPinned: input.isPinned,
    })
  );
  if (result.success) {
    revalidatePath(`/admin/events/${input.eventId}`);
  }
  return result;
}

export async function createCreativeApprovalAction(input: {
  clientId: string;
  eventId: string;
  approvalType: PortalApprovalType;
  title: string;
  description?: string;
  dueAt?: string;
  attachmentUrl?: string;
}) {
  const result = await runAction(() =>
    portalPremiumRepo.createCreativeApproval({
      eventId: input.eventId,
      clientId: input.clientId,
      approvalType: input.approvalType,
      title: input.title,
      description: input.description,
      dueAt: input.dueAt,
      attachmentUrl: input.attachmentUrl,
    })
  );
  if (result.success) {
    revalidatePath(`/admin/events/${input.eventId}`);
  }
  return result;
}

export async function createPortalContractAction(input: {
  clientId: string;
  eventId: string;
  title: string;
  description?: string;
  fileUrl?: string;
}) {
  const result = await runAction(() =>
    portalPremiumRepo.createPortalContract({
      clientId: input.clientId,
      eventId: input.eventId,
      title: input.title,
      description: input.description,
      fileUrl: input.fileUrl,
    })
  );
  if (result.success) {
    revalidatePath(`/admin/events/${input.eventId}`);
  }
  return result;
}
