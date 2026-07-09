import { createHash } from "node:crypto";
import type { CreateClientEventInput } from "@/lib/events/create-event-validation";
import type {
  ClientEventInsert,
  ClientEventType,
} from "@/lib/events/client-app-database.types";
import { buildOnboardingEventSlug } from "@/lib/auth/onboarding-storage";

const mozambiquePhoneRegex = /^\+258[2-9]\d{7,8}$/;

export function normalizeMozambiquePhone(phone: string): string {
  const trimmed = phone.trim();
  if (mozambiquePhoneRegex.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("258") && digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+258${digits}`;
  }

  return trimmed;
}

export function buildClientEventSlug(
  input: Pick<CreateClientEventInput, "brideName" | "groomName">,
): string {
  return buildOnboardingEventSlug({
    brideName: input.brideName,
    groomName: input.groomName,
  });
}

/** Stable SHA-256 fingerprint for idempotency when localFingerprint is absent. */
export function buildStableOnboardingFingerprint(
  input: Pick<
    CreateClientEventInput,
    | "brideName"
    | "groomName"
    | "eventDate"
    | "eventLocation"
    | "estimatedGuests"
    | "phone"
    | "eventType"
  >,
): string {
  const material = [
    input.eventType,
    input.brideName.trim().toLowerCase(),
    input.groomName.trim().toLowerCase(),
    input.eventDate.trim(),
    input.eventLocation.trim().toLowerCase(),
    String(input.estimatedGuests),
    normalizeMozambiquePhone(input.phone),
  ].join("\u001f");

  return createHash("sha256").update(material, "utf8").digest("hex");
}

export function resolveOnboardingFingerprint(
  input: CreateClientEventInput,
): string {
  const explicit = input.localFingerprint?.trim();
  if (explicit) return explicit;
  return buildStableOnboardingFingerprint(input);
}

export function normalizeCreateEventInput(
  input: CreateClientEventInput,
): CreateClientEventInput {
  return {
    ...input,
    eventName: input.eventName.trim(),
    brideName: input.brideName.trim(),
    groomName: input.groomName.trim(),
    eventDate: input.eventDate.trim(),
    eventLocation: input.eventLocation.trim(),
    phone: normalizeMozambiquePhone(input.phone),
    servicesInterested: input.servicesInterested ?? [],
    localFingerprint: input.localFingerprint?.trim(),
  };
}

export function mapCreateEventInputToClientEventInsert(
  ownerUserId: string,
  input: CreateClientEventInput,
  fingerprint: string,
): ClientEventInsert {
  return {
    owner_user_id: ownerUserId,
    slug: buildClientEventSlug(input),
    event_name: input.eventName,
    event_type: input.eventType as ClientEventType,
    bride_name: input.brideName,
    groom_name: input.groomName,
    event_date: input.eventDate,
    event_location: input.eventLocation,
    estimated_guests: input.estimatedGuests,
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    source: input.source,
    services_interested: input.servicesInterested,
    phone: input.phone,
    onboarding_fingerprint: fingerprint,
    status: "planning",
    is_active: true,
  };
}

export function buildClientEventRedirect(eventId: string): string {
  return `/app/dashboard?eventId=${eventId}`;
}
