import { redirect } from "next/navigation";
import { POST_LOGIN_DASHBOARD } from "@/lib/auth/onboarding-status";

/**
 * Alias Loverly-style `/dashboard`.
 * O middleware trata auth antes desta página; fallback para `/app/dashboard`.
 */
export default function DashboardAliasPage() {
  redirect(POST_LOGIN_DASHBOARD);
}
