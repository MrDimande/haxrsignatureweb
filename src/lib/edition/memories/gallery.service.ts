/**
 * HAXR Edition Engine — Memories Gallery Service
 *
 * REGRA ARQUITETURAL (Gate 3C):
 * A geração de URLs de visualização da galeria depende estritamente de 'StorageProvider'.
 * Zero chamadas diretas ao Supabase Storage.
 */

import {
  StorageProvider,
  resolveStorageProvider,
} from "../storage";
import {
  MemoriesRepository,
  PublicMemoryItem,
} from "./memories.types";
import { isVideoContentType } from "./config";

export class MemoriesGalleryService {
  constructor(
    private readonly repository: MemoriesRepository,
    private readonly storageProvider?: StorageProvider,
    private readonly defaultBucket: string = "wedding-photos",
    private readonly signedUrlTtlSeconds: number = 3600
  ) {}

  private getProvider(): StorageProvider {
    return this.storageProvider || resolveStorageProvider();
  }

  async listMemories(
    slug: string,
    bucketName?: string
  ): Promise<PublicMemoryItem[]> {
    if (!slug) return [];

    const bucket = bucketName || this.defaultBucket;
    const records = await this.repository.listPublic(slug);
    if (!records.length) return [];

    const provider = this.getProvider();
    const results: PublicMemoryItem[] = [];

    for (const record of records) {
      // Regra de segurança: memórias rejeitadas nunca recebem URL assinada
      if (record.moderationStatus === "rejected") {
        continue;
      }

      try {
        const signedUrl = await provider.createSignedUrl(bucket, record.storagePath, {
          expiresInSeconds: this.signedUrlTtlSeconds,
        });

        if (!signedUrl) continue;

        const kind = isVideoContentType(record.contentType) ? "video" : "image";

        results.push({
          id: record.id,
          signedUrl,
          createdAt: record.createdAt,
          contentType: record.contentType,
          kind,
          caption: record.caption,
          guestName: record.guestName,
          challengeId: record.challengeId,
          tableId: record.tableId,
        });
      } catch {
        // Se a geração falhar para um objeto individual, continua sem interromper o resto da galeria
        continue;
      }
    }

    return results;
  }
}
