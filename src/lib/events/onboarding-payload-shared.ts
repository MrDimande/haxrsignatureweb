import type { CreateClientEventInput } from "@/lib/events/create-event-validation";

const mozambiquePhoneRegex = /^\+258[2-9]\d{7,8}$/;

export type StableOnboardingFingerprintInput = Pick<
  CreateClientEventInput,
  | "brideName"
  | "groomName"
  | "eventDate"
  | "eventLocation"
  | "estimatedGuests"
  | "phone"
  | "eventType"
>;

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

/** Canonical material for a stable onboarding fingerprint (browser + server safe). */
export function buildStableOnboardingFingerprintMaterial(
  input: StableOnboardingFingerprintInput,
): string {
  return [
    input.eventType,
    input.brideName.trim().toLowerCase(),
    input.groomName.trim().toLowerCase(),
    input.eventDate.trim(),
    input.eventLocation.trim().toLowerCase(),
    String(input.estimatedGuests),
    normalizeMozambiquePhone(input.phone),
  ].join("\u001f");
}
