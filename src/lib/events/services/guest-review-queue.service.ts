/**
 * Fila de revisão RSVP — agrega ledger, resoluções de duplicados e clusters.
 */

import { buildDuplicateClusters } from "@/lib/events/deduplication";
import { normalizeGuestName } from "@/lib/events/normalize";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { PartyParseResult } from "@/lib/events/party-parser";
import { listSuggestedPartyGroupsByEvent } from "@/lib/events/repositories/guest-party-members.repository";
import { listEventDuplicateResolutions } from "@/lib/events/repositories/guest-duplicate-resolutions.repository";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  EventGuest,
  ReviewQueueItem,
  ReviewQueueItemType,
  ReviewQueueResult,
  ReviewQueueSummary,
} from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export const REVIEW_CLOSED_REASONS = new Set([
  "admin_resolved",
  "admin_attached",
]);

export const LEDGER_REVIEW_REASONS = new Set([
  "guest_deleted_or_missing",
  "primary_guest_missing",
  "duplicate_resolution_needs_review",
  "duplicate_resolution_ignored",
]);

type LedgerRow = Tables<"event_sheet_sync_ledger">;

export function isQueueClosedReason(reason: string | null | undefined): boolean {
  if (!reason?.trim()) return false;
  return REVIEW_CLOSED_REASONS.has(reason.trim());
}

export function isLedgerQueueCandidate(
  action: string,
  reason: string | null | undefined
): boolean {
  if (isQueueClosedReason(reason)) return false;
  if (action === "error") return true;
  if (action === "skipped" || action === "ignored") {
    if (!reason?.trim()) return true;
    if (reason === "admin_ignored") return true;
    return (
      LEDGER_REVIEW_REASONS.has(reason) ||
      reason.startsWith("duplicate_resolution")
    );
  }
  return false;
}

export function mapLedgerReasonToType(
  action: string,
  reason: string | null | undefined
): ReviewQueueItemType {
  if (action === "error") return "sync_error";
  if (reason === "guest_deleted_or_missing") return "missing_guest";
  if (reason === "primary_guest_missing") return "primary_guest_missing";
  if (
    reason === "duplicate_resolution_needs_review" ||
    action === "skipped"
  ) {
    return "duplicate_needs_review";
  }
  if (
    reason === "duplicate_resolution_ignored" ||
    action === "ignored"
  ) {
    return "ignored_import_row";
  }
  return "duplicate_needs_review";
}

export function parseRowPayloadFromUnknown(raw: unknown): SheetGuestRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;
  return {
    name,
    email: typeof row.email === "string" ? row.email : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    clientType: row.clientType === "company" ? "company" : "individual",
    rowNumber: typeof row.rowNumber === "number" ? row.rowNumber : 0,
    plusOnes: typeof row.plusOnes === "number" ? row.plusOnes : undefined,
    dietaryNotes:
      typeof row.dietaryNotes === "string" ? row.dietaryNotes : undefined,
    guestNotes: typeof row.guestNotes === "string" ? row.guestNotes : undefined,
    label:
      typeof row.label === "string"
        ? (row.label as SheetGuestRow["label"])
        : undefined,
    groupName: typeof row.groupName === "string" ? row.groupName : undefined,
    status:
      typeof row.status === "string"
        ? (row.status as SheetGuestRow["status"])
        : undefined,
    rawName: typeof row.rawName === "string" ? row.rawName : undefined,
    partyParse:
      row.partyParse && typeof row.partyParse === "object"
        ? (row.partyParse as SheetGuestRow["partyParse"])
        : undefined,
  };
}

function parseRowPayload(raw: unknown): SheetGuestRow | null {
  return parseRowPayloadFromUnknown(raw);
}

/** Expõe mapeamento ledger → item (testes e diagnóstico). */
export function buildLedgerReviewItem(
  eventId: string,
  row: LedgerRow
): ReviewQueueItem | null {
  return ledgerToReviewItem(eventId, row);
}

/** Expõe mapeamento resolução → item (testes e diagnóstico). */
export function buildResolutionReviewItem(
  eventId: string,
  row: Tables<"guest_duplicate_resolutions">,
  primaryExists: boolean
): ReviewQueueItem | null {
  return resolutionToReviewItem(eventId, row, primaryExists);
}

function ledgerToReviewItem(
  eventId: string,
  row: LedgerRow
): ReviewQueueItem | null {
  if (!isLedgerQueueCandidate(row.action, row.reason)) return null;

  const payload = parseRowPayload(row.row_payload);
  const displayName =
    payload?.name?.trim() ||
    (typeof row.row_payload === "object" &&
    row.row_payload &&
    "name" in (row.row_payload as object)
      ? String((row.row_payload as { name?: string }).name ?? "Linha importada")
      : "Linha importada");

  return {
    id: `ledger:${row.id}`,
    eventId,
    type: mapLedgerReasonToType(row.action, row.reason),
    source: "ledger",
    sourceId: row.id,
    guestId: row.guest_id,
    rowFingerprint: row.row_fingerprint,
    displayName,
    normalizedName: payload?.name
      ? normalizeGuestName(payload.name)
      : null,
    email: payload?.email?.trim() || null,
    phone: payload?.phone?.trim() || null,
    reason: row.reason,
    action: row.action,
    sourceSystem: row.source,
    rowPayload: (row.row_payload as Record<string, unknown> | null) ?? null,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

function resolutionToReviewItem(
  eventId: string,
  row: Tables<"guest_duplicate_resolutions">,
  primaryExists: boolean
): ReviewQueueItem | null {
  if (row.resolution_status === "merged" && primaryExists) {
    return null;
  }

  const closedNote = row.notes?.trim() ?? "";
  if (closedNote.includes("admin_resolved")) return null;

  let type: ReviewQueueItemType = "duplicate_needs_review";
  if (row.resolution_status === "ignored") {
    type = "ignored_import_row";
  } else if (!primaryExists) {
    type = "primary_guest_missing";
  } else if (row.resolution_status === "needs_review") {
    type = "duplicate_needs_review";
  }

  if (
    row.resolution_status !== "needs_review" &&
    row.resolution_status !== "ignored" &&
    primaryExists
  ) {
    return null;
  }

  return {
    id: `duplicate_resolution:${row.id}`,
    eventId,
    type,
    source: "duplicate_resolution",
    sourceId: row.id,
    primaryGuestId: row.primary_guest_id,
    rowFingerprint: row.duplicate_fingerprint,
    displayName: row.duplicate_name?.trim() || row.duplicate_name_normalized || "Variante duplicada",
    normalizedName: row.duplicate_name_normalized,
    email: row.duplicate_email,
    phone: row.duplicate_phone,
    reason: row.resolution_status,
    action: row.resolution_status,
    sourceSystem: row.source,
    lastSeenAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

function partyGroupToReviewItem(
  eventId: string,
  guestId: string,
  guest: EventGuest | undefined,
  parse: PartyParseResult,
  members: Tables<"guest_party_members">[]
): ReviewQueueItem {
  const displayName = parse.displayName || guest?.name || "Grupo detectado";
  const latest = members[0];

  return {
    id: `party_parser:${guestId}`,
    eventId,
    type: "party_needs_review",
    source: "party_parser",
    sourceId: guestId,
    guestId,
    displayName,
    normalizedName: parse.normalizedPrimaryName || guest?.nameNormalized || null,
    email: guest?.email || null,
    phone: guest?.phone || null,
    reason: "party_needs_review",
    action: "suggested",
    sourceSystem: latest?.source ?? "parser",
    partyParse: parse,
    lastSeenAt: latest?.updated_at ?? latest?.created_at ?? null,
    createdAt: latest?.created_at ?? null,
  };
}

function clusterToReviewItem(
  eventId: string,
  normalizedName: string,
  guestIds: string[],
  guests: EventGuest[]
): ReviewQueueItem {
  const members = guests.filter((g) => guestIds.includes(g.id));
  const displayName = members[0]?.name ?? normalizedName;

  return {
    id: `deduplication:${normalizedName}`,
    eventId,
    type: "possible_duplicate",
    source: "deduplication",
    sourceId: normalizedName,
    displayName,
    normalizedName,
    reason: `${guestIds.length} registos com o mesmo nome normalizado`,
    action: "possible_duplicate",
    createdAt: null,
    lastSeenAt: null,
  };
}

export function buildReviewQueueSummary(
  items: ReviewQueueItem[]
): ReviewQueueSummary {
  let toReview = 0;
  let ignored = 0;
  let missingGuest = 0;
  let possibleDuplicates = 0;
  let syncErrors = 0;

  for (const item of items) {
    if (item.type === "ignored_import_row") ignored++;
    else if (item.type === "missing_guest") missingGuest++;
    else if (item.type === "possible_duplicate") possibleDuplicates++;
    else if (item.type === "sync_error") syncErrors++;
    else toReview++;
  }

  return {
    toReview,
    ignored,
    missingGuest,
    possibleDuplicates,
    syncErrors,
    total: items.length,
  };
}

export function parseReviewItemId(
  itemId: string
): { source: ReviewQueueItem["source"]; sourceId: string } {
  const [source, ...rest] = itemId.split(":");
  const sourceId = rest.join(":");
  if (
    source !== "ledger" &&
    source !== "duplicate_resolution" &&
    source !== "deduplication" &&
    source !== "party_parser"
  ) {
    throw new Error("Item de revisão inválido.");
  }
  if (!sourceId) throw new Error("Item de revisão inválido.");
  return { source, sourceId };
}

export async function buildGuestReviewQueue(
  eventId: string,
  guests?: EventGuest[]
): Promise<ReviewQueueResult> {
  const supabase = createAdminClient();
  const guestList = guests ?? (await guestsRepo.listGuestsByEvent(eventId));
  const guestIds = new Set(guestList.map((g) => g.id));

  const { data: ledgerData, error: ledgerError } = await supabase
    .from("event_sheet_sync_ledger")
    .select("*")
    .eq("event_id", eventId)
    .order("last_seen_at", { ascending: false });

  if (ledgerError) {
    throw new Error(`[review-queue] ledger: ${ledgerError.message}`);
  }

  const ledgerRows = asTableRows<"event_sheet_sync_ledger">(ledgerData);
  const items: ReviewQueueItem[] = [];

  for (const row of ledgerRows) {
    const item = ledgerToReviewItem(eventId, row);
    if (item) items.push(item);
  }

  const resolutions = await listEventDuplicateResolutions(eventId);
  for (const row of resolutions) {
    const primaryExists = guestIds.has(row.primary_guest_id);
    const item = resolutionToReviewItem(eventId, row, primaryExists);
    if (item) items.push(item);
  }

  const clusters = buildDuplicateClusters(guestList);
  for (const cluster of clusters) {
    items.push(
      clusterToReviewItem(
        eventId,
        cluster.normalizedName,
        cluster.guestIds,
        guestList
      )
    );
  }

  const partyGroups = await listSuggestedPartyGroupsByEvent(eventId);
  for (const group of partyGroups) {
    if (!group.parse) continue;
    const guest = guestList.find((g) => g.id === group.guestId);
    items.push(
      partyGroupToReviewItem(
        eventId,
        group.guestId,
        guest,
        group.parse,
        group.members
      )
    );
  }

  const deduped = new Map<string, ReviewQueueItem>();
  for (const item of items) {
    deduped.set(item.id, item);
  }

  const sorted = [...deduped.values()].sort((a, b) => {
    const aTime = a.lastSeenAt ?? a.createdAt ?? "";
    const bTime = b.lastSeenAt ?? b.createdAt ?? "";
    return bTime.localeCompare(aTime);
  });

  return {
    items: sorted,
    summary: buildReviewQueueSummary(sorted),
  };
}
