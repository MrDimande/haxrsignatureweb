"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import type { ContactInquiry, InquiryStatus } from "@/lib/contact/types";

export async function getInquiriesAction() {
  return runAction(() => inquiriesRepo.listInquiries());
}

export async function updateInquiryStatusAction(
  id: string,
  status: InquiryStatus
) {
  const result = await runAction(() =>
    inquiriesRepo.updateInquiryStatus(id, status)
  );
  if (result.success) {
    revalidatePath("/admin/leads");
  }
  return result;
}

export async function convertLeadAction(inquiryId: string) {
  const result = await runAction(async () => {
    const { convertLeadToClientAndEvent } = await import(
      "@/lib/admin/services/convert-lead.service"
    );
    return convertLeadToClientAndEvent(inquiryId);
  });
  if (result.success) {
    revalidatePath("/admin/leads");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/clients/${result.data.client.id}`);
    revalidatePath(`/admin/events/${result.data.event.id}`);
  }
  return result;
}

export type { ContactInquiry, InquiryStatus };
