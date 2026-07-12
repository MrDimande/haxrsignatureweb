/**
 * Acções da fila de revisão RSVP — mutações seguras com audit log.
 */

import {
  parseReviewItemId,
  parseRowPayloadFromUnknown,
} from "@/lib/events/services/guest-review-queue.service";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import {
  createDuplicateResolution,
  getDuplicateResolutionById,
  updateDuplicateResolution,
} from "@/lib/events/repositories/guest-duplicate-resolutions.repository";
import {
  getLedgerById,
  updateLedgerById,
} from "@/lib/events/sheets/sync-ledger.repository";
import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import {
  mapSheetImportSourceToContactSource,
  safeSyncGuestContactProfile,
  type EventContactSource,
} from "@/lib/events/repositories/event-contact-profiles.repository";
import { buildSheetRowFingerprint } from "@/lib/events/sheets/fingerprint";
import type { SheetImportSource } from "@/lib/events/sheets/fingerprint";
import type { SheetGuestRow } from "@/lib/events/sheets/types";
import type { EventGuest } from "@/lib/events/types";

async function auditReviewAction(
  eventId: string,
  guestId: string | null,
  guestName: string,
  action: string,
  details: string
): Promise<void> {
  await logGuestAudit(
    guestId ?? "",
    eventId,
    guestName || "Revisão RSVP",
    action,
    details
  );
}

async function resolveTechnicalPrimaryGuestId(
  eventId: string,
  preferredId?: string | null
): Promise<string> {
  if (preferredId) {
    const guest = await guestsRepo.getGuestById(preferredId);
    if (guest?.eventId === eventId) return guest.id;
  }
  const guests = await guestsRepo.listGuestsByEvent(eventId);
  if (!guests[0]) {
    throw new Error(
      "Não há convidados no evento — restaure ou crie um convidado antes desta acção."
    );
  }
  return guests[0].id;
}

function resolutionIdentityFromPayload(
  eventId: string,
  source: SheetImportSource,
  row: SheetGuestRow,
  fingerprint?: string | null
) {
  return {
    duplicateFingerprint:
      fingerprint ??
      buildSheetRowFingerprint({
        eventId,
        source,
        name: row.name,
        email: row.email,
        phone: row.phone,
        plusOnes: row.plusOnes,
        groupName: row.groupName,
      }),
    duplicateName: row.name,
    duplicateEmail: row.email,
    duplicatePhone: row.phone,
  };
}

export async function attachReviewItemToGuest(
  eventId: string,
  itemId: string,
  targetGuestId: string,
  resolvedBy = "admin"
): Promise<EventGuest> {
  const target = await guestsRepo.getGuestById(targetGuestId);
  if (!target || target.eventId !== eventId) {
    throw new Error("Convidado de destino não encontrado neste evento.");
  }

  const { source, sourceId } = parseReviewItemId(itemId);
  let contactSource: EventContactSource = "admin";

  if (source === "deduplication") {
    throw new Error(
      "Use o painel «Fundir duplicados» para clusters de nomes iguais."
    );
  }

  if (source === "ledger") {
    const ledger = await getLedgerById(sourceId);
    if (!ledger || ledger.event_id !== eventId) {
      throw new Error("Registo de ledger não encontrado.");
    }

    const payload = parseRowPayloadFromUnknown(ledger.row_payload);
    if (payload) {
      await guestsRepo.updateGuestFromSheet(targetGuestId, payload);
    }

    const sheetSource = ledger.source as SheetImportSource;
    contactSource = mapSheetImportSourceToContactSource(sheetSource);
    if (payload) {
      await createDuplicateResolution({
        eventId,
        primaryGuestId: targetGuestId,
        duplicateGuestId: null,
        ...resolutionIdentityFromPayload(
          eventId,
          sheetSource,
          payload,
          ledger.row_fingerprint
        ),
        source: "admin",
        resolutionStatus: "merged",
        resolvedBy,
        notes: "admin_attached",
      });
    }

    await updateLedgerById(ledger.id, {
      guestId: targetGuestId,
      action: "matched",
      reason: "admin_attached",
      rowPayload: payload,
    });
  } else {
    const resolution = await getDuplicateResolutionById(sourceId);
    if (!resolution || resolution.event_id !== eventId) {
      throw new Error("Resolução de duplicado não encontrada.");
    }

    await updateDuplicateResolution(resolution.id, {
      resolutionStatus: "merged",
      primaryGuestId: targetGuestId,
      resolvedBy,
      notes: "admin_attached",
    });
  }

  const updated = await guestsRepo.getGuestById(targetGuestId);
  if (!updated) throw new Error("Falha ao associar revisão.");

  await auditReviewAction(
    eventId,
    targetGuestId,
    updated.name,
    "Revisão RSVP — associado",
    `Item ${itemId} associado ao convidado principal.`
  );

  await safeSyncGuestContactProfile({
    eventId,
    guest: updated,
    source: contactSource,
  });

  return updated;
}

export async function ignoreReviewItem(
  eventId: string,
  itemId: string,
  resolvedBy = "admin"
): Promise<void> {
  const { source, sourceId } = parseReviewItemId(itemId);
  let displayName = "Revisão";

  if (source === "ledger") {
    const ledger = await getLedgerById(sourceId);
    if (!ledger || ledger.event_id !== eventId) {
      throw new Error("Registo de ledger não encontrado.");
    }

    const payload = parseRowPayloadFromUnknown(ledger.row_payload);
    displayName = payload?.name ?? displayName;

    await updateLedgerById(ledger.id, {
      action: "ignored",
      reason: "admin_ignored",
    });

    if (payload) {
      const sheetSource = ledger.source as SheetImportSource;
      const primaryGuestId = await resolveTechnicalPrimaryGuestId(
        eventId,
        ledger.guest_id
      );
      await createDuplicateResolution({
        eventId,
        primaryGuestId,
        duplicateGuestId: null,
        ...resolutionIdentityFromPayload(
          eventId,
          sheetSource,
          payload,
          ledger.row_fingerprint
        ),
        source: "admin",
        resolutionStatus: "ignored",
        resolvedBy,
        notes: "admin_ignored",
      });
    }
  } else if (source === "duplicate_resolution") {
    await updateDuplicateResolution(sourceId, {
      resolutionStatus: "ignored",
      resolvedBy,
      notes: "admin_ignored",
    });
  } else {
    await auditReviewAction(
      eventId,
      null,
      sourceId,
      "Revisão RSVP — resolvido",
      `Cluster «${sourceId}» marcado como tratado manualmente.`
    );
    return;
  }

  await auditReviewAction(
    eventId,
    null,
    displayName,
    "Revisão RSVP — ignorado",
    `Item ${itemId} ignorado para syncs futuros.`
  );
}

export async function restoreGuestFromReviewItem(
  eventId: string,
  itemId: string,
  resolvedBy = "admin"
): Promise<EventGuest> {
  const { source, sourceId } = parseReviewItemId(itemId);

  if (source !== "ledger") {
    throw new Error("Restaurar só está disponível para linhas de import/sync.");
  }

  const ledger = await getLedgerById(sourceId);
  if (!ledger || ledger.event_id !== eventId) {
    throw new Error("Registo de ledger não encontrado.");
  }

  const payload = parseRowPayloadFromUnknown(ledger.row_payload);
  if (!payload?.name?.trim()) {
    throw new Error(
      "Payload da linha não contém dados suficientes para restaurar."
    );
  }

  const created = await guestsRepo.createGuestFromSheet(eventId, payload);

  await updateLedgerById(ledger.id, {
    guestId: created.id,
    action: "created",
    reason: "admin_restored",
    rowPayload: payload,
  });

  const sheetSource = ledger.source as SheetImportSource;
  await createDuplicateResolution({
    eventId,
    primaryGuestId: created.id,
    duplicateGuestId: created.id,
    ...resolutionIdentityFromPayload(
      eventId,
      sheetSource,
      payload,
      ledger.row_fingerprint
    ),
    source: "admin",
    resolutionStatus: "restored",
    resolvedBy,
    notes: "admin_restored",
  });

  await auditReviewAction(
    eventId,
    created.id,
    created.name,
    "Revisão RSVP — restaurado",
    `Convidado criado a partir do item ${itemId}.`
  );

  await safeSyncGuestContactProfile({
    eventId,
    guest: created,
    source: mapSheetImportSourceToContactSource(sheetSource),
  });

  return created;
}

export async function markReviewItemNeedsReview(
  eventId: string,
  itemId: string,
  resolvedBy = "admin"
): Promise<void> {
  const { source, sourceId } = parseReviewItemId(itemId);

  if (source === "ledger") {
    const ledger = await getLedgerById(sourceId);
    if (!ledger || ledger.event_id !== eventId) {
      throw new Error("Registo de ledger não encontrado.");
    }
    await updateLedgerById(ledger.id, {
      action: "skipped",
      reason: "duplicate_resolution_needs_review",
    });
  } else if (source === "duplicate_resolution") {
    await updateDuplicateResolution(sourceId, {
      resolutionStatus: "needs_review",
      resolvedBy,
      notes: "needs_review",
    });
  }

  await auditReviewAction(
    eventId,
    null,
    sourceId,
    "Revisão RSVP — em revisão",
    `Item ${itemId} mantido em revisão.`
  );
}

export async function markReviewItemResolved(
  eventId: string,
  itemId: string,
  resolvedBy = "admin"
): Promise<void> {
  const { source, sourceId } = parseReviewItemId(itemId);

  if (source === "ledger") {
    const ledger = await getLedgerById(sourceId);
    if (!ledger || ledger.event_id !== eventId) {
      throw new Error("Registo de ledger não encontrado.");
    }
    await updateLedgerById(ledger.id, {
      reason: "admin_resolved",
    });
  } else if (source === "duplicate_resolution") {
    await updateDuplicateResolution(sourceId, {
      resolutionStatus: "merged",
      resolvedBy,
      notes: "admin_resolved",
    });
  }

  await auditReviewAction(
    eventId,
    null,
    sourceId,
    "Revisão RSVP — resolvido",
    `Item ${itemId} marcado como resolvido pelo admin.`
  );
}
