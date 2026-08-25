import { buildDuplicateClusters } from "@/lib/events/deduplication";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import type { PartyParseResult } from "@/lib/events/party-parser";
import { listSuggestedPartyGroupsByEvent } from "@/lib/events/repositories/guest-party-members.repository";
import { listEventDuplicateResolutions } from "@/lib/events/repositories/guest-duplicate-resolutions.repository";
import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  EventGuest,
  ReviewQueueItem,
  ReviewQueueResult,
} from "@/lib/events/types";
import {
  buildLedgerReviewItem,
  buildResolutionReviewItem,
  buildReviewQueueSummary,
} from "@/lib/events/services/guest-review-queue.supabase.service";

type LedgerRow = Tables<"event_sheet_sync_ledger">;
type NeonLedgerJsonRow = { row: LedgerRow };

function partyGroupToReviewItem(
  eventId: string,
  guestId: string,
  guest: EventGuest | undefined,
  parse: PartyParseResult,
  members: Tables<"guest_party_members">[],
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
  guests: EventGuest[],
): ReviewQueueItem {
  const members = guests.filter((guest) => guestIds.includes(guest.id));
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

export async function buildGuestReviewQueue(
  eventId: string,
  guests?: EventGuest[],
): Promise<ReviewQueueResult> {
  const guestList = guests ?? (await guestsRepo.listGuestsByEvent(eventId));
  const guestIds = new Set(guestList.map((guest) => guest.id));

  const ledgerResult = await neonQuery<NeonLedgerJsonRow>(
    `
      SELECT to_jsonb(ledger) AS row
      FROM public.event_sheet_sync_ledger ledger
      WHERE ledger.event_id = $1::uuid
      ORDER BY ledger.last_seen_at DESC
    `,
    [eventId],
  );

  const items: ReviewQueueItem[] = [];

  for (const { row } of ledgerResult.rows) {
    const item = buildLedgerReviewItem(eventId, row);
    if (item) items.push(item);
  }

  const resolutions = await listEventDuplicateResolutions(eventId);
  for (const row of resolutions) {
    const item = buildResolutionReviewItem(
      eventId,
      row,
      guestIds.has(row.primary_guest_id),
    );
    if (item) items.push(item);
  }

  const clusters = buildDuplicateClusters(guestList);
  for (const cluster of clusters) {
    items.push(
      clusterToReviewItem(
        eventId,
        cluster.normalizedName,
        cluster.guestIds,
        guestList,
      ),
    );
  }

  const partyGroups = await listSuggestedPartyGroupsByEvent(eventId);
  for (const group of partyGroups) {
    if (!group.parse) continue;
    const guest = guestList.find((candidate) => candidate.id === group.guestId);
    items.push(
      partyGroupToReviewItem(
        eventId,
        group.guestId,
        guest,
        group.parse,
        group.members,
      ),
    );
  }

  const deduped = new Map<string, ReviewQueueItem>();
  for (const item of items) {
    deduped.set(item.id, item);
  }

  const sorted = [...deduped.values()].sort((left, right) => {
    const leftTime = left.lastSeenAt ?? left.createdAt ?? "";
    const rightTime = right.lastSeenAt ?? right.createdAt ?? "";
    return rightTime.localeCompare(leftTime);
  });

  return {
    items: sorted,
    summary: buildReviewQueueSummary(sorted),
  };
}
