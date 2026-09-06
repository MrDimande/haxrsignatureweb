import { getPrivateStorageProvider, isPrivateStorageConfigured } from "@/lib/storage/private-storage";
import {
  PORTAL_CONCIERGE_ALLOWED_MIME,
  PORTAL_CONCIERGE_BUCKET,
  PORTAL_CONCIERGE_MAX_FILE_BYTES,
  type ConciergeStorageMode,
  type ConciergeStorageProvider,
  type ConciergeStorageUploadInput,
  type ConciergeStorageUploadResult,
} from "./concierge-storage-provider";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export class UniversalConciergeStorageProvider implements ConciergeStorageProvider {
  get mode(): ConciergeStorageMode {
    const provider = (process.env.HAXR_PRIVATE_STORAGE_PROVIDER || "").trim().toLowerCase();
    if (provider === "r2-s3" || provider === "r2") return "r2-s3";
    if (provider === "supabase") return "supabase";
    return "metadata_only";
  }

  async uploadFile(input: ConciergeStorageUploadInput): Promise<ConciergeStorageUploadResult> {
    if (!isPrivateStorageConfigured()) {
      throw new Error("Armazenamento privado não configurado.");
    }
    if (input.buffer.length > PORTAL_CONCIERGE_MAX_FILE_BYTES) {
      throw new Error("Ficheiro demasiado grande (máx. 20 MB).");
    }
    if (!PORTAL_CONCIERGE_ALLOWED_MIME.has(input.mimeType)) {
      throw new Error(`Tipo de ficheiro não suportado: ${input.mimeType}`);
    }

    const fileName = sanitizeFileName(input.fileName);
    const storagePath = `events/${input.eventId}/portal/${input.itemId}/${fileName}`;
    const storage = getPrivateStorageProvider();

    await storage.uploadBuffer(PORTAL_CONCIERGE_BUCKET, storagePath, input.buffer, input.mimeType);

    return { storagePath, sizeBytes: input.buffer.length };
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!isPrivateStorageConfigured()) return null;
    try {
      const storage = getPrivateStorageProvider();
      return await storage.createSignedUrl(PORTAL_CONCIERGE_BUCKET, path, expiresInSeconds);
    } catch {
      return null;
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (!isPrivateStorageConfigured()) return;
    try {
      const storage = getPrivateStorageProvider();
      await storage.deleteFile(PORTAL_CONCIERGE_BUCKET, path);
    } catch {
      // Non-blocking safe delete
    }
  }
}
