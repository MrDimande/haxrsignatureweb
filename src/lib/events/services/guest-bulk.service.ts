import type { EventGuest } from "@/lib/events/types";

export type GuestProtectionFlag =
  | "rsvp"
  | "seat"
  | "check_in"
  /** Convite/campanha já enviada (`invite_sent_at`). */
  | "campaign";

export type GuestBulkImpact = {
  total: number;
  protectedCount: number;
  unprotectedCount: number;
  byFlag: Record<GuestProtectionFlag, number>;
  protectedGuestIds: string[];
  unprotectedGuestIds: string[];
  canHardDelete: boolean;
  recommendedAction: "soft_archive" | "block_hard_delete";
};

/** Plano transaccional em memória: validar tudo antes de mutar. */
export type BulkMutationPlan = {
  guestIds: string[];
  impact: GuestBulkImpact;
  allowed: boolean;
  blockReason?: string;
};

export function getGuestProtectionFlags(guest: EventGuest): GuestProtectionFlag[] {
  const flags: GuestProtectionFlag[] = [];

  if (
    guest.status === "confirmed" ||
    guest.status === "declined" ||
    guest.guestSource === "edition_rsvp" ||
    guest.guestSource === "sheet_rsvp"
  ) {
    flags.push("rsvp");
  }

  if (guest.seatId) flags.push("seat");
  if (guest.status === "checked_in" || guest.checkedInAt) flags.push("check_in");
  if (guest.inviteSentAt) flags.push("campaign");

  return flags;
}

/**
 * Valida o conjunto completo antes de qualquer escrita.
 * Soft archive/remove só avança se `allowed`; hard delete nunca quando há protegidos.
 */
export function planBulkSoftMutation(
  guests: EventGuest[],
  options?: { forceSoftArchiveProtected?: boolean }
): BulkMutationPlan {
  const impact = assessBulkImpact(guests);
  const guestIds = guests.map((guest) => guest.id);

  if (impact.protectedCount > 0 && !options?.forceSoftArchiveProtected) {
    return {
      guestIds,
      impact,
      allowed: false,
      blockReason: `Impacto: ${formatBulkImpactMessage(impact)}. Confirme arquivo suave dos protegidos (RSVP/lugar/check-in/campanha) — hard delete bloqueado.`,
    };
  }

  return { guestIds, impact, allowed: true };
}

export function assertGuestsScopedToEvent(
  eventId: string,
  guests: EventGuest[]
): void {
  const foreign = guests.find((guest) => guest.eventId !== eventId);
  if (foreign) {
    throw new Error(
      "Operação bloqueada: convidado fora do event_id do evento activo."
    );
  }
}

export function assertGuestsScopedToBatch(
  batchId: string | null | undefined,
  guests: EventGuest[]
): void {
  if (!batchId) return;
  const foreign = guests.find((guest) => guest.importBatchId !== batchId);
  if (foreign) {
    throw new Error(
      "Operação bloqueada: lote A não pode afectar convidados do lote B."
    );
  }
}

export function assessBulkImpact(guests: EventGuest[]): GuestBulkImpact {
  const byFlag: Record<GuestProtectionFlag, number> = {
    rsvp: 0,
    seat: 0,
    check_in: 0,
    campaign: 0,
  };

  const protectedGuestIds: string[] = [];
  const unprotectedGuestIds: string[] = [];

  for (const guest of guests) {
    const flags = getGuestProtectionFlags(guest);
    if (flags.length) {
      protectedGuestIds.push(guest.id);
      for (const flag of flags) byFlag[flag] += 1;
    } else {
      unprotectedGuestIds.push(guest.id);
    }
  }

  const protectedCount = protectedGuestIds.length;
  return {
    total: guests.length,
    protectedCount,
    unprotectedCount: unprotectedGuestIds.length,
    byFlag,
    protectedGuestIds,
    unprotectedGuestIds,
    canHardDelete: protectedCount === 0,
    recommendedAction:
      protectedCount > 0 ? "block_hard_delete" : "soft_archive",
  };
}

export function formatBulkImpactMessage(impact: GuestBulkImpact): string {
  if (!impact.total) return "Nenhum convidado seleccionado.";
  const parts = [
    `${impact.total} seleccionado${impact.total === 1 ? "" : "s"}`,
    `${impact.protectedCount} com protecção (RSVP/lugar/check-in/campanha)`,
    `${impact.unprotectedCount} sem protecção`,
  ];
  return parts.join(" · ");
}

/** Snapshot para undo — contrato estável do audit. */
export function buildBulkUndoPayload(guests: EventGuest[]): {
  guests: Array<{
    id: string;
    archivedAt: string | null;
    archiveReason: string;
    deletedAt: string | null;
    isIncorrect: boolean;
  }>;
} {
  return {
    guests: guests.map((guest) => ({
      id: guest.id,
      archivedAt: guest.archivedAt,
      archiveReason: guest.archiveReason,
      deletedAt: guest.deletedAt,
      isIncorrect: guest.isIncorrect,
    })),
  };
}
