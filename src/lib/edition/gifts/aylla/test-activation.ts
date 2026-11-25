import { AYLLA_GIFTS_CONFIG } from "./config";

/**
 * Strictly fail-closed isolated test activation for Gate D / Playwright E2E.
 * Never activates in Vercel Production and requires explicit dual opt-in flags
 * alongside the synthetic OTP delivery barrier.
 */
export function isAyllaTestActivationEnabled(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const publicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV?.trim().toLowerCase();
  const targetEnv = process.env.VERCEL_TARGET_ENV?.trim().toLowerCase();

  if (
    vercelEnv === "production" ||
    publicVercelEnv === "production" ||
    targetEnv === "production"
  ) {
    return false;
  }

  return (
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION === "true" &&
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY === "true"
  );
}

/**
 * Operational authority check for Baby Aylla Gift Registry.
 * Opens ONLY when canonical public config is enabled OR isolated
 * non-production staging test activation is explicitly turned on.
 */
export function isAyllaGiftRegistryOperational(): boolean {
  return AYLLA_GIFTS_CONFIG.enabled || isAyllaTestActivationEnabled();
}
