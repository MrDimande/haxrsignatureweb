import { namesAreEquivalent, normalizeGuestName } from "@/lib/events/normalize";
import type { EventGuest } from "@/lib/events/types";

export type DuplicateCluster = {
  normalizedName: string;
  guestIds: string[];
  displayName: string;
};

export function buildDuplicateClusters(guests: EventGuest[]): DuplicateCluster[] {
  const buckets = new Map<string, EventGuest[]>();

  for (const guest of guests) {
    const key = normalizeGuestName(guest.name);
    if (!key || key.length < 2) continue;
    const bucket = buckets.get(key) ?? [];
    bucket.push(guest);
    buckets.set(key, bucket);
  }

  const clusters: DuplicateCluster[] = [];

  for (const [normalizedName, members] of buckets) {
    if (members.length < 2) continue;
    clusters.push({
      normalizedName,
      guestIds: members.map((guest) => guest.id),
      displayName: members[0]?.name ?? normalizedName,
    });
  }

  return clusters.sort((a, b) => b.guestIds.length - a.guestIds.length);
}

export function getDuplicateGuestIds(guests: EventGuest[]): Set<string> {
  const ids = new Set<string>();
  for (const cluster of buildDuplicateClusters(guests)) {
    for (const id of cluster.guestIds) {
      ids.add(id);
    }
  }
  return ids;
}

export function countDuplicateGuests(guests: EventGuest[]): number {
  return getDuplicateGuestIds(guests).size;
}

export function isPossibleDuplicate(
  guest: EventGuest,
  guests: EventGuest[]
): boolean {
  const key = normalizeGuestName(guest.name);
  if (!key || key.length < 2) return false;

  return guests.some(
    (other) =>
      other.id !== guest.id && namesAreEquivalent(other.name, guest.name)
  );
}
