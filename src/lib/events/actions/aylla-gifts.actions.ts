"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import { requireActiveAdminIdentity } from "@/lib/admin/admin-identity.server";
import { isAdminUserActive } from "@/lib/admin/admin-user";
import { AYLLA_GIFTS_CONFIG } from "@/lib/edition/gifts/aylla/config";
import { findAyllaCatalogItem } from "@/lib/edition/gifts/aylla/catalog-items";
import {
  transitionAyllaGiftReservationAdmin,
  updateAyllaGiftInventoryAdmin,
} from "@/lib/edition/gifts/aylla/admin-store";
import type { AyllaGiftReservationStatus } from "@/lib/edition/gifts/aylla/types";

const PERMITTED_ROLES = new Set(["OWNER", "ADMIN", "EVENT_MANAGER"]);

async function requireAuthorizedGiftAdmin(eventId: string): Promise<string> {
  if (eventId !== AYLLA_GIFTS_CONFIG.eventId) {
    throw new Error("Evento não autorizado para gestão do catálogo Baby Aylla.");
  }

  const identity = await requireActiveAdminIdentity();
  if (
    !identity.isPersisted ||
    !identity.id ||
    !isAdminUserActive(identity) ||
    !PERMITTED_ROLES.has(identity.role)
  ) {
    throw new Error("Identidade administrativa activa (OWNER/ADMIN/EVENT_MANAGER) obrigatória.");
  }

  return identity.id;
}

export async function updateAyllaGiftInventoryAction(input: {
  eventId: string;
  itemId: string;
  familyApproved: boolean;
  enabled: boolean;
  approvedQuantity: number | null;
  specificationsComplete: boolean;
  childSafetyValidated: boolean;
}) {
  return runAction(async () => {
    const adminId = await requireAuthorizedGiftAdmin(input.eventId);

    if (!findAyllaCatalogItem(input.itemId)) {
      throw new Error("Artigo não pertence aos 52 itens canónicos da Baby Aylla.");
    }

    const updated = await updateAyllaGiftInventoryAdmin({
      ...input,
      adminId,
    });

    revalidatePath(`/admin/events/${input.eventId}`);
    return updated;
  });
}

export async function transitionAyllaGiftReservationAction(input: {
  eventId: string;
  reservationId: string;
  nextStatus: AyllaGiftReservationStatus;
  reason?: string;
}) {
  return runAction(async () => {
    const adminId = await requireAuthorizedGiftAdmin(input.eventId);

    const updated = await transitionAyllaGiftReservationAdmin({
      ...input,
      adminId,
    });

    revalidatePath(`/admin/events/${input.eventId}`);
    return updated;
  });
}
