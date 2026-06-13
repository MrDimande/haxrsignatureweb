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

export type { ContactInquiry, InquiryStatus };
