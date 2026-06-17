/**
 * Normalização partilhada para deduplicação, pesquisa e importação.
 */

const PLUS_SUFFIX_PATTERN = /\s*(\(\s*\+?\s*(\d+)\s*\)|\+\s*(\d+))\s*$/i;

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

/** Remove sufixos «+1», «(+2)» etc. do nome para deduplicação e matching. */
export function stripPlusSuffix(value: string): string {
  return value.replace(PLUS_SUFFIX_PATTERN, "").trim();
}

export type ParsedGuestName = {
  name: string;
  plusOnes: number;
  inferredGroupName: string | null;
};

/**
 * Interpreta entradas como «Carlos Dimande +1» ou «João e Maria» (unidade familiar).
 */
export function parseGuestNameInput(raw: string): ParsedGuestName {
  const trimmed = raw.trim();
  let plusOnes = 0;
  let name = trimmed;

  const plusMatch = trimmed.match(PLUS_SUFFIX_PATTERN);
  if (plusMatch) {
    plusOnes = Number.parseInt(plusMatch[2] ?? plusMatch[3] ?? "1", 10) || 1;
    name = stripPlusSuffix(trimmed);
  }

  const inferredGroupName = inferFamilyGroupName(name);

  return {
    name: name.trim(),
    plusOnes,
    inferredGroupName,
  };
}

/** Detecta padrão «João e Maria» como grupo familiar (duas partes, sem «&»). */
export function inferFamilyGroupName(value: string): string | null {
  const cleaned = value.trim();
  if (!/\s+e\s+/i.test(cleaned)) return null;

  const parts = cleaned.split(/\s+e\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  if (parts.some((part) => part.length < 2)) return null;

  return cleaned;
}

export function normalizeGuestName(value: string): string {
  return stripAccents(stripPlusSuffix(value))
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
