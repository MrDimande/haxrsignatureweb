import { getPrivateStorageProvider } from "@/lib/storage/private-storage";
import { CONCIERGE_BUCKET } from "@/lib/concierge/types";

const DEFAULT_EXPIRES_SECONDS = 3600;

export function assertConciergeStoragePath(
  eventId: string,
  storagePath: string
): void {
  const expectedPrefix = `events/${eventId}/concierge/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    throw new Error("Caminho de ficheiro inválido para este evento.");
  }
  if (storagePath.includes("..")) {
    throw new Error("Caminho de ficheiro inválido.");
  }
}

export async function getConciergeSignedFileUrl(
  eventId: string,
  storagePath: string,
  expiresInSeconds = DEFAULT_EXPIRES_SECONDS
): Promise<string> {
  assertConciergeStoragePath(eventId, storagePath);

  const storage = getPrivateStorageProvider();
  return storage.createSignedUrl(CONCIERGE_BUCKET, storagePath, expiresInSeconds);
}
