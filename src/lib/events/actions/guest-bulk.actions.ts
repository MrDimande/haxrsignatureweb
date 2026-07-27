"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as batchesRepo from "@/lib/events/repositories/guest-import-batches.repository";
import { logGuestAudit } from "@/lib/events/repositories/guest-audit.repository";
import {
  assessBulkImpact,
  assertGuestsScopedToBatch,
  assertGuestsScopedToEvent,
  buildBulkUndoPayload,
  formatBulkImpactMessage,
  planBulkSoftMutation,
} from "@/lib/events/services/guest-bulk.service";
import type { EventGuest } from "@/lib/events/types";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

function getOperatorEmail() {
  return process.env.ADMIN_EMAIL?.trim() || "admin";
}

async function loadScopedGuests(
  eventId: string,
  guestIds: string[],
  options?: { batchId?: string | null; includeArchived?: boolean }
): Promise<EventGuest[]> {
  if (!guestIds.length) throw new Error("Seleccione pelo menos um convidado.");

  const guests = await guestsRepo.listGuestsByEvent(eventId, {
    includeDeleted: false,
    includeArchived: options?.includeArchived ?? true,
  });
  const selected = guests.filter((guest) => guestIds.includes(guest.id));

  if (selected.length !== guestIds.length) {
    throw new Error(
      "Alguns convidados não foram encontrados neste evento (ou já foram removidos)."
    );
  }

  assertGuestsScopedToEvent(eventId, selected);
  if (options?.batchId) {
    assertGuestsScopedToBatch(options.batchId, selected);
  }

  return selected;
}

export async function previewBulkImpactAction(
  eventId: string,
  guestIds: string[]
) {
  return runAction(async () => {
    const selected = await loadScopedGuests(eventId, guestIds);
    const impact = assessBulkImpact(selected);
    return {
      impact,
      message: formatBulkImpactMessage(impact),
    };
  });
}

export async function bulkArchiveGuestsAction(
  eventId: string,
  guestIds: string[],
  reason = "bulk_archive"
) {
  const result = await runAction(async () => {
    const selected = await loadScopedGuests(eventId, guestIds);
    const impact = assessBulkImpact(selected);
    const undoPayload = buildBulkUndoPayload(selected);

    // Plano completo validado antes de mutações sequenciais (fail-closed).
    for (const guest of selected) {
      await guestsRepo.archiveGuest(guest.id, reason);
    }

    const auditId = await batchesRepo.insertBulkAudit({
      eventId,
      action: "bulk_archive",
      guestIds: selected.map((guest) => guest.id),
      operatorEmail: getOperatorEmail(),
      impact: impact as unknown as Record<string, unknown>,
      undoPayload,
    });

    return {
      affected: selected.length,
      impact,
      auditId,
      message: formatBulkImpactMessage(impact),
    };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkRestoreGuestsAction(
  eventId: string,
  guestIds: string[]
) {
  const result = await runAction(async () => {
    const selected = await loadScopedGuests(eventId, guestIds, {
      includeArchived: true,
    });
    const undoPayload = buildBulkUndoPayload(selected);

    for (const guest of selected) {
      await guestsRepo.restoreGuest(guest.id);
    }

    const auditId = await batchesRepo.insertBulkAudit({
      eventId,
      action: "bulk_restore",
      guestIds: selected.map((guest) => guest.id),
      operatorEmail: getOperatorEmail(),
      impact: { restored: selected.length },
      undoPayload,
    });

    return { affected: selected.length, auditId };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkMarkIncorrectGuestsAction(
  eventId: string,
  guestIds: string[]
) {
  const result = await runAction(async () => {
    const selected = await loadScopedGuests(eventId, guestIds);
    for (const guest of selected) {
      await guestsRepo.markGuestIncorrect(guest.id, true);
    }
    const auditId = await batchesRepo.insertBulkAudit({
      eventId,
      action: "bulk_mark_incorrect",
      guestIds: selected.map((guest) => guest.id),
      operatorEmail: getOperatorEmail(),
      impact: { marked: selected.length },
    });
    return { affected: selected.length, auditId };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkSoftRemoveGuestsAction(
  eventId: string,
  guestIds: string[],
  options?: { forceSoftArchiveProtected?: boolean }
) {
  const result = await runAction(async () => {
    const selected = await loadScopedGuests(eventId, guestIds);
    const plan = planBulkSoftMutation(selected, options);
    if (!plan.allowed) {
      throw new Error(plan.blockReason ?? "Operação em massa bloqueada.");
    }

    const impact = plan.impact;
    const undoPayload = buildBulkUndoPayload(selected);

    for (const guest of selected) {
      await guestsRepo.softDeleteGuest(guest.id, "bulk_soft_remove");
    }

    const auditId = await batchesRepo.insertBulkAudit({
      eventId,
      action: "bulk_soft_remove",
      guestIds: selected.map((guest) => guest.id),
      operatorEmail: getOperatorEmail(),
      impact: impact as unknown as Record<string, unknown>,
      undoPayload,
    });

    return {
      affected: selected.length,
      impact,
      auditId,
      message: formatBulkImpactMessage(impact),
    };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function bulkMoveGuestsToGroupAction(
  eventId: string,
  guestIds: string[],
  groupId: string | null
) {
  const result = await runAction(async () => {
    const selected = await loadScopedGuests(eventId, guestIds);
    for (const guest of selected) {
      await guestsRepo.updateGuest(guest.id, {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        clientType: guest.clientType,
        status: guest.status,
        seatId: guest.seatId,
        groupId,
        plusOnes: guest.plusOnes,
        dietaryNotes: guest.dietaryNotes,
        guestNotes: guest.guestNotes,
        label: guest.label,
      });
    }
    await batchesRepo.insertBulkAudit({
      eventId,
      action: "bulk_move_group",
      guestIds: selected.map((guest) => guest.id),
      operatorEmail: getOperatorEmail(),
      impact: { groupId, moved: selected.length },
    });
    return { affected: selected.length };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function removeImportBatchAction(
  eventId: string,
  batchId: string,
  options?: { forceSoftArchiveProtected?: boolean }
) {
  const result = await runAction(async () => {
    const operatorEmail = getOperatorEmail();

    // Tentar executar via RPC atómico do PostgreSQL
    try {
      const atomicResult = await batchesRepo.removeImportBatchAtomic(
        eventId,
        batchId,
        operatorEmail
      );
      return {
        affected: atomicResult.removedGuestCount,
        impact: {
          removed: atomicResult.removedGuestCount,
          alreadyRemoved: atomicResult.alreadyRemovedCount,
          protected: atomicResult.protectedCount,
        },
        auditId: atomicResult.auditId,
        message: `Lote removido com sucesso (${atomicResult.removedGuestCount} convidado(s) removidos).`,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Se for erro de função inexistente no Postgres, usar fallback legado
      if (
        !errMsg.includes("function") &&
        !errMsg.includes("schema") &&
        !errMsg.includes("does not exist")
      ) {
        throw new Error(errMsg);
      }
    }

    // Fallback de aplicação (quando a migração RPC ainda não foi aplicada)
    const batch = await batchesRepo.getImportBatchById(batchId);
    if (!batch || batch.eventId !== eventId) {
      throw new Error("Lote não encontrado neste evento.");
    }

    const guests = await guestsRepo.listGuestsByEvent(eventId, {
      includeArchived: true,
      includeDeleted: false,
    });
    const batchGuests = guests.filter(
      (guest) => guest.importBatchId === batchId
    );
    assertGuestsScopedToEvent(eventId, batchGuests);
    assertGuestsScopedToBatch(batchId, batchGuests);

    const plan = planBulkSoftMutation(batchGuests, options);
    if (!plan.allowed) {
      throw new Error(
        `Remover lote: ${plan.blockReason ?? formatBulkImpactMessage(plan.impact)}`
      );
    }

    const impact = plan.impact;
    const undoPayload = buildBulkUndoPayload(batchGuests);

    for (const guest of batchGuests) {
      await guestsRepo.softDeleteGuest(guest.id, `remove_batch:${batchId}`);
    }

    await batchesRepo.updateImportBatchTotals(batchId, eventId, {
      removedRows: batch.removedRows + batchGuests.length,
      status: "removed",
    });

    const auditId = await batchesRepo.insertBulkAudit({
      eventId,
      batchId,
      action: "remove_import_batch",
      guestIds: batchGuests.map((guest) => guest.id),
      operatorEmail: getOperatorEmail(),
      impact: impact as unknown as Record<string, unknown>,
      undoPayload,
    });

    return {
      affected: batchGuests.length,
      impact,
      auditId,
      message: formatBulkImpactMessage(impact),
    };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function undoBulkGuestAction(
  eventId: string,
  auditId: string
) {
  const result = await runAction(async () => {
    const operatorEmail = getOperatorEmail();
    const audit = await batchesRepo.getBulkAuditById(auditId, eventId);
    if (!audit) throw new Error("Registo de auditoria não encontrado.");
    if (audit.undone_at) throw new Error("Esta acção já foi desfeita.");

    // Se for uma auditoria de remoção de lote, tentar o undo atómico por RPC
    if (audit.action === "remove_import_batch") {
      try {
        const atomicUndo = await batchesRepo.undoImportBatchRemovalAtomic(
          eventId,
          auditId,
          operatorEmail
        );
        return { restored: atomicUndo.restoredGuestCount };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (
          !errMsg.includes("function") &&
          !errMsg.includes("schema") &&
          !errMsg.includes("does not exist")
        ) {
          throw new Error(errMsg);
        }
      }
    }

    // Fallback legado para outras acções de bulk ou se o RPC não estiver disponível
    const payload = audit.undo_payload as {
      guests?: Array<{
        id: string;
        archivedAt: string | null;
        archiveReason: string;
        deletedAt: string | null;
        isIncorrect: boolean;
      }>;
    } | null;

    if (!payload?.guests?.length) {
      throw new Error("Esta acção não tem undo disponível.");
    }

    const supabaseGuests = await guestsRepo.listGuestsByEvent(eventId, {
      includeArchived: true,
      includeDeleted: true,
    });

    let restored = 0;
    for (const snapshot of payload.guests) {
      const current = supabaseGuests.find((guest) => guest.id === snapshot.id);
      if (!current || current.eventId !== eventId) continue;

      if (
        snapshot.archivedAt === null &&
        snapshot.deletedAt === null &&
        !snapshot.isIncorrect
      ) {
        await guestsRepo.restoreGuest(snapshot.id);
        restored++;
      } else if (snapshot.archivedAt) {
        await guestsRepo.archiveGuest(
          snapshot.id,
          snapshot.archiveReason || "undo_restore_archive"
        );
        restored++;
      }

      await logGuestAudit(
        snapshot.id,
        eventId,
        current.name,
        "Undo acção em massa",
        audit.action
      );
    }

    await batchesRepo.markBulkAuditUndone(auditId, eventId);
    return { restored };
  });

  if (result.success) revalidateEvent(eventId);
  return result;
}
