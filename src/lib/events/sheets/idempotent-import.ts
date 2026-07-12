/**
 * Import idempotente com ledger — partilhado por Google Sheets sync e CSV upload.
 */

import { randomUUID } from "node:crypto";
import { findGuestMatch } from "@/lib/events/sheets/match";
import {
  buildSheetRowFingerprintBundle,
  type SheetImportSource,
} from "@/lib/events/sheets/fingerprint";
import * as ledgerRepo from "@/lib/events/sheets/sync-ledger.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import {
  findResolutionCandidateForImport,
} from "@/lib/events/repositories/guest-duplicate-resolutions.repository";
import {
  planDuplicateResolutionImport,
} from "@/lib/events/duplicate-resolution-plan";
import type { EventGuest, SheetsSyncMode } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";
import {
  mapSheetSourceToPartySource,
  persistPartyParseForGuest,
} from "@/lib/events/repositories/guest-party-members.repository";
import {
  mapSheetImportSourceToContactSource,
  safeSyncGuestContactProfile,
} from "@/lib/events/repositories/event-contact-profiles.repository";

async function persistPartySuggestionsFromRow(
  ctx: IdempotentImportContext,
  guestId: string,
  row: SheetGuestRow
): Promise<void> {
  if (!row.partyParse?.needsReview) return;
  await persistPartyParseForGuest(
    ctx.eventId,
    guestId,
    row.partyParse,
    mapSheetSourceToPartySource(ctx.source)
  );
}

async function persistContactFromGuest(
  ctx: IdempotentImportContext,
  guest: EventGuest
): Promise<void> {
  await safeSyncGuestContactProfile({
    eventId: ctx.eventId,
    guest,
    source: mapSheetImportSourceToContactSource(ctx.source),
    metadata: { syncBatchId: ctx.syncBatchId },
  });
}

export type IdempotentImportContext = {
  eventId: string;
  source: SheetImportSource;
  syncBatchId: string;
  syncMode: SheetsSyncMode;
  sourceUrl?: string | null;
  sourceGid?: string | null;
  sourceFileName?: string | null;
  existingGuests: EventGuest[];
  usedIds: Set<string>;
};

export type IdempotentRowResult =
  | {
      kind: "created";
      guest: EventGuest;
      fingerprint: string;
      importRowsSeen: true;
      fingerprintsCreated: boolean;
      ledgerMatched: false;
      ledgerSkipped: false;
    }
  | {
      kind: "updated";
      guest: EventGuest;
      fingerprint: string;
      importRowsSeen: true;
      fingerprintsCreated: boolean;
      ledgerMatched: boolean;
      ledgerSkipped: false;
    }
  | {
      kind: "skipped";
      fingerprint: string;
      reason: string;
      importRowsSeen: true;
      fingerprintsCreated: boolean;
      ledgerMatched: false;
      ledgerSkipped: true;
    };

export type IdempotentImportStats = {
  importRowsSeen: number;
  fingerprintsCreated: number;
  ledgerMatched: number;
  ledgerSkipped: number;
};

export function createSyncBatchId(): string {
  return randomUUID();
}

export function createEmptyIdempotentStats(): IdempotentImportStats {
  return {
    importRowsSeen: 0,
    fingerprintsCreated: 0,
    ledgerMatched: 0,
    ledgerSkipped: 0,
  };
}

export function mergeIdempotentStats(
  target: IdempotentImportStats,
  row: Pick<
    IdempotentRowResult,
    | "importRowsSeen"
    | "fingerprintsCreated"
    | "ledgerMatched"
    | "ledgerSkipped"
  >
): void {
  if (row.importRowsSeen) target.importRowsSeen++;
  if (row.fingerprintsCreated) target.fingerprintsCreated++;
  if (row.ledgerMatched) target.ledgerMatched++;
  if (row.ledgerSkipped) target.ledgerSkipped++;
}

export type ImportPlan =
  | { type: "ledger_update"; guestId: string }
  | { type: "skip_deleted"; reason: string }
  | { type: "admin_ignored"; reason: string }
  | { type: "admin_resolved"; reason: string }
  | { type: "match_update"; guestId: string }
  | { type: "create_new" };

const CLOSED_LEDGER_IMPORT_REASONS = new Set([
  "admin_ignored",
  "admin_resolved",
]);

/** Lógica pura de decisão — usada em testes e por processImportRowWithLedger. */
export function resolveImportPlan(input: {
  ledgerGuestId: string | null;
  ledgerExists: boolean;
  ledgerAction: string | null;
  ledgerReason?: string | null;
  linkedGuestExists: boolean;
  matchGuestId: string | null;
}): ImportPlan {
  if (
    input.ledgerExists &&
    input.ledgerReason &&
    CLOSED_LEDGER_IMPORT_REASONS.has(input.ledgerReason)
  ) {
    if (input.ledgerReason === "admin_ignored") {
      return { type: "admin_ignored", reason: "admin_ignored" };
    }
    return { type: "admin_resolved", reason: "admin_resolved" };
  }

  if (input.ledgerGuestId) {
    if (input.linkedGuestExists) {
      return { type: "ledger_update", guestId: input.ledgerGuestId };
    }
    return { type: "skip_deleted", reason: "guest_deleted_or_missing" };
  }

  if (
    input.ledgerExists &&
    input.ledgerAction &&
    !["skipped", "ignored", "error"].includes(input.ledgerAction)
  ) {
    return { type: "skip_deleted", reason: "guest_deleted_or_missing" };
  }

  if (input.matchGuestId) {
    return { type: "match_update", guestId: input.matchGuestId };
  }
  return { type: "create_new" };
}

async function recordImportRow(
  ctx: IdempotentImportContext,
  row: SheetGuestRow,
  fingerprint: string,
  normalized: ReturnType<typeof buildSheetRowFingerprintBundle>["normalized"]
): Promise<void> {
  await ledgerRepo.upsertImportRow({
    eventId: ctx.eventId,
    source: ctx.source,
    rowFingerprint: fingerprint,
    rowPayload: row,
    normalized,
    syncBatchId: ctx.syncBatchId,
    sourceUrl: ctx.sourceUrl,
    sourceGid: ctx.sourceGid,
    sourceFileName: ctx.sourceFileName,
    sourceRowNumber: row.rowNumber,
  });
}

/**
 * Processa uma linha com fingerprint + ledger antes de criar convidado novo.
 */
export async function processImportRowWithLedger(
  ctx: IdempotentImportContext,
  row: SheetGuestRow
): Promise<IdempotentRowResult> {
  const { fingerprint, normalized } = buildSheetRowFingerprintBundle({
    eventId: ctx.eventId,
    source: ctx.source,
    name: row.name,
    email: row.email,
    phone: row.phone,
    plusOnes: row.plusOnes,
    groupName: row.groupName,
  });

  const existingLedger = await ledgerRepo.getLedgerByFingerprint(
    ctx.eventId,
    ctx.source,
    fingerprint
  );
  const fingerprintsCreated = !existingLedger;

  await recordImportRow(ctx, row, fingerprint, normalized);

  if (existingLedger?.reason && CLOSED_LEDGER_IMPORT_REASONS.has(existingLedger.reason)) {
    await ledgerRepo.upsertLedgerAction({
      eventId: ctx.eventId,
      source: ctx.source,
      rowFingerprint: fingerprint,
      guestId: existingLedger.guest_id,
      action: existingLedger.action === "ignored" ? "ignored" : "skipped",
      reason: existingLedger.reason,
      syncBatchId: ctx.syncBatchId,
      rowPayload: row,
    });
    return {
      kind: "skipped",
      fingerprint,
      reason:
        existingLedger.reason === "admin_ignored"
          ? "Linha ignorada pelo admin — não será recriada."
          : "Linha marcada como resolvida pelo admin.",
      importRowsSeen: true,
      fingerprintsCreated,
      ledgerMatched: false,
      ledgerSkipped: true,
    };
  }

  if (
    existingLedger &&
    !existingLedger.guest_id &&
    existingLedger.action &&
    !["skipped", "ignored", "error"].includes(existingLedger.action)
  ) {
    await ledgerRepo.upsertLedgerAction({
      eventId: ctx.eventId,
      source: ctx.source,
      rowFingerprint: fingerprint,
      guestId: null,
      action: "skipped",
      reason: "guest_deleted_or_missing",
      syncBatchId: ctx.syncBatchId,
      rowPayload: row,
    });
    return {
      kind: "skipped",
      fingerprint,
      reason:
        "Convidado ligado ao ledger foi removido — linha ignorada (revisão futura).",
      importRowsSeen: true,
      fingerprintsCreated,
      ledgerMatched: false,
      ledgerSkipped: true,
    };
  }

  if (existingLedger?.guest_id) {
    const linked = await guestsRepo.getGuestById(existingLedger.guest_id);
    if (!linked || linked.eventId !== ctx.eventId) {
      await ledgerRepo.upsertLedgerAction({
        eventId: ctx.eventId,
        source: ctx.source,
        rowFingerprint: fingerprint,
        guestId: null,
        action: "skipped",
        reason: "guest_deleted_or_missing",
        syncBatchId: ctx.syncBatchId,
        rowPayload: row,
      });
      return {
        kind: "skipped",
        fingerprint,
        reason:
          "Convidado ligado ao ledger foi removido — linha ignorada (revisão futura).",
        importRowsSeen: true,
        fingerprintsCreated,
        ledgerMatched: false,
        ledgerSkipped: true,
      };
    }

    ctx.usedIds.add(linked.id);
    const updated = await guestsRepo.updateGuestFromSheet(
      linked.id,
      row,
      ctx.syncMode
    );
    const idx = ctx.existingGuests.findIndex((g) => g.id === linked.id);
    if (idx >= 0) ctx.existingGuests[idx] = updated;
    else ctx.existingGuests.push(updated);

    await ledgerRepo.upsertLedgerAction({
      eventId: ctx.eventId,
      source: ctx.source,
      rowFingerprint: fingerprint,
      guestId: linked.id,
      action: "updated",
      reason: "ledger_guest_reused",
      syncBatchId: ctx.syncBatchId,
      rowPayload: row,
    });

    await persistPartySuggestionsFromRow(ctx, updated.id, row);
    await persistContactFromGuest(ctx, updated);

    return {
      kind: "updated",
      guest: updated,
      fingerprint,
      importRowsSeen: true,
      fingerprintsCreated,
      ledgerMatched: true,
      ledgerSkipped: false,
    };
  }

  const match = findGuestMatch(ctx.existingGuests, row, ctx.usedIds);

  if (match) {
    ctx.usedIds.add(match.id);
    const updated = await guestsRepo.updateGuestFromSheet(
      match.id,
      row,
      ctx.syncMode
    );
    const idx = ctx.existingGuests.findIndex((g) => g.id === match.id);
    if (idx >= 0) ctx.existingGuests[idx] = updated;
    else ctx.existingGuests.push(updated);

    await ledgerRepo.upsertLedgerAction({
      eventId: ctx.eventId,
      source: ctx.source,
      rowFingerprint: fingerprint,
      guestId: match.id,
      action: "matched",
      reason: "findGuestMatch",
      syncBatchId: ctx.syncBatchId,
      rowPayload: row,
    });

    await persistPartySuggestionsFromRow(ctx, updated.id, row);
    await persistContactFromGuest(ctx, updated);

    return {
      kind: "updated",
      guest: updated,
      fingerprint,
      importRowsSeen: true,
      fingerprintsCreated,
      ledgerMatched: false,
      ledgerSkipped: false,
    };
  }

  const resolutionCandidate = await findResolutionCandidateForImport({
    eventId: ctx.eventId,
    fingerprint,
    normalizedEmail: normalized.normalizedEmail,
    normalizedPhone: normalized.normalizedPhone,
    normalizedName: normalized.normalizedName,
  });

  if (resolutionCandidate) {
    const primary = await guestsRepo.getGuestById(
      resolutionCandidate.primaryGuestId
    );
    const resolutionPlan = planDuplicateResolutionImport(
      resolutionCandidate,
      Boolean(primary && primary.eventId === ctx.eventId)
    );

    if (resolutionPlan.type === "use_primary" && primary) {
      ctx.usedIds.add(primary.id);
      const updated = await guestsRepo.updateGuestFromSheet(
        primary.id,
        row,
        ctx.syncMode
      );
      const idx = ctx.existingGuests.findIndex((g) => g.id === primary.id);
      if (idx >= 0) ctx.existingGuests[idx] = updated;
      else ctx.existingGuests.push(updated);

      await ledgerRepo.upsertLedgerAction({
        eventId: ctx.eventId,
        source: ctx.source,
        rowFingerprint: fingerprint,
        guestId: primary.id,
        action: "matched",
        reason: resolutionPlan.reason,
        syncBatchId: ctx.syncBatchId,
        rowPayload: row,
      });

      await persistPartySuggestionsFromRow(ctx, updated.id, row);
      await persistContactFromGuest(ctx, updated);

      return {
        kind: "updated",
        guest: updated,
        fingerprint,
        importRowsSeen: true,
        fingerprintsCreated,
        ledgerMatched: true,
        ledgerSkipped: false,
      };
    }

    if (resolutionPlan.type === "ignored") {
      await ledgerRepo.upsertLedgerAction({
        eventId: ctx.eventId,
        source: ctx.source,
        rowFingerprint: fingerprint,
        guestId: null,
        action: "ignored",
        reason: resolutionPlan.reason,
        syncBatchId: ctx.syncBatchId,
        rowPayload: row,
      });

      return {
        kind: "skipped",
        fingerprint,
        reason: "Linha ignorada — duplicado resolvido anteriormente pelo admin.",
        importRowsSeen: true,
        fingerprintsCreated,
        ledgerMatched: false,
        ledgerSkipped: true,
      };
    }

    const skipReason =
      resolutionPlan.type === "primary_missing"
        ? "Convidado principal da resolução foi removido — linha ignorada."
        : "Duplicado marcado para revisão — linha ignorada.";

    const ledgerReason =
      resolutionPlan.type === "primary_missing"
        ? resolutionPlan.reason
        : resolutionPlan.type === "needs_review"
          ? resolutionPlan.reason
          : "duplicate_resolution_skipped";

    await ledgerRepo.upsertLedgerAction({
      eventId: ctx.eventId,
      source: ctx.source,
      rowFingerprint: fingerprint,
      guestId: null,
      action: "skipped",
      reason: ledgerReason,
      syncBatchId: ctx.syncBatchId,
      rowPayload: row,
    });

    return {
      kind: "skipped",
      fingerprint,
      reason: skipReason,
      importRowsSeen: true,
      fingerprintsCreated,
      ledgerMatched: false,
      ledgerSkipped: true,
    };
  }

  const created = await guestsRepo.createGuestFromSheet(
    ctx.eventId,
    row,
    ctx.syncMode
  );
  ctx.existingGuests.push(created);

  await ledgerRepo.upsertLedgerAction({
    eventId: ctx.eventId,
    source: ctx.source,
    rowFingerprint: fingerprint,
    guestId: created.id,
    action: "created",
    reason: "new_guest",
    syncBatchId: ctx.syncBatchId,
    rowPayload: row,
  });

  await persistPartySuggestionsFromRow(ctx, created.id, row);
  await persistContactFromGuest(ctx, created);

  return {
    kind: "created",
    guest: created,
    fingerprint,
    importRowsSeen: true,
    fingerprintsCreated,
    ledgerMatched: false,
    ledgerSkipped: false,
  };
}
