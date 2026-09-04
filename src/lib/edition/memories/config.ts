/**
 * HAXR Edition Engine — Memories Configuration & Magic Bytes Validation
 */

export const PLUS_MEMORIES_CHALLENGES = Object.freeze([
  "first-look",
  "golden-hour",
  "dance-floor",
  "champagne-toast",
  "parents-tear",
  "detail-shot",
  "cake-cutting",
  "bouquet-toss",
  "table-cheers",
  "late-night-vibe",
  "grand-entrance",
  "candid-smile",
] as const);

export type PlusMemoriesChallengeId = (typeof PLUS_MEMORIES_CHALLENGES)[number];

export const ACCEPTED_IMAGE_MIMES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const ACCEPTED_VIDEO_MIMES = Object.freeze([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith("video/");
}

export function maxBytesForContentType(contentType: string): number {
  return isVideoContentType(contentType) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function validateFileSize(byteLength: number, contentType: string): string | null {
  const max = maxBytesForContentType(contentType);
  if (byteLength > max) {
    const maxMb = Math.round(max / (1024 * 1024));
    return `O ficheiro excede o limite de ${maxMb} MB.`;
  }
  return null;
}

function readAscii(buffer: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(
    ...buffer.slice(start, Math.min(start + length, buffer.length))
  );
}

function hasFtypBrand(buffer: Uint8Array, brands: readonly string[]): boolean {
  if (buffer.length < 12) return false;
  if (readAscii(buffer, 4, 4) !== "ftyp") return false;
  const major = readAscii(buffer, 8, 4).toLowerCase();
  if (brands.includes(major)) return true;
  for (let offset = 16; offset + 4 <= Math.min(buffer.length, 64); offset += 4) {
    const brand = readAscii(buffer, offset, 4).toLowerCase();
    if (brands.includes(brand)) return true;
  }
  return false;
}

/**
 * Validação de Magic Bytes (assinatura binária) para prevenir adulteração de ficheiros.
 */
export function matchesMagicBytes(
  buffer: Uint8Array,
  contentType: string
): boolean {
  const normType = contentType.toLowerCase().split(";")[0].trim();

  switch (normType) {
    case "image/jpeg":
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );

    case "image/png":
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case "image/webp":
      return (
        buffer.length >= 12 &&
        readAscii(buffer, 0, 4) === "RIFF" &&
        readAscii(buffer, 8, 4) === "WEBP"
      );

    case "image/heic":
    case "image/heif":
      return hasFtypBrand(buffer, [
        "heic",
        "heix",
        "hevc",
        "hevx",
        "mif1",
        "msf1",
        "heim",
        "heis",
      ]);

    case "video/mp4":
      return hasFtypBrand(buffer, [
        "isom",
        "iso2",
        "mp41",
        "mp42",
        "avc1",
        "dash",
      ]);

    case "video/quicktime":
      return hasFtypBrand(buffer, ["qt  "]);

    case "video/webm":
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );

    default:
      return false;
  }
}
