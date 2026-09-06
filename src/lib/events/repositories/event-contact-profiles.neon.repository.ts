/**
 * Perfis de contacto operacionais por evento em Neon.
 */

import { mapGuest } from "@/lib/events/db/mappers";
import { normalizeEmail, normalizeGuestName, normalizePhone } from "@/lib/events/normalize";
import { neonQuery } from "@/lib/neon/server-db";
import type { Tables } from "@/lib/supabase/database.types";
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

type ContactJsonRow = { row: EventContactProfileRow };
type GuestJsonRow = { row: Tables<"guests"> };

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
  if (normalizedEmail) {
    const byEmail = await neonQuery<ContactJsonRow>(
      `
        SELECT to_jsonb(p) AS row
        FROM public.event_contact_profiles p
        WHERE p.event_id = $1::uuid
          AND p.normalized_email = $2
        LIMIT 1
      `,
      [eventId, normalizedEmail],
    );
    const row = byEmail.rows[0]?.row;
    if (row) return row;
  }

  if (normalizedPhone) {
    const byPhone = await neonQuery<ContactJsonRow>(
      `
        SELECT to_jsonb(p) AS row
        FROM public.event_contact_profiles p
        WHERE p.event_id = $1::uuid
          AND p.normalized_phone = $2
        LIMIT 1
      `,
      [eventId, normalizedPhone],
    );
    return byPhone.rows[0]?.row ?? null;
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
  const now = new Date().toISOString();
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

  if (existing) {
    const result = await neonQuery<ContactJsonRow>(
      `
        WITH saved AS (
          UPDATE public.event_contact_profiles
          SET guest_id = $2::uuid,
              full_name = $3,
              normalized_name = $4,
              email = $5,
              normalized_email = $6,
              phone = $7,
              normalized_phone = $8,
              source = $9,
              confidence = $10,
              consent_status = $11,
              marketing_allowed = $12::boolean,
              last_seen_at = $13::timestamptz,
              metadata = $14::jsonb
          WHERE id = $1::uuid
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row FROM saved
      `,
      [
        existing.id,
        input.guestId ?? existing.guest_id ?? null,
        fullName,
        normalizedName,
        email || null,
        normalizedEmail,
        phone || null,
        normalizedPhone,
        input.source,
        confidence,
        consentStatus,
        marketingAllowed,
        now,
        metadata,
      ],
    );
    return result.rows[0]?.row ?? null;
  }

  const result = await neonQuery<ContactJsonRow>(
    `
      WITH saved AS (
        INSERT INTO public.event_contact_profiles (
          event_id,
          guest_id,
          full_name,
          normalized_name,
          email,
          normalized_email,
          phone,
          normalized_phone,
          source,
          confidence,
          consent_status,
          marketing_allowed,
          first_seen_at,
          last_seen_at,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12::boolean,
          $13::timestamptz,
          $13::timestamptz,
          $14::jsonb
        )
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.eventId,
      input.guestId ?? null,
      fullName,
      normalizedName,
      email || null,
      normalizedEmail,
      phone || null,
      normalizedPhone,
      input.source,
      confidence,
      consentStatus,
      marketingAllowed,
      now,
      metadata,
    ],
  );
  return result.rows[0]?.row ?? null;
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
  const result = await neonQuery<ContactJsonRow>(
    `
      SELECT to_jsonb(p) AS row
      FROM public.event_contact_profiles p
      WHERE p.event_id = $1::uuid
      ORDER BY p.last_seen_at DESC
    `,
    [eventId],
  );
  return result.rows.map(({ row }) => row);
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
  const result = await neonQuery<GuestJsonRow>(
    `
      SELECT to_jsonb(g) AS row
      FROM public.guests g
      WHERE g.event_id = $1::uuid
        AND g.qr_token = $2
      LIMIT 1
    `,
    [eventId, token],
  );
  const row = result.rows[0]?.row;
  return row ? mapGuest(row) : null;
}
