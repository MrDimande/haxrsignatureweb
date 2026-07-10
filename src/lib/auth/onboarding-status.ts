/**
 * Client-side onboarding status helpers.
 * Mirrors the localStorage keys used by /onboarding/profile/* steps.
 *
 * TODO: Replace with server-side session + profile API when real auth is wired.
 */

import {
  hasRequiredOnboardingKeys,
  ONBOARDING_KEYS,
  type OnboardingStorageReader,
} from "@/lib/auth/onboarding-storage";

export const ONBOARDING_COMPLETE_KEY = "haxr_onboarding_complete";

export const POST_LOGIN_DASHBOARD = "/app/dashboard";
export const POST_LOGIN_ONBOARDING = "/onboarding";

function getDefaultStore(): OnboardingStorageReader | null {
  if (typeof window === "undefined") return null;
  return localStorage;
}

function clearStaleCompleteFlag(store: OnboardingStorageReader): void {
  if (store.getItem(ONBOARDING_COMPLETE_KEY) === "true" && !hasRequiredOnboardingKeys(store)) {
    store.removeItem(ONBOARDING_COMPLETE_KEY);
  }
}

/**
 * Whether the user finished the full onboarding wizard with all mandatory fields.
 * If the complete flag exists but required data is missing, onboarding is treated as incomplete.
 */
export function isOnboardingComplete(store: OnboardingStorageReader | null = getDefaultStore()): boolean {
  if (!store) return false;

  clearStaleCompleteFlag(store);
  return hasRequiredOnboardingKeys(store);
}

/**
 * Resolves where to send the user immediately after sign-in.
 * Complete profile → dashboard; otherwise continue existing onboarding.
 */
export function resolvePostLoginRedirect(store: OnboardingStorageReader | null = getDefaultStore()): string {
  return isOnboardingComplete(store) ? POST_LOGIN_DASHBOARD : POST_LOGIN_ONBOARDING;
}

/**
 * Route guard for /app/dashboard — incomplete onboarding must return to wizard.
 */
export function resolveDashboardEntryRedirect(
  store: OnboardingStorageReader | null = getDefaultStore(),
): string | null {
  return isOnboardingComplete(store) ? null : POST_LOGIN_ONBOARDING;
}

/** Mark onboarding as finished — call from profile step 4 after successful setup. */
export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

export { ONBOARDING_KEYS };
