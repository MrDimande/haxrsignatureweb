export type AyllaGiftReservationStatus = "reserved" | "purchased" | "delivered" | "cancelled";

export type AyllaGiftCoreOutcome =
  | "verification_required"
  | "verification_pending"
  | "verified"
  | "access_denied"
  | "registry_closed"
  | "item_unavailable"
  | "quantity_unconfirmed"
  | "reservation_confirmed"
  | "session_expired"
  | "service_unavailable"
  | "rate_limited";

export interface AyllaGiftReservationRecord {
  readonly id: string;
  readonly eventId: string;
  readonly giftId: string;
  readonly guestId: string;
  readonly quantity: number;
  readonly status: AyllaGiftReservationStatus;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CoreGuestRecord {
  readonly id: string;
  readonly eventId: string;
  readonly name: string;
  readonly contact: string;
  readonly status: "confirmed" | "declined" | "pending";
  readonly source: string;
  readonly archived: boolean;
  readonly deleted: boolean;
  readonly incorrect: boolean;
}

export interface CoreGiftInventoryRecord {
  readonly eventId: string;
  readonly registryKey: string;
  readonly itemId: string;
  readonly familyApproved: boolean;
  readonly enabled: boolean;
  readonly approvedQuantity: number | null;
  readonly specificationsComplete: boolean;
  readonly childSafetyValidated: boolean;
}

export interface CoreVerificationChallengeRecord {
  readonly id: string;
  readonly eventId: string;
  readonly guestId: string;
  readonly verifierHash: string;
  readonly expiresAt: Date;
  attempts: number;
  readonly maxAttempts: number;
  consumedAt: Date | null;
  sessionIssuedAt?: Date | null;
  readonly createdAt: Date;
}

export interface CoreGuestSessionRecord {
  readonly id: string;
  readonly eventId: string;
  readonly guestId: string;
  readonly secretHash: string;
  readonly challengeId?: string;
  readonly expiresAt: Date;
  revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface CoreReservationAuditRecord {
  readonly id: string;
  readonly reservationId: string;
  readonly eventId: string;
  readonly actorGuestId: string | null;
  readonly actorAdminId: string | null;
  readonly action: AyllaGiftReservationStatus;
  readonly previousStatus: AyllaGiftReservationStatus | null;
  readonly nextStatus: AyllaGiftReservationStatus;
  readonly reason: string | null;
  readonly createdAt: Date;
}

export interface CoreAdminSession {
  readonly id: string;
  readonly active: boolean;
  readonly permittedEventIds: readonly string[];
}

export interface CoreGiftStore {
  findGuestByContact(eventId: string, contact: string): Promise<CoreGuestRecord | null>;
  getGuestById(eventId: string, guestId: string): Promise<CoreGuestRecord | null>;
  createChallenge(challenge: CoreVerificationChallengeRecord): Promise<void>;
  getChallenge(challengeId: string): Promise<CoreVerificationChallengeRecord | null>;
  consumeChallenge(challengeId: string, now: Date): Promise<boolean>;
  incrementChallengeAttempts(challengeId: string): Promise<number>;
  verifyAndConsumeChallenge?(
    challengeId: string,
    verifierHash: string,
    now: Date
  ): Promise<{ consumed: boolean; eventId?: string; guestId?: string }>;
  createSession(session: CoreGuestSessionRecord): Promise<void>;
  getSession(sessionId: string): Promise<CoreGuestSessionRecord | null>;
  resolveSessionVerified?(input: {
    sessionId: string;
    secretProof: string;
  }): Promise<CoreGuestRecord | null>;
  revokeSession(sessionId: string, now: Date, secretProof?: string): Promise<void>;
  revokeSessionVerified?(input: {
    sessionId: string;
    secretProof: string;
    now?: Date;
  }): Promise<boolean>;
  getInventoryItem(eventId: string, itemId: string): Promise<CoreGiftInventoryRecord | null>;
  listInventory(eventId: string): Promise<readonly CoreGiftInventoryRecord[]>;
  getReservationsByItem(eventId: string, itemId: string): Promise<readonly AyllaGiftReservationRecord[]>;
  getReservationById(eventId: string, reservationId: string): Promise<AyllaGiftReservationRecord | null>;
  findReservationByIdempotency(eventId: string, guestId: string, idempotencyKey: string): Promise<AyllaGiftReservationRecord | null>;
  createReservation(reservation: AyllaGiftReservationRecord): Promise<void>;
  updateReservationStatus(reservationId: string, status: AyllaGiftReservationStatus, now: Date): Promise<void>;
  createAuditRecord(audit: CoreReservationAuditRecord): Promise<void>;
  transitionAdminVerified?(input: {
    eventId: string;
    reservationId: string;
    adminId: string;
    nextStatus: AyllaGiftReservationStatus;
    reason?: string;
  }): Promise<AyllaGiftReservationRecord>;
  reserveVerified(input: {
    sessionId: string;
    secretHash: string;
    itemId: string;
    quantity: number;
    idempotencyKey: string;
  }): Promise<AyllaGiftReservationRecord>;
  cancelVerified(input: {
    sessionId: string;
    secretHash: string;
    reservationId: string;
  }): Promise<AyllaGiftReservationRecord>;
}

export interface CoreDeliveryProvider {
  sendVerificationCode(contact: string, code: string, expiresAt: Date): Promise<boolean>;
}

export interface CoreRateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }>;
}
