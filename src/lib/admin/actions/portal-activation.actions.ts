"use server";

import { revalidatePath } from "next/cache";
import type { AdminActionResult } from "@/lib/admin/actions/admin-users.actions";
import {
  executePortalActivation,
  type PortalActivationActionData,
} from "@/lib/admin/services/portal-activation.service";

/** Browser input is intentionally limited to the immutable portal account ID. */
export async function sendPortalActivationAction(
  input: { accountId: string },
): Promise<AdminActionResult<PortalActivationActionData>> {
  const result = await executePortalActivation(input);
  if (result.success) revalidatePath("/admin/portal-accounts");
  return result;
}
