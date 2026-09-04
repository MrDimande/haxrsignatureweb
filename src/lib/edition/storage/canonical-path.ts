/**
 * HAXR Edition Engine — Canonical Storage Path and Security Validation
 *
 * Contrato Canónico Inviolável:
 *   {invitation_slug}/{photo_id_uuid}/original.{ext}
 */

import { StorageSecurityError } from "./storage-provider.types";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9-]+$/;

export const ALLOWED_STORAGE_EXTENSIONS = Object.freeze([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "mp4",
  "mov",
  "webm",
]);

export const EXTENSION_MIME_MAP: Record<string, string> = Object.freeze({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
});

export interface ParsedStoragePath {
  slug: string;
  photoId: string;
  fileName: string;
  extension: string;
  canonicalPath: string;
}

/**
 * Valida rigorosamente que o storagePath respeita a estrutura canónica do ecossistema HAXR:
 *   {invitation_slug}/{photo_id_uuid}/original.{ext}
 *
 * Rejeita explicitamente:
 * - Path traversal ("..", "\", "/", caracteres de controlo, null bytes)
 * - Slugs fora do padrão permitido (apenas lowercase alfanumérico e hífens)
 * - Identificadores de foto que não sejam UUID v4 válidos
 * - Nomes de ficheiro diferentes de "original.{ext}"
 * - Extensões não autorizadas
 * - Incompatibilidade entre a extensão do ficheiro e o Content-Type declarado
 * - Tentativas de acesso cruzado entre convites (cross-invitation access)
 */
export function validateAndParseStoragePath(
  storagePath: string,
  expectedSlug?: string,
  declaredContentType?: string,
  options?: { allowStaging?: boolean }
): ParsedStoragePath {
  if (!storagePath || typeof storagePath !== "string") {
    throw new StorageSecurityError("storage_path_empty_or_invalid");
  }

  // 1. Deteção de Path Traversal e Caracteres Ilegais
  if (
    storagePath.includes("..") ||
    storagePath.includes("\\") ||
    storagePath.startsWith("/") ||
    storagePath.endsWith("/") ||
    storagePath.includes("//") ||
    /[\x00-\x1F\x7F]/.test(storagePath)
  ) {
    throw new StorageSecurityError("path_traversal_or_illegal_characters_detected");
  }

  let effectivePath = storagePath;
  if (options?.allowStaging && storagePath.startsWith("__migration/")) {
    const stagingParts = storagePath.split("/");
    if (stagingParts.length !== 5 || !stagingParts[1]) {
      throw new StorageSecurityError("invalid_staging_path_structure");
    }
    effectivePath = `${stagingParts[2]}/${stagingParts[3]}/${stagingParts[4]}`;
  }

  // 2. Estrutura exata: 3 segmentos
  const parts = effectivePath.split("/");
  if (parts.length !== 3) {
    throw new StorageSecurityError(
      `storage_path_must_have_exactly_three_segments:received_${parts.length}`
    );
  }

  const [slug, photoId, fileName] = parts;

  // 3. Validação do Slug
  if (!slug || !SLUG_REGEX.test(slug)) {
    throw new StorageSecurityError(`invalid_invitation_slug_format:${slug}`);
  }

  // 4. Isolamento Multi-Evento: Proteção contra Cross-Invitation Access
  if (expectedSlug && slug !== expectedSlug) {
    throw new StorageSecurityError(
      `cross_invitation_access_blocked:expected_${expectedSlug}_got_${slug}`
    );
  }

  // 5. Validação do UUID da fotografia
  if (!UUID_V4_REGEX.test(photoId)) {
    throw new StorageSecurityError(`invalid_photo_uuid_format:${photoId}`);
  }

  // 6. Validação do nome e extensão canónica
  if (!fileName.startsWith("original.")) {
    throw new StorageSecurityError(`file_name_must_be_original_dot_ext:${fileName}`);
  }

  const ext = fileName.slice("original.".length).toLowerCase();
  if (!ALLOWED_STORAGE_EXTENSIONS.includes(ext)) {
    throw new StorageSecurityError(`unsupported_file_extension:${ext}`);
  }

  // 7. Compatibilidade entre Content-Type e Extensão
  if (declaredContentType) {
    const expectedMime = EXTENSION_MIME_MAP[ext];
    const normalizedDeclared = declaredContentType.toLowerCase().split(";")[0].trim();
    if (expectedMime && normalizedDeclared !== expectedMime) {
      throw new StorageSecurityError(
        `mime_type_extension_mismatch:ext_${ext}_decl_${normalizedDeclared}`
      );
    }
  }

  return {
    slug,
    photoId,
    fileName,
    extension: ext,
    canonicalPath: `${slug}/${photoId}/original.${ext}`,
  };
}

/**
 * Construtor determinístico do path canónico.
 */
export function buildCanonicalStoragePath(
  slug: string,
  photoId: string,
  extension: string
): string {
  const cleanExt = extension.replace(/^\./, "").toLowerCase();
  const parsed = validateAndParseStoragePath(`${slug}/${photoId}/original.${cleanExt}`, slug);
  return parsed.canonicalPath;
}

/**
 * Validação rigorosa dos limites de TTL para URLs assinadas.
 * - Upload: padrão 600s (10 min), mín 60s, máx 3600s (1 hora).
 * - Download: padrão 3600s (1 hora), mín 60s, máx 86400s (24 horas).
 */
export function validateTtlSeconds(
  ttl: number | undefined,
  type: "upload" | "download"
): number {
  if (ttl === undefined) {
    return type === "upload" ? 600 : 3600;
  }

  if (typeof ttl !== "number" || !Number.isInteger(ttl) || isNaN(ttl)) {
    throw new StorageSecurityError(`invalid_ttl_format:must_be_integer_${ttl}`);
  }

  const min = 60;
  const max = type === "upload" ? 3600 : 86400;

  if (ttl < min || ttl > max) {
    throw new StorageSecurityError(
      `ttl_out_of_bounds:must_be_between_${min}_and_${max}_received_${ttl}`
    );
  }

  return ttl;
}
