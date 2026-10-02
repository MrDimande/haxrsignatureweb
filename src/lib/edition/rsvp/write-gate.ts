import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { timingSafeEqual } from "@/lib/security/timing-safe";

export const EDITION_RSVP_WRITES_DISABLED_CODE = "edition_rsvp_writes_disabled" as const;

export type EditionRsvpWriteMode = "disabled" | "preview_neon" | "production";
export type EditionRsvpWriteGateReason =
  | "mode_disabled"
  | "mode_unknown"
  | "production_runtime"
  | "not_preview"
  | "neon_database_unavailable"
  | "not_production"
  | "proxy_secret_unset"
  | "proxy_secret_missing"
  | "proxy_secret_invalid"
  | "production_allowlist_unset"
  | "production_slug_required"
  | "production_slug_denied";

export type EditionRsvpWriteGateDecision =
  | { allowed: true; mode: "preview_neon" | "production" }
  | { allowed: false; mode: EditionRsvpWriteMode | "unknown"; reason: EditionRsvpWriteGateReason };

export function resolveEditionRsvpWriteMode(
  raw: string | undefined = process.env.HAXR_EDITION_RSVP_WRITE_MODE,
): EditionRsvpWriteMode | "unknown" {
  const value = raw?.trim().toLowerCase();
  if (!value || value === "disabled") return "disabled";
  if (value === "preview_neon") return "preview_neon";
  if (value === "production") return "production";
  return "unknown";
}

export function isEditionRsvpProductionRuntime(options?: {
  vercelEnv?: string;
  nodeEnv?: string;
}): boolean {
  const vercelEnv = (options?.vercelEnv ?? process.env.VERCEL_ENV)?.trim().toLowerCase();
  if (vercelEnv === "production") return true;
  if (vercelEnv === "preview" || vercelEnv === "development") return false;
  return (options?.nodeEnv ?? process.env.NODE_ENV)?.trim().toLowerCase() === "production";
}

export function parseProductionAllowedSlugs(
  raw: string | undefined = process.env.HAXR_EDITION_RSVP_PRODUCTION_ALLOWED_SLUGS,
): string[] {
  return raw?.trim().split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) ?? [];
}

function evaluatePreviewWriteGate(options?: {
  vercelEnv?: string;
  nodeEnv?: string;
  neonDatabaseEnabled?: boolean;
}): EditionRsvpWriteGateDecision {
  if (isEditionRsvpProductionRuntime(options)) {
    return { allowed: false, mode: "preview_neon", reason: "production_runtime" };
  }
  if ((options?.vercelEnv ?? process.env.VERCEL_ENV)?.trim().toLowerCase() !== "preview") {
    return { allowed: false, mode: "preview_neon", reason: "not_preview" };
  }
  if (!(options?.neonDatabaseEnabled ?? shouldUseNeonServerDatabase())) {
    return { allowed: false, mode: "preview_neon", reason: "neon_database_unavailable" };
  }
  return { allowed: true, mode: "preview_neon" };
}

function evaluateProductionWriteGate(options?: {
  vercelEnv?: string;
  configuredProxySecret?: string;
  presentedProxySecret?: string;
  productionAllowedSlugs?: string;
  resolvedSlug?: string | null;
}): EditionRsvpWriteGateDecision {
  if ((options?.vercelEnv ?? process.env.VERCEL_ENV)?.trim().toLowerCase() !== "production") {
    return { allowed: false, mode: "production", reason: "not_production" };
  }
  const configured = (options?.configuredProxySecret ?? process.env.HAXR_EDITION_PROXY_SECRET)?.trim();
  if (!configured) return { allowed: false, mode: "production", reason: "proxy_secret_unset" };
  const presented = options?.presentedProxySecret?.trim();
  if (!presented) return { allowed: false, mode: "production", reason: "proxy_secret_missing" };
  if (!timingSafeEqual(presented, configured)) {
    return { allowed: false, mode: "production", reason: "proxy_secret_invalid" };
  }
  const allowlist = parseProductionAllowedSlugs(
    options?.productionAllowedSlugs ?? process.env.HAXR_EDITION_RSVP_PRODUCTION_ALLOWED_SLUGS,
  );
  if (!allowlist.length) return { allowed: false, mode: "production", reason: "production_allowlist_unset" };
  const slug = options?.resolvedSlug?.trim().toLowerCase();
  if (!slug) return { allowed: false, mode: "production", reason: "production_slug_required" };
  if (!allowlist.includes(slug)) return { allowed: false, mode: "production", reason: "production_slug_denied" };
  return { allowed: true, mode: "production" };
}

/** Fail-closed gate for the Neon-backed Edition RSVP persistence path. */
export function evaluateEditionRsvpWriteGate(options?: {
  writeMode?: string;
  vercelEnv?: string;
  nodeEnv?: string;
  neonDatabaseEnabled?: boolean;
  configuredProxySecret?: string;
  presentedProxySecret?: string;
  productionAllowedSlugs?: string;
  resolvedSlug?: string | null;
}): EditionRsvpWriteGateDecision {
  const mode = resolveEditionRsvpWriteMode(options?.writeMode);
  if (mode === "disabled") return { allowed: false, mode, reason: "mode_disabled" };
  if (mode === "unknown") return { allowed: false, mode, reason: "mode_unknown" };
  return mode === "preview_neon"
    ? evaluatePreviewWriteGate(options)
    : evaluateProductionWriteGate(options);
}

export function editionRsvpWritesDisabledResponse(): {
  success: false;
  error: string;
  code: typeof EDITION_RSVP_WRITES_DISABLED_CODE;
} {
  return {
    success: false,
    error: "Gravação de RSVP Edition temporariamente indisponível. Tente novamente mais tarde.",
    code: EDITION_RSVP_WRITES_DISABLED_CODE,
  };
}
