import "server-only";

import { AYLLA_GIFTS_CONFIG } from "./config";
import {
  AYLLA_GIFT_CATEGORIES,
  reconcileAyllaCatalogInventory,
  type AyllaGiftCategoryDefinition,
  type AyllaGiftReconciledItem,
} from "./catalog-items";
import { getAyllaOtpDeliveryReadiness, type AyllaOtpDeliveryReadiness } from "./otp-delivery";
import { canTransitionAyllaGiftReservation } from "./service";
import type { AyllaGiftReservationStatus, CoreGiftInventoryRecord } from "./types";
import { ayllaGiftAdminQuery } from "@/lib/neon/aylla-gift-db";

export interface AyllaAdminReservationView {
  readonly id: string;
  readonly eventId: string;
  readonly itemId: string;
  readonly guestId: string;
  readonly guestName: string;
  readonly guestPhone: string;
  readonly guestEmail: string;
  readonly guestStatus: string;
  readonly quantity: number;
  readonly status: AyllaGiftReservationStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly cancelledAt: string | null;
  readonly purchasedAt: string | null;
  readonly deliveredAt: string | null;
}

export interface AyllaAdminAuditView {
  readonly id: string;
  readonly reservationId: string;
  readonly itemId: string | null;
  readonly actorGuestId: string | null;
  readonly actorAdminId: string | null;
  readonly action: AyllaGiftReservationStatus;
  readonly previousStatus: AyllaGiftReservationStatus | null;
  readonly nextStatus: AyllaGiftReservationStatus;
  readonly reason: string | null;
  readonly createdAt: string;
}

export interface AyllaGiftAdminSnapshot {
  readonly configured: boolean;
  readonly statusMessage: string | null;
  readonly eventId: string;
  readonly registryKey: string;
  readonly categories: readonly AyllaGiftCategoryDefinition[];
  readonly items: readonly AyllaGiftReconciledItem[];
  readonly reservations: readonly AyllaAdminReservationView[];
  readonly audits: readonly AyllaAdminAuditView[];
  readonly otpReadiness: AyllaOtpDeliveryReadiness;
}

function emptyAdminSnapshot(
  eventId: string,
  statusMessage: string
): AyllaGiftAdminSnapshot {
  return {
    configured: false,
    statusMessage,
    eventId,
    registryKey: AYLLA_GIFTS_CONFIG.registryKey,
    categories: AYLLA_GIFT_CATEGORIES,
    items: reconcileAyllaCatalogInventory([], new Map()),
    reservations: [],
    audits: [],
    otpReadiness: getAyllaOtpDeliveryReadiness(),
  };
}

function toIsoString(val: string | Date | null | undefined): string | null {
  if (!val) return null;
  return val instanceof Date ? val.toISOString() : String(val);
}

/**
 * Loads the V2 inventory, guest reservations, audit trail, and OTP channel readiness
 * for the Baby Aylla admin tab using the dedicated haxr_aylla_gift_admin role.
 * Degrades cleanly if the production role or Gate E SQL migration is not yet provisioned.
 */
export async function loadAyllaGiftAdminSnapshot(
  eventId: string,
  adminId?: string | null
): Promise<AyllaGiftAdminSnapshot> {
  if (eventId !== AYLLA_GIFTS_CONFIG.eventId) {
    return emptyAdminSnapshot(eventId, "Evento não corresponde ao scope Baby Aylla V2.");
  }

  if (!adminId) {
    return emptyAdminSnapshot(
      eventId,
      "Identidade administrativa autenticada na base de dados (HAXR_ADMIN_IDENTITY_MODE=database) necessária para operações V2."
    );
  }

  try {
    const [inventoryRes, reservedRes, reservationsRes, auditsRes] = await Promise.all([
      ayllaGiftAdminQuery<{
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
        WHERE event_id = $1::uuid
        ORDER BY item_id ASC
        `,
        [eventId]
      ),
      ayllaGiftAdminQuery<{ item_id: string; reserved_qty: number }>(
        `
        SELECT item_id, COALESCE(SUM(quantity), 0)::int AS reserved_qty
        FROM public.edition_gift_reservations_v2
        WHERE event_id = $1::uuid
          AND status IN ('reserved', 'purchased', 'delivered')
        GROUP BY item_id
        `,
        [eventId]
      ),
      ayllaGiftAdminQuery<{
        id: string;
        event_id: string;
        item_id: string;
        guest_id: string;
        guest_name: string;
        guest_phone: string | null;
        guest_email: string | null;
        guest_status: string;
        quantity: number;
        status: AyllaGiftReservationStatus;
        created_at: string | Date;
        updated_at: string | Date;
        cancelled_at: string | Date | null;
        purchased_at: string | Date | null;
        delivered_at: string | Date | null;
      }>(
        `
        SELECT id, event_id, item_id, guest_id, guest_name, guest_phone, guest_email,
               guest_status::text AS guest_status, quantity, status,
               created_at, updated_at, cancelled_at, purchased_at, delivered_at
        FROM public.list_baby_aylla_gift_admin_reservations($1::uuid, $2::uuid)
        `,
        [eventId, adminId]
      ),
      ayllaGiftAdminQuery<{
        id: string;
        reservation_id: string;
        item_id: string | null;
        actor_guest_id: string | null;
        actor_admin_id: string | null;
        action: AyllaGiftReservationStatus;
        previous_status: AyllaGiftReservationStatus | null;
        next_status: AyllaGiftReservationStatus;
        reason: string | null;
        created_at: string | Date;
      }>(
        `
        SELECT a.id, a.reservation_id, r.item_id, a.actor_guest_id, a.actor_admin_id,
               a.action, a.previous_status, a.next_status, a.reason, a.created_at
        FROM public.edition_gift_reservation_audit_v2 AS a
        LEFT JOIN public.edition_gift_reservations_v2 AS r
          ON r.id = a.reservation_id AND r.event_id = a.event_id
        WHERE a.event_id = $1::uuid
        ORDER BY a.created_at DESC
        LIMIT 50
        `,
        [eventId]
      ),
    ]);

    const inventoryRecords: CoreGiftInventoryRecord[] = inventoryRes.rows.map((row) => ({
      eventId: row.event_id,
      registryKey: row.registry_key,
      itemId: row.item_id,
      familyApproved: row.family_approved,
      enabled: row.enabled,
      approvedQuantity: row.approved_quantity,
      specificationsComplete: row.specifications_complete,
      childSafetyValidated: row.child_safety_validated,
    }));

    const reservedMap = new Map<string, number>();
    for (const row of reservedRes.rows) {
      reservedMap.set(row.item_id, Number(row.reserved_qty ?? 0));
    }

    const reservations: AyllaAdminReservationView[] = reservationsRes.rows.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      itemId: row.item_id,
      guestId: row.guest_id,
      guestName: row.guest_name,
      guestPhone: row.guest_phone ?? "",
      guestEmail: row.guest_email ?? "",
      guestStatus: row.guest_status,
      quantity: row.quantity,
      status: row.status,
      createdAt: toIsoString(row.created_at) ?? "",
      updatedAt: toIsoString(row.updated_at) ?? "",
      cancelledAt: toIsoString(row.cancelled_at),
      purchasedAt: toIsoString(row.purchased_at),
      deliveredAt: toIsoString(row.delivered_at),
    }));

    const audits: AyllaAdminAuditView[] = auditsRes.rows.map((row) => ({
      id: row.id,
      reservationId: row.reservation_id,
      itemId: row.item_id,
      actorGuestId: row.actor_guest_id,
      actorAdminId: row.actor_admin_id,
      action: row.action,
      previousStatus: row.previous_status,
      nextStatus: row.next_status,
      reason: row.reason,
      createdAt: toIsoString(row.created_at) ?? "",
    }));

    return {
      configured: true,
      statusMessage: null,
      eventId,
      registryKey: AYLLA_GIFTS_CONFIG.registryKey,
      categories: AYLLA_GIFT_CATEGORIES,
      items: reconcileAyllaCatalogInventory(inventoryRecords, reservedMap),
      reservations,
      audits,
      otpReadiness: getAyllaOtpDeliveryReadiness(),
    };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Infraestrutura administrativa Baby Aylla V2 não provisionada.";
    return emptyAdminSnapshot(eventId, msg);
  }
}

export async function updateAyllaGiftInventoryAdmin(input: {
  eventId: string;
  adminId: string;
  itemId: string;
  familyApproved: boolean;
  enabled: boolean;
  approvedQuantity: number | null;
  specificationsComplete: boolean;
  childSafetyValidated: boolean;
}): Promise<CoreGiftInventoryRecord> {
  if (input.eventId !== AYLLA_GIFTS_CONFIG.eventId) {
    throw new Error("Scope de evento inválido para o inventário Baby Aylla.");
  }

  const res = await ayllaGiftAdminQuery<{
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
    FROM public.upsert_baby_aylla_gift_inventory_admin(
      $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8
    )
    `,
    [
      input.eventId,
      input.adminId,
      input.itemId,
      input.familyApproved,
      input.enabled,
      input.approvedQuantity,
      input.specificationsComplete,
      input.childSafetyValidated,
    ]
  );

  const row = res.rows[0];
  if (!row) throw new Error("Falha ao actualizar inventário.");
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
}

export async function transitionAyllaGiftReservationAdmin(input: {
  eventId: string;
  adminId: string;
  reservationId: string;
  nextStatus: AyllaGiftReservationStatus;
  reason?: string;
}): Promise<{ id: string; status: AyllaGiftReservationStatus }> {
  if (input.eventId !== AYLLA_GIFTS_CONFIG.eventId) {
    throw new Error("Scope de evento inválido para transição de reserva.");
  }

  const currentRes = await ayllaGiftAdminQuery<{ status: AyllaGiftReservationStatus }>(
    `
    SELECT status
    FROM public.edition_gift_reservations_v2
    WHERE event_id = $1::uuid AND id = $2::uuid
    `,
    [input.eventId, input.reservationId]
  );

  const currentStatus = currentRes.rows[0]?.status;
  if (!currentStatus) {
    throw new Error("Reserva não encontrada.");
  }
  if (!canTransitionAyllaGiftReservation(currentStatus, input.nextStatus)) {
    throw new Error(`Transição inválida de "${currentStatus}" para "${input.nextStatus}".`);
  }

  const updated = await ayllaGiftAdminQuery<{
    id: string;
    status: AyllaGiftReservationStatus;
  }>(
    `
    SELECT id, status
    FROM public.transition_baby_aylla_gift_reservation_admin(
      $1::uuid, $2::uuid, $3::uuid, $4, $5
    )
    `,
    [
      input.eventId,
      input.reservationId,
      input.adminId,
      input.nextStatus,
      input.reason?.trim() ? input.reason.trim().slice(0, 280) : null,
    ]
  );

  const row = updated.rows[0];
  if (!row) throw new Error("Falha ao transicionar reserva.");
  return row;
}
