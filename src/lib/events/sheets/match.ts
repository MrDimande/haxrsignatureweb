import type { EventGuest } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findGuestMatch(
  guests: EventGuest[],
  row: SheetGuestRow,
  usedIds: Set<string>
): EventGuest | null {
  const available = guests.filter((g) => !usedIds.has(g.id));

  if (row.email) {
    const emailKey = normalizeEmail(row.email);
    const match = available.find(
      (g) => g.email && normalizeEmail(g.email) === emailKey
    );
    if (match) return match;
  }

  if (row.phone) {
    const phoneKey = normalizePhone(row.phone);
    if (phoneKey.length >= 8) {
      const match = available.find(
        (g) => g.phone && normalizePhone(g.phone) === phoneKey
      );
      if (match) return match;
    }
  }

  if (row.name) {
    const nameKey = normalizeName(row.name);
    const match = available.find(
      (g) => normalizeName(g.name) === nameKey
    );
    if (match) return match;
  }

  return null;
}
