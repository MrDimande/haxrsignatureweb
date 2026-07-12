/**
 * Lógica pura para aplicar guest_duplicate_resolutions no import.
 */

export type DuplicateResolutionStatus =
  | "merged"
  | "ignored"
  | "restored"
  | "needs_review";

export type DuplicateResolutionMatchKind =
  | "fingerprint"
  | "email"
  | "phone"
  | "name"
  | "none";

export type DuplicateResolutionCandidate = {
  id: string;
  primaryGuestId: string;
  resolutionStatus: DuplicateResolutionStatus;
  matchKind: DuplicateResolutionMatchKind;
};

export type DuplicateResolutionImportPlan =
  | { type: "use_primary"; guestId: string; reason: string }
  | { type: "ignored"; reason: string }
  | { type: "needs_review"; reason: string }
  | { type: "primary_missing"; reason: string }
  | { type: "none" };

const MATCH_PRIORITY: Record<DuplicateResolutionMatchKind, number> = {
  fingerprint: 4,
  email: 3,
  phone: 2,
  name: 1,
  none: 0,
};

const STATUS_PRIORITY: Record<DuplicateResolutionStatus, number> = {
  merged: 4,
  restored: 3,
  needs_review: 2,
  ignored: 1,
};

export function pickBestDuplicateResolution(
  candidates: DuplicateResolutionCandidate[]
): DuplicateResolutionCandidate | null {
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => {
    const kindDiff = MATCH_PRIORITY[b.matchKind] - MATCH_PRIORITY[a.matchKind];
    if (kindDiff !== 0) return kindDiff;
    return STATUS_PRIORITY[b.resolutionStatus] - STATUS_PRIORITY[a.resolutionStatus];
  });

  return sorted[0] ?? null;
}

export function planDuplicateResolutionImport(
  resolution: DuplicateResolutionCandidate | null,
  primaryGuestExists: boolean
): DuplicateResolutionImportPlan {
  if (!resolution) return { type: "none" };

  switch (resolution.resolutionStatus) {
    case "ignored":
      return {
        type: "ignored",
        reason: "duplicate_resolution_ignored",
      };
    case "needs_review":
      return {
        type: "needs_review",
        reason: "duplicate_resolution_needs_review",
      };
    case "merged":
    case "restored": {
      if (!primaryGuestExists) {
        return {
          type: "primary_missing",
          reason: "primary_guest_missing",
        };
      }
      return {
        type: "use_primary",
        guestId: resolution.primaryGuestId,
        reason: "duplicate_resolution_merged",
      };
    }
    default: {
      const _exhaustive: never = resolution.resolutionStatus;
      void _exhaustive;
      return { type: "none" };
    }
  }
}

export function scoreResolutionMatch(input: {
  fingerprint: string;
  normalizedEmail: string;
  normalizedPhone: string;
  normalizedName: string;
  storedFingerprint: string | null;
  storedFingerprints?: string[] | null;
  storedEmail: string | null;
  storedPhone: string | null;
  storedNameNormalized: string | null;
}): DuplicateResolutionMatchKind {
  const allFingerprints = [
    input.storedFingerprint,
    ...(input.storedFingerprints ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));

  if (allFingerprints.includes(input.fingerprint)) {
    return "fingerprint";
  }

  if (
    input.normalizedEmail &&
    input.storedEmail &&
    input.normalizedEmail === input.storedEmail
  ) {
    return "email";
  }

  if (
    input.normalizedPhone &&
    input.storedPhone &&
    input.normalizedPhone.length >= 8 &&
    input.normalizedPhone === input.storedPhone
  ) {
    return "phone";
  }

  if (
    input.normalizedName &&
    input.storedNameNormalized &&
    input.normalizedName === input.storedNameNormalized
  ) {
    return "name";
  }

  return "none";
}
