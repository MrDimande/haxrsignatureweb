import { ayllaGiftIssuerQuery, ayllaGiftQuery } from "@/lib/neon/aylla-gift-db";
import { normalizeAyllaContactForLookup } from "./otp-delivery";
import { logAyllaTrace } from "./trace";
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
    async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
      const queryFn = key.startsWith("rate:gift-verify-") ? ayllaGiftIssuerQuery : ayllaGiftQuery;
      const res = await queryFn<{ allowed: boolean }>(
        `
        SELECT public.consume_baby_aylla_rate_limit($1, $2, $3) AS allowed;
        `,
        [key, limit, windowMs]
      );
      return Boolean(res.rows[0]?.allowed);
    },

    async findGuestByContact(_eventId: string, contact: string): Promise<CoreGuestRecord | null> {
      const normalized = normalizeAyllaContactForLookup(contact);
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

    async createChallenge(challenge): Promise<void> {
      await ayllaGiftIssuerQuery(
        `
        SELECT public.create_baby_aylla_verification_challenge(
          $1::uuid, $2::uuid, $3::uuid, $4, $5
        );
        `,
        [
          challenge.id,
          challenge.eventId,
          challenge.guestId,
          challenge.verifierHash,
          challenge.maxAttempts ?? 5,
        ]
      );
    },

    async getChallenge(_challengeId: string): Promise<CoreVerificationChallengeRecord | null> {
      throw new Error("Direct challenge query is forbidden; use verifyAndConsumeChallenge RPC.");
    },

    async verifyAndConsumeChallenge(challengeId: string, verifierHash: string, _now?: Date) {
      const res = await ayllaGiftQuery<{
        consumed: boolean;
        event_id: string | null;
        guest_id: string | null;
      }>(
        `
        SELECT consumed, event_id, guest_id
        FROM public.verify_and_consume_baby_aylla_challenge($1::uuid, $2);
        `,
        [challengeId, verifierHash]
      );
      const row = res.rows[0];
      if (!row || !row.consumed || !row.event_id || !row.guest_id) {
        return { consumed: false };
      }
      return {
        consumed: true,
        eventId: row.event_id,
        guestId: row.guest_id,
      };
    },

    async consumeChallenge(challengeId: string, _now?: Date): Promise<boolean> {
      const res = await ayllaGiftQuery<{ consumed: boolean }>(
        `
        SELECT public.verify_and_consume_baby_aylla_challenge($1::uuid, '') AS consumed;
        `,
        [challengeId]
      );
      return res.rows[0]?.consumed ?? false;
    },

    async incrementChallengeAttempts(_challengeId: string): Promise<number> {
      throw new Error(
        "Direct challenge attempt increment is forbidden; use verifyAndConsumeChallenge RPC."
      );
    },

    async createSession(session): Promise<void> {
      if (!session.challengeId) {
        throw new Error("createSession requires challengeId bound to verification.");
      }
      await ayllaGiftQuery(
        `
        SELECT public.create_baby_aylla_guest_session(
          $1::uuid, $2::uuid, $3::uuid, $4, $5::uuid
        );
        `,
        [
          session.id,
          session.eventId,
          session.guestId,
          session.secretHash,
          session.challengeId,
        ]
      );
    },

    async getSession(_sessionId: string): Promise<CoreGuestSessionRecord | null> {
      throw new Error("Direct session query is forbidden; use resolveSessionVerified RPC.");
    },

    async resolveSessionVerified(input: { sessionId: string; secretProof: string }): Promise<CoreGuestRecord | null> {
      const res = await ayllaGiftQuery<{
        guest_id: string;
        event_id: string;
        guest_name: string;
        guest_contact: string;
        guest_status: "confirmed" | "declined" | "pending";
        guest_source: string;
        guest_archived: boolean;
        guest_deleted: boolean;
        guest_incorrect: boolean;
      }>(
        `
        SELECT guest_id, event_id, guest_name, guest_contact, guest_status,
               guest_source, guest_archived, guest_deleted, guest_incorrect
        FROM public.resolve_baby_aylla_guest_session($1::uuid, $2);
        `,
        [input.sessionId, input.secretProof]
      );

      const row = res.rows[0];
      if (!row) return null;

      return {
        id: row.guest_id,
        eventId: row.event_id,
        name: row.guest_name,
        contact: row.guest_contact,
        status: row.guest_status,
        source: row.guest_source,
        archived: row.guest_archived,
        deleted: row.guest_deleted,
        incorrect: row.guest_incorrect,
      };
    },

    async revokeSessionVerified(input: { sessionId: string; secretProof: string; now?: Date }): Promise<boolean> {
      const res = await ayllaGiftQuery<{ revoked: boolean }>(
        `
        SELECT public.revoke_baby_aylla_guest_session($1::uuid, $2) AS revoked;
        `,
        [input.sessionId, input.secretProof]
      );
      return res.rows[0]?.revoked ?? false;
    },

    async revokeSession(sessionId: string, _now?: Date, secretProof?: string): Promise<void> {
      if (!secretProof) {
        throw new Error("revokeSession requires secretProof; direct unauthenticated revocation is forbidden.");
      }
      await ayllaGiftQuery(
        `
        SELECT public.revoke_baby_aylla_guest_session($1::uuid, $2);
        `,
        [sessionId, secretProof]
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

    async listReservedQuantities(eventId: string): Promise<ReadonlyMap<string, number>> {
      const res = await ayllaGiftQuery<{
        item_id: string;
        reserved_quantity: number;
      }>(
        `
        SELECT item_id, COALESCE(SUM(quantity), 0)::int AS reserved_quantity
        FROM public.edition_gift_reservations_v2
        WHERE event_id = $1
          AND status IN ('reserved', 'purchased', 'delivered')
        GROUP BY item_id;
        `,
        [eventId]
      );

      const totals = new Map<string, number>();
      for (const row of res.rows) {
        totals.set(row.item_id, Number(row.reserved_quantity ?? 0));
      }
      return totals;
    },

    async listReservationsByGuest(eventId: string, guestId: string): Promise<readonly AyllaGiftReservationRecord[]> {
      const res = await ayllaGiftQuery<{
        id: string;
        event_id: string;
        item_id: string;
        guest_id: string;
        quantity: number;
        status: AyllaGiftReservationStatus;
        idempotency_key: string;
        created_at: string | Date;
        updated_at: string | Date;
      }>(
        `
        SELECT id, event_id, item_id, guest_id, quantity, status,
               idempotency_key::text, created_at, updated_at
        FROM public.edition_gift_reservations_v2
        WHERE event_id = $1 AND guest_id = $2
        ORDER BY created_at DESC;
        `,
        [eventId, guestId]
      );

      return res.rows.map((row) => ({
        id: row.id,
        eventId: row.event_id,
        giftId: row.item_id,
        guestId: row.guest_id,
        quantity: row.quantity,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
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

    async transitionAdminVerified(_input: {
      eventId: string;
      reservationId: string;
      adminId: string;
      nextStatus: AyllaGiftReservationStatus;
      reason?: string;
    }): Promise<AyllaGiftReservationRecord> {
      throw new Error(
        "Administrative transitions are strictly forbidden on guest runtime connection; use dedicated admin identity haxr_aylla_gift_admin."
      );
    },

    async reserveVerified(input) {
      const startedAt = Date.now();
      logAyllaTrace("store_rpc_reserve_start", { itemId: input.itemId, quantity: input.quantity });
      const res = await ayllaGiftQuery<{
        id: string; event_id: string; item_id: string; guest_id: string; quantity: number;
        status: AyllaGiftReservationStatus; idempotency_key: string; created_at: string; updated_at: string;
      }>(
        `SELECT id, event_id, item_id, guest_id, quantity, status, idempotency_key::text, created_at, updated_at
         FROM public.reserve_baby_aylla_gift_verified($1::uuid, $2, $3, $4, $5::uuid)`,
        [input.sessionId, input.secretHash, input.itemId, input.quantity, input.idempotencyKey]
      );
      const row = res.rows[0];
      logAyllaTrace("store_rpc_reserve_end", {
        itemId: input.itemId,
        durationMs: Date.now() - startedAt,
        status: row?.status,
      });
      if (!row) throw new Error("Verified reservation RPC returned no row.");
      return { id: row.id, eventId: row.event_id, giftId: row.item_id, guestId: row.guest_id, quantity: row.quantity,
        status: row.status, idempotencyKey: row.idempotency_key, createdAt: row.created_at, updatedAt: row.updated_at };
    },

    async cancelVerified(input) {
      const startedAt = Date.now();
      logAyllaTrace("store_rpc_cancel_start");
      const res = await ayllaGiftQuery<{
        id: string; event_id: string; item_id: string; guest_id: string; quantity: number;
        status: AyllaGiftReservationStatus; idempotency_key: string; created_at: string; updated_at: string;
      }>(
        `SELECT id, event_id, item_id, guest_id, quantity, status, idempotency_key::text, created_at, updated_at
         FROM public.cancel_baby_aylla_gift_verified($1::uuid, $2, $3::uuid)`,
        [input.sessionId, input.secretHash, input.reservationId]
      );
      const row = res.rows[0];
      logAyllaTrace("store_rpc_cancel_end", {
        durationMs: Date.now() - startedAt,
        status: row?.status,
      });
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
  const guestsByContact = new Map<string, CoreGuestRecord[]>();
  const inventory = new Map<string, CoreGiftInventoryRecord>();
  const challenges = new Map<string, CoreVerificationChallengeRecord>();
  const sessions = new Map<string, CoreGuestSessionRecord>();
  const reservations = new Map<string, AyllaGiftReservationRecord>();
  const audits: CoreReservationAuditRecord[] = [];
  const rateLimits = new Map<string, { count: number; resetAt: number }>();

  for (const g of seed?.guests ?? []) {
    guests.set(`${g.eventId}:${g.id}`, g);
    const contactKey = `${g.eventId}:contact:${normalizeAyllaContactForLookup(g.contact)}`;
    const list = guestsByContact.get(contactKey) ?? [];
    list.push(g);
    guestsByContact.set(contactKey, list);
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
    async checkRateLimit(key, limit, windowMs) {
      if (limit < 1 || windowMs < 1) return false;
      const now = Date.now();
      const existing = rateLimits.get(key);
      if (!existing || existing.resetAt <= now) {
        rateLimits.set(key, { count: 1, resetAt: now + windowMs });
        return 1 <= limit;
      }
      existing.count += 1;
      return existing.count <= limit;
    },
    async findGuestByContact(eventId, contact) {
      const list = guestsByContact.get(`${eventId}:contact:${normalizeAyllaContactForLookup(contact)}`);
      if (!list || list.length === 0) return null;
      const ranked = [...list].reverse().sort((a, b) => {
        const aActive = Number(!a.archived && !a.deleted && !a.incorrect);
        const bActive = Number(!b.archived && !b.deleted && !b.incorrect);
        if (bActive !== aActive) return bActive - aActive;
        const aEligible = Number(a.status === "confirmed" && a.source === "edition_rsvp");
        const bEligible = Number(b.status === "confirmed" && b.source === "edition_rsvp");
        return bEligible - aEligible;
      });
      return ranked[0] ?? null;
    },
    async getGuestById(eventId, guestId) {
      return guests.get(`${eventId}:${guestId}`) ?? null;
    },
    async createChallenge(challenge) {
      const now = challenge.createdAt ?? new Date();
      const expiresAt = challenge.expiresAt ?? new Date(now.getTime() + 10 * 60 * 1000);
      challenges.set(challenge.id, {
        id: challenge.id,
        eventId: challenge.eventId,
        guestId: challenge.guestId,
        verifierHash: challenge.verifierHash,
        expiresAt,
        attempts: challenge.attempts ?? 0,
        maxAttempts: challenge.maxAttempts ?? 5,
        consumedAt: challenge.consumedAt ?? null,
        sessionIssuedAt: challenge.sessionIssuedAt ?? null,
        createdAt: now,
      });
    },
    async getChallenge(challengeId) {
      const c = challenges.get(challengeId);
      return c ? { ...c } : null;
    },
    async consumeChallenge(challengeId, now) {
      const c = challenges.get(challengeId);
      const currentTime = now ?? new Date();
      if (!c || c.consumedAt !== null || (c.expiresAt && c.expiresAt <= currentTime)) return false;
      c.consumedAt = currentTime;
      return true;
    },
    async incrementChallengeAttempts(challengeId) {
      const c = challenges.get(challengeId);
      if (!c) return 0;
      c.attempts = (c.attempts ?? 0) + 1;
      return c.attempts;
    },
    async verifyAndConsumeChallenge(challengeId, verifierHash, now) {
      const c = challenges.get(challengeId);
      if (!c) return { consumed: false };
      const currentTime = now ?? new Date();
      if (c.consumedAt !== null || (c.expiresAt && c.expiresAt <= currentTime) || (c.attempts ?? 0) >= (c.maxAttempts ?? 5)) {
        return { consumed: false };
      }
      if (c.verifierHash !== verifierHash) {
        c.attempts = (c.attempts ?? 0) + 1;
        return { consumed: false };
      }
      c.consumedAt = currentTime;
      return { consumed: true, eventId: c.eventId, guestId: c.guestId };
    },
    async createSession(session) {
      const now = session.createdAt ?? new Date();
      const expiresAt = session.expiresAt ?? new Date(now.getTime() + 20 * 60 * 1000);
      if (session.challengeId) {
        const c = challenges.get(session.challengeId);
        if (!c) {
          throw new Error("challenge not found for session issuance");
        }
        if (c.eventId !== session.eventId || c.guestId !== session.guestId) {
          throw new Error("cannot issue session: challenge guest and event must match session");
        }
        if (c.consumedAt === null || c.consumedAt === undefined) {
          throw new Error("challenge must be consumed before issuing session");
        }
        if (now.getTime() - c.consumedAt.getTime() > 120_000) {
          throw new Error("challenge consumption expired for session issuance (exceeded 120s)");
        }
        if (c.sessionIssuedAt) {
          throw new Error("challenge already used to issue session");
        }
        c.sessionIssuedAt = now;
      }
      sessions.set(session.id, {
        id: session.id,
        eventId: session.eventId,
        guestId: session.guestId,
        secretHash: session.secretHash,
        challengeId: session.challengeId,
        expiresAt,
        revokedAt: session.revokedAt ?? null,
        createdAt: now,
      });
    },
    async getSession(sessionId) {
      const s = sessions.get(sessionId);
      return s ? { ...s } : null;
    },
    async resolveSessionVerified(input) {
      const session = sessions.get(input.sessionId);
      if (!session || session.revokedAt !== null || (session.expiresAt && session.expiresAt <= new Date())) {
        return null;
      }
      if (session.secretHash !== input.secretProof) {
        return null;
      }
      const guest = guests.get(`${session.eventId}:${session.guestId}`);
      return guest ?? null;
    },
    async revokeSessionVerified(input) {
      const session = sessions.get(input.sessionId);
      if (!session || session.secretHash !== input.secretProof) {
        return false;
      }
      session.revokedAt = input.now ?? new Date();
      return true;
    },
    async revokeSession(sessionId, now) {
      const s = sessions.get(sessionId);
      if (s && s.revokedAt === null) {
        s.revokedAt = now ?? new Date();
      }
    },
    async getInventoryItem(eventId, itemId) {
      const i = inventory.get(`${eventId}:${itemId}`);
      return i ? { ...i } : null;
    },
    async listInventory(eventId) {
      return Array.from(inventory.values()).filter((i) => i.eventId === eventId);
    },
    async listReservedQuantities(eventId) {
      const totals = new Map<string, number>();
      for (const r of reservations.values()) {
        if (
          r.eventId === eventId &&
          (r.status === "reserved" || r.status === "purchased" || r.status === "delivered")
        ) {
          totals.set(r.giftId, (totals.get(r.giftId) ?? 0) + r.quantity);
        }
      }
      return totals;
    },
    async listReservationsByGuest(eventId, guestId) {
      return Array.from(reservations.values())
        .filter((r) => r.eventId === eventId && r.guestId === guestId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
