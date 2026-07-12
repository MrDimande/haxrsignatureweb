export type ConciergeStorageMode = "metadata_only" | "supabase";

export interface ConciergeStorageUploadInput {
  eventId: string;
  itemId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ConciergeStorageUploadResult {
  storagePath: string;
  sizeBytes: number;
}

export interface ConciergeStorageProvider {
  readonly mode: ConciergeStorageMode;
  uploadFile(input: ConciergeStorageUploadInput): Promise<ConciergeStorageUploadResult>;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string | null>;
  deleteFile(path: string): Promise<void>;
}

export const PORTAL_CONCIERGE_BUCKET = "haxr-concierge";

export const PORTAL_CONCIERGE_MAX_FILE_BYTES = 20 * 1024 * 1024;

export const PORTAL_CONCIERGE_ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
