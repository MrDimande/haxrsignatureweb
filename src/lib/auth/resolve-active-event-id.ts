import { ONBOARDING_SYNC_KEYS } from "@/lib/auth/onboarding-sync";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ActiveEventIdSource = "url" | "local_storage" | "profile" | "none";

export type ResolvedActiveEventId =
  | { eventId: string; source: Exclude<ActiveEventIdSource, "none"> }
  | { eventId: null; source: "none" };

export type SearchParamsLike = {
  get(name: string): string | null;
};

export type StorageLike = {
  getItem(key: string): string | null;
};

export function isRealClientEventId(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return UUID_REGEX.test(trimmed);
}

export function resolveActiveEventIdFromUrl(
  searchParams?: SearchParamsLike | null,
): string | null {
  const value = searchParams?.get("eventId")?.trim();
  return value || null;
}

export function resolveActiveEventIdFromLocalStorage(
  store: StorageLike | null = null,
): string | null {
  if (!store) return null;
  return store.getItem(ONBOARDING_SYNC_KEYS.syncedEventId)?.trim() || null;
}

export function resolveActiveEventId(input: {
  searchParams?: SearchParamsLike | null;
  store?: StorageLike | null;
  profileActiveEventId?: string | null;
}): ResolvedActiveEventId {
  const fromUrl = resolveActiveEventIdFromUrl(input.searchParams);
  if (fromUrl) {
    return { eventId: fromUrl, source: "url" };
  }

  const fromStorage = resolveActiveEventIdFromLocalStorage(input.store ?? null);
  if (fromStorage) {
    return { eventId: fromStorage, source: "local_storage" };
  }

  const fromProfile = input.profileActiveEventId?.trim();
  if (fromProfile) {
    return { eventId: fromProfile, source: "profile" };
  }

  return { eventId: null, source: "none" };
}

export function resolvePreferredRealClientEventId(input: {
  searchParams?: SearchParamsLike | null;
  store?: StorageLike | null;
  profileActiveEventId?: string | null;
}): string | null {
  const resolved = resolveActiveEventId(input);
  if (!resolved.eventId || !isRealClientEventId(resolved.eventId)) {
    return null;
  }
  return resolved.eventId;
}
