import { redirect } from "next/navigation";
import { resolveOnboardingFirstStepPath } from "@/lib/auth/onboarding-entry";

/** Server redirect to the first step of the private onboarding experience. */
export default function OnboardingPage() {
  redirect(resolveOnboardingFirstStepPath());
}
