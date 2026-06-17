import { randomBytes } from "crypto";

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,19}$/;

/** Normaliza código de acesso (ex.: haxr300 → HAXR300). */
export function normalizeFindSeatCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidFindSeatCode(value: string): boolean {
  const normalized = normalizeFindSeatCode(value);
  return CODE_PATTERN.test(normalized);
}

/** Gera código legível para partilhar em convites/QR (ex.: HAXR3A2F). */
export function generateFindSeatCode(seed?: string): string {
  const base =
    (seed ?? "HAXR")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase() || "HAXR";
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `${base}${suffix}`.slice(0, 12);
}

export const FIND_SEAT_MIN_NAME_LENGTH = 4;
export const FIND_SEAT_MAX_RESULTS = 5;
