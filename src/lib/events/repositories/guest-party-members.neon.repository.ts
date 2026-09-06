import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import type { Json, Tables } from "@/lib/supabase/database.types";
import type { PartyMemberRole, PartyParseResult } from "@/lib/events/party-parser";
import type { SheetImportSource } from "@/lib/events/sheets/fingerprint";

export type GuestPartyMemberRow = Tables<"guest_party_members">;
export type PartyMemberStatus = "suggested" | "confirmed" | "dismissed";
export type PartyMemberSource = "parser" | "admin" | "sheet" | "csv" | "rsvp";

export type UpsertPartySuggestionsInput = {
  eventId: string;
  guestId: string;
  parse: PartyParseResult;
  source: PartyMemberSource;
};

type PartyMemberJsonRow = { row: GuestPartyMemberRow };

export function mapSheetSourceToPartySource(
  source?: SheetImportSource | null,
): PartyMemberSource {
  if (source === "google_sheet") return "sheet";
  if (source === "csv_upload") return "csv";
  return "parser";
}

function buildMetadata(parse: PartyParseResult): Json {
  return {
    rawInput: parse.rawInput,
    primaryName: parse.primaryName,
    normalizedPrimaryName: parse.normalizedPrimaryName,
    displayName: parse.displayName,
    reasons: parse.reasons,
    suggestedHeadcount: parse.suggestedHeadcount,
    suggestedPlusOnes: parse.suggestedPlusOnes,
    needsReview: parse.needsReview,
    confidence: parse.confidence,
    members: parse.members,
  } as unknown as Json;
}

export async function replaceSuggestedPartyMembers(
  input: UpsertPartySuggestionsInput,
): Promise<GuestPartyMemberRow[]> {
  return withNeonTransaction(async (client) => {
    await client.query(
      `DELETE FROM public.guest_party_members
       WHERE guest_id = $1::uuid AND status = 'suggested'`,
      [input.guestId],
    );

    if (!input.parse.needsReview || !input.parse.members.length) {
      return [];
    }

    const metadata = JSON.stringify(buildMetadata(input.parse));
    const savedRows: GuestPartyMemberRow[] = [];

    for (const member of input.parse.members) {
      const result = await client.query<PartyMemberJsonRow>(
        `
          WITH saved AS (
            INSERT INTO public.guest_party_members (
              event_id,
              guest_id,
              label,
              normalized_label,
              role,
              count,
              status,
              source,
              confidence,
              metadata
            )
            VALUES (
              $1::uuid,
              $2::uuid,
              $3,
              $4,
              $5,
              $6::int,
              'suggested',
              $7,
              $8,
              $9::jsonb
            )
            RETURNING *
          )
          SELECT to_jsonb(saved) AS row FROM saved
        `,
        [
          input.eventId,
          input.guestId,
          member.label,
          member.normalizedLabel ?? null,
          member.role as PartyMemberRole,
          member.count,
          input.source,
          input.parse.confidence,
          metadata,
        ],
      );

      const row = result.rows[0]?.row;
      if (!row) {
        throw new Error("[guest-party-members] replace insert: no row returned");
      }
      savedRows.push(row);
    }

    return savedRows;
  });
}

export async function persistPartyParseForGuest(
  eventId: string,
  guestId: string,
  parse: PartyParseResult | undefined,
  source: PartyMemberSource = "parser",
): Promise<void> {
  if (!parse?.needsReview) return;

  await replaceSuggestedPartyMembers({
    eventId,
    guestId,
    parse,
    source,
  });
}

export async function listSuggestedPartyGroupsByEvent(
  eventId: string,
): Promise<
  Array<{
    guestId: string;
    members: GuestPartyMemberRow[];
    parse: PartyParseResult | null;
  }>
> {
  const result = await neonQuery<PartyMemberJsonRow>(
    `
      SELECT to_jsonb(gpm) AS row
      FROM public.guest_party_members gpm
      WHERE gpm.event_id = $1::uuid
        AND gpm.status = 'suggested'
      ORDER BY gpm.created_at DESC
    `,
    [eventId],
  );

  const grouped = new Map<string, GuestPartyMemberRow[]>();
  for (const { row } of result.rows) {
    const bucket = grouped.get(row.guest_id) ?? [];
    bucket.push(row);
    grouped.set(row.guest_id, bucket);
  }

  return [...grouped.entries()].map(([guestId, members]) => ({
    guestId,
    members,
    parse: metadataToPartyParse(members[0]?.metadata),
  }));
}

function metadataToPartyParse(metadata: Json | null): PartyParseResult | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const meta = metadata as Record<string, unknown>;
  const rawInput = typeof meta.rawInput === "string" ? meta.rawInput : null;
  if (!rawInput) return null;

  const members = membersFromMeta(meta);

  return {
    rawInput,
    primaryName:
      typeof meta.primaryName === "string"
        ? meta.primaryName
        : (members.find((member) => member.role === "primary")?.label ?? rawInput),
    normalizedPrimaryName:
      typeof meta.normalizedPrimaryName === "string"
        ? meta.normalizedPrimaryName
        : "",
    displayName:
      typeof meta.displayName === "string" ? meta.displayName : rawInput,
    suggestedHeadcount:
      typeof meta.suggestedHeadcount === "number" ? meta.suggestedHeadcount : 1,
    suggestedPlusOnes:
      typeof meta.suggestedPlusOnes === "number" ? meta.suggestedPlusOnes : 0,
    confidence:
      meta.confidence === "high" ||
      meta.confidence === "medium" ||
      meta.confidence === "low"
        ? meta.confidence
        : "medium",
    needsReview: meta.needsReview !== false,
    reasons: Array.isArray(meta.reasons)
      ? meta.reasons.filter((reason): reason is string => typeof reason === "string")
      : [],
    members,
  };
}

function membersFromMeta(
  meta: Record<string, unknown>,
): PartyParseResult["members"] {
  if (!Array.isArray(meta.members)) return [];

  return meta.members
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      label: String(item.label ?? ""),
      normalizedLabel:
        typeof item.normalizedLabel === "string"
          ? item.normalizedLabel
          : undefined,
      role: (item.role as PartyMemberRole) ?? "unknown_companion",
      count: typeof item.count === "number" ? item.count : 1,
      isNamed: Boolean(item.isNamed),
      needsName: item.needsName === true ? true : undefined,
    }))
    .filter((member) => member.label.length > 0);
}

export async function confirmPartySuggestions(
  eventId: string,
  guestId: string,
  plusOnes?: number,
): Promise<void> {
  await withNeonTransaction(async (client) => {
    await client.query(
      `
        UPDATE public.guest_party_members
        SET status = 'confirmed', updated_at = now()
        WHERE event_id = $1::uuid
          AND guest_id = $2::uuid
          AND status = 'suggested'
      `,
      [eventId, guestId],
    );

    if (plusOnes !== undefined) {
      await client.query(
        `
          UPDATE public.guests
          SET plus_ones = $3::int, updated_at = now()
          WHERE id = $2::uuid AND event_id = $1::uuid
        `,
        [eventId, guestId, plusOnes],
      );
    }
  });
}

export async function dismissPartySuggestions(
  eventId: string,
  guestId: string,
): Promise<void> {
  await neonQuery(
    `
      UPDATE public.guest_party_members
      SET status = 'dismissed'
      WHERE event_id = $1::uuid
        AND guest_id = $2::uuid
        AND status = 'suggested'
    `,
    [eventId, guestId],
  );
}

export async function getGuestPartyMemberById(
  id: string,
): Promise<GuestPartyMemberRow | null> {
  const result = await neonQuery<PartyMemberJsonRow>(
    `
      SELECT to_jsonb(gpm) AS row
      FROM public.guest_party_members gpm
      WHERE gpm.id = $1::uuid
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0]?.row ?? null;
}
