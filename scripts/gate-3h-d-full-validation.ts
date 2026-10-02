/**
 * Retired after the HAXR-owned Neon/R2 cutover.
 *
 * The former script connected to legacy storage and Production endpoints. It
 * is intentionally disarmed so it cannot recreate a Supabase dependency or
 * perform an accidental production probe. Use Preview-only Neon/R2 checks.
 */
throw new Error(
  "gate-3h-d-full-validation is retired: use Preview-only Neon/R2 validation.",
);
