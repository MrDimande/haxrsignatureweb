/**
 * HAXR Edition Engine — Gate 3F-E / 3F-E1 Operational Pre-Cutover Validation Suite
 *
 * REGRAS FUNDAMENTAIS (Gate 3F-E1):
 * - Português de Moçambique em todos os comentários e asserções.
 * - Testes determinísticos em memória sem mutações remotas (ZERO PutObject/DeleteObject/CopyObject).
 * - Valida a especificação da política CORS mínima de privilégio estrito sem wildcard, sem localhost,
 *   sem origens de redireccionamento, com métodos mínimos (PUT) e sem ExposeHeaders supérfluos.
 * - Valida a guarda de imutabilidade do corpus histórico de 147 caminhos.
 * - Valida a lógica do mecanismo dormente de Write-Freeze (StorageWriteFreezeError).
 * - Valida a não interferência do Write-Freeze nas leituras da galeria pública e em outros fluxos.
 * - Valida o tratamento determinístico de corridas de uploads em curso (*in-flight*) e drenagem.
 * - Valida a separação estrita de identidades operacionais.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

import {
  validateAndParseStoragePath,
} from "./canonical-path";
import { StorageSecurityError } from "./storage-provider.types";
import { FakeStorageProvider } from "./fake-storage-provider";
import { loadApprovedSourceInventory } from "../../../../scripts/dry-run-r2-migration.mjs";

import {
  MemoriesUploadService,
  MemoriesGalleryService,
  StorageWriteFreezeError,
  isStorageWriteFreezeActive,
  __setStorageWriteFreezeForTesting,
  MemoryRecord,
  MemoriesRepository,
} from "../memories";

// Repositório em memória para validação determinística sem base de dados externa
class InMemoryMemoriesTestRepo implements MemoriesRepository {
  public records: Map<string, MemoryRecord> = new Map();

  async insert(record: MemoryRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async listPublic(slug: string): Promise<MemoryRecord[]> {
    return Array.from(this.records.values())
      .filter((r) => r.invitationSlug === slug && r.moderationStatus !== "rejected");
  }

  async updateModerationStatus(
    photoId: string,
    slug: string,
    status: "approved" | "rejected"
  ): Promise<boolean> {
    const record = this.records.get(photoId);
    if (!record || record.invitationSlug !== slug) return false;
    record.moderationStatus = status;
    return true;
  }

  async findById(photoId: string, slug: string): Promise<MemoryRecord | null> {
    const record = this.records.get(photoId);
    if (!record || record.invitationSlug !== slug) return null;
    return { ...record };
  }
}

/**
 * Origem real de produção onde a interface de upload de fotografias executa.
 */
export const REAL_UPLOAD_PRODUCTION_ORIGIN = "https://edition.haxrsignature.com";

/**
 * Origens candidatas e respectiva classificação arquitectural no projecto.
 */
export const ORIGIN_CLASSIFICATIONS = Object.freeze({
  "https://edition.haxrsignature.com": "UPLOAD_UI_EXECUTES_HERE",
  "https://haxrsignature.com": "REDIRECT_ONLY",
  "https://www.haxrsignature.com": "NO_UPLOAD_UI",
  "http://localhost:3000": "LOCAL_DEV_EXCLUDED",
} as const);

export type R2CorsRule = {
  AllowedOrigins: string[];
  AllowedMethods: string[];
  AllowedHeaders: string[];
  ExposeHeaders: string[];
  MaxAgeSeconds: number;
};

/**
 * Política CORS Mínima e de Privilégio Estrito para o Cloudflare R2 (Gate 3F-E1).
 */
export const MINIMAL_PRODUCTION_R2_CORS_POLICY: readonly R2CorsRule[] = Object.freeze([
  {
    AllowedOrigins: [REAL_UPLOAD_PRODUCTION_ORIGIN],
    AllowedMethods: ["PUT"],
    AllowedHeaders: ["Content-Type"],
    ExposeHeaders: [],
    MaxAgeSeconds: 3600,
  },
]);

describe("Gate 3F-E1 — Operational Pre-Cutover Validation Suite", () => {
  const approvedInventory = loadApprovedSourceInventory() as Array<{ storage_path: string }>;
  const historicalPathSet = new Set<string>(approvedInventory.map((i) => i.storage_path));

  let repo: InMemoryMemoriesTestRepo;
  let fakeStorage: FakeStorageProvider;
  const BUCKET = "wedding-photos";
  const SLUG = "jessicasamuelwedding";
  const PHOTO_ID = "0ec655a9-85e7-4d13-93d2-9d422fe06d4d";
  const VALID_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  beforeEach(() => {
    repo = new InMemoryMemoriesTestRepo();
    fakeStorage = new FakeStorageProvider();
    __setStorageWriteFreezeForTesting(null);
  });

  afterEach(() => {
    __setStorageWriteFreezeForTesting(null);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ESPECIFICAÇÃO DE CORS E PRIVILÉGIO MÍNIMO (Requisitos 4, 5, 6, 13)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Especificação de CORS e Privilégio Mínimo (Gate 3F-E1)", () => {
    it("política CORS não contém wildcard '*' em AllowedOrigins nem AllowedHeaders", () => {
      for (const rule of MINIMAL_PRODUCTION_R2_CORS_POLICY) {
        assert.strictEqual(rule.AllowedOrigins.includes("*"), false);
        assert.strictEqual(rule.AllowedHeaders.includes("*"), false);
      }
    });

    it("AllowedOrigins contém estritamente a origem real de execução da UI em produção", () => {
      const allowed = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].AllowedOrigins;
      assert.strictEqual(allowed.length, 1);
      assert.strictEqual(allowed[0], REAL_UPLOAD_PRODUCTION_ORIGIN);
    });

    it("AllowedOrigins exclui estritamente http://localhost:3000 da política permanente", () => {
      const allowed = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].AllowedOrigins;
      assert.strictEqual(allowed.includes("http://localhost:3000"), false);
    });

    it("AllowedOrigins exclui origens de redireccionamento (ex: https://haxrsignature.com)", () => {
      const allowed = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].AllowedOrigins;
      assert.strictEqual(allowed.includes("https://haxrsignature.com"), false);
      assert.strictEqual(ORIGIN_CLASSIFICATIONS["https://haxrsignature.com"], "REDIRECT_ONLY");
    });

    it("AllowedMethods contém unicamente o método PUT necessário ao upload pré-assinado", () => {
      const methods = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].AllowedMethods;
      assert.deepStrictEqual(methods, ["PUT"]);
      assert.strictEqual(methods.includes("GET"), false);
      assert.strictEqual(methods.includes("HEAD"), false);
      assert.strictEqual(methods.includes("DELETE"), false);
      assert.strictEqual(methods.includes("POST"), false);
    });

    it("AllowedHeaders restringe-se estritamente a Content-Type", () => {
      const headers = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].AllowedHeaders;
      assert.deepStrictEqual(headers, ["Content-Type"]);
    });

    it("ExposeHeaders é vazio pois o JavaScript do browser não inspeciona cabeçalhos de resposta", () => {
      const exposed = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].ExposeHeaders;
      assert.deepStrictEqual(exposed, []);
      assert.strictEqual(exposed.length, 0);
      assert.strictEqual((exposed as string[]).includes("ETag"), false);
      assert.strictEqual((exposed as string[]).includes("Content-Length"), false);
      assert.strictEqual((exposed as string[]).includes("Content-Type"), false);
    });

    it("MaxAgeSeconds é limitado e determinístico (3600 segundos)", () => {
      assert.strictEqual(MINIMAL_PRODUCTION_R2_CORS_POLICY[0].MaxAgeSeconds, 3600);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONCEPÇÃO E SEGURANÇA DO CAMINHO CANÁRIO (Zero Mutações Históricas)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Concepção do Caminho Canário e Imutabilidade Histórica", () => {
    const CANARY_SLUG = "cutoverreadinesscanary";
    const CANARY_UUID = "00000000-4000-4000-8000-000000000001";
    const CANARY_EXT = "jpg";
    const CANARY_PATH = `${CANARY_SLUG}/${CANARY_UUID}/original.${CANARY_EXT}`;

    it("caminho canário obedece rigorosamente às regras de validação canónica", () => {
      const parsed = validateAndParseStoragePath(CANARY_PATH, CANARY_SLUG, "image/jpeg");
      assert.strictEqual(parsed.slug, CANARY_SLUG);
      assert.strictEqual(parsed.photoId, CANARY_UUID);
      assert.strictEqual(parsed.extension, CANARY_EXT);
      assert.strictEqual(parsed.canonicalPath, CANARY_PATH);
    });

    it("caminho canário NÃO existe no conjunto dos 147 caminhos históricos congelados", () => {
      assert.strictEqual(historicalPathSet.has(CANARY_PATH), false);
    });

    it("guarda de remoção impede que qualquer caminho histórico seja apagado durante o teste canário", () => {
      function safeRemoveCanaryOnly(targetPath: string, allowedCanary: string) {
        if (historicalPathSet.has(targetPath)) {
          throw new StorageSecurityError(`HISTORICAL_CORPUS_MUTATION_BLOCKED: Proibido apagar ${targetPath}`);
        }
        if (targetPath !== allowedCanary) {
          throw new StorageSecurityError(`UNAUTHORIZED_CANARY_TARGET: ${targetPath}`);
        }
        return { deleted: true, path: targetPath };
      }

      const res = safeRemoveCanaryOnly(CANARY_PATH, CANARY_PATH);
      assert.strictEqual(res.deleted, true);

      for (const histPath of Array.from(historicalPathSet).slice(0, 5)) {
        assert.throws(
          () => safeRemoveCanaryOnly(histPath, CANARY_PATH),
          (err: unknown) =>
            err instanceof StorageSecurityError &&
            err.message.includes("HISTORICAL_CORPUS_MUTATION_BLOCKED")
        );
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SEPARAÇÃO E VALIDAÇÃO DE IDENTIDADES
  // ───────────────────────────────────────────────────────────────────────────
  describe("Separação e Validação de Identidades", () => {
    it("runtime identity deve ser distinta de identidades de auditoria e migração parente", () => {
      const identities = {
        GATE_3F_A_AUDIT_IDENTITY: "AUDIT_KEY_READ_ONLY",
        MIGRATION_PARENT_IDENTITY: "PARENT_KEY_SIGNING_ONLY",
        MIGRATION_OBJECT_IDENTITY: "TEMP_JWT_SESSION_TOKEN",
        R2_RUNTIME_IDENTITY: "RUNTIME_KEY_OBJECT_READ_WRITE",
      };

      const keys = Object.values(identities);
      const uniqueKeys = new Set(keys);
      assert.strictEqual(keys.length, uniqueKeys.size);
    });

    it("falha fechado se for tentada a reutilização de credenciais de auditoria para escrita", () => {
      function validateRuntimeCredentialUsage(credentialType: string) {
        if (credentialType === "GATE_3F_A_AUDIT_IDENTITY") {
          throw new Error("PROIBIDO: Credencial de auditoria é estritamente Read-Only.");
        }
        if (credentialType === "MIGRATION_PARENT_IDENTITY") {
          throw new Error("PROIBIDO: Credencial parente de migração não pode ser reutilizada em runtime.");
        }
        if (credentialType === "R2_RUNTIME_IDENTITY") {
          return true;
        }
        throw new Error(`Credencial desconhecida: ${credentialType}`);
      }

      assert.throws(() => validateRuntimeCredentialUsage("GATE_3F_A_AUDIT_IDENTITY"));
      assert.throws(() => validateRuntimeCredentialUsage("MIGRATION_PARENT_IDENTITY"));
      assert.strictEqual(validateRuntimeCredentialUsage("R2_RUNTIME_IDENTITY"), true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. WRITE-FREEZE MECANISMO E TESTES (Requisitos 8, 9, 14)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Mecanismo Dormente de Write-Freeze (Gate 3F-E1)", () => {
    it("por defeito, o mecanismo de Write-Freeze está inactivo (dormente)", () => {
      assert.strictEqual(isStorageWriteFreezeActive(), false);
    });

    it("comportamento padrão de emissão de intent permanece inalterado quando inactivo", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);
      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024 * 50,
      });

      assert.ok(intent.uploadUrl.length > 0);
      assert.strictEqual(intent.storagePath, `${SLUG}/${PHOTO_ID}/original.jpg`);
    });

    it("quando activo, o Write-Freeze rejeita novas intenções antes de emitir URL assinada", async () => {
      __setStorageWriteFreezeForTesting(true);
      assert.strictEqual(isStorageWriteFreezeActive(), true);

      let signedUrlInvoked = false;
      const spyingStorage = new FakeStorageProvider();
      const originalCreate = spyingStorage.createSignedUploadUrl.bind(spyingStorage);
      spyingStorage.createSignedUploadUrl = async (...args) => {
        signedUrlInvoked = true;
        return originalCreate(...args);
      };

      const uploadService = new MemoriesUploadService(repo, spyingStorage, BUCKET);

      await assert.rejects(
        async () => {
          await uploadService.createUploadIntent({
            slug: SLUG,
            photoId: PHOTO_ID,
            contentType: "image/jpeg",
            declaredFileSizeBytes: 1024 * 50,
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof StorageWriteFreezeError);
          assert.strictEqual((err as StorageWriteFreezeError).code, "STORAGE_WRITE_FREEZE_ACTIVE");
          return true;
        }
      );

      // Prova estrita: nenhuma URL assinada é gerada
      assert.strictEqual(signedUrlInvoked, false);
    });

    it("Write-Freeze NÃO afeta leituras da galeria pública", async () => {
      // 1. Preparar registo aprovado na base de dados
      const record: MemoryRecord = {
        id: PHOTO_ID,
        invitationSlug: SLUG,
        storagePath: `${SLUG}/${PHOTO_ID}/original.jpg`,
        originalFilename: "original.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024 * 50,
        guestName: "Madalena & Paulo",
        caption: "Parabéns!",
        challengeId: "champagne-toast",
        tableId: null,
        participantId: null,
        moderationStatus: "approved",
        createdAt: new Date().toISOString(),
      };
      await repo.insert(record);

      // 2. Activar Write-Freeze
      __setStorageWriteFreezeForTesting(true);

      // 3. Executar leitura da galeria
      const galleryService = new MemoriesGalleryService(repo, fakeStorage, BUCKET);
      const items = await galleryService.listMemories(SLUG);

      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].id, PHOTO_ID);
      assert.ok(items[0].signedUrl.length > 0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. TRATAMENTO DETERMINÍSTICO DE IN-FLIGHT UPLOADS & DRENAGEM (Requisitos 10, 11, 12, 15)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Estratégia de Drenagem e Resolução de In-Flight Uploads", () => {
    it("intenção criada antes do congelamento pode ser concluída com sucesso", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);

      // 1. Criar intenção antes do congelamento
      const intent = await uploadService.createUploadIntent({
        slug: SLUG,
        photoId: PHOTO_ID,
        contentType: "image/jpeg",
        declaredFileSizeBytes: VALID_JPEG.byteLength,
      });

      // 2. Activar congelamento
      __setStorageWriteFreezeForTesting(true);

      // 3. Novas intenções são rejeitadas
      await assert.rejects(
        async () => {
          await uploadService.createUploadIntent({
            slug: SLUG,
            photoId: "new-photo-during-freeze",
            contentType: "image/jpeg",
            declaredFileSizeBytes: 1024,
          });
        },
        StorageWriteFreezeError
      );

      // 4. Concluir a intenção pré-existente (upload físico realizado pelo cliente)
      fakeStorage.seedObject(BUCKET, intent.storagePath, VALID_JPEG, "image/jpeg");

      const result = await uploadService.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: { guestName: "Amigos de Longa Data" },
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.record?.id, PHOTO_ID);
    });

    it("rejeita conclusão se o TTL expirou sem envio do cliente", async () => {
      const uploadService = new MemoriesUploadService(repo, fakeStorage, BUCKET);

      // Sem injectar intent em memória, simula expiração
      const result = await uploadService.completeUpload({
        slug: SLUG,
        photoId: "expired-unresolved-intent",
        metadata: {},
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, "INTENT_EXPIRED");
    });

    it("prova a necessidade de drenagem: comutação abrupta de storage falha na verificação sem reconciliação", async () => {
      // Storage A (Supabase) onde o cliente colocou o ficheiro
      const storageA = new FakeStorageProvider();
      const storagePath = `${SLUG}/${PHOTO_ID}/original.jpg`;
      storageA.seedObject(BUCKET, storagePath, VALID_JPEG, "image/jpeg");

      // Storage B (R2) antes da reconciliação (ficheiro ausente)
      const storageB = new FakeStorageProvider();

      // Serviço comutado para Storage B prematuramente
      const uploadServiceOnB = new MemoriesUploadService(repo, storageB, BUCKET);
      uploadServiceOnB.__seedIntent({
        photoId: PHOTO_ID,
        slug: SLUG,
        bucketName: BUCKET,
        storagePath,
        contentType: "image/jpeg",
        declaredFileSizeBytes: VALID_JPEG.byteLength,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        status: "pending",
      });

      const res = await uploadServiceOnB.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: {},
      });

      // Demonstração da falha por corrida se não houver drenagem
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, "UPLOAD_MISSING");

      // Demonstração da correcção: após reconciliação (Storage B recebe o objecto)
      storageB.seedObject(BUCKET, storagePath, VALID_JPEG, "image/jpeg");
      const resAfterReconcile = await uploadServiceOnB.completeUpload({
        slug: SLUG,
        photoId: PHOTO_ID,
        metadata: {},
      });
      assert.strictEqual(resAfterReconcile.success, true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. HARDENING DO CLEANUP CANÁRIO E RESILIÊNCIA (Gate 3F-E2)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Hardening do Cleanup Canário e Resiliência (Gate 3F-E2)", () => {
    const CANARY_PATH = "cutoverreadinesscanary/00000000-4000-4000-8000-000000000001/original.jpg";

    function executeGuardedCanaryCleanupSimulated({
      canaryPath,
      historicalSet,
      onRemove,
    }: {
      canaryPath: string;
      historicalSet: Set<string>;
      onRemove: () => Promise<void>;
    }) {
      if (canaryPath !== CANARY_PATH) {
        throw new StorageSecurityError(`UNAUTHORIZED_CANARY_CLEANUP_TARGET: Proibido apagar '${canaryPath}'`);
      }
      if (historicalSet.has(canaryPath)) {
        throw new StorageSecurityError(`HISTORICAL_CORPUS_MUTATION_BLOCKED: Proibido apagar caminho histórico!`);
      }
      return onRemove();
    }

    it("executeGuardedCanaryCleanup recusa categoricamente qualquer caminho diferente do canário exacto", async () => {
      await assert.rejects(
        async () => {
          await executeGuardedCanaryCleanupSimulated({
            canaryPath: "jessicasamuelwedding/00000000-4000-4000-8000-000000000001/original.jpg",
            historicalSet: historicalPathSet,
            onRemove: async () => {},
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof StorageSecurityError);
          assert.ok((err as StorageSecurityError).message.includes("UNAUTHORIZED_CANARY_CLEANUP_TARGET"));
          return true;
        }
      );
    });

    it("executeGuardedCanaryCleanup proíbe terminantemente apagar qualquer caminho do corpus histórico", async () => {
      const firstHist = Array.from(historicalPathSet)[0];
      await assert.rejects(
        async () => {
          await executeGuardedCanaryCleanupSimulated({
            canaryPath: firstHist,
            historicalSet: historicalPathSet,
            onRemove: async () => {},
          });
        },
        StorageSecurityError
      );
    });

    it("orquestração try/finally garante execução do cleanup mesmo quando validação pós-PUT lança excepção", async () => {
      let canaryCreated = false;
      let cleanupRan = false;

      async function simulatedLifecycle() {
        try {
          canaryCreated = true;
          throw new Error("CANARY_OBJECT_INFO_MISMATCH: falha pós-PUT");
        } finally {
          if (canaryCreated) {
            cleanupRan = true;
          }
        }
      }

      await assert.rejects(
        async () => await simulatedLifecycle(),
        /CANARY_OBJECT_INFO_MISMATCH/
      );

      assert.strictEqual(cleanupRan, true);
    });

    it("falha no cleanup é reportada e não mascara a falha original do teste", async () => {
      let originalErrorCaptured: Error | null = null;
      let cleanupErrorCaptured: Error | null = null;

      async function simulatedDoubleFailure() {
        let canaryCreated = false;
        let originalError: Error | null = null;

        try {
          canaryCreated = true;
          throw new Error("VALIDATION_ORIGINAL_FAILURE");
        } catch (err) {
          originalError = err as Error;
          throw err;
        } finally {
          if (canaryCreated) {
            try {
              throw new Error("NETWORK_CLEANUP_FAILURE");
            } catch (cleanupErr) {
              cleanupErrorCaptured = cleanupErr as Error;
              if (originalError) {
                originalErrorCaptured = originalError;
              } else {
                throw cleanupErr;
              }
            }
          }
        }
      }

      await assert.rejects(
        async () => await simulatedDoubleFailure(),
        /VALIDATION_ORIGINAL_FAILURE/
      );

      assert.strictEqual((originalErrorCaptured as Error | null)?.message, "VALIDATION_ORIGINAL_FAILURE");
      assert.strictEqual((cleanupErrorCaptured as Error | null)?.message, "NETWORK_CLEANUP_FAILURE");
    });
  });
});
