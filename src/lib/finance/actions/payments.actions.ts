"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import { registerPayment } from "@/lib/finance/services/register-payment.service";
import type { RegisterPaymentInput } from "@/lib/finance/types";

function revalidateFinance() {
  revalidatePath("/admin/cash");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/documents");
}

export async function registerPaymentAction(input: RegisterPaymentInput) {
  const result = await runAction(() => registerPayment(input));
  if (result.success) {
    revalidateFinance();
    if (result.data.receipt?.id) {
      revalidatePath(`/admin/documents/${result.data.receipt.id}`);
    }
    if (input.sourceDocumentId) {
      revalidatePath(`/admin/documents/${input.sourceDocumentId}`);
    }
  }
  return result;
}
