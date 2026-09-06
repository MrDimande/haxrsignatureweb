import type { EventGuest } from "@/lib/events/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  findEventContactByEmailOrPhone as findEventContactByEmailOrPhoneNeon,
  getGuestByEventAndToken as getGuestByEventAndTokenNeon,
  listEventContactProfiles as listEventContactProfilesNeon,
  safeSyncGuestContactProfile as safeSyncGuestContactProfileNeon,
  syncGuestContactProfile as syncGuestContactProfileNeon,
  upsertEventContactProfile as upsertEventContactProfileNeon,
} from "@/lib/events/repositories/event-contact-profiles.neon.repository";
import {
  findEventContactByEmailOrPhone as findEventContactByEmailOrPhoneSupabase,
  getGuestByEventAndToken as getGuestByEventAndTokenSupabase,
  listEventContactProfiles as listEventContactProfilesSupabase,
  safeSyncGuestContactProfile as safeSyncGuestContactProfileSupabase,
  syncGuestContactProfile as syncGuestContactProfileSupabase,
  upsertEventContactProfile as upsertEventContactProfileSupabase,
} from "@/lib/events/repositories/event-contact-profiles.supabase.repository";
import type {
  EventContactProfileRow,
  EventContactSource,
  UpsertEventContactProfileInput,
} from "@/lib/events/repositories/event-contact-profiles.supabase.repository";

export type {
  EventContactConfidence,
  EventContactConsentStatus,
  EventContactProfileRow,
  EventContactSource,
  ExtractedContactProfile,
  UpsertEventContactProfileInput,
} from "@/lib/events/repositories/event-contact-profiles.supabase.repository";

export {
  defaultOperationalConsent,
  extractContactFromGuest,
  hasContactableInfo,
  mapSheetImportSourceToContactSource,
  resolveContactConfidence,
} from "@/lib/events/repositories/event-contact-profiles.supabase.repository";

export function findEventContactByEmailOrPhone(
  eventId: string,
  normalizedEmail: string | null,
  normalizedPhone: string | null,
): Promise<EventContactProfileRow | null> {
  return shouldUseNeonServerDatabase()
    ? findEventContactByEmailOrPhoneNeon(eventId, normalizedEmail, normalizedPhone)
    : findEventContactByEmailOrPhoneSupabase(eventId, normalizedEmail, normalizedPhone);
}

export function upsertEventContactProfile(
  input: UpsertEventContactProfileInput,
): Promise<EventContactProfileRow | null> {
  return shouldUseNeonServerDatabase()
    ? upsertEventContactProfileNeon(input)
    : upsertEventContactProfileSupabase(input);
}

export function syncGuestContactProfile(input: {
  eventId: string;
  guest: Pick<EventGuest, "id" | "name" | "email" | "phone">;
  source: EventContactSource;
  metadata?: Record<string, unknown> | null;
}): Promise<EventContactProfileRow | null> {
  return shouldUseNeonServerDatabase()
    ? syncGuestContactProfileNeon(input)
    : syncGuestContactProfileSupabase(input);
}

export function listEventContactProfiles(
  eventId: string,
): Promise<EventContactProfileRow[]> {
  return shouldUseNeonServerDatabase()
    ? listEventContactProfilesNeon(eventId)
    : listEventContactProfilesSupabase(eventId);
}

export function safeSyncGuestContactProfile(input: {
  eventId: string;
  guest: Pick<EventGuest, "id" | "name" | "email" | "phone">;
  source: EventContactSource;
  metadata?: Record<string, unknown> | null;
}): Promise<EventContactProfileRow | null> {
  return shouldUseNeonServerDatabase()
    ? safeSyncGuestContactProfileNeon(input)
    : safeSyncGuestContactProfileSupabase(input);
}

export function getGuestByEventAndToken(
  eventId: string,
  token: string,
): Promise<EventGuest | null> {
  return shouldUseNeonServerDatabase()
    ? getGuestByEventAndTokenNeon(eventId, token)
    : getGuestByEventAndTokenSupabase(eventId, token);
}
