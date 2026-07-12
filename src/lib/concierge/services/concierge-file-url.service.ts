import { createAdminClient } from "@/lib/supabase/server";
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

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(CONCIERGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Não foi possível gerar link do ficheiro.");
  }

  return data.signedUrl;
}
