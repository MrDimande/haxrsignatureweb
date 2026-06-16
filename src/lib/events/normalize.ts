/**
 * Normalização partilhada para deduplicação, pesquisa e importação.
 */

const ACCENT_MAP: Record<string, string> = {
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ç: "c",
  ñ: "n",
};

function stripAccents(value: string): string {
  return value
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      return ACCENT_MAP[lower] ?? char;
    })
    .join("");
}

export function normalizeGuestName(value: string): string {
  return stripAccents(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeSearchQuery(value: string): string {
  return normalizeGuestName(value);
}

export function namesAreEquivalent(a: string, b: string): boolean {
  const na = normalizeGuestName(a);
  const nb = normalizeGuestName(b);
  if (!na || !nb) return false;
  return na === nb;
}

export type SearchMatchKind = "exact" | "starts_with" | "contains" | "fuzzy";

export function rankNameMatch(
  guestName: string,
  query: string
): { score: number; kind: SearchMatchKind } | null {
  const normalizedGuest = normalizeGuestName(guestName);
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedGuest || !normalizedQuery || normalizedQuery.length < 2) {
    return null;
  }

  if (normalizedGuest === normalizedQuery) {
    return { score: 100, kind: "exact" };
  }

  if (normalizedGuest.startsWith(normalizedQuery)) {
    return { score: 80, kind: "starts_with" };
  }

  if (normalizedGuest.includes(normalizedQuery)) {
    return { score: 60, kind: "contains" };
  }

  const queryParts = normalizedQuery.split(" ").filter(Boolean);
  const allPartsMatch = queryParts.every((part) => normalizedGuest.includes(part));
  if (allPartsMatch && queryParts.length > 1) {
    return { score: 50, kind: "fuzzy" };
  }

  return null;
}
