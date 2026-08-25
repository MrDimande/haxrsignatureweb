import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
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

function mapSheetSourceToPartySource(
  source?: SheetImportSource | null
): PartyMemberSource {
  if (source === "google_sheet") return "sheet";
  if (source === "csv_upload") return "csv";
  return "parser";
}

export async function replaceSuggestedPartyMembers(
  input: UpsertPartySuggestionsInput
): Promise<GuestPartyMemberRow[]> {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("guest_party_members")
    .delete()
    .eq("guest_id", input.guestId)
    .eq("status", "suggested");

  if (deleteError) {
    throw new Error(
      `[guest-party-members] replace delete: ${deleteError.message}`
    );
  }

  if (!input.parse.needsReview || !input.parse.members.length) {
    return [];
  }

  const rows = input.parse.members.map((member) => ({
    event_id: input.eventId,
    guest_id: input.guestId,
    label: member.label,
    normalized_label: member.normalizedLabel ?? null,
    role: member.role as PartyMemberRole,
    count: member.count,
    status: "suggested" as const,
    source: input.source,
    confidence: input.parse.confidence,
    metadata: {
      rawInput: input.parse.rawInput,
      primaryName: input.parse.primaryName,
      normalizedPrimaryName: input.parse.normalizedPrimaryName,
      displayName: input.parse.displayName,
      reasons: input.parse.reasons,
      suggestedHeadcount: input.parse.suggestedHeadcount,
      suggestedPlusOnes: input.parse.suggestedPlusOnes,
      needsReview: input.parse.needsReview,
      confidence: input.parse.confidence,
      members: input.parse.members,
    } as unknown as Json,
  }));

  const { data, error } = await supabase
    .from("guest_party_members")
    .insert(rows as never)
    .select("*");

  if (error) {
    throw new Error(`[guest-party-members] replace insert: ${error.message}`);
  }

  return asTableRows<"guest_party_members">(data);
}

export async function persistPartyParseForGuest(
  eventId: string,
  guestId: string,
  parse: PartyParseResult | undefined,
  source: PartyMemberSource = "parser"
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
  eventId: string
): Promise<
  Array<{
    guestId: string;
    members: GuestPartyMemberRow[];
    parse: PartyParseResult | null;
  }>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_party_members")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "suggested")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[guest-party-members] listSuggested: ${error.message}`
    );
  }

  const rows = asTableRows<"guest_party_members">(data);
  const grouped = new Map<string, GuestPartyMemberRow[]>();

  for (const row of rows) {
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
        : (members.find((m) => m.role === "primary")?.label ?? rawInput),
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
      ? meta.reasons.filter((r): r is string => typeof r === "string")
      : [],
    members,
  };
}

function membersFromMeta(
  meta: Record<string, unknown>
): PartyParseResult["members"] {
  if (!Array.isArray(meta.members)) return [];
  return meta.members
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
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
  plusOnes?: number
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error: memberError } = await supabase
    .from("guest_party_members")
    .update({ status: "confirmed", updated_at: now } as never)
    .eq("event_id", eventId)
    .eq("guest_id", guestId)
    .eq("status", "suggested");

  if (memberError) {
    throw new Error(
      `[guest-party-members] confirm members: ${memberError.message}`
    );
  }

  if (plusOnes !== undefined) {
    const { error: guestError } = await supabase
      .from("guests")
      .update({ plus_ones: plusOnes, updated_at: now } as never)
      .eq("id", guestId)
      .eq("event_id", eventId);

    if (guestError) {
      throw new Error(`[guest-party-members] confirm guest: ${guestError.message}`);
    }
  }
}

export async function dismissPartySuggestions(
  eventId: string,
  guestId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("guest_party_members")
    .update({ status: "dismissed" } as never)
    .eq("event_id", eventId)
    .eq("guest_id", guestId)
    .eq("status", "suggested");

  if (error) {
    throw new Error(`[guest-party-members] dismiss: ${error.message}`);
  }
}

export async function getGuestPartyMemberById(
  id: string
): Promise<GuestPartyMemberRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_party_members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`[guest-party-members] getById: ${error.message}`);
  }

  return asTableRow<"guest_party_members">(data);
}

export { mapSheetSourceToPartySource };
