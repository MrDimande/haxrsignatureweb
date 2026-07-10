import { POST_LOGIN_ONBOARDING } from "@/lib/auth/onboarding-status";

/** First wizard step — all incomplete onboarding flows must land here, not 404. */
export const ONBOARDING_FIRST_STEP_PATH = "/onboarding/profile/1";

/** Entry route used after sign-in when onboarding is incomplete. */
export const ONBOARDING_ENTRY_PATH = POST_LOGIN_ONBOARDING;

export function resolveOnboardingFirstStepPath(): string {
  return ONBOARDING_FIRST_STEP_PATH;
}
