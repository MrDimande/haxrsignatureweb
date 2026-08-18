import {
  getSupabaseJwtProjectRef,
  getSupabaseProjectRef,
  SUPABASE_PRODUCTION_PROJECT_REF,
} from "@/lib/supabase/config";

export const EDITION_RSVP_WRITES_DISABLED_CODE =
  "edition_rsvp_writes_disabled" as const;

export type EditionRsvpWriteMode = "disabled" | "preview_clone";

export type EditionRsvpWriteGateReason =
  | "mode_disabled"
  | "mode_unknown"
  | "production_runtime"
  | "not_preview"
  | "url_unresolved"
  | "production_ref"
  | "allowed_ref_unset"
  | "ref_mismatch"
  | "service_role_ref_mismatch";

export type EditionRsvpWriteGateDecision =
  | { allowed: true; mode: "preview_clone" }
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
 * Fail-closed gate for Edition RSVP persistence.
 * Must run after Bearer auth and before any guests SELECT/INSERT/UPDATE/RPC.
 */
export function evaluateEditionRsvpWriteGate(options?: {
  writeMode?: string | undefined;
  allowedRef?: string | undefined;
  supabaseUrl?: string | undefined;
  serviceRoleKey?: string | undefined;
  vercelEnv?: string | undefined;
  nodeEnv?: string | undefined;
}): EditionRsvpWriteGateDecision {
  const mode = resolveEditionRsvpWriteMode(options?.writeMode);

  if (mode === "disabled") {
    return { allowed: false, mode: "disabled", reason: "mode_disabled" };
  }

  if (mode === "unknown") {
    return { allowed: false, mode: "unknown", reason: "mode_unknown" };
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
