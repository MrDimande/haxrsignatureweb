/**
 * HAXR Edition Engine — Memories Upload Service
 *
 * REGRA ARQUITETURAL (Gate 3C):
 * Este serviço depende estritamente de 'StorageProvider' e 'MemoriesRepository'.
 * Não contém nenhuma chamada direta ao Supabase Storage, AWS S3 ou Cloudflare R2.
 */

import {
  StorageProvider,
  buildCanonicalStoragePath,
  validateAndParseStoragePath,
  resolveStorageProvider,
} from "../storage";
import {
  MemoryUploadIntent,
  MemoryRecord,
  MemoriesRepository,
} from "./memories.types";
import {
  validateFileSize,
  matchesMagicBytes,
  PLUS_MEMORIES_CHALLENGES,
  PlusMemoriesChallengeId,
} from "./config";
import {
  isStorageWriteFreezeActive,
  StorageWriteFreezeError,
} from "./write-freeze";

export interface CreateUploadIntentInput {
  slug: string;
  photoId: string;
  contentType: string;
  declaredFileSizeBytes: number;
  bucketName?: string;
}

export interface CompleteUploadInput {
  slug: string;
  photoId: string;
  bucketName?: string;
  metadata: {
    guestName?: string | null;
    caption?: string | null;
    challengeId?: string | null;
    tableId?: string | null;
    participantId?: string | null;
  };
}

export interface CompleteUploadResult {
  success: boolean;
  error?: string;
  code?: string;
  record?: MemoryRecord;
}

export class MemoriesUploadService {
  private intents: Map<string, MemoryUploadIntent> = new Map();

  constructor(
    private readonly repository: MemoriesRepository,
    private readonly storageProvider?: StorageProvider,
    private readonly defaultBucket: string = "wedding-photos"
  ) {}

  private getProvider(): StorageProvider {
    return this.storageProvider || resolveStorageProvider();
  }

  async createUploadIntent(
    input: CreateUploadIntentInput
  ): Promise<{ uploadUrl: string; storagePath: string; expiresAt: string }> {
    if (isStorageWriteFreezeActive()) {
      throw new StorageWriteFreezeError();
    }

    const { slug, photoId, contentType, declaredFileSizeBytes } = input;
    const bucket = input.bucketName || this.defaultBucket;

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : contentType.includes("mp4")
      ? "mp4"
      : contentType.includes("quicktime")
      ? "mov"
      : contentType.includes("webm")
      ? "webm"
      : contentType.includes("heic")
      ? "heic"
      : contentType.includes("heif")
      ? "heif"
      : "jpg";

    const storagePath = buildCanonicalStoragePath(slug, photoId, ext);

    const sizeError = validateFileSize(declaredFileSizeBytes, contentType);
    if (sizeError) {
      throw new Error(sizeError);
    }

    const provider = this.getProvider();
    const signedUpload = await provider.createSignedUploadUrl(bucket, storagePath, {
      contentType,
      expiresInSeconds: 600,
    });

    const expiresAt = new Date(Date.now() + signedUpload.expiresInSeconds * 1000).toISOString();

    const intent: MemoryUploadIntent = {
      photoId,
      slug,
      bucketName: bucket,
      storagePath,
      contentType,
      declaredFileSizeBytes,
      expiresAt,
      status: "pending",
    };

    this.intents.set(photoId, intent);

    return {
      uploadUrl: signedUpload.uploadUrl,
      storagePath,
      expiresAt,
    };
  }

  async completeUpload(
    input: CompleteUploadInput
  ): Promise<CompleteUploadResult> {
    const { slug, photoId, metadata } = input;
    const bucket = input.bucketName || this.defaultBucket;

    const intent = this.intents.get(photoId);
    if (!intent) {
      return { success: false, error: "Pedido de envio expirado ou não encontrado.", code: "INTENT_EXPIRED" };
    }

    if (intent.slug !== slug || intent.bucketName !== bucket) {
      return { success: false, error: "Pedido de envio inválido ou violação de evento.", code: "INVALID_INTENT" };
    }

    if (intent.status !== "pending") {
      return { success: false, error: "Este pedido de envio já foi consumido.", code: "ALREADY_CONSUMED" };
    }

    validateAndParseStoragePath(intent.storagePath, slug, intent.contentType);

    const provider = this.getProvider();

    // 1. Download do binário para inspeção no servidor via StorageProvider
    const downloadRes = await provider.download(bucket, intent.storagePath);
    if (!downloadRes || !downloadRes.data || downloadRes.data.length === 0) {
      return {
        success: false,
        error: "Não foi possível confirmar o ficheiro enviado.",
        code: "UPLOAD_MISSING",
      };
    }

    const buffer = downloadRes.data;

    // 2. Validação estrita de tamanho real
    const sizeError = validateFileSize(buffer.byteLength, intent.contentType);
    if (sizeError || buffer.byteLength > intent.declaredFileSizeBytes) {
      // Purga imediata do ficheiro violador via StorageProvider
      await provider.remove(bucket, [intent.storagePath]);
      return {
        success: false,
        error: sizeError || "Tamanho do ficheiro superior ao declarado.",
        code: "FILE_TOO_LARGE",
      };
    }

    // 3. Validação estrita de Magic Bytes
    if (!matchesMagicBytes(buffer, intent.contentType)) {
      // Purga imediata do ficheiro forjado via StorageProvider
      await provider.remove(bucket, [intent.storagePath]);
      return {
        success: false,
        error: "Assinatura de ficheiro inválida (magic bytes mismatch).",
        code: "INVALID_SIGNATURE",
      };
    }

    // 4. Validação opcional de challengeId
    if (metadata.challengeId) {
      const isAllowed = PLUS_MEMORIES_CHALLENGES.includes(
        metadata.challengeId as PlusMemoriesChallengeId
      );
      if (!isAllowed) {
        return { success: false, error: "Desafio inválido.", code: "INVALID_CHALLENGE" };
      }
    }

    const record: MemoryRecord = {
      id: photoId,
      invitationSlug: slug,
      storagePath: intent.storagePath,
      originalFilename: intent.storagePath.split("/").pop() || "original.jpg",
      contentType: intent.contentType,
      fileSizeBytes: buffer.byteLength,
      guestName: metadata.guestName?.trim() || null,
      caption: metadata.caption?.trim() || null,
      challengeId: metadata.challengeId?.trim() || null,
      tableId: metadata.tableId?.trim() || null,
      participantId: metadata.participantId?.trim() || null,
      moderationStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    // 5. Persistir metadata na base de dados
    await this.repository.insert(record);

    intent.status = "consumed";

    return {
      success: true,
      record,
    };
  }

  /** Helper para testes de injeção de intents */
  public __seedIntent(intent: MemoryUploadIntent): void {
    this.intents.set(intent.photoId, intent);
  }
}
