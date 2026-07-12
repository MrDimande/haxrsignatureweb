"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import { getClientPortalUrl } from "@/lib/portal/services/client-portal.service";

export async function ensureClientPortalLinkAction(clientId: string) {
  const result = await runAction(async () => {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    return getClientPortalUrl(clientId, siteUrl);
  });
  if (result.success) {
    revalidatePath(`/admin/clients/${clientId}`);
  }
  return result;
}
