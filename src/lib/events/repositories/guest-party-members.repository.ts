import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import type { PartyParseResult } from "@/lib/events/party-parser";
import {
  confirmPartySuggestions as confirmPartySuggestionsNeon,
  dismissPartySuggestions as dismissPartySuggestionsNeon,
  getGuestPartyMemberById as getGuestPartyMemberByIdNeon,
  listSuggestedPartyGroupsByEvent as listSuggestedPartyGroupsByEventNeon,
  persistPartyParseForGuest as persistPartyParseForGuestNeon,
  replaceSuggestedPartyMembers as replaceSuggestedPartyMembersNeon,
} from "@/lib/events/repositories/guest-party-members.neon.repository";
import {
  confirmPartySuggestions as confirmPartySuggestionsSupabase,
  dismissPartySuggestions as dismissPartySuggestionsSupabase,
  getGuestPartyMemberById as getGuestPartyMemberByIdSupabase,
  listSuggestedPartyGroupsByEvent as listSuggestedPartyGroupsByEventSupabase,
  persistPartyParseForGuest as persistPartyParseForGuestSupabase,
  replaceSuggestedPartyMembers as replaceSuggestedPartyMembersSupabase,
} from "@/lib/events/repositories/guest-party-members.supabase.repository";
import type {
  GuestPartyMemberRow,
  PartyMemberSource,
  UpsertPartySuggestionsInput,
} from "@/lib/events/repositories/guest-party-members.supabase.repository";

export type {
  GuestPartyMemberRow,
  PartyMemberSource,
  PartyMemberStatus,
  UpsertPartySuggestionsInput,
} from "@/lib/events/repositories/guest-party-members.supabase.repository";

export { mapSheetSourceToPartySource } from "@/lib/events/repositories/guest-party-members.supabase.repository";

export function replaceSuggestedPartyMembers(
  input: UpsertPartySuggestionsInput,
): Promise<GuestPartyMemberRow[]> {
  return shouldUseNeonServerDatabase()
    ? replaceSuggestedPartyMembersNeon(input)
    : replaceSuggestedPartyMembersSupabase(input);
}

export function persistPartyParseForGuest(
  eventId: string,
  guestId: string,
  parse: PartyParseResult | undefined,
  source: PartyMemberSource = "parser",
): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? persistPartyParseForGuestNeon(eventId, guestId, parse, source)
    : persistPartyParseForGuestSupabase(eventId, guestId, parse, source);
}

export function listSuggestedPartyGroupsByEvent(eventId: string) {
  return shouldUseNeonServerDatabase()
    ? listSuggestedPartyGroupsByEventNeon(eventId)
    : listSuggestedPartyGroupsByEventSupabase(eventId);
}

export function confirmPartySuggestions(
  eventId: string,
  guestId: string,
  plusOnes?: number,
): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? confirmPartySuggestionsNeon(eventId, guestId, plusOnes)
    : confirmPartySuggestionsSupabase(eventId, guestId, plusOnes);
}

export function dismissPartySuggestions(
  eventId: string,
  guestId: string,
): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? dismissPartySuggestionsNeon(eventId, guestId)
    : dismissPartySuggestionsSupabase(eventId, guestId);
}

export function getGuestPartyMemberById(
  id: string,
): Promise<GuestPartyMemberRow | null> {
  return shouldUseNeonServerDatabase()
    ? getGuestPartyMemberByIdNeon(id)
    : getGuestPartyMemberByIdSupabase(id);
}
