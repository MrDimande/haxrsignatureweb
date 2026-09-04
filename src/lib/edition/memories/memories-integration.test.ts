import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  FakeStorageProvider,
  SupabaseStorageProvider,
  SupabaseStorageClientLike,
  S3CompatibleStorageProvider,
  S3ClientLike,
  S3PresignerLike,
  S3CommandStructural,
  __setStorageProviderForTests,
  __resetStorageComposition,
  resolveStorageProvider,
  StorageProviderType,
} from "../storage";

import {
  MemoriesUploadService,
  MemoriesGalleryService,
  MemoriesModerationService,
  MemoryRecord,
  MemoriesRepository,
} from "./index";

// In-Memory Repository para simular a tabela wedding_photos sem BD real
class InMemoryMemoriesRepository implements MemoriesRepository {
  public records: Map<string, MemoryRecord> = new Map();

  async insert(record: MemoryRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async listPublic(slug: string): Promise<MemoryRecord[]> {
    return Array.from(this.records.values())
      .filter((r) => r.invitationSlug === slug && r.moderationStatus !== "rejected")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async updateModerationStatus(
    photoId: string,
    slug: string,
    status: "approved" | "rejected"
  ): Promise<boolean> {
    const record = this.records.get(photoId);
    if (!record || record.invitationSlug !== slug) {
      return false;
    }
    record.moderationStatus = status;
    return true;
  }

  async findById(photoId: string, slug: string): Promise<MemoryRecord | null> {
    const record = this.records.get(photoId);
    if (!record || record.invitationSlug !== slug) return null;
    return { ...record };
  }
}

describe("Gate 3C — Memories Integration & Dual-Provider Binding Suite", () => {
  const SLUG = "jessicaesamueltraditionalwedding";
  const OTHER_SLUG = "jessicasamuelwedding";
  const PHOTO_ID = "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a";
  const BUCKET = "wedding-photos";

  // JPEG binário válido com cabeçalho 0xff, 0xd8, 0xff
  const VALID_JPEG_BYTES = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);

  // Ficheiro corrompido / executável disfarçado de imagem
  const FAKE_EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]); // "MZ" header

  let repo: InMemoryMemoriesRepository;
  let fakeStorage: FakeStorageProvider;

  beforeEach(() => {
    __resetStorageComposition();
    repo = new InMemoryMemoriesRepository();
    fakeStorage = new FakeStorageProvider();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. UPLOAD WORKFLOW INTEGRATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("Upload Workflow (Two-Phase Ingestion)", () => {
    it("completa com sucesso o ciclo: intent -> upload -> magic bytes -> DB insert", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);

      // 1. Criação de Intent
      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024 * 100, // 100 KB
      });

      assert.strictEqual(intent.storagePath, `${SLUG}/${PHOTO_ID}/original.jpg`);
      assert.ok(intent.uploadUrl.includes("action=upload"));

      // 2. Simulação do upload físico do binário pelo cliente
      fakeStorage.seedObject(BUCKET, intent.storagePath, VALID_JPEG_BYTES, "image/jpeg");

      // 3. Conclusão do Upload (Server-side inspection & DB insert)
      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: {
          guestName: "Madalena & Paulo",
          caption: "Muitas felicidades!",
          challengeId: "champagne-toast",
        },
      });

      assert.strictEqual(completeRes.success, true);
      assert.ok(completeRes.record);
      assert.strictEqual(completeRes.record.moderationStatus, "pending");

      // Verificação de persistência na base de dados
      const dbRow = await repo.findById(PHOTO_ID, SLUG);
      assert.ok(dbRow !== null);
      assert.strictEqual(dbRow.guestName, "Madalena & Paulo");
      assert.strictEqual(dbRow.challengeId, "champagne-toast");
    });

    it("purga o ficheiro do storage e recusa INSERT se magic bytes forem inválidos", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);

      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024 * 100,
      });

      // Cliente faz upload de um binário falso (não é JPEG)
      fakeStorage.seedObject(BUCKET, intent.storagePath, FAKE_EXE_BYTES, "image/jpeg");

      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: { caption: "Hacked file" },
      });

      assert.strictEqual(completeRes.success, false);
      assert.strictEqual(completeRes.code, "INVALID_SIGNATURE");

      // Ficheiro DEVE ter sido eliminado do storage via provider.remove()
      const storageFile = await fakeStorage.download(BUCKET, intent.storagePath);
      assert.strictEqual(storageFile, null);

      // Nenhum registo deve ter sido inserido na base de dados
      const dbRow = await repo.findById(PHOTO_ID, SLUG);
      assert.strictEqual(dbRow, null);
    });

    it("purga o ficheiro se exceder o tamanho declarado", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);

      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 5, // Limite declarado: 5 bytes
      });

      // Ficheiro tem 12 bytes (> 5 bytes)
      fakeStorage.seedObject(BUCKET, intent.storagePath, VALID_JPEG_BYTES, "image/jpeg");

      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: {},
      });

      assert.strictEqual(completeRes.success, false);
      assert.strictEqual(completeRes.code, "FILE_TOO_LARGE");

      // Ficheiro purgado
      assert.strictEqual(await fakeStorage.download(BUCKET, intent.storagePath), null);
      assert.strictEqual(await repo.findById(PHOTO_ID, SLUG), null);
    });

    it("rejeita upload se o ficheiro não tiver sido enviado para o storage", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);

      await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024,
      });

      // Tentativa de completar sem ter feito o upload no storage
      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: {},
      });

      assert.strictEqual(completeRes.success, false);
      assert.strictEqual(completeRes.code, "UPLOAD_MISSING");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. GALLERY WORKFLOW INTEGRATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("Gallery Workflow (Signed URL Generation)", () => {
    it("lista fotografias ativas e gera URLs assinadas preservando TTL", async () => {
      const galleryService = new MemoriesGalleryService(repo, fakeStorage, BUCKET, 3600);

      // Inserir duas fotos (uma pending, uma approved, uma rejected)
      await repo.insert({
        id: "photo-1",
        invitationSlug: SLUG,
        storagePath: `${SLUG}/11111111-1111-4111-8111-111111111111/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1000,
        guestName: "Convidado A",
        caption: "Foto 1",
        challengeId: "dance-floor",
        tableId: "table-1",
        participantId: null,
        moderationStatus: "approved",
        createdAt: "2026-09-02T10:00:00Z",
      });

      await repo.insert({
        id: "photo-2",
        invitationSlug: SLUG,
        storagePath: `${SLUG}/22222222-2222-4222-8222-222222222222/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 2000,
        guestName: "Convidado B",
        caption: "Foto 2",
        challengeId: null,
        tableId: null,
        participantId: null,
        moderationStatus: "pending",
        createdAt: "2026-09-02T11:00:00Z",
      });

      await repo.insert({
        id: "photo-rejected",
        invitationSlug: SLUG,
        storagePath: `${SLUG}/33333333-3333-4333-8333-333333333333/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 3000,
        guestName: "Convidado C",
        caption: "Foto Rejeitada",
        challengeId: null,
        tableId: null,
        participantId: null,
        moderationStatus: "rejected",
        createdAt: "2026-09-02T12:00:00Z",
      });

      const memories = await galleryService.listMemories(SLUG, BUCKET);

      // Deve incluir photo-1 e photo-2, mas NUNCA photo-rejected
      assert.strictEqual(memories.length, 2);
      assert.strictEqual(memories[0].id, "photo-2"); // Ordenação por createdAt DESC
      assert.strictEqual(memories[1].id, "photo-1");

      assert.ok(memories[0].signedUrl.includes("action=read"));
      assert.ok(memories[1].signedUrl.includes("action=read"));
    });

    it("retorna lista vazia para slug sem memórias ou slug vazio", async () => {
      const galleryService = new MemoriesGalleryService(repo, fakeStorage, BUCKET);
      assert.deepStrictEqual(await galleryService.listMemories(""), []);
      assert.deepStrictEqual(await galleryService.listMemories("inexistent-slug"), []);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. MODERATION WORKFLOW INTEGRATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("Moderation Workflow (Approve & Reject with Isolation)", () => {
    it("aprova e rejeita memórias com sucesso", async () => {
      const modService = new MemoriesModerationService(repo);

      await repo.insert({
        id: PHOTO_ID,
        invitationSlug: SLUG,
        storagePath: `${SLUG}/${PHOTO_ID}/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1000,
        guestName: null,
        caption: null,
        challengeId: null,
        tableId: null,
        participantId: null,
        moderationStatus: "pending",
        createdAt: new Date().toISOString(),
      });

      // 1. Aprovar
      const approveRes = await modService.moderateMemory({
        slug: SLUG,
        photoId: PHOTO_ID,
        action: "approve",
      });
      assert.strictEqual(approveRes.success, true);
      assert.strictEqual((await repo.findById(PHOTO_ID, SLUG))?.moderationStatus, "approved");

      // 2. Rejeitar
      const rejectRes = await modService.moderateMemory({
        slug: SLUG,
        photoId: PHOTO_ID,
        action: "reject",
      });
      assert.strictEqual(rejectRes.success, true);
      assert.strictEqual((await repo.findById(PHOTO_ID, SLUG))?.moderationStatus, "rejected");
    });

    it("bloqueia moderação de memória pertencente a outro evento (cross-invitation)", async () => {
      const modService = new MemoriesModerationService(repo);

      await repo.insert({
        id: PHOTO_ID,
        invitationSlug: SLUG,
        storagePath: `${SLUG}/${PHOTO_ID}/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1000,
        guestName: null,
        caption: null,
        challengeId: null,
        tableId: null,
        participantId: null,
        moderationStatus: "pending",
        createdAt: new Date().toISOString(),
      });

      // Tenta moderar usando o slug do outro casamento
      const res = await modService.moderateMemory({
        slug: OTHER_SLUG,
        photoId: PHOTO_ID,
        action: "approve",
      });

      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes("violação de evento") || res.error?.includes("não encontrado"));

      // Status na base de dados permanece inalterado
      assert.strictEqual((await repo.findById(PHOTO_ID, SLUG))?.moderationStatus, "pending");
    });

    it("valida segredo de moderação quando configurado", async () => {
      const modService = new MemoriesModerationService(repo);

      await repo.insert({
        id: PHOTO_ID,
        invitationSlug: SLUG,
        storagePath: `${SLUG}/${PHOTO_ID}/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1000,
        guestName: null,
        caption: null,
        challengeId: null,
        tableId: null,
        participantId: null,
        moderationStatus: "pending",
        createdAt: new Date().toISOString(),
      });

      // Segredo incorreto
      const badRes = await modService.moderateMemory({
        slug: SLUG,
        photoId: PHOTO_ID,
        action: "approve",
        secretKey: "wrong-secret",
        expectedSecretKey: "correct-secret-2026",
      });
      assert.strictEqual(badRes.success, false);
      assert.strictEqual(badRes.error, "Não autorizado.");

      // Segredo correto
      const goodRes = await modService.moderateMemory({
        slug: SLUG,
        photoId: PHOTO_ID,
        action: "approve",
        secretKey: "correct-secret-2026",
        expectedSecretKey: "correct-secret-2026",
      });
      assert.strictEqual(goodRes.success, true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. PROVIDER SUBSTITUTION & AGNOSTICISM
  // ───────────────────────────────────────────────────────────────────────────
  describe("Provider Substitution (Contracts over Implementations)", () => {
    it("executa o mesmo fluxo de upload sobre SupabaseStorageProvider", async () => {
      const mockStorageMap = new Map<string, Blob>();

      const mockSupabaseClient: SupabaseStorageClientLike = {
        storage: {
          from: () => ({
            createSignedUploadUrl: async (path: string) => ({
              data: { signedUrl: `https://supabase.co/upload/${path}`, token: "t123", path },
              error: null,
            }),
            createSignedUrl: async (path: string, ttl: number) => ({
              data: { signedUrl: `https://supabase.co/read/${path}?exp=${ttl}` },
              error: null,
            }),
            download: async (path: string) => {
              const blob = mockStorageMap.get(path);
              return blob ? { data: blob, error: null } : { data: null, error: new Error("not_found") };
            },
            remove: async (paths: string[]) => {
              paths.forEach((p) => mockStorageMap.delete(p));
              return { data: {}, error: null };
            },
          }),
        },
      };

      const supabaseProvider = new SupabaseStorageProvider(mockSupabaseClient);
      const uploadService = new MemoriesUploadService(repo, supabaseProvider, BUCKET);

      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024,
      });

      assert.ok(intent.uploadUrl.includes("supabase.co/upload"));

      // Seed no mock do Supabase
      mockStorageMap.set(
        intent.storagePath,
        new Blob([VALID_JPEG_BYTES], { type: "image/jpeg" })
      );

      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: { guestName: "Teste Supabase Adapter" },
      });

      assert.strictEqual(completeRes.success, true);
      assert.strictEqual(
        (await repo.findById(PHOTO_ID, SLUG))?.guestName,
        "Teste Supabase Adapter"
      );
    });

    it("executa o mesmo fluxo sobre S3CompatibleStorageProvider sem rede", async () => {
      const mockS3Store = new Map<string, Uint8Array>();

      const mockS3Client: S3ClientLike = {
        send: async <T>(command: S3CommandStructural): Promise<T> => {
          if (command._type === "GetObjectCommand") {
            const data = mockS3Store.get(command.Key || "");
            if (!data) throw { name: "NoSuchKey" };
            return {
              Body: data,
              ContentType: "image/jpeg",
            } as T;
          }
          if (command._type === "DeleteObjectsCommand") {
            command.Delete?.Objects.forEach((o) => mockS3Store.delete(o.Key));
            return {} as T;
          }
          return {} as T;
        },
      };

      const mockPresigner: S3PresignerLike = {
        getSignedUrl: async (
          _client: S3ClientLike,
          command: S3CommandStructural,
          options?: { expiresIn?: number }
        ) => {
          return `https://r2.cloudflare.com/${command.Bucket}/${command.Key}?exp=${options?.expiresIn}`;
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

      assert.ok(intent.uploadUrl.includes("r2.cloudflare.com"));

      // Seed no store do S3
      mockS3Store.set(intent.storagePath, VALID_JPEG_BYTES);

      const completeRes = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: { guestName: "Teste S3/R2 Adapter" },
      });

      assert.strictEqual(completeRes.success, true);
      assert.strictEqual(
        (await repo.findById(PHOTO_ID, SLUG))?.guestName,
        "Teste S3/R2 Adapter"
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. COMPOSITION ROOT & INJECTION SECURITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("Composition Root & Injection Security", () => {
    it("resolveStorageProvider usa o seam injetado em testes", () => {
      __setStorageProviderForTests(fakeStorage);
      const provider = resolveStorageProvider();
      assert.strictEqual(provider.providerName, "fake");
    });

    it("falha fechado se STORAGE_PROVIDER=supabase for invocado sem cliente configurado", () => {
      __resetStorageComposition();
      assert.throws(
        () => resolveStorageProvider({ providerType: "supabase" }),
        /supabase_client_not_configured_in_composition_root/
      );
    });

    it("falha fechado se STORAGE_PROVIDER=r2-s3 for invocado sem s3Client ou presigner", () => {
      __resetStorageComposition();
      assert.throws(
        () => resolveStorageProvider({ providerType: "r2-s3" }),
        /r2_s3_storage_provider_requires_s3_client_and_presigner/
      );
    });

    it("falha fechado para tipo de provider desconhecido", () => {
      __resetStorageComposition();
      assert.throws(
        () =>
          resolveStorageProvider({
            providerType: "unknown-provider" as unknown as StorageProviderType,
          }),
        /unsupported_storage_provider_type/
      );
    });
  });
});
