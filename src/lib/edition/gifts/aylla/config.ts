export const CANONICAL_BABY_AYLLA_EVENT_ID = "a0f6b5a9-4d8c-4501-81b6-52929fa9da38";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CANARY_BABY_AYLLA_EVENT_ID = "cc608a8d-3cb9-47f0-955d-8d1be3f30faf";

/**
 * Resolves the active Baby Aylla event UUID safely across environments.
 * Rejects canary archive UUIDs and malformed values, defaulting strictly
 * to the canonical production/staging event identity.
 */
export function resolveAyllaGiftEventId(
  env: Readonly<Record<string, string | undefined>> = process.env
): string {
  const candidates = [
    env.EDITION_EVENT_BABY_AYLLA_BIRTHDAY_ID,
    env.EDITION_EVENT_AYLLA_ID,
    env.HAXR_AYLLA_GIFT_EVENT_ID,
  ];
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    if (!UUID_PATTERN.test(trimmed)) {
      throw new Error("Baby Aylla event ID override must be a valid UUID.");
    }
    if (trimmed.toLowerCase() === CANARY_BABY_AYLLA_EVENT_ID) {
      throw new Error("Refusing deprecated canary archive event ID for Baby Aylla Gift Registry.");
    }
    return trimmed.toLowerCase();
  }
  return CANONICAL_BABY_AYLLA_EVENT_ID;
}

export const AYLLA_GIFTS_CONFIG = {
  slug: "babyaylla",
  registryKey: "baby-aylla-couture",
  get eventId(): string {
    return resolveAyllaGiftEventId();
  },
  businessId: "haxr-signature",
  enabled: false,
  requireConfirmedRsvp: true,
  requireVerifiedIdentity: true,
  allowDraftReservations: false,
  allowPublicReservationNames: false,
} as const;

export type BabyAyllaGiftInvitationStatus = "draft" | "active" | "archived";

export function canBabyAyllaGiftRegistryReserve(input: {
  invitationStatus: BabyAyllaGiftInvitationStatus;
}): boolean {
  return (
    AYLLA_GIFTS_CONFIG.enabled &&
    (input.invitationStatus === "active" ||
      (input.invitationStatus === "draft" && AYLLA_GIFTS_CONFIG.allowDraftReservations))
  );
}
