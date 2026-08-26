const MIGRATION_BRANCH = "migration/supabase-to-neon";

export function shouldUseNeonAuthInBrowser(): boolean {
  if (
    process.env.NEXT_PUBLIC_HAXR_AUTH_PROVIDER?.trim().toLowerCase() !== "neon"
  ) {
    return false;
  }

  const buildRef = process.env.NEXT_PUBLIC_HAXR_GIT_COMMIT_REF?.trim();

  // Vercel builds carry a public, non-secret branch marker injected by
  // next.config.ts. If present, Neon Auth is allowed only on the isolated
  // migration branch. Local deliberate testing can still opt in explicitly.
  return !buildRef || buildRef === MIGRATION_BRANCH;
}
