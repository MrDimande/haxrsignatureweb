import { redirect } from "next/navigation";
import { resolveOnboardingFirstStepPath } from "@/lib/auth/onboarding-entry";

/** Server redirect — avoids 404 on /onboarding after sign-in on clean Vercel checkouts. */
export default function OnboardingPage() {
  redirect(resolveOnboardingFirstStepPath());
}
