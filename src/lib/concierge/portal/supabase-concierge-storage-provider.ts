import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  PORTAL_CONCIERGE_ALLOWED_MIME,
  PORTAL_CONCIERGE_BUCKET,
  PORTAL_CONCIERGE_MAX_FILE_BYTES,
  type ConciergeStorageProvider,
  type ConciergeStorageUploadInput,
  type ConciergeStorageUploadResult,
} from "./concierge-storage-provider";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export class SupabaseConciergeStorageProvider implements ConciergeStorageProvider {
  readonly mode = "supabase" as const;

  async uploadFile(input: ConciergeStorageUploadInput): Promise<ConciergeStorageUploadResult> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase não configurado.");
    }
    if (input.buffer.length > PORTAL_CONCIERGE_MAX_FILE_BYTES) {
      throw new Error("Ficheiro demasiado grande (máx. 20 MB).");
    }
    if (!PORTAL_CONCIERGE_ALLOWED_MIME.has(input.mimeType)) {
      throw new Error(`Tipo de ficheiro não suportado: ${input.mimeType}`);
    }

    const fileName = sanitizeFileName(input.fileName);
    const storagePath = `events/${input.eventId}/portal/${input.itemId}/${fileName}`;
    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from(PORTAL_CONCIERGE_BUCKET)
      .upload(storagePath, input.buffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Storage: ${error.message}`);
    }

    // TODO: antivirus / file scanning pipeline

    return { storagePath, sizeBytes: input.buffer.length };
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(PORTAL_CONCIERGE_BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  async deleteFile(path: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = createAdminClient();
    await supabase.storage.from(PORTAL_CONCIERGE_BUCKET).remove([path]);
  }
}
