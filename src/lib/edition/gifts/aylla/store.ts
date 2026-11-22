import { neonQuery } from "@/lib/neon/server-db";
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
      const res = await neonQuery<{
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
        SELECT id, event_id, name, COALESCE(phone, email, name) AS contact,
               status, guest_source, archived_at, deleted_at, is_incorrect
        FROM public.guests
        WHERE event_id = $1
          AND (lower(COALESCE(phone, '')) = $2 OR lower(COALESCE(email, '')) = $2)
        LIMIT 1;
        `,
        [eventId, normalized]
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
      const res = await neonQuery<{
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
        SELECT id, event_id, name, COALESCE(phone, email, name) AS contact,
               status, guest_source, archived_at, deleted_at, is_incorrect
        FROM public.guests
        WHERE event_id = $1 AND id = $2
        LIMIT 1;
        `,
        [eventId, guestId]
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
      await neonQuery(
        `
        INSERT INTO public.edition_guest_verification_challenges
          (id, event_id, guest_id, verifier_hash, expires_at, attempts, max_attempts, consumed_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `,
        [
          challenge.id,
          challenge.eventId,
          challenge.guestId,
          challenge.verifierHash,
          challenge.expiresAt,
          challenge.attempts,
          challenge.maxAttempts,
          challenge.consumedAt,
          challenge.createdAt,
        ]
      );
    },

    async getChallenge(challengeId: string): Promise<CoreVerificationChallengeRecord | null> {
      const res = await neonQuery<{
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
      const res = await neonQuery(
        `
        UPDATE public.edition_guest_verification_challenges
        SET consumed_at = $2
        WHERE id = $1 AND consumed_at IS NULL AND expires_at > $2
        RETURNING id;
        `,
        [challengeId, now]
      );
      return (res.rowCount ?? 0) > 0;
    },

    async incrementChallengeAttempts(challengeId: string): Promise<number> {
      const res = await neonQuery<{ attempts: number }>(
        `
        UPDATE public.edition_guest_verification_challenges
        SET attempts = attempts + 1
        WHERE id = $1
        RETURNING attempts;
        `,
        [challengeId]
      );
      return res.rows[0]?.attempts ?? 0;
    },

    async createSession(session: CoreGuestSessionRecord): Promise<void> {
      await neonQuery(
        `
        INSERT INTO public.edition_guest_sessions
          (id, event_id, guest_id, secret_hash, expires_at, revoked_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
        [
          session.id,
          session.eventId,
          session.guestId,
          session.secretHash,
          session.expiresAt,
          session.revokedAt,
          session.createdAt,
        ]
      );
    },

    async getSession(sessionId: string): Promise<CoreGuestSessionRecord | null> {
      const res = await neonQuery<{
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
      await neonQuery(
        `
        UPDATE public.edition_guest_sessions
        SET revoked_at = $2
        WHERE id = $1 AND revoked_at IS NULL;
        `,
        [sessionId, now]
      );
    },

    async getInventoryItem(eventId: string, itemId: string): Promise<CoreGiftInventoryRecord | null> {
      const res = await neonQuery<{
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
      const res = await neonQuery<{
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
      const res = await neonQuery<{
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
      const res = await neonQuery<{
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
      const res = await neonQuery<{
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

    async createReservation(reservation: AyllaGiftReservationRecord): Promise<void> {
      await neonQuery(
        `
        INSERT INTO public.edition_gift_reservations_v2
          (id, event_id, item_id, guest_id, quantity, status, idempotency_key, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8, $9);
        `,
        [
          reservation.id,
          reservation.eventId,
          reservation.giftId,
          reservation.guestId,
          reservation.quantity,
          reservation.status,
          reservation.idempotencyKey,
          reservation.createdAt,
          reservation.updatedAt,
        ]
      );
    },

    async updateReservationStatus(
      reservationId: string,
      status: AyllaGiftReservationStatus,
      now: Date
    ): Promise<void> {
      await neonQuery(
        `
        UPDATE public.edition_gift_reservations_v2
        SET status = $2,
            updated_at = $3,
            cancelled_at = CASE WHEN $2 = 'cancelled' THEN $3 ELSE cancelled_at END,
            purchased_at = CASE WHEN $2 = 'purchased' THEN $3 ELSE purchased_at END,
            delivered_at = CASE WHEN $2 = 'delivered' THEN $3 ELSE delivered_at END
        WHERE id = $1;
        `,
        [reservationId, status, now]
      );
    },

    async createAuditRecord(audit: CoreReservationAuditRecord): Promise<void> {
      await neonQuery(
        `
        INSERT INTO public.edition_gift_reservation_audit_v2
          (id, reservation_id, event_id, actor_guest_id, actor_admin_id, action, previous_status, next_status, reason, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `,
        [
          audit.id,
          audit.reservationId,
          audit.eventId,
          audit.actorGuestId,
          audit.actorAdminId,
          audit.action,
          audit.previousStatus,
          audit.nextStatus,
          audit.reason,
          audit.createdAt,
        ]
      );
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
  };
}
