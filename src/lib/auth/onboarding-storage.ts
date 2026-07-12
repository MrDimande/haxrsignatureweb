/**
 * Reads onboarding wizard data from a key-value store (localStorage in the browser).
 * Kept separate from onboarding-status so adapters and tests can reuse the same shape.
 */

export const ONBOARDING_KEYS = {
  role: "haxr_onboarding_role",
  bride: "haxr_onboarding_bride",
  groom: "haxr_onboarding_groom",
  date: "haxr_onboarding_date",
  location: "haxr_onboarding_location",
  guests: "haxr_onboarding_guests",
  budget: "haxr_onboarding_budget",
  phone: "haxr_onboarding_phone",
} as const;

/** Keys required for a complete onboarding profile (budget is optional). */
export const ONBOARDING_REQUIRED_KEYS = [
  ONBOARDING_KEYS.role,
  ONBOARDING_KEYS.bride,
  ONBOARDING_KEYS.groom,
  ONBOARDING_KEYS.date,
  ONBOARDING_KEYS.location,
  ONBOARDING_KEYS.guests,
  ONBOARDING_KEYS.phone,
] as const;

export type OnboardingRole = "noiva" | "consultor" | string;

export interface OnboardingRawData {
  role: OnboardingRole;
  brideName: string;
  groomName: string;
  eventDateIso: string;
  location: string;
  guestsCount: number;
  estimatedBudget?: number;
  phone: string;
}

export type OnboardingStorageReader = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
};

function readTrimmed(store: OnboardingStorageReader, key: string): string {
  return store.getItem(key)?.trim() ?? "";
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

/** Returns null when mandatory fields are missing or invalid. */
export function readOnboardingData(
  store: OnboardingStorageReader,
): OnboardingRawData | null {
  const role = readTrimmed(store, ONBOARDING_KEYS.role);
  const brideName = readTrimmed(store, ONBOARDING_KEYS.bride);
  const groomName = readTrimmed(store, ONBOARDING_KEYS.groom);
  const eventDateIso = readTrimmed(store, ONBOARDING_KEYS.date);
  const location = readTrimmed(store, ONBOARDING_KEYS.location);
  const guestsRaw = readTrimmed(store, ONBOARDING_KEYS.guests);
  const phone = readTrimmed(store, ONBOARDING_KEYS.phone);
  const budgetRaw = readTrimmed(store, ONBOARDING_KEYS.budget);

  if (!role || !brideName || !groomName || !eventDateIso || !location || !guestsRaw || !phone) {
    return null;
  }

  const guestsCount = parsePositiveInt(guestsRaw);
  if (guestsCount === null) return null;

  const estimatedBudget = budgetRaw ? parsePositiveInt(budgetRaw) ?? undefined : undefined;

  return {
    role,
    brideName,
    groomName,
    eventDateIso,
    location,
    guestsCount,
    estimatedBudget,
    phone,
  };
}

export function hasRequiredOnboardingKeys(store: OnboardingStorageReader): boolean {
  return readOnboardingData(store) !== null;
}

export function buildCoupleDisplayName(data: Pick<OnboardingRawData, "brideName" | "groomName">): string {
  return `${data.brideName} & ${data.groomName}`;
}

export function buildOnboardingEventSlug(
  data: Pick<OnboardingRawData, "brideName" | "groomName">,
): string {
  const slug = `${data.brideName}-${data.groomName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "meu-evento";
}

export function resolveEventTypeLabel(role: OnboardingRole): string {
  return role === "consultor" ? "Evento · Consultor" : "Casamento";
}

export function formatOnboardingEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString("pt-MZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Browser helper — returns null during SSR. */
export function readOnboardingFromBrowser(): OnboardingRawData | null {
  if (typeof window === "undefined") return null;
  return readOnboardingData(localStorage);
}

export function getOnboardingEventNameFromBrowser(): string | null {
  const data = readOnboardingFromBrowser();
  return data ? buildCoupleDisplayName(data) : null;
}

export function getOnboardingEventSlugFromBrowser(): string | null {
  const data = readOnboardingFromBrowser();
  return data ? buildOnboardingEventSlug(data) : null;
}
