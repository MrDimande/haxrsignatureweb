import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { timingSafeEqual } from "@/lib/security/timing-safe";
import {
  getSupabaseJwtProjectRef,
  getSupabaseProjectRef,
  SUPABASE_PRODUCTION_PROJECT_REF,
} from "@/lib/supabase/config";

export const EDITION_RSVP_WRITES_DISABLED_CODE =
  "edition_rsvp_writes_disabled" as const;

const DATABASE_MIGRATION_BRANCH = "migration/supabase-to-neon";

export type EditionRsvpWriteMode =
  | "disabled"
  | "preview_clone"
  | "preview_neon"
  | "production";

export type EditionRsvpWriteGateReason =
  | "mode_disabled"
  | "mode_unknown"
  | "production_runtime"
  | "not_preview"
  | "migration_branch_required"
  | "neon_database_unavailable"
  | "not_production"
  | "url_unresolved"
  | "production_ref"
  | "allowed_ref_unset"
  | "ref_mismatch"
  | "service_role_ref_mismatch"
  | "proxy_secret_unset"
  | "proxy_secret_missing"
  | "proxy_secret_invalid"
  | "production_allowlist_unset"
  | "production_slug_required"
  | "production_slug_denied";

export type EditionRsvpWriteGateDecision =
  | { allowed: true; mode: "preview_clone" | "preview_neon" | "production" }
  | {
      allowed: false;
      mode: EditionRsvpWriteMode | "unknown";
      reason: EditionRsvpWriteGateReason;
    };

const CLONE_REF_FOR_DOCS = "rkkxfrwtmsqzpnbkshnd";

/** Documented clone rehearsal ref — not used as implicit allowlist. */
export const EDITION_RSVP_CLONE_REF_DOCUMENTATION_ONLY = CLONE_REF_FOR_DOCS;

export function resolveEditionRsvpWriteMode(
  raw: string | undefined = process.env.HAXR_EDITION_RSVP_WRITE_MODE
): EditionRsvpWriteMode | "unknown" {
  const value = raw?.trim().toLowerCase();
  if (!value || value === "disabled") return "disabled";
  if (value === "preview_clone") return "preview_clone";
  if (value === "preview_neon") return "preview_neon";
  if (value === "production") return "production";
  return "unknown";
}

export function isEditionRsvpProductionRuntime(options?: {
  vercelEnv?: string | undefined;
  nodeEnv?: string | undefined;
}): boolean {
  const vercelEnv = (
    options?.vercelEnv ?? process.env.VERCEL_ENV
  )?.trim().toLowerCase();
  if (vercelEnv === "production") return true;

  // Vercel Preview/Production set VERCEL_ENV; bare NODE_ENV=production on
  // Vercel Preview must not alone disable writes — VERCEL_ENV is authoritative.
  if (vercelEnv === "preview" || vercelEnv === "development") return false;

  const nodeEnv = (
    options?.nodeEnv ?? process.env.NODE_ENV
  )?.trim().toLowerCase();
  return nodeEnv === "production";
}

function readAllowedSupabaseRef(
  raw: string | undefined = process.env.HAXR_EDITION_RSVP_ALLOWED_SUPABASE_REF
): string | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (!/^[a-z0-9]{10,40}$/.test(value)) return null;
  return value;
}

/**
 * Parse Production RSVP slug allowlist (comma-separated).
 * Empty / whitespace-only input → empty list (caller must deny).
 */
export function parseProductionAllowedSlugs(
  raw: string | undefined = process.env
    .HAXR_EDITION_RSVP_PRODUCTION_ALLOWED_SLUGS
): string[] {
  if (raw === undefined || raw === null) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return trimmed
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);
}

function readConfiguredProxySecret(
  raw: string | undefined = process.env.HAXR_EDITION_PROXY_SECRET
): string | null {
  const value = raw?.trim();
  return value ? value : null;
}

function evaluateProductionWriteGate(options?: {
  vercelEnv?: string | undefined;
  configuredProxySecret?: string | undefined;
  presentedProxySecret?: string | undefined;
  productionAllowedSlugs?: string | undefined;
  resolvedSlug?: string | null | undefined;
}): EditionRsvpWriteGateDecision {
  const vercelEnv = (
    options?.vercelEnv ?? process.env.VERCEL_ENV
  )?.trim().toLowerCase();

  if (vercelEnv !== "production") {
    return {
      allowed: false,
      mode: "production",
      reason: "not_production",
    };
  }

  const configured = readConfiguredProxySecret(options?.configuredProxySecret);
  if (!configured) {
    return {
      allowed: false,
      mode: "production",
      reason: "proxy_secret_unset",
    };
  }

  const presented = options?.presentedProxySecret?.trim() ?? "";
  if (!presented) {
    return {
      allowed: false,
      mode: "production",
      reason: "proxy_secret_missing",
    };
  }

  if (!timingSafeEqual(presented, configured)) {
    return {
      allowed: false,
      mode: "production",
      reason: "proxy_secret_invalid",
    };
  }

  const hasAllowlistOption =
    options !== undefined &&
    Object.prototype.hasOwnProperty.call(options, "productionAllowedSlugs");
  const allowlistRaw = hasAllowlistOption
    ? options.productionAllowedSlugs
    : process.env.HAXR_EDITION_RSVP_PRODUCTION_ALLOWED_SLUGS;
  if (allowlistRaw === undefined || allowlistRaw === null) {
    return {
      allowed: false,
      mode: "production",
      reason: "production_allowlist_unset",
    };
  }

  const allowlist = parseProductionAllowedSlugs(allowlistRaw);
  if (allowlist.length === 0) {
    return {
      allowed: false,
      mode: "production",
      reason: "production_allowlist_unset",
    };
  }

  const resolved = options?.resolvedSlug?.trim().toLowerCase() ?? "";
  if (!resolved) {
    return {
      allowed: false,
      mode: "production",
      reason: "production_slug_required",
    };
  }

  if (!allowlist.includes(resolved)) {
    return {
      allowed: false,
      mode: "production",
      reason: "production_slug_denied",
    };
  }

  return { allowed: true, mode: "production" };
}

function resolveVercelGitCommitRef(raw?: string): string {
  return (raw ?? process.env.VERCEL_GIT_COMMIT_REF)?.trim() ?? "";
}

function isMigrationPreview(options?: {
  vercelEnv?: string | undefined;
  vercelGitCommitRef?: string | undefined;
}): boolean {
  const vercelEnv = (
    options?.vercelEnv ?? process.env.VERCEL_ENV
  )?.trim().toLowerCase();
  return (
    vercelEnv === "preview" &&
    resolveVercelGitCommitRef(options?.vercelGitCommitRef) ===
      DATABASE_MIGRATION_BRANCH
  );
}

function evaluatePreviewNeonWriteGate(options?: {
  vercelEnv?: string | undefined;
  nodeEnv?: string | undefined;
  vercelGitCommitRef?: string | undefined;
  neonDatabaseEnabled?: boolean | undefined;
}): EditionRsvpWriteGateDecision {
  if (
    isEditionRsvpProductionRuntime({
      vercelEnv: options?.vercelEnv,
      nodeEnv: options?.nodeEnv,
    })
  ) {
    return {
      allowed: false,
      mode: "preview_neon",
      reason: "production_runtime",
    };
  }

  const vercelEnv = (
    options?.vercelEnv ?? process.env.VERCEL_ENV
  )?.trim().toLowerCase();
  if (vercelEnv !== "preview") {
    return { allowed: false, mode: "preview_neon", reason: "not_preview" };
  }

  if (
    resolveVercelGitCommitRef(options?.vercelGitCommitRef) !==
    DATABASE_MIGRATION_BRANCH
  ) {
    return {
      allowed: false,
      mode: "preview_neon",
      reason: "migration_branch_required",
    };
  }

  const neonDatabaseEnabled =
    options?.neonDatabaseEnabled ?? shouldUseNeonServerDatabase();
  if (!neonDatabaseEnabled) {
    return {
      allowed: false,
      mode: "preview_neon",
      reason: "neon_database_unavailable",
    };
  }

  return { allowed: true, mode: "preview_neon" };
}

/**
 * Fail-closed gate for Edition RSVP persistence.
 * Must run after Bearer auth and before any guests SELECT/INSERT/UPDATE/RPC.
 *
 * Migration behavior:
 * - Existing Preview clone rehearsals remain unchanged on all other branches.
 * - On the exact Supabase→Neon migration Preview branch, an existing
 *   preview_clone operator intent is promoted to preview_neon and must prove
 *   that the Neon server database is actually active. If DATABASE_URL/Neon is
 *   unavailable, writes fail closed instead of silently falling back to the
 *   legacy Supabase clone.
 */
export function evaluateEditionRsvpWriteGate(options?: {
  writeMode?: string | undefined;
  allowedRef?: string | undefined;
  supabaseUrl?: string | undefined;
  serviceRoleKey?: string | undefined;
  vercelEnv?: string | undefined;
  nodeEnv?: string | undefined;
  vercelGitCommitRef?: string | undefined;
  neonDatabaseEnabled?: boolean | undefined;
  configuredProxySecret?: string | undefined;
  presentedProxySecret?: string | undefined;
  productionAllowedSlugs?: string | undefined;
  /** Canonical Edition slug (already resolved). Never the raw payload alias alone. */
  resolvedSlug?: string | null | undefined;
}): EditionRsvpWriteGateDecision {
  const configuredMode = resolveEditionRsvpWriteMode(options?.writeMode);
  const mode =
    configuredMode === "preview_clone" &&
    isMigrationPreview({
      vercelEnv: options?.vercelEnv,
      vercelGitCommitRef: options?.vercelGitCommitRef,
    })
      ? "preview_neon"
      : configuredMode;

  if (mode === "disabled") {
    return { allowed: false, mode: "disabled", reason: "mode_disabled" };
  }

  if (mode === "unknown") {
    return { allowed: false, mode: "unknown", reason: "mode_unknown" };
  }

  if (mode === "production") {
    return evaluateProductionWriteGate(options);
  }

  if (mode === "preview_neon") {
    return evaluatePreviewNeonWriteGate(options);
  }

  // mode === preview_clone
  if (
    isEditionRsvpProductionRuntime({
      vercelEnv: options?.vercelEnv,
      nodeEnv: options?.nodeEnv,
    })
  ) {
    return {
      allowed: false,
      mode: "preview_clone",
      reason: "production_runtime",
    };
  }

  const vercelEnv = (
    options?.vercelEnv ?? process.env.VERCEL_ENV
  )?.trim().toLowerCase();
  if (vercelEnv !== "preview") {
    return { allowed: false, mode: "preview_clone", reason: "not_preview" };
  }

  const urlRef = getSupabaseProjectRef(
    options?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.toLowerCase();
  if (!urlRef) {
    return { allowed: false, mode: "preview_clone", reason: "url_unresolved" };
  }

  if (urlRef === SUPABASE_PRODUCTION_PROJECT_REF) {
    return { allowed: false, mode: "preview_clone", reason: "production_ref" };
  }

  const allowed = readAllowedSupabaseRef(options?.allowedRef);
  if (!allowed) {
    return {
      allowed: false,
      mode: "preview_clone",
      reason: "allowed_ref_unset",
    };
  }

  if (allowed === SUPABASE_PRODUCTION_PROJECT_REF) {
    return { allowed: false, mode: "preview_clone", reason: "production_ref" };
  }

  if (urlRef !== allowed) {
    return { allowed: false, mode: "preview_clone", reason: "ref_mismatch" };
  }

  const serviceKey =
    options?.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceRef = getSupabaseJwtProjectRef(serviceKey)?.toLowerCase();
  if (serviceRef && serviceRef !== urlRef) {
    return {
      allowed: false,
      mode: "preview_clone",
      reason: "service_role_ref_mismatch",
    };
  }
  if (serviceRef === SUPABASE_PRODUCTION_PROJECT_REF) {
    return { allowed: false, mode: "preview_clone", reason: "production_ref" };
  }

  return { allowed: true, mode: "preview_clone" };
}

export function editionRsvpWritesDisabledResponse(): {
  success: false;
  error: string;
  code: typeof EDITION_RSVP_WRITES_DISABLED_CODE;
} {
  return {
    success: false,
    error:
      "Gravação de RSVP Edition temporariamente indisponível. Tente novamente mais tarde.",
    code: EDITION_RSVP_WRITES_DISABLED_CODE,
  };
}
