import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { AYLLA_GIFTS_CONFIG } from "./config";
import type {
  AyllaGiftReservationRecord,
  AyllaGiftReservationStatus,
  CoreAdminSession,
  CoreDeliveryProvider,
  CoreGiftStore,
  CoreGuestRecord,
  CoreRateLimiter,
  CoreReservationAuditRecord,
} from "./types";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 20 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;
const MAX_VERIFIER_LENGTH = 256;

const ALLOWED_RESERVATION_TRANSITIONS: Readonly<Record<AyllaGiftReservationStatus, readonly AyllaGiftReservationStatus[]>> = {
  reserved: ["purchased", "cancelled"],
  purchased: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransitionAyllaGiftReservation(
  from: AyllaGiftReservationStatus,
  to: AyllaGiftReservationStatus
): boolean {
  return ALLOWED_RESERVATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface CoreAyllaGiftServiceConfig {
  readonly store: CoreGiftStore;
  readonly pepper: string;
  readonly rateLimiter?: CoreRateLimiter;
  readonly deliveryProvider?: CoreDeliveryProvider;
  readonly now?: () => Date;
  readonly tokenGenerator?: () => string;
}

function hashVerifier(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value).digest("base64url");
}

function safeCompareHashes(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  return leftBuf.length === rightBuf.length && timingSafeEqual(leftBuf, rightBuf);
}

function isEligibleGuest(guest: CoreGuestRecord | null): guest is CoreGuestRecord {
  return Boolean(
    guest &&
      guest.eventId === AYLLA_GIFTS_CONFIG.eventId &&
      guest.status === "confirmed" &&
      guest.source === "edition_rsvp" &&
      !guest.archived &&
      !guest.deleted &&
      !guest.incorrect
  );
}

function parseSessionToken(token: string): { sessionId: string; secret: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[1].length > MAX_VERIFIER_LENGTH) {
    return null;
  }
  return { sessionId: parts[0], secret: parts[1] };
}

export function createCoreAyllaGiftService(config: CoreAyllaGiftServiceConfig) {
  if (!config.pepper) {
    throw new Error("CoreAyllaGiftService: pepper is required for HMAC verifiers");
  }

  const { store, pepper } = config;
  const now = config.now ?? (() => new Date());
  const tokenGen = config.tokenGenerator ?? (() => randomBytes(32).toString("base64url"));

  async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    if (!config.rateLimiter) return true;
    const res = await config.rateLimiter.check(key, limit, windowMs);
    return res.allowed;
  }

  /**
   * 1. Request Verification Challenge
   * Anti-enumeration: always returns verification_pending.
   */
  async function requestVerification(
    contact: string,
    clientIp: string
  ): Promise<{ readonly outcome: "verification_pending" | "rate_limited" }> {
    const ipAllowed = await checkRateLimit(`rate:gift-verify-ip:${clientIp}`, 10, 60_000);
    const contactAllowed = await checkRateLimit(`rate:gift-verify-contact:${contact.trim().toLowerCase()}`, 5, 300_000);
    if (!ipAllowed || !contactAllowed) {
      return { outcome: "rate_limited" };
    }

    const normalizedContact = contact.trim().toLowerCase();
    const guest = await store.findGuestByContact(AYLLA_GIFTS_CONFIG.eventId, normalizedContact);

    if (isEligibleGuest(guest)) {
      const code = tokenGen();
      const currentTime = now();
      const expiresAt = new Date(currentTime.getTime() + CHALLENGE_TTL_MS);
      const challengeId = randomUUID();

      await store.createChallenge({
        id: challengeId,
        eventId: guest.eventId,
        guestId: guest.id,
        verifierHash: hashVerifier(code, pepper),
        expiresAt,
        attempts: 0,
        maxAttempts: MAX_CHALLENGE_ATTEMPTS,
        consumedAt: null,
        createdAt: currentTime,
      });

      if (config.deliveryProvider) {
        await config.deliveryProvider.sendVerificationCode(guest.contact, code, expiresAt);
      }
    }

    return { outcome: "verification_pending" };
  }

  /**
   * 2. Verify Challenge & Issue Session Token for Edition
   */
  async function verifyChallenge(
    challengeId: string,
    code: string,
    clientIp: string
  ): Promise<
    | { readonly outcome: "verified"; readonly sessionToken: string; readonly expiresAt: string }
    | { readonly outcome: "verification_required" | "rate_limited" }
  > {
    const ipAllowed = await checkRateLimit(`rate:challenge-verify-ip:${clientIp}`, 20, 60_000);
    if (!ipAllowed) return { outcome: "rate_limited" };

    if (!challengeId || !code || code.length > MAX_VERIFIER_LENGTH) {
      return { outcome: "verification_required" };
    }

    const challenge = await store.getChallenge(challengeId);
    const currentTime = now();

    if (!challenge || challenge.consumedAt !== null || challenge.expiresAt <= currentTime || challenge.attempts >= challenge.maxAttempts) {
      return { outcome: "verification_required" };
    }

    const presentedHash = hashVerifier(code, pepper);
    if (!safeCompareHashes(presentedHash, challenge.verifierHash)) {
      await store.incrementChallengeAttempts(challengeId);
      return { outcome: "verification_required" };
    }

    const consumed = await store.consumeChallenge(challengeId, currentTime);
    if (!consumed) {
      return { outcome: "verification_required" };
    }

    const guest = await store.getGuestById(challenge.eventId, challenge.guestId);
    if (!isEligibleGuest(guest)) {
      return { outcome: "verification_required" };
    }

    const sessionId = randomUUID();
    const secret = tokenGen();
    const sessionExpiresAt = new Date(currentTime.getTime() + SESSION_TTL_MS);

    await store.createSession({
      id: sessionId,
      eventId: guest.eventId,
      guestId: guest.id,
      secretHash: hashVerifier(secret, pepper),
      expiresAt: sessionExpiresAt,
      revokedAt: null,
      createdAt: currentTime,
    });

    return {
      outcome: "verified",
      sessionToken: `${sessionId}.${secret}`,
      expiresAt: sessionExpiresAt.toISOString(),
    };
  }

  /**
   * 3. Resolve Session Token from Edition
   */
  async function resolveSession(
    sessionToken: string
  ): Promise<
    | { readonly valid: true; readonly guest: CoreGuestRecord; readonly sessionId: string }
    | { readonly valid: false; readonly reason: "session_expired" | "access_denied" }
  > {
    const parsed = parseSessionToken(sessionToken);
    if (!parsed) return { valid: false, reason: "session_expired" };

    const session = await store.getSession(parsed.sessionId);
    const currentTime = now();

    if (!session || session.revokedAt !== null || session.expiresAt <= currentTime) {
      return { valid: false, reason: "session_expired" };
    }

    const presentedHash = hashVerifier(parsed.secret, pepper);
    if (!safeCompareHashes(presentedHash, session.secretHash)) {
      return { valid: false, reason: "session_expired" };
    }

    if (session.eventId !== AYLLA_GIFTS_CONFIG.eventId) {
      return { valid: false, reason: "access_denied" };
    }

    const guest = await store.getGuestById(session.eventId, session.guestId);
    if (!isEligibleGuest(guest)) {
      return { valid: false, reason: "access_denied" };
    }

    return { valid: true, guest, sessionId: session.id };
  }

  /**
   * 4. Revoke Session
   */
  async function revokeSession(sessionToken: string): Promise<boolean> {
    const auth = await resolveSession(sessionToken);
    if (!auth.valid) return false;
    await store.revokeSession(auth.sessionId, now());
    return true;
  }

  /**
   * 5. Reserve Gift (Fail-Closed Core Authority)
   */
  async function reserveGift(input: {
    readonly sessionToken: string;
    readonly itemId: string;
    readonly quantity: number;
    readonly idempotencyKey: string;
  }): Promise<
    | { readonly outcome: "reservation_confirmed"; readonly reservation: Pick<AyllaGiftReservationRecord, "id" | "giftId" | "quantity" | "status"> }
    | { readonly outcome: "registry_closed" | "access_denied" | "session_expired" | "item_unavailable" | "quantity_unconfirmed" | "service_unavailable" }
  > {
    // Primary fail-closed: catalog must be enabled
    if (!AYLLA_GIFTS_CONFIG.enabled) {
      return { outcome: "registry_closed" };
    }

    const auth = await resolveSession(input.sessionToken);
    if (!auth.valid) {
      return { outcome: auth.reason === "session_expired" ? "session_expired" : "access_denied" };
    }

    const { itemId, quantity, idempotencyKey } = input;

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return { outcome: "quantity_unconfirmed" };
    }

    const parsed = parseSessionToken(input.sessionToken);
    if (!parsed) return { outcome: "session_expired" };
    let reservationRecord: AyllaGiftReservationRecord;
    try {
      reservationRecord = await store.reserveVerified({
        sessionId: parsed.sessionId,
        secretHash: hashVerifier(parsed.secret, pepper),
        itemId,
        quantity,
        idempotencyKey,
      });
    } catch {
      return { outcome: "service_unavailable" };
    }

    return {
      outcome: "reservation_confirmed",
      reservation: {
        id: reservationRecord.id,
        giftId: reservationRecord.giftId,
        quantity: reservationRecord.quantity,
        status: reservationRecord.status,
      },
    };
  }

  /**
   * 6. Cancel Reservation
   */
  async function cancelReservation(input: {
    readonly sessionToken: string;
    readonly reservationId: string;
  }): Promise<
    | { readonly outcome: "reservation_confirmed"; readonly reservation: Pick<AyllaGiftReservationRecord, "id" | "giftId" | "quantity" | "status"> }
    | { readonly outcome: "access_denied" | "session_expired" }
  > {
    const auth = await resolveSession(input.sessionToken);
    if (!auth.valid) {
      return { outcome: auth.reason === "session_expired" ? "session_expired" : "access_denied" };
    }

    const parsed = parseSessionToken(input.sessionToken);
    if (!parsed) return { outcome: "session_expired" };
    let reservation: AyllaGiftReservationRecord;
    try {
      reservation = await store.cancelVerified({
        sessionId: parsed.sessionId,
        secretHash: hashVerifier(parsed.secret, pepper),
        reservationId: input.reservationId,
      });
    } catch {
      return { outcome: "access_denied" };
    }

    return {
      outcome: "reservation_confirmed",
      reservation: {
        id: reservation.id,
        giftId: reservation.giftId,
        quantity: reservation.quantity,
        status: reservation.status,
      },
    };
  }

  /**
   * 7. Admin State Transition
   */
  async function adminTransition(
    admin: CoreAdminSession | null,
    eventId: string,
    reservationId: string,
    nextStatus: AyllaGiftReservationStatus,
    reason?: string
  ): Promise<
    | { readonly ok: true; readonly reservationId: string; readonly newStatus: AyllaGiftReservationStatus }
    | { readonly ok: false; readonly reason: "access_denied" | "invalid_transition" | "reservation_not_found" }
  > {
    if (!admin || !admin.active || eventId !== AYLLA_GIFTS_CONFIG.eventId || !admin.permittedEventIds.includes(eventId)) {
      return { ok: false, reason: "access_denied" };
    }

    const reservation = await store.getReservationById(eventId, reservationId);
    if (!reservation) {
      return { ok: false, reason: "reservation_not_found" };
    }

    if (!canTransitionAyllaGiftReservation(reservation.status, nextStatus)) {
      return { ok: false, reason: "invalid_transition" };
    }

    if (store.transitionAdminVerified) {
      try {
        const updated = await store.transitionAdminVerified({
          eventId,
          reservationId,
          adminId: admin.id,
          nextStatus,
          reason,
        });
        return { ok: true, reservationId: updated.id, newStatus: updated.status };
      } catch {
        return { ok: false, reason: "invalid_transition" };
      }
    }

    const currentTime = now();
    await store.updateReservationStatus(reservationId, nextStatus, currentTime);

    const auditRecord: CoreReservationAuditRecord = {
      id: randomUUID(),
      reservationId,
      eventId,
      actorGuestId: null,
      actorAdminId: admin.id,
      action: nextStatus,
      previousStatus: reservation.status,
      nextStatus,
      reason: reason ?? null,
      createdAt: currentTime,
    };
    await store.createAuditRecord(auditRecord);

    return { ok: true, reservationId, newStatus: nextStatus };
  }

  return {
    requestVerification,
    verifyChallenge,
    resolveSession,
    revokeSession,
    reserveGift,
    cancelReservation,
    adminTransition,
  };
}
