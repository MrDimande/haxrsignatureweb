export const AYLLA_GIFTS_CONFIG = {
  slug: "babyaylla",
  registryKey: "baby-aylla-couture",
  eventId: "a0f6b5a9-4d8c-4501-81b6-52929fa9da38",
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
