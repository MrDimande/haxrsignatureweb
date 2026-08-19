"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as inquiriesRepo from "@/lib/contact/inquiries.repository";
import { assertManualInquiryStatus } from "@/lib/contact/constants";
import type {
  ContactInquiry,
  InquiryStatus,
  ManualInquiryStatus,
} from "@/lib/contact/types";

export async function getInquiriesAction() {
  return runAction(() => inquiriesRepo.listInquiries());
}

export async function updateInquiryStatusAction(
  id: string,
  status: InquiryStatus | ManualInquiryStatus
) {
  const result = await runAction(async () => {
    assertManualInquiryStatus(status);
    return inquiriesRepo.updateInquiryStatus(id, status);
  });
  if (result.success) {
    revalidatePath("/admin/leads");
    revalidatePath("/admin/dashboard");
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
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/clients/${result.data.client.id}`);
    revalidatePath(`/admin/events/${result.data.event.id}`);
  }
  return result;
}

export type { ContactInquiry, InquiryStatus, ManualInquiryStatus };
