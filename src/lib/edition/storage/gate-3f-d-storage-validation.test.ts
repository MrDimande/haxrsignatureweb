/**
 * HAXR Edition Engine — Gate 3F-D Storage Abstraction & Parity Test Suite
 *
 * REGRAS FUNDAMENTAIS (Gate 3F-D):
 * - Português de Moçambique em todos os comentários e asserções.
 * - Testes determinísticos em memória sem chamadas de rede ou escritas remotas no R2.
 * - Valida paridade de contrato entre SupabaseStorageProvider e S3CompatibleStorageProvider.
 * - Valida semântica de objectos ausentes (retorno de null).
 * - Valida rejeição estrita de caminhos canónicos inválidos.
 * - Valida preservação de MIME types reais do manifest (JPEG, HEIC, MP4, MOV).
 * - Valida geração de URLs privadas pré-assinadas.
 * - Valida integração do Edition Engine (Galeria e Uploads) com S3CompatibleStorageProvider.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { createHash } from "node:crypto";

import {
  StorageProvider,
  StorageSecurityError,
} from "./storage-provider.types";
import {
  SupabaseStorageProvider,
  SupabaseStorageClientLike,
} from "./supabase-storage-provider";
import {
  S3CompatibleStorageProvider,
  S3ClientLike,
  S3PresignerLike,
  S3CommandStructural,
} from "./s3-compatible-storage-provider";
import {
  resolveStorageProvider,
  __setStorageProviderForTests,
  __resetStorageComposition,
} from "./storage-composition";
import { MemoriesGalleryService } from "../memories/gallery.service";
import { MemoriesUploadService } from "../memories/upload.service";
import {
  MemoryRecord,
  MemoriesRepository,
} from "../memories/memories.types";

function sha256(buf: Uint8Array | string): string {
  const buffer = typeof buf === "string" ? Buffer.from(buf, "utf8") : Buffer.from(buf);
  return createHash("sha256").update(buffer).digest("hex");
}

class InMemoryMemoriesRepo implements MemoriesRepository {
  private items: Map<string, MemoryRecord> = new Map();

  async insert(record: MemoryRecord): Promise<void> {
    this.items.set(record.id, record);
  }

  async findById(photoId: string, slug: string): Promise<MemoryRecord | null> {
    const item = this.items.get(photoId);
    if (!item) return null;
    if (slug && item.invitationSlug !== slug) return null;
    return item;
  }

  async listPublic(slug: string): Promise<MemoryRecord[]> {
    return Array.from(this.items.values()).filter(
      (m) => m.invitationSlug === slug && m.moderationStatus !== "rejected"
    );
  }

  async updateModerationStatus(
    photoId: string,
    slug: string,
    status: "approved" | "rejected"
  ): Promise<boolean> {
    const item = this.items.get(photoId);
    if (!item || item.invitationSlug !== slug) return false;
    item.moderationStatus = status;
    return true;
  }
}

describe("Gate 3F-D — Storage Abstraction & Parity Suite", () => {
  const BUCKET = "wedding-photos";
  const SLUG = "jessicaesamueltraditionalwedding";
  const PHOTO_ID = "0ec655a9-85e7-4d13-93d2-9d422fe06d4d";
  const CANONICAL_PATH = `${SLUG}/${PHOTO_ID}/original.jpg`;
  const DUMMY_PAYLOAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  afterEach(() => {
    __resetStorageComposition();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CONTRATO DE LEITURA E PARIDADE SUPABASE / R2
  // ───────────────────────────────────────────────────────────────────────────
  describe("Paridade de Leitura entre Providers", () => {
    it("ambos os providers retornam payload idêntico, tamanho e MIME type", async () => {
      const mockSupabaseClient: SupabaseStorageClientLike = {
        storage: {
          from: () => ({
            createSignedUploadUrl: async () => ({ data: null, error: null }),
            createSignedUrl: async () => ({ data: null, error: null }),
            download: async () => ({
              data: new Blob([DUMMY_PAYLOAD], { type: "image/jpeg" }),
              error: null,
            }),
            remove: async () => ({ data: null, error: null }),
          }),
        },
      };

      const mockS3Client: S3ClientLike = {
        send: async <T>(cmd: S3CommandStructural): Promise<T> => {
          if (cmd._type === "GetObjectCommand") {
            return {
              Body: DUMMY_PAYLOAD,
              ContentType: "image/jpeg",
            } as T;
          }
          return {} as T;
        },
      };

      const mockPresigner: S3PresignerLike = {
        getSignedUrl: async () => "https://r2.dummy/presigned",
      };

      const supaProvider = new SupabaseStorageProvider(mockSupabaseClient);
      const s3Provider = new S3CompatibleStorageProvider(mockS3Client, mockPresigner, {
        bucketName: BUCKET,
      });

      const supaRes = await supaProvider.download(BUCKET, CANONICAL_PATH);
      const s3Res = await s3Provider.download(BUCKET, CANONICAL_PATH);

      assert.ok(supaRes !== null);
      assert.ok(s3Res !== null);

      assert.strictEqual(supaRes.sizeBytes, s3Res.sizeBytes);
      assert.strictEqual(supaRes.contentType, s3Res.contentType);
      assert.strictEqual(sha256(supaRes.data), sha256(s3Res.data));
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SEMÂNTICA DE OBJECTO AUSENTE
  // ───────────────────────────────────────────────────────────────────────────
  describe("Semântica de Objecto Ausente", () => {
    it("ambos os providers retornam null quando o objecto não existe", async () => {
      const mockSupabaseClient: SupabaseStorageClientLike = {
        storage: {
          from: () => ({
            createSignedUploadUrl: async () => ({ data: null, error: null }),
            createSignedUrl: async () => ({ data: null, error: null }),
            download: async () => ({
              data: null,
              error: new Error("Object not found"),
            }),
            remove: async () => ({ data: null, error: null }),
          }),
        },
      };

      const mockS3Client: S3ClientLike = {
        send: async () => {
          const err = new Error("The specified key does not exist.");
          (err as unknown as Record<string, unknown>).name = "NoSuchKey";
          throw err;
        },
      };

      const supaProvider = new SupabaseStorageProvider(mockSupabaseClient);
      const s3Provider = new S3CompatibleStorageProvider(mockS3Client, {
        getSignedUrl: async () => "",
      });

      const absentKey = `${SLUG}/00000000-0000-4000-8000-000000000000/original.jpg`;

      const supaRes = await supaProvider.download(BUCKET, absentKey);
      const s3Res = await s3Provider.download(BUCKET, absentKey);

      assert.strictEqual(supaRes, null);
      assert.strictEqual(s3Res, null);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SEGURANÇA E ENFORCEMENT DE CAMINHOS CANÓNICOS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Validação de Caminhos Canónicos", () => {
    const invalidPaths = [
      "",
      "../path-traversal/original.jpg",
      "/leading-slash/original.jpg",
      `${SLUG}//double-slash/original.jpg`,
      "invalid-slug/not-uuid/original.jpg",
      `${SLUG}/${PHOTO_ID}/malicious.sh`,
      `${SLUG}/${PHOTO_ID}/not-original.jpg`,
    ];

    it("rejeita caminhos inválidos antes de qualquer operação de storage", async () => {
      const mockS3Client: S3ClientLike = {
        send: async () => {
          throw new Error("Não devia ter chegado ao cliente S3!");
        },
      };
      const s3Provider = new S3CompatibleStorageProvider(mockS3Client, {
        getSignedUrl: async () => "",
      });

      for (const badPath of invalidPaths) {
        await assert.rejects(
          async () => s3Provider.download(BUCKET, badPath),
          (err: unknown) => err instanceof StorageSecurityError
        );

        await assert.rejects(
          async () => s3Provider.createSignedUrl(BUCKET, badPath),
          (err: unknown) => err instanceof StorageSecurityError
        );
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. PRESERVAÇÃO DE MIME TYPES
  // ───────────────────────────────────────────────────────────────────────────
  describe("Preservação de MIME Types", () => {
    const testCases = [
      { ext: "jpg", mime: "image/jpeg" },
      { ext: "heic", mime: "image/heic" },
      { ext: "mp4", mime: "video/mp4" },
      { ext: "mov", mime: "video/quicktime" },
    ];

    for (const tc of testCases) {
      it(`preserva MIME type '${tc.mime}' para extensão '${tc.ext}'`, async () => {
        const path = `${SLUG}/${PHOTO_ID}/original.${tc.ext}`;

        const mockS3Client: S3ClientLike = {
          send: async <T>(cmd: S3CommandStructural): Promise<T> => {
            if (cmd._type === "GetObjectCommand") {
              return {
                Body: new Uint8Array([1, 2, 3]),
                ContentType: tc.mime,
              } as T;
            }
            return {} as T;
          },
        };

        const s3Provider = new S3CompatibleStorageProvider(mockS3Client, {
          getSignedUrl: async () => "",
        });

        const res = await s3Provider.download(BUCKET, path);
        assert.ok(res !== null);
        assert.strictEqual(res.contentType, tc.mime);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. SEMÂNTICA DE URLS PRIVADAS E PRÉ-ASSINADAS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Semântica de URLs Pré-Assinadas", () => {
    it("cria URLs assinadas com TTL respeitado e sem dependência de URL pública", async () => {
      let presignedExpiresIn: number | undefined;

      const mockPresigner: S3PresignerLike = {
        getSignedUrl: async (_client, cmd, opts) => {
          presignedExpiresIn = opts?.expiresIn;
          return `https://haxr-r2.private/${cmd.Bucket}/${cmd.Key}?X-Amz-Expires=${opts?.expiresIn}`;
        },
      };

      const s3Provider = new S3CompatibleStorageProvider(
        { send: async <T>() => ({} as T) },
        mockPresigner,
        { bucketName: BUCKET }
      );

      const url = await s3Provider.createSignedUrl(BUCKET, CANONICAL_PATH, {
        expiresInSeconds: 1800,
      });

      assert.strictEqual(presignedExpiresIn, 1800);
      assert.ok(url.includes("X-Amz-Expires=1800"));
      assert.ok(url.includes(CANONICAL_PATH));
    });

    it("rejeita TTL de download fora dos limites permitidos (60s a 86400s)", async () => {
      const s3Provider = new S3CompatibleStorageProvider(
        { send: async <T>() => ({} as T) },
        { getSignedUrl: async () => "" },
        { bucketName: BUCKET }
      );

      await assert.rejects(
        async () => s3Provider.createSignedUrl(BUCKET, CANONICAL_PATH, { expiresInSeconds: 10 }),
        (err: unknown) => err instanceof StorageSecurityError
      );

      await assert.rejects(
        async () => s3Provider.createSignedUrl(BUCKET, CANONICAL_PATH, { expiresInSeconds: 100000 }),
        (err: unknown) => err instanceof StorageSecurityError
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. COMPOSITION ROOT & FABRICAÇÃO DE PROVIDERS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Composition Root & Injeção de Dependências", () => {
    it("mantém supabase como padrão se não for fornecido outro tipo", () => {
      delete process.env.STORAGE_PROVIDER;

      // Sem cliente injetado, falha com erro de segurança seguro
      assert.throws(
        () => resolveStorageProvider(),
        (err: unknown) => err instanceof StorageSecurityError
      );
    });

    it("respeita o provider de testes injetado via seam", () => {
      const testProvider: StorageProvider = {
        providerName: "custom-test",
        createSignedUploadUrl: async () => ({ uploadUrl: "", storagePath: "", expiresInSeconds: 0 }),
        createSignedUrl: async () => "",
        download: async () => null,
        remove: async () => {},
      };

      __setStorageProviderForTests(testProvider);
      const resolved = resolveStorageProvider();
      assert.strictEqual(resolved.providerName, "custom-test");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. INTEGRAÇÃO EDITION ENGINE (MEMORIES GALLERY & UPLOAD)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Integração do Edition Engine com S3CompatibleStorageProvider", () => {
    it("MemoriesGalleryService gera URLs assinadas com S3CompatibleStorageProvider", async () => {
      const repo = new InMemoryMemoriesRepo();
      await repo.insert({
        id: PHOTO_ID,
        invitationSlug: SLUG,
        storagePath: CANONICAL_PATH,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
        guestName: "Noivo e Noiva",
        caption: "Momento Especial",
        challengeId: null,
        tableId: null,
        participantId: null,
        moderationStatus: "approved",
        createdAt: new Date().toISOString(),
      });

      const mockPresigner: S3PresignerLike = {
        getSignedUrl: async (_client, cmd, opts) => {
          return `https://r2.haxr.private/${cmd.Bucket}/${cmd.Key}?token=r2_signed&exp=${opts?.expiresIn}`;
        },
      };

      const s3Provider = new S3CompatibleStorageProvider(
        { send: async <T>() => ({} as T) },
        mockPresigner,
        { bucketName: BUCKET }
      );

      const galleryService = new MemoriesGalleryService(repo, s3Provider, BUCKET);
      const memories = await galleryService.listMemories(SLUG);

      assert.strictEqual(memories.length, 1);
      assert.strictEqual(memories[0].id, PHOTO_ID);
      assert.ok(memories[0].signedUrl.includes("token=r2_signed"));
      assert.strictEqual(memories[0].kind, "image");
    });

    it("MemoriesUploadService valida e inspeciona ficheiro via S3CompatibleStorageProvider.download()", async () => {
      const repo = new InMemoryMemoriesRepo();
      const s3StorageMap = new Map<string, Uint8Array>();

      const mockS3Client: S3ClientLike = {
        send: async <T>(cmd: S3CommandStructural): Promise<T> => {
          if (cmd._type === "GetObjectCommand") {
            const data = s3StorageMap.get(cmd.Key || "");
            if (!data) {
              const err = new Error("NoSuchKey");
              (err as unknown as Record<string, unknown>).name = "NoSuchKey";
              throw err;
            }
            return {
              Body: data,
              ContentType: "image/jpeg",
            } as T;
          }
          if (cmd._type === "DeleteObjectsCommand") {
            cmd.Delete?.Objects.forEach((o) => s3StorageMap.delete(o.Key));
            return {} as T;
          }
          return {} as T;
        },
      };

      const mockPresigner: S3PresignerLike = {
        getSignedUrl: async (_client, cmd) => {
          return `https://r2.haxr.private/upload/${cmd.Bucket}/${cmd.Key}`;
        },
      };

      const s3Provider = new S3CompatibleStorageProvider(mockS3Client, mockPresigner, {
        bucketName: BUCKET,
      });

      const uploadService = new MemoriesUploadService(repo, s3Provider, BUCKET);

      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024,
      });

      assert.ok(intent.uploadUrl.includes("r2.haxr.private/upload"));

      // Seed do JPEG com magic bytes válidos (\xFF\xD8\xFF)
      const validJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      s3StorageMap.set(intent.storagePath, validJpeg);

      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: { guestName: "Convidado Especial" },
      });

      assert.strictEqual(completeRes.success, true);
      const inserted = await repo.findById(PHOTO_ID, SLUG);
      assert.strictEqual(inserted?.guestName, "Convidado Especial");
      assert.strictEqual(inserted?.storagePath, intent.storagePath);
    });
  });
});
