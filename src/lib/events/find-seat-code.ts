import { randomBytes } from "crypto";

const ACCESS_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,63}$/;
const STRONG_CODE_PATTERN = /^HXR-[A-F0-9]{24}$/;

/** Normaliza código de acesso (ex.: haxr300 → HAXR300). */
export function normalizeFindSeatCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidFindSeatCode(value: string): boolean {
  const normalized = normalizeFindSeatCode(value);
  return ACCESS_CODE_PATTERN.test(normalized);
}

export function isStrongFindSeatCode(value: string): boolean {
  return STRONG_CODE_PATTERN.test(normalizeFindSeatCode(value));
}

/**
 * Gera um código opaco com 96 bits de entropia.
 *
 * O parâmetro opcional é mantido apenas por compatibilidade com chamadas
 * antigas. O nome do evento nunca volta a fazer parte do segredo.
 */
export function generateFindSeatCode(seed?: string): string {
  void seed;
  return `HXR-${randomBytes(12).toString("hex").toUpperCase()}`;
}

export const FIND_SEAT_MIN_NAME_LENGTH = 3;
export const FIND_SEAT_MAX_RESULTS = 5;
export const FIND_SEAT_MAX_CODE_LENGTH = 64;
