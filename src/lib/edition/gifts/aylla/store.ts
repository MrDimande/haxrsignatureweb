import { ayllaGiftQuery } from "@/lib/neon/aylla-gift-db";
import type {
  AyllaGiftReservationRecord,
  AyllaGiftReservationStatus,
  CoreGiftInventoryRecord,
  CoreGiftStore,
  CoreGuestRecord,
  CoreReservationAuditRecord,
  CoreVerificationChallengeRecord,
  CoreGuestSessionRecord,
} from "./types";

/**
 * Neon PostgreSQL Store Implementation
 * Uses parameterized queries and guarantees SQL safety.
 */
export function createNeonAyllaGiftStore(): CoreGiftStore {
  return {
    async findGuestByContact(eventId: string, contact: string): Promise<CoreGuestRecord | null> {
      const normalized = contact.trim().toLowerCase();
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        name: string;
        contact: string;
        status: "confirmed" | "declined" | "pending";
        guest_source: string;
        archived_at: string | null;
        deleted_at: string | null;
        is_incorrect: boolean;
      }>(
        `
        SELECT id, event_id, name, contact, status, guest_source, archived_at, deleted_at, is_incorrect
        FROM public.resolve_baby_aylla_guest_by_contact($1)
        `,
        [normalized]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        contact: row.contact,
        status: row.status,
        source: row.guest_source,
        archived: row.archived_at !== null,
        deleted: row.deleted_at !== null,
        incorrect: row.is_incorrect,
      };
    },

    async getGuestById(eventId: string, guestId: string): Promise<CoreGuestRecord | null> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        name: string;
        contact: string;
        status: "confirmed" | "declined" | "pending";
        guest_source: string;
        archived_at: string | null;
        deleted_at: string | null;
        is_incorrect: boolean;
      }>(
        `
        SELECT id, event_id, name, contact, status, guest_source, archived_at, deleted_at, is_incorrect
        FROM public.resolve_baby_aylla_guest_by_id($1)
        `,
        [guestId]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        contact: row.contact,
        status: row.status,
        source: row.guest_source,
        archived: row.archived_at !== null,
        deleted: row.deleted_at !== null,
        incorrect: row.is_incorrect,
      };
    },

    async createChallenge(challenge: CoreVerificationChallengeRecord): Promise<void> {
      await ayllaGiftQuery(
        `
        SELECT public.create_baby_aylla_verification_challenge(
          $1::uuid, $2::uuid, $3::uuid, $4, $5, $6
        );
        `,
        [
          challenge.id,
          challenge.eventId,
          challenge.guestId,
          challenge.verifierHash,
          challenge.expiresAt,
          challenge.maxAttempts,
        ]
      );
    },

    async getChallenge(challengeId: string): Promise<CoreVerificationChallengeRecord | null> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        guest_id: string;
        verifier_hash: string;
        expires_at: string;
        attempts: number;
        max_attempts: number;
        consumed_at: string | null;
        created_at: string;
      }>(
        `
        SELECT id, event_id, guest_id, verifier_hash, expires_at, attempts, max_attempts, consumed_at, created_at
        FROM public.edition_guest_verification_challenges
        WHERE id = $1;
        `,
        [challengeId]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.id,
        eventId: row.event_id,
        guestId: row.guest_id,
        verifierHash: row.verifier_hash,
        expiresAt: new Date(row.expires_at),
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
        createdAt: new Date(row.created_at),
      };
    },

    async consumeChallenge(challengeId: string, now: Date): Promise<boolean> {
      const res = await ayllaGiftQuery<{ consumed: boolean }>(
        `
        SELECT public.consume_baby_aylla_verification_challenge($1::uuid, $2) AS consumed;
        `,
        [challengeId, now]
      );
      return res.rows[0]?.consumed ?? false;
    },

    async incrementChallengeAttempts(challengeId: string): Promise<number> {
      const res = await ayllaGiftQuery<{ attempts: number }>(
        `
        SELECT public.increment_baby_aylla_challenge_attempts($1::uuid) AS attempts;
        `,
        [challengeId]
      );
      return res.rows[0]?.attempts ?? 0;
    },

    async createSession(session: CoreGuestSessionRecord): Promise<void> {
      await ayllaGiftQuery(
        `
        SELECT public.create_baby_aylla_guest_session(
          $1::uuid, $2::uuid, $3::uuid, $4, $5, $6
        );
        `,
        [
          session.id,
          session.eventId,
          session.guestId,
          session.secretHash,
          session.expiresAt,
          session.createdAt,
        ]
      );
    },

    async getSession(sessionId: string): Promise<CoreGuestSessionRecord | null> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        guest_id: string;
        secret_hash: string;
        expires_at: string;
        revoked_at: string | null;
        created_at: string;
      }>(
        `
        SELECT id, event_id, guest_id, secret_hash, expires_at, revoked_at, created_at
        FROM public.edition_guest_sessions
        WHERE id = $1;
        `,
        [sessionId]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.id,
        eventId: row.event_id,
        guestId: row.guest_id,
        secretHash: row.secret_hash,
        expiresAt: new Date(row.expires_at),
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
        createdAt: new Date(row.created_at),
      };
    },

    async revokeSession(sessionId: string, now: Date): Promise<void> {
      await ayllaGiftQuery(
        `
        SELECT public.revoke_baby_aylla_guest_session($1::uuid, $2);
        `,
        [sessionId, now]
      );
    },

    async getInventoryItem(eventId: string, itemId: string): Promise<CoreGiftInventoryRecord | null> {
      const res = await ayllaGiftQuery<{
        event_id: string;
        registry_key: string;
        item_id: string;
        family_approved: boolean;
        enabled: boolean;
        approved_quantity: number | null;
        specifications_complete: boolean;
        child_safety_validated: boolean;
      }>(
        `
        SELECT event_id, registry_key, item_id, family_approved, enabled,
               approved_quantity, specifications_complete, child_safety_validated
        FROM public.edition_gift_inventory
        WHERE event_id = $1 AND item_id = $2;
        `,
        [eventId, itemId]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        eventId: row.event_id,
        registryKey: row.registry_key,
        itemId: row.item_id,
        familyApproved: row.family_approved,
        enabled: row.enabled,
        approvedQuantity: row.approved_quantity,
        specificationsComplete: row.specifications_complete,
        childSafetyValidated: row.child_safety_validated,
      };
    },

    async listInventory(eventId: string): Promise<readonly CoreGiftInventoryRecord[]> {
      const res = await ayllaGiftQuery<{
        event_id: string;
        registry_key: string;
        item_id: string;
        family_approved: boolean;
        enabled: boolean;
        approved_quantity: number | null;
        specifications_complete: boolean;
        child_safety_validated: boolean;
      }>(
        `
        SELECT event_id, registry_key, item_id, family_approved, enabled,
               approved_quantity, specifications_complete, child_safety_validated
        FROM public.edition_gift_inventory
        WHERE event_id = $1
        ORDER BY item_id ASC;
        `,
        [eventId]
      );

      return res.rows.map((row) => ({
        eventId: row.event_id,
        registryKey: row.registry_key,
        itemId: row.item_id,
        familyApproved: row.family_approved,
        enabled: row.enabled,
        approvedQuantity: row.approved_quantity,
        specificationsComplete: row.specifications_complete,
        childSafetyValidated: row.child_safety_validated,
      }));
    },

    async getReservationsByItem(eventId: string, itemId: string): Promise<readonly AyllaGiftReservationRecord[]> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        item_id: string;
        guest_id: string;
        quantity: number;
        status: AyllaGiftReservationStatus;
        idempotency_key: string;
        created_at: string;
        updated_at: string;
      }>(
        `
        SELECT id, event_id, item_id, guest_id, quantity, status,
               idempotency_key::text, created_at, updated_at
        FROM public.edition_gift_reservations_v2
        WHERE event_id = $1 AND item_id = $2;
        `,
        [eventId, itemId]
      );

      return res.rows.map((row) => ({
        id: row.id,
        eventId: row.event_id,
        giftId: row.item_id,
        guestId: row.guest_id,
        quantity: row.quantity,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },

    async getReservationById(eventId: string, reservationId: string): Promise<AyllaGiftReservationRecord | null> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        item_id: string;
        guest_id: string;
        quantity: number;
        status: AyllaGiftReservationStatus;
        idempotency_key: string;
        created_at: string;
        updated_at: string;
      }>(
        `
        SELECT id, event_id, item_id, guest_id, quantity, status,
               idempotency_key::text, created_at, updated_at
        FROM public.edition_gift_reservations_v2
        WHERE event_id = $1 AND id = $2;
        `,
        [eventId, reservationId]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.id,
        eventId: row.event_id,
        giftId: row.item_id,
        guestId: row.guest_id,
        quantity: row.quantity,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    async findReservationByIdempotency(
      eventId: string,
      guestId: string,
      idempotencyKey: string
    ): Promise<AyllaGiftReservationRecord | null> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        item_id: string;
        guest_id: string;
        quantity: number;
        status: AyllaGiftReservationStatus;
        idempotency_key: string;
        created_at: string;
        updated_at: string;
      }>(
        `
        SELECT id, event_id, item_id, guest_id, quantity, status,
               idempotency_key::text, created_at, updated_at
        FROM public.edition_gift_reservations_v2
        WHERE event_id = $1 AND guest_id = $2 AND idempotency_key = $3::uuid;
        `,
        [eventId, guestId, idempotencyKey]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.id,
        eventId: row.event_id,
        giftId: row.item_id,
        guestId: row.guest_id,
        quantity: row.quantity,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    async createReservation(_reservation: AyllaGiftReservationRecord): Promise<void> {
      throw new Error("Direct reservation creation is forbidden; use reserveVerified RPC.");
    },

    async updateReservationStatus(
      _reservationId: string,
      _status: AyllaGiftReservationStatus,
      _now: Date
    ): Promise<void> {
      throw new Error("Direct reservation status update is forbidden; use transitionAdminVerified RPC.");
    },

    async createAuditRecord(_audit: CoreReservationAuditRecord): Promise<void> {
      throw new Error("Direct audit record creation is forbidden; audit records are written by verified RPCs.");
    },

    async transitionAdminVerified(input: {
      eventId: string;
      reservationId: string;
      adminId: string;
      nextStatus: AyllaGiftReservationStatus;
      reason?: string;
    }): Promise<AyllaGiftReservationRecord> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        item_id: string;
        guest_id: string;
        quantity: number;
        status: AyllaGiftReservationStatus;
        idempotency_key: string;
        created_at: string;
        updated_at: string;
      }>(
        `
        SELECT id, event_id, item_id, guest_id, quantity, status, idempotency_key::text, created_at, updated_at
        FROM public.transition_baby_aylla_gift_reservation_admin($1::uuid, $2::uuid, $3::uuid, $4, $5);
        `,
        [input.eventId, input.reservationId, input.adminId, input.nextStatus, input.reason ?? null]
      );

      const row = res.rows[0];
      if (!row) throw new Error("Admin transition RPC returned no row.");

      return {
        id: row.id,
        eventId: row.event_id,
        giftId: row.item_id,
        guestId: row.guest_id,
        quantity: row.quantity,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    async reserveVerified(input) {
      const res = await ayllaGiftQuery<{
        id: string; event_id: string; item_id: string; guest_id: string; quantity: number;
        status: AyllaGiftReservationStatus; idempotency_key: string; created_at: string; updated_at: string;
      }>(
        `SELECT id, event_id, item_id, guest_id, quantity, status, idempotency_key::text, created_at, updated_at
         FROM public.reserve_baby_aylla_gift_verified($1::uuid, $2, $3, $4, $5::uuid)`,
        [input.sessionId, input.secretHash, input.itemId, input.quantity, input.idempotencyKey]
      );
      const row = res.rows[0];
      if (!row) throw new Error("Verified reservation RPC returned no row.");
      return { id: row.id, eventId: row.event_id, giftId: row.item_id, guestId: row.guest_id, quantity: row.quantity,
        status: row.status, idempotencyKey: row.idempotency_key, createdAt: row.created_at, updatedAt: row.updated_at };
    },

    async cancelVerified(input) {
      const res = await ayllaGiftQuery<{
        id: string; event_id: string; item_id: string; guest_id: string; quantity: number;
        status: AyllaGiftReservationStatus; idempotency_key: string; created_at: string; updated_at: string;
      }>(
        `SELECT id, event_id, item_id, guest_id, quantity, status, idempotency_key::text, created_at, updated_at
         FROM public.cancel_baby_aylla_gift_verified($1::uuid, $2, $3::uuid)`,
        [input.sessionId, input.secretHash, input.reservationId]
      );
      const row = res.rows[0];
      if (!row) throw new Error("Verified cancellation RPC returned no row.");
      return { id: row.id, eventId: row.event_id, giftId: row.item_id, guestId: row.guest_id, quantity: row.quantity,
        status: row.status, idempotencyKey: row.idempotency_key, createdAt: row.created_at, updatedAt: row.updated_at };
    },
  };
}

export interface InMemorySeedData {
  guests?: CoreGuestRecord[];
  inventory?: CoreGiftInventoryRecord[];
  challenges?: CoreVerificationChallengeRecord[];
  sessions?: CoreGuestSessionRecord[];
  reservations?: AyllaGiftReservationRecord[];
  auditRecords?: CoreReservationAuditRecord[];
}

/**
 * In-Memory Store for Hermetic, Fast Testing without Live DB
 */
export function createInMemoryAyllaGiftStore(seed?: InMemorySeedData): CoreGiftStore {
  const guests = new Map<string, CoreGuestRecord>();
  const inventory = new Map<string, CoreGiftInventoryRecord>();
  const challenges = new Map<string, CoreVerificationChallengeRecord>();
  const sessions = new Map<string, CoreGuestSessionRecord>();
  const reservations = new Map<string, AyllaGiftReservationRecord>();
  const audits: CoreReservationAuditRecord[] = [];

  for (const g of seed?.guests ?? []) {
    guests.set(`${g.eventId}:${g.id}`, g);
    guests.set(`${g.eventId}:contact:${g.contact.trim().toLowerCase()}`, g);
  }
  for (const i of seed?.inventory ?? []) {
    inventory.set(`${i.eventId}:${i.itemId}`, i);
  }
  for (const c of seed?.challenges ?? []) {
    challenges.set(c.id, { ...c });
  }
  for (const s of seed?.sessions ?? []) {
    sessions.set(s.id, { ...s });
  }
  for (const r of seed?.reservations ?? []) {
    reservations.set(r.id, { ...r });
  }
  for (const a of seed?.auditRecords ?? []) {
    audits.push({ ...a });
  }

  return {
    async findGuestByContact(eventId, contact) {
      return guests.get(`${eventId}:contact:${contact.trim().toLowerCase()}`) ?? null;
    },
    async getGuestById(eventId, guestId) {
      return guests.get(`${eventId}:${guestId}`) ?? null;
    },
    async createChallenge(challenge) {
      challenges.set(challenge.id, { ...challenge });
    },
    async getChallenge(challengeId) {
      const c = challenges.get(challengeId);
      return c ? { ...c } : null;
    },
    async consumeChallenge(challengeId, now) {
      const c = challenges.get(challengeId);
      if (!c || c.consumedAt !== null || c.expiresAt <= now) return false;
      c.consumedAt = now;
      return true;
    },
    async incrementChallengeAttempts(challengeId) {
      const c = challenges.get(challengeId);
      if (!c) return 0;
      c.attempts += 1;
      return c.attempts;
    },
    async createSession(session) {
      sessions.set(session.id, { ...session });
    },
    async getSession(sessionId) {
      const s = sessions.get(sessionId);
      return s ? { ...s } : null;
    },
    async revokeSession(sessionId, now) {
      const s = sessions.get(sessionId);
      if (s && s.revokedAt === null) {
        s.revokedAt = now;
      }
    },
    async getInventoryItem(eventId, itemId) {
      const i = inventory.get(`${eventId}:${itemId}`);
      return i ? { ...i } : null;
    },
    async listInventory(eventId) {
      return Array.from(inventory.values()).filter((i) => i.eventId === eventId);
    },
    async getReservationsByItem(eventId, itemId) {
      return Array.from(reservations.values()).filter(
        (r) => r.eventId === eventId && r.giftId === itemId
      );
    },
    async getReservationById(eventId, reservationId) {
      const r = reservations.get(reservationId);
      return r && r.eventId === eventId ? { ...r } : null;
    },
    async findReservationByIdempotency(eventId, guestId, idempotencyKey) {
      for (const r of reservations.values()) {
        if (r.eventId === eventId && r.guestId === guestId && r.idempotencyKey === idempotencyKey) {
          return { ...r };
        }
      }
      return null;
    },
    async createReservation(reservation) {
      reservations.set(reservation.id, { ...reservation });
    },
    async updateReservationStatus(reservationId, status, now) {
      const r = reservations.get(reservationId);
      if (r) {
        reservations.set(reservationId, {
          ...r,
          status,
          updatedAt: now.toISOString(),
        });
      }
    },
    async createAuditRecord(audit) {
      audits.push({ ...audit });
    },
    async transitionAdminVerified(input) {
      const r = reservations.get(input.reservationId);
      if (!r || r.eventId !== input.eventId) {
        throw new Error("reservation not found");
      }
      let validTransition = false;
      if (r.status === "reserved" && (input.nextStatus === "purchased" || input.nextStatus === "cancelled")) {
        validTransition = true;
      } else if (r.status === "purchased" && input.nextStatus === "delivered") {
        validTransition = true;
      }
      if (!validTransition) {
        throw new Error(`invalid reservation status transition from ${r.status} to ${input.nextStatus}`);
      }
      const updated: AyllaGiftReservationRecord = {
        ...r,
        status: input.nextStatus,
        updatedAt: new Date().toISOString(),
      };
      reservations.set(input.reservationId, updated);
      audits.push({
        id: crypto.randomUUID(),
        reservationId: input.reservationId,
        eventId: input.eventId,
        actorGuestId: null,
        actorAdminId: input.adminId,
        action: input.nextStatus,
        previousStatus: r.status,
        nextStatus: input.nextStatus,
        reason: input.reason ?? null,
        createdAt: new Date(),
      });
      return updated;
    },
    async reserveVerified(input) {
      const session = sessions.get(input.sessionId);
      if (!session || session.secretHash !== input.secretHash || session.expiresAt <= new Date() || session.revokedAt !== null) {
        throw new Error("verified guest session required");
      }
      const guest = guests.get(`${session.eventId}:${session.guestId}`);
      if (!guest || guest.status !== "confirmed" || guest.source !== "edition_rsvp" || guest.archived || guest.deleted || guest.incorrect) {
        throw new Error("guest is not eligible");
      }
      for (const r of reservations.values()) {
        if (r.eventId === session.eventId && r.guestId === session.guestId && r.idempotencyKey === input.idempotencyKey) {
          if (r.giftId !== input.itemId || r.quantity !== input.quantity) {
            throw new Error("idempotency key conflicts with original reservation intent");
          }
          return { ...r };
        }
      }
      const item = inventory.get(`${session.eventId}:${input.itemId}`);
      if (!item || !item.familyApproved || !item.enabled || item.approvedQuantity === null || !item.specificationsComplete || !item.childSafetyValidated) {
        throw new Error("gift item is not reservable");
      }
      let reservedQty = 0;
      for (const r of reservations.values()) {
        if (r.eventId === session.eventId && r.giftId === input.itemId && (r.status === "reserved" || r.status === "purchased" || r.status === "delivered")) {
          reservedQty += r.quantity;
        }
      }
      if (input.quantity > item.approvedQuantity - reservedQty) {
        throw new Error("gift quantity unavailable");
      }
      const newReservation: AyllaGiftReservationRecord = {
        id: crypto.randomUUID(),
        eventId: session.eventId,
        giftId: input.itemId,
        guestId: session.guestId,
        quantity: input.quantity,
        status: "reserved",
        idempotencyKey: input.idempotencyKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reservations.set(newReservation.id, newReservation);
      audits.push({
        id: crypto.randomUUID(),
        reservationId: newReservation.id,
        eventId: session.eventId,
        actorGuestId: session.guestId,
        actorAdminId: null,
        action: "reserved",
        previousStatus: null,
        nextStatus: "reserved",
        reason: null,
        createdAt: new Date(),
      });
      return newReservation;
    },
    async cancelVerified(input) {
      const session = sessions.get(input.sessionId);
      if (!session || session.secretHash !== input.secretHash || session.expiresAt <= new Date() || session.revokedAt !== null) {
        throw new Error("verified guest session required");
      }
      const res = reservations.get(input.reservationId);
      if (!res || res.eventId !== session.eventId || res.guestId !== session.guestId) {
        throw new Error("reservation not found or ownership mismatch");
      }
      if (res.status !== "reserved") {
        throw new Error("only reserved gifts can be cancelled by guest");
      }
      const updated: AyllaGiftReservationRecord = {
        ...res,
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      };
      reservations.set(res.id, updated);
      audits.push({
        id: crypto.randomUUID(),
        reservationId: res.id,
        eventId: session.eventId,
        actorGuestId: session.guestId,
        actorAdminId: null,
        action: "cancelled",
        previousStatus: "reserved",
        nextStatus: "cancelled",
        reason: "cancelled_by_guest",
        createdAt: new Date(),
      });
      return updated;
    },
  };
}
