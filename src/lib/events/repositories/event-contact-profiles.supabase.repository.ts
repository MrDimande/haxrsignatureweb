/**
 * Perfis de contacto operacionais por evento (sem integração marketing).
 */

import { mapGuest } from "@/lib/events/db/mappers";
import { normalizeEmail, normalizeGuestName, normalizePhone } from "@/lib/events/normalize";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import type { Json, Tables } from "@/lib/supabase/database.types";
import type { SheetImportSource } from "@/lib/events/sheets/fingerprint";
import type { EventGuest } from "@/lib/events/types";

export type EventContactProfileRow = Tables<"event_contact_profiles">;
export type EventContactSource =
  | "rsvp"
  | "google_sheet"
  | "csv_upload"
  | "admin"
  | "edition_rsvp"
  | "checkin"
  | "unknown";
export type EventContactConfidence = "high" | "medium" | "low";
export type EventContactConsentStatus =
  | "operational_only"
  | "marketing_granted"
  | "marketing_denied"
  | "unknown";

export type ExtractedContactProfile = {
  fullName: string | null;
  normalizedName: string | null;
  email: string | null;
  normalizedEmail: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  confidence: EventContactConfidence;
};

export type UpsertEventContactProfileInput = {
  eventId: string;
  guestId?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  source: EventContactSource;
  confidence?: EventContactConfidence;
  consentStatus?: EventContactConsentStatus;
  marketingAllowed?: boolean;
  metadata?: Record<string, unknown> | null;
};

export function defaultOperationalConsent(): {
  consentStatus: EventContactConsentStatus;
  marketingAllowed: boolean;
} {
  return {
    consentStatus: "operational_only",
    marketingAllowed: false,
  };
}

export function resolveContactConfidence(input: {
  normalizedEmail: string | null;
  normalizedPhone: string | null;
}): EventContactConfidence {
  if (input.normalizedEmail && input.normalizedPhone) return "high";
  if (input.normalizedEmail || input.normalizedPhone) return "medium";
  return "low";
}

export function hasContactableInfo(input: {
  email?: string | null;
  phone?: string | null;
}): boolean {
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  return Boolean(email || phone);
}

export function mapSheetImportSourceToContactSource(
  source: SheetImportSource,
): EventContactSource {
  if (source === "google_sheet") return "google_sheet";
  if (source === "csv_upload") return "csv_upload";
  return "unknown";
}

export function extractContactFromGuest(
  guest: Pick<EventGuest, "name" | "email" | "phone">,
): ExtractedContactProfile | null {
  const email = guest.email?.trim() ?? "";
  const phone = guest.phone?.trim() ?? "";
  if (!email && !phone) return null;

  const normalizedEmail = email ? normalizeEmail(email) : null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  const fullName = guest.name?.trim() || null;

  return {
    fullName,
    normalizedName: fullName ? normalizeGuestName(fullName) : null,
    email: email || null,
    normalizedEmail,
    phone: phone || null,
    normalizedPhone,
    confidence: resolveContactConfidence({
      normalizedEmail,
      normalizedPhone,
    }),
  };
}

export async function findEventContactByEmailOrPhone(
  eventId: string,
  normalizedEmail: string | null,
  normalizedPhone: string | null,
): Promise<EventContactProfileRow | null> {
  const supabase = createAdminClient();

  if (normalizedEmail) {
    const { data, error } = await supabase
      .from("event_contact_profiles")
      .select("*")
      .eq("event_id", eventId)
      .eq("normalized_email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(`[event-contact-profiles] find email: ${error.message}`);
    }
    const row = asTableRow<"event_contact_profiles">(data);
    if (row) return row;
  }

  if (normalizedPhone) {
    const { data, error } = await supabase
      .from("event_contact_profiles")
      .select("*")
      .eq("event_id", eventId)
      .eq("normalized_phone", normalizedPhone)
      .maybeSingle();

    if (error) {
      throw new Error(`[event-contact-profiles] find phone: ${error.message}`);
    }
    return asTableRow<"event_contact_profiles">(data);
  }

  return null;
}

export async function upsertEventContactProfile(
  input: UpsertEventContactProfileInput,
): Promise<EventContactProfileRow | null> {
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  if (!email && !phone) return null;

  const normalizedEmail = email ? normalizeEmail(email) : null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  const fullName = input.fullName?.trim() || null;
  const normalizedName = fullName ? normalizeGuestName(fullName) : null;
  const confidence =
    input.confidence ??
    resolveContactConfidence({ normalizedEmail, normalizedPhone });
  const consent = defaultOperationalConsent();
  const consentStatus = input.consentStatus ?? consent.consentStatus;
  const marketingAllowed = input.marketingAllowed ?? consent.marketingAllowed;

  const existing = await findEventContactByEmailOrPhone(
    input.eventId,
    normalizedEmail,
    normalizedPhone,
  );

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const metadata = (input.metadata ?? null) as Json | null;

  const payload = {
    guest_id: input.guestId ?? existing?.guest_id ?? null,
    full_name: fullName,
    normalized_name: normalizedName,
    email: email || null,
    normalized_email: normalizedEmail,
    phone: phone || null,
    normalized_phone: normalizedPhone,
    source: input.source,
    confidence,
    consent_status: consentStatus,
    marketing_allowed: marketingAllowed,
    last_seen_at: now,
    metadata,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("event_contact_profiles")
      .update(payload as never)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`[event-contact-profiles] update: ${error.message}`);
    }
    return asTableRow<"event_contact_profiles">(data);
  }

  const { data, error } = await supabase
    .from("event_contact_profiles")
    .insert({
      event_id: input.eventId,
      ...payload,
      first_seen_at: now,
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`[event-contact-profiles] insert: ${error.message}`);
  }

  return asTableRow<"event_contact_profiles">(data);
}

export async function syncGuestContactProfile(input: {
  eventId: string;
  guest: Pick<EventGuest, "id" | "name" | "email" | "phone">;
  source: EventContactSource;
  metadata?: Record<string, unknown> | null;
}): Promise<EventContactProfileRow | null> {
  const extracted = extractContactFromGuest(input.guest);
  if (!extracted) return null;

  return upsertEventContactProfile({
    eventId: input.eventId,
    guestId: input.guest.id,
    fullName: extracted.fullName,
    email: extracted.email,
    phone: extracted.phone,
    source: input.source,
    confidence: extracted.confidence,
    metadata: input.metadata ?? null,
  });
}

export async function listEventContactProfiles(
  eventId: string,
): Promise<EventContactProfileRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_contact_profiles")
    .select("*")
    .eq("event_id", eventId)
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(`[event-contact-profiles] list: ${error.message}`);
  }

  return asTableRows<"event_contact_profiles">(data);
}

export async function safeSyncGuestContactProfile(input: {
  eventId: string;
  guest: Pick<EventGuest, "id" | "name" | "email" | "phone">;
  source: EventContactSource;
  metadata?: Record<string, unknown> | null;
}): Promise<EventContactProfileRow | null> {
  try {
    return await syncGuestContactProfile(input);
  } catch (error) {
    console.error("[event-contact-profiles] sync failed:", error);
    return null;
  }
}

export async function getGuestByEventAndToken(
  eventId: string,
  token: string,
): Promise<EventGuest | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("event_id", eventId)
    .eq("qr_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(`[event-contact-profiles] guest by token: ${error.message}`);
  }

  const row = asTableRow<"guests">(data);
  if (!row) return null;

  return mapGuest(row);
}
