import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { AYLLA_GIFTS_CONFIG } from "./config";
import { normalizeAyllaContactForLookup } from "./otp-delivery";
import { isAyllaGiftRegistryOperational } from "./test-activation";
import { logAyllaTrace } from "./trace";
import type {
  AyllaCatalogAvailabilitySnapshot,
  AyllaGiftAvailabilityItem,
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

function classifyReserveStoreError(
  error: unknown
): "item_unavailable" | "quantity_unconfirmed" | "session_expired" | "access_denied" | "service_unavailable" {
  const code = typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    code === "23514" ||
    message.includes("gift quantity unavailable") ||
    message.includes("gift item is not reservable") ||
    message.includes("registry key mismatch") ||
    message.includes("idempotency key conflicts")
  ) {
    return "item_unavailable";
  }
  if (code === "22023" || message.includes("invalid reservation quantity")) {
    return "quantity_unconfirmed";
  }
  if (message.includes("verified guest session required")) {
    return "session_expired";
  }
  if (code === "42501" || message.includes("guest is not eligible")) {
    return "access_denied";
  }
  return "service_unavailable";
}

function classifyCancelStoreError(error: unknown): "session_expired" | "access_denied" {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("verified guest session required")) {
    return "session_expired";
  }
  return "access_denied";
}

export function createCoreAyllaGiftService(config: CoreAyllaGiftServiceConfig) {
  if (!config.pepper) {
    throw new Error("CoreAyllaGiftService: pepper is required for HMAC verifiers");
  }

  const { store, pepper } = config;
  const now = config.now ?? (() => new Date());
  const otpGen = config.tokenGenerator ?? (() => String(randomInt(0, 1_000_000)).padStart(6, "0"));
  const secretGen = config.tokenGenerator ?? (() => randomBytes(32).toString("base64url"));

  async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    if (!config.rateLimiter) {
      logAyllaTrace("rate_limit_skip");
      return true;
    }
    const bucketScope = key.split(":").slice(0, 2).join(":");
    logAyllaTrace("rate_limit_enter", { bucketScope });
    const res = await config.rateLimiter.check(key, limit, windowMs);
    logAyllaTrace("rate_limit_exit", { bucketScope, allowed: res.allowed });
    return res.allowed;
  }

  /**
   * 1. Request Verification Challenge
   * Anti-enumeration: always returns verification_pending with an opaque challengeId.
   */
  async function requestVerification(
    contact: string,
    clientIp: string
  ): Promise<
    | { readonly outcome: "verification_pending"; readonly challengeId: string }
    | { readonly outcome: "rate_limited" }
  > {
    const normalizedContact = normalizeAyllaContactForLookup(contact);
    const ipAllowed = await checkRateLimit(`rate:gift-verify-ip:${clientIp}`, 10, 60_000);
    const contactAllowed = await checkRateLimit(`rate:gift-verify-contact:${normalizedContact}`, 5, 300_000);
    if (!ipAllowed || !contactAllowed) {
      return { outcome: "rate_limited" };
    }

    const challengeId = randomUUID();
    const guest = await store.findGuestByContact(AYLLA_GIFTS_CONFIG.eventId, normalizedContact);

    if (isEligibleGuest(guest)) {
      const code = otpGen();
      const currentTime = now();
      const expiresAt = new Date(currentTime.getTime() + CHALLENGE_TTL_MS);

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

    return { outcome: "verification_pending", challengeId };
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

    const normalizedCode = typeof code === "string" ? code.trim() : "";
    if (!challengeId || !normalizedCode || normalizedCode.length > MAX_VERIFIER_LENGTH) {
      return { outcome: "verification_required" };
    }

    const currentTime = now();
    const presentedHash = hashVerifier(normalizedCode, pepper);

    let eventId: string;
    let guestId: string;

    if (store.verifyAndConsumeChallenge) {
      const consumedResult = await store.verifyAndConsumeChallenge(challengeId, presentedHash, currentTime);
      if (!consumedResult.consumed || !consumedResult.eventId || !consumedResult.guestId) {
        return { outcome: "verification_required" };
      }
      eventId = consumedResult.eventId;
      guestId = consumedResult.guestId;
    } else {
      const challenge = await store.getChallenge(challengeId);
      if (!challenge || challenge.consumedAt !== null || challenge.expiresAt <= currentTime || challenge.attempts >= challenge.maxAttempts) {
        return { outcome: "verification_required" };
      }

      if (!safeCompareHashes(presentedHash, challenge.verifierHash)) {
        await store.incrementChallengeAttempts(challengeId);
        return { outcome: "verification_required" };
      }

      const consumed = await store.consumeChallenge(challengeId, currentTime);
      if (!consumed) {
        return { outcome: "verification_required" };
      }
      eventId = challenge.eventId;
      guestId = challenge.guestId;
    }

    const guest = await store.getGuestById(eventId, guestId);
    if (!isEligibleGuest(guest)) {
      return { outcome: "verification_required" };
    }

    const sessionId = randomUUID();
    const secret = secretGen();
    const sessionExpiresAt = new Date(currentTime.getTime() + SESSION_TTL_MS);

    await store.createSession({
      id: sessionId,
      eventId: guest.eventId,
      guestId: guest.id,
      secretHash: hashVerifier(secret, pepper),
      challengeId,
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

    const secretProof = hashVerifier(parsed.secret, pepper);

    if (store.resolveSessionVerified) {
      const guest = await store.resolveSessionVerified({
        sessionId: parsed.sessionId,
        secretProof,
      });
      if (!guest) {
        return { valid: false, reason: "session_expired" };
      }
      if (guest.eventId !== AYLLA_GIFTS_CONFIG.eventId) {
        return { valid: false, reason: "access_denied" };
      }
      if (!isEligibleGuest(guest)) {
        return { valid: false, reason: "access_denied" };
      }
      return { valid: true, guest, sessionId: parsed.sessionId };
    }

    const session = await store.getSession(parsed.sessionId);
    const currentTime = now();

    if (!session || session.revokedAt !== null || session.expiresAt <= currentTime) {
      return { valid: false, reason: "session_expired" };
    }

    if (!safeCompareHashes(secretProof, session.secretHash)) {
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
    const parsed = parseSessionToken(sessionToken);
    if (!parsed) return false;
    const secretProof = hashVerifier(parsed.secret, pepper);

    if (store.revokeSessionVerified) {
      return await store.revokeSessionVerified({
        sessionId: parsed.sessionId,
        secretProof,
        now: now(),
      });
    }

    const auth = await resolveSession(sessionToken);
    if (!auth.valid) return false;
    await store.revokeSession(auth.sessionId, now(), secretProof);
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
    const startedAt = Date.now();
    logAyllaTrace("service_reserve_start", { itemId: input.itemId, quantity: input.quantity });
    // Primary fail-closed: catalog must be enabled (or isolated test activation in non-production)
    if (!isAyllaGiftRegistryOperational()) {
      logAyllaTrace("service_reserve_end", { outcome: "registry_closed", durationMs: Date.now() - startedAt });
      return { outcome: "registry_closed" };
    }

    const auth = await resolveSession(input.sessionToken);
    logAyllaTrace("service_reserve_session_checked", {
      valid: auth.valid,
      reason: auth.valid ? "ok" : auth.reason,
      durationMs: Date.now() - startedAt,
    });
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
      const rpcStartedAt = Date.now();
      reservationRecord = await store.reserveVerified({
        sessionId: parsed.sessionId,
        secretHash: hashVerifier(parsed.secret, pepper),
        itemId,
        quantity,
        idempotencyKey,
      });
      logAyllaTrace("service_reserve_end", {
        outcome: "reservation_confirmed",
        rpcDurationMs: Date.now() - rpcStartedAt,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const classified = classifyReserveStoreError(error);
      logAyllaTrace("service_reserve_end", {
        outcome: classified,
        durationMs: Date.now() - startedAt,
      });
      return { outcome: classified };
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
    const startedAt = Date.now();
    logAyllaTrace("service_cancel_start");
    const auth = await resolveSession(input.sessionToken);
    if (!auth.valid) {
      logAyllaTrace("service_cancel_end", { outcome: auth.reason, durationMs: Date.now() - startedAt });
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
      logAyllaTrace("service_cancel_end", {
        outcome: "reservation_confirmed",
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const outcome = classifyCancelStoreError(error);
      logAyllaTrace("service_cancel_end", { outcome, durationMs: Date.now() - startedAt });
      return { outcome };
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
   * 6.5. Catalog Availability & Authenticated Guest Reservations Snapshot
   */
  async function getCatalogAvailability(
    sessionToken?: string | null
  ): Promise<AyllaCatalogAvailabilitySnapshot> {
    if (!isAyllaGiftRegistryOperational()) {
      return {
        registryEnabled: false,
        items: [],
        myReservations: [],
      };
    }

    const eventId = AYLLA_GIFTS_CONFIG.eventId;
    const inventory = await store.listInventory(eventId);
    const reservedByItem = store.listReservedQuantities
      ? await store.listReservedQuantities(eventId)
      : new Map<string, number>();

    const items: AyllaGiftAvailabilityItem[] = [];
    for (const item of inventory) {
      let reservedQuantity = reservedByItem.get(item.itemId) ?? 0;
      if (!store.listReservedQuantities) {
        const rows = await store.getReservationsByItem(eventId, item.itemId);
        reservedQuantity = rows
          .filter((r) => r.status === "reserved" || r.status === "purchased" || r.status === "delivered")
          .reduce((sum, r) => sum + r.quantity, 0);
      }

      const approvedQuantity = item.approvedQuantity;
      const remainingQuantity =
        approvedQuantity === null ? 0 : Math.max(0, approvedQuantity - reservedQuantity);
      const reservable = Boolean(
        item.familyApproved &&
          item.enabled &&
          approvedQuantity !== null &&
          item.specificationsComplete &&
          item.childSafetyValidated &&
          remainingQuantity > 0
      );

      items.push({
        itemId: item.itemId,
        familyApproved: item.familyApproved,
        enabled: item.enabled,
        approvedQuantity,
        reservedQuantity,
        remainingQuantity,
        reservable,
      });
    }

    let myReservations: AyllaCatalogAvailabilitySnapshot["myReservations"] = [];
    if (sessionToken) {
      const auth = await resolveSession(sessionToken);
      if (auth.valid && store.listReservationsByGuest) {
        const guestReservations = await store.listReservationsByGuest(eventId, auth.guest.id);
        myReservations = guestReservations.map((r) => ({
          id: r.id,
          giftId: r.giftId,
          quantity: r.quantity,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
    }

    return {
      registryEnabled: true,
      items,
      myReservations,
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
    getCatalogAvailability,
    adminTransition,
  };
}
