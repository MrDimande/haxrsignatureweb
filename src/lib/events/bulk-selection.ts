/**
 * Selecção em massa — helpers puros (sem I/O).
 * event_id é obrigatório em todos os filtros; nunca atravessar eventos/lotes.
 */

import type { EventGuest, GuestSource, GuestStatus } from "@/lib/events/types";

export type BulkSelectionMode = "individual" | "page" | "all_results";

export type BulkGuestFilters = {
  /** Obrigatório — isolamento por evento */
  eventId: string;
  /** all | none (sem lote) | uuid do lote */
  batchId?: string | "all" | "none";
  source?: GuestSource | "all";
  status?: GuestStatus | "all";
  includeArchived?: boolean;
  search?: string;
};

export type BulkSelectionInput = {
  eventId: string;
  mode: BulkSelectionMode;
  /** IDs individuais (mode=individual) ou acumulados */
  guestIds?: string[];
  /** Página visível (mode=page) */
  pageGuestIds?: string[];
  /** Todos os resultados filtrados (mode=all_results) */
  filteredGuestIds?: string[];
};

/**
 * Filtra convidados com event_id obrigatório e filtros de lote/origem/estado.
 * Lote A nunca inclui convidados do lote B.
 */
export function filterGuestsForBulk(
  guests: EventGuest[],
  filters: BulkGuestFilters
): EventGuest[] {
  const eventId = filters.eventId?.trim();
  if (!eventId) {
    throw new Error("event_id é obrigatório em filtros de selecção em massa.");
  }

  let rows = guests.filter((guest) => guest.eventId === eventId);

  if (!filters.includeArchived) {
    rows = rows.filter((guest) => !guest.archivedAt && !guest.deletedAt);
  }

  const batch = filters.batchId ?? "all";
  if (batch === "none") {
    rows = rows.filter((guest) => !guest.importBatchId);
  } else if (batch !== "all") {
    rows = rows.filter((guest) => guest.importBatchId === batch);
  }

  if (filters.source && filters.source !== "all") {
    rows = rows.filter((guest) => guest.guestSource === filters.source);
  }

  if (filters.status && filters.status !== "all") {
    rows = rows.filter((guest) => guest.status === filters.status);
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (guest) =>
        guest.name.toLowerCase().includes(search) ||
        guest.email.toLowerCase().includes(search) ||
        guest.phone.includes(search)
    );
  }

  return rows;
}

/** Resolve IDs seleccionados segundo o modo (individual / página / todos resultados). */
export function resolveBulkSelection(input: BulkSelectionInput): string[] {
  if (input.eventId.trim() === "") {
    throw new Error("event_id é obrigatório na selecção em massa.");
  }

  switch (input.mode) {
    case "individual":
      return uniqueIds(input.guestIds ?? []);
    case "page":
      return uniqueIds(input.pageGuestIds ?? []);
    case "all_results":
      return uniqueIds(input.filteredGuestIds ?? []);
    default: {
      const _exhaustive: never = input.mode;
      throw new Error(`Modo de selecção desconhecido: ${_exhaustive}`);
    }
  }
}

/**
 * Garante que os IDs seleccionados pertencem ao event_id e, se indicado, ao lote.
 */
export function assertSelectionWithinScope(
  eventId: string,
  guests: EventGuest[],
  selectedIds: string[],
  batchId?: string | null
): EventGuest[] {
  const byId = new Map(guests.map((guest) => [guest.id, guest]));
  const selected: EventGuest[] = [];

  for (const id of selectedIds) {
    const guest = byId.get(id);
    if (!guest) {
      throw new Error(`Convidado ${id} não encontrado no âmbito do evento.`);
    }
    if (guest.eventId !== eventId) {
      throw new Error("Selecção atravessa event_id — operação bloqueada.");
    }
    if (batchId && guest.importBatchId !== batchId) {
      throw new Error("Lote A não pode afectar convidados do lote B.");
    }
    selected.push(guest);
  }

  return selected;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}
