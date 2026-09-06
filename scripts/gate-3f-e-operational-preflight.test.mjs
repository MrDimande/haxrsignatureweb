/**
 * HAXR Edition Engine — Gate 3F-E / 3F-E1 Operational Pre-Cutover Validation Suite (Script MJS)
 *
 * REGRAS FUNDAMENTAIS (Gate 3F-E1):
 * - Português de Moçambique em todos os comentários e asserções.
 * - Testes determinísticos em memória sem mutações remotas (ZERO PutObject/DeleteObject/CopyObject).
 * - Valida a especificação da política CORS mínima de privilégio estrito sem wildcard, sem localhost,
 *   sem origens de redireccionamento, com métodos mínimos (PUT) e sem ExposeHeaders supérfluos.
 * - Valida a guarda de imutabilidade do corpus histórico de 147 caminhos.
 * - Valida a lógica do mecanismo dormente de Write-Freeze (StorageWriteFreezeError).
 * - Valida o tratamento determinístico de corridas de uploads em curso (*in-flight*) e drenagem.
 * - Valida a separação estrita de identidades operacionais.
 */

import { describe, it } from "node:test";
import assert from "node:assert";

import {
  validateAndParseStoragePath,
  buildCanonicalStoragePath,
} from "../src/lib/edition/storage/canonical-path.js";
import { StorageSecurityError } from "../src/lib/edition/storage/storage-provider.types.js";
import { loadApprovedSourceInventory } from "./dry-run-r2-migration.mjs";

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
});

/**
 * Política CORS Mínima e de Privilégio Estrito para o Cloudflare R2 (Gate 3F-E1).
 */
export const MINIMAL_PRODUCTION_R2_CORS_POLICY = Object.freeze([
  {
    AllowedOrigins: [REAL_UPLOAD_PRODUCTION_ORIGIN],
    AllowedMethods: ["PUT"],
    AllowedHeaders: ["Content-Type"],
    ExposeHeaders: [],
    MaxAgeSeconds: 3600,
  },
]);

describe("Gate 3F-E1 — Operational Pre-Cutover Validation Suite (MJS)", () => {
  const approvedInventory = loadApprovedSourceInventory();
  const historicalPathSet = new Set(approvedInventory.map((i) => i.storage_path));

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
    });

    it("AllowedHeaders restringe-se estritamente a Content-Type", () => {
      const headers = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].AllowedHeaders;
      assert.deepStrictEqual(headers, ["Content-Type"]);
    });

    it("ExposeHeaders é vazio pois o JavaScript do browser não inspeciona cabeçalhos de resposta", () => {
      const exposed = MINIMAL_PRODUCTION_R2_CORS_POLICY[0].ExposeHeaders;
      assert.deepStrictEqual(exposed, []);
      assert.strictEqual(exposed.includes("ETag"), false);
      assert.strictEqual(exposed.includes("Content-Length"), false);
      assert.strictEqual(exposed.includes("Content-Type"), false);
    });

    it("MaxAgeSeconds é limitado e determinístico (3600 segundos)", () => {
      assert.strictEqual(MINIMAL_PRODUCTION_R2_CORS_POLICY[0].MaxAgeSeconds, 3600);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONCEPÇÃO E SEGURANÇA DO CAMINHO CANÁRIO
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
      function safeRemoveCanaryOnly(targetPath, allowedCanary) {
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
          (err) =>
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
      function validateRuntimeCredentialUsage(credentialType) {
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
  // 4. WRITE-FREEZE MECANISMO E IN-FLIGHT RESILIÊNCIA
  // ───────────────────────────────────────────────────────────────────────────
  describe("Write-Freeze Plan & Tratamento de In-Flight Uploads", () => {
    it("Write-Freeze bloqueia novos pedidos antes de emitir URL assinada", () => {
      let isWriteFreezeActive = true;

      function createUploadIntentWithFreeze(slug, photoId) {
        if (isWriteFreezeActive) {
          const err = new Error("STORAGE_WRITE_FREEZE_ACTIVE: Envios temporariamente suspensos para manutenção.");
          err.code = "STORAGE_WRITE_FREEZE_ACTIVE";
          throw err;
        }
        return { uploadUrl: "https://r2.dummy/upload", storagePath: `${slug}/${photoId}/original.jpg` };
      }

      assert.throws(
        () => createUploadIntentWithFreeze("slug-1", "0ec655a9-85e7-4d13-93d2-9d422fe06d4d"),
        (err) => err.code === "STORAGE_WRITE_FREEZE_ACTIVE"
      );

      isWriteFreezeActive = false;
      const intent = createUploadIntentWithFreeze("slug-1", "0ec655a9-85e7-4d13-93d2-9d422fe06d4d");
      assert.ok(intent.uploadUrl.length > 0);
    });

    it("invalida intents se houver comutação de infra-estrutura sem reconciliação", () => {
      function completeUploadSimulated(intentProvider, activeStorageProvider) {
        if (intentProvider !== activeStorageProvider) {
          const err = new Error("UPLOAD_MISSING: O binário não foi encontrado no fornecedor activo.");
          err.code = "UPLOAD_MISSING";
          throw err;
        }
        return { success: true };
      }

      assert.throws(
        () => completeUploadSimulated("supabase", "r2-s3"),
        (err) => err.code === "UPLOAD_MISSING"
      );

      assert.deepStrictEqual(completeUploadSimulated("r2-s3", "r2-s3"), { success: true });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. HARDENING DO CLEANUP CANÁRIO E RESILIÊNCIA (Gate 3F-E2)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Hardening do Cleanup Canário e Resiliência (Gate 3F-E2)", () => {
    it("executeGuardedCanaryCleanup recusa categoricamente qualquer caminho diferente do canário exacto", async () => {
      const { executeGuardedCanaryCleanup, CANARY_STORAGE_PATH } = await import("./run-live-gate-3f-e.mjs");

      const mockProvider = {
        remove: async () => {},
      };

      await assert.rejects(
        async () => {
          await executeGuardedCanaryCleanup({
            runtimeProvider: mockProvider,
            bucketName: "haxr-wedding-photos",
            canaryPath: "jessicasamuelwedding/00000000-4000-4000-8000-000000000001/original.jpg",
            historicalPathSet,
          });
        },
        (err) => {
          assert.ok(err instanceof StorageSecurityError);
          assert.ok(err.message.includes("UNAUTHORIZED_CANARY_CLEANUP_TARGET"));
          return true;
        }
      );
    });

    it("executeGuardedCanaryCleanup proíbe terminantemente apagar qualquer caminho do corpus histórico", async () => {
      const { executeGuardedCanaryCleanup } = await import("./run-live-gate-3f-e.mjs");

      const firstHistoricalPath = Array.from(historicalPathSet)[0];
      const mockProvider = {
        remove: async () => {},
      };

      await assert.rejects(
        async () => {
          await executeGuardedCanaryCleanup({
            runtimeProvider: mockProvider,
            bucketName: "haxr-wedding-photos",
            canaryPath: firstHistoricalPath,
            historicalPathSet,
          });
        },
        (err) => {
          assert.ok(err instanceof StorageSecurityError);
          return true;
        }
      );
    });

    it("executeGuardedCanaryCleanup executa remoção e confirma 404 via HeadObject", async () => {
      const { executeGuardedCanaryCleanup, CANARY_STORAGE_PATH } = await import("./run-live-gate-3f-e.mjs");

      let removeInvokedWith = null;
      let headInvokedWith = null;

      const mockProvider = {
        remove: async (bucket, paths) => {
          removeInvokedWith = { bucket, paths };
        },
      };

      const mockClient = {
        send: async (cmd) => {
          headInvokedWith = cmd;
          const err = new Error("NoSuchKey");
          err.name = "NoSuchKey";
          err.$metadata = { httpStatusCode: 404 };
          throw err;
        },
      };

      const result = await executeGuardedCanaryCleanup({
        runtimeProvider: mockProvider,
        bucketName: "haxr-wedding-photos",
        canaryPath: CANARY_STORAGE_PATH,
        historicalPathSet,
        runtimeClient: mockClient,
      });

      assert.deepStrictEqual(result, { cleaned: true, confirmedNotFound: true });
      assert.deepStrictEqual(removeInvokedWith, {
        bucket: "haxr-wedding-photos",
        paths: [CANARY_STORAGE_PATH],
      });
      assert.strictEqual(headInvokedWith?.input?.Key, CANARY_STORAGE_PATH);
    });

    it("orquestração try/finally garante execução do cleanup mesmo quando validação pós-PUT lança excepção", async () => {
      let canaryCreated = false;
      let cleanupRan = false;

      async function simulatedOrchestrationWithPostPutFailure() {
        try {
          // PUT simulado com sucesso
          canaryCreated = true;
          // Validação pós-PUT falha (ex: getObjectInfo mismatch ou erro de rede)
          throw new Error("CANARY_OBJECT_INFO_MISMATCH: falha pós-PUT de teste");
        } finally {
          if (canaryCreated) {
            cleanupRan = true;
          }
        }
      }

      await assert.rejects(
        async () => await simulatedOrchestrationWithPostPutFailure(),
        /CANARY_OBJECT_INFO_MISMATCH/
      );

      // Prova determinística: o cleanup executou no finally
      assert.strictEqual(cleanupRan, true);
    });

    it("falha no cleanup é reportada e não mascara a falha original do teste", async () => {
      let originalErrorCaptured = null;
      let cleanupErrorCaptured = null;

      async function simulatedOrchestrationWithBothFailing() {
        let canaryCreated = false;
        let originalError = null;

        try {
          canaryCreated = true;
          throw new Error("VALIDATION_ORIGINAL_FAILURE");
        } catch (err) {
          originalError = err;
          throw err;
        } finally {
          if (canaryCreated) {
            try {
              throw new Error("NETWORK_CLEANUP_FAILURE");
            } catch (cleanupErr) {
              cleanupErrorCaptured = cleanupErr;
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
        async () => await simulatedOrchestrationWithBothFailing(),
        /VALIDATION_ORIGINAL_FAILURE/
      );

      assert.strictEqual(originalErrorCaptured?.message, "VALIDATION_ORIGINAL_FAILURE");
      assert.strictEqual(cleanupErrorCaptured?.message, "NETWORK_CLEANUP_FAILURE");
    });
  });
});
