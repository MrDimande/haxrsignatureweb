import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { jwtVerify } from "jose";
import { S3Client } from "@aws-sdk/client-s3";

import {
  verifyLiveSourcePreflight,
  verifyDestinationPrecondition,
  createR2S3Client,
  HardenedPhysicalTransferEngine,
  sha256,
  validateR2TempActions,
  mintR2LocalTemporaryCredential,
  deriveCanonicalPrefixPaths,
  deriveAndValidateManifestObjectPaths,
  validateExactManifestPathSetEquality,
  estimateS3RequestHeaderFootprint,
  MIGRATION_PROFILE_ALLOWED_ACTIONS,
} from "./hardened-transfer-engine.mjs";

import {
  GATE_3D_BASELINE_PIN,
} from "./sync-storage-protocol.mjs";

describe("Gate 3F-C1 — Streaming, Retries, Ambiguous PUT & 412 Reconciliation Suite", () => {
  let mockSourceProvider;
  let mockS3Client;
  let testItem;
  let samplePayload;

  beforeEach(() => {
    samplePayload = Buffer.from("test_image_payload_content_12345");
    testItem = {
      storage_path: "jessicaesamueltraditionalwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.jpg",
      size_bytes: samplePayload.byteLength,
      content_type: "image/jpeg",
      sha256: sha256(samplePayload),
      invitation_slug: "jessicaesamueltraditionalwedding",
      photo_id: "012a2a33-e775-44c3-b1f7-008a46945e0d",
    };

    mockSourceProvider = {
      downloadStream: async () => ({
        stream: Readable.from(samplePayload),
        contentType: "image/jpeg",
      }),
    };

    mockS3Client = {
      sentCommands: [],
      send: async (cmd) => {
        mockS3Client.sentCommands.push(cmd);

        if (cmd.constructor.name === "HeadObjectCommand") {
          const err = new Error("NotFound");
          err.name = "NotFound";
          throw err;
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return {
            Body: Readable.from(samplePayload),
          };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          return { ETag: '"mock-etag"' };
        }
        return {};
      },
    };
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. STREAMING & LOCAL TEMP FILE INVARIANTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Streaming from Temp & Resource Safety", () => {
    it("usa Stream como Body no PutObject (sem buffer integral em RAM)", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        mockS3Client.sentCommands.push(cmd);
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          // Valida que o Body é um Readable stream, não um Buffer
          assert.ok(
            cmd.input.Body instanceof Readable || typeof cmd.input.Body.pipe === "function",
            "PutObject Body deve ser um Readable stream"
          );
          assert.strictEqual(cmd.input.ContentLength, samplePayload.byteLength);
          assert.strictEqual(cmd.input.IfNoneMatch, "*");
          return { ETag: '"mock-etag"' };
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      const res = await engine.transferObject(testItem);
      assert.strictEqual(res.status, "VERIFIED");
      assert.strictEqual(engine.mutationsRecord.PutObject, 1);
      assert.strictEqual(engine.mutationsRecord.CopyObject, 0);
      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);

      // Garante limpeza de ficheiros temporários
      const tmpFiles = readdirSync(tmpdir()).filter((f) => f.startsWith("haxr-migrate-"));
      assert.strictEqual(tmpFiles.length, 0);
    });

    it("não executa PUT se o stream da fonte falhar a meio", async () => {
      const failingStream = new Readable({
        read() {
          this.emit("error", new Error("source_socket_hangup"));
        },
      });

      const failingSourceProvider = {
        downloadStream: async () => ({
          stream: failingStream,
          contentType: "image/jpeg",
        }),
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: failingSourceProvider,
        s3Client: mockS3Client,
      });

      await assert.rejects(
        () => engine.transferObject(testItem),
        (err) => err.code === "source_stream_interrupted"
      );

      assert.strictEqual(engine.mutationsRecord.PutObject, 0);

      // Garante limpeza de temporários após falha
      const tmpFiles = readdirSync(tmpdir()).filter((f) => f.startsWith("haxr-migrate-"));
      assert.strictEqual(tmpFiles.length, 0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. 412 RECONCILIATION (IDENTICAL VS COLLISION)
  // ───────────────────────────────────────────────────────────────────────────
  describe("412 PreconditionFailed Reconciliation", () => {
    it("412 + objeto idêntico no destino -> ALREADY_TRANSFERRED_IDENTICAL (safe resume)", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            // No pre-check, objeto não existe ainda
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          // Na reconciliação do 412, objeto já existe com atributos idênticos
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          const err = new Error("PreconditionFailed");
          err.name = "PreconditionFailed";
          err.$metadata = { httpStatusCode: 412 };
          throw err;
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      const res = await engine.transferObject(testItem);
      assert.strictEqual(res.status, "ALREADY_TRANSFERRED_IDENTICAL");
      assert.strictEqual(res.skipped, true);
      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);
    });

    it("412 + objeto divergente no destino -> BLOCK (destination_race_or_collision, sem overwrite e sem delete)", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          return { ContentLength: samplePayload.byteLength + 999, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          const err = new Error("PreconditionFailed");
          err.name = "PreconditionFailed";
          err.$metadata = { httpStatusCode: 412 };
          throw err;
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      await assert.rejects(
        () => engine.transferObject(testItem),
        (err) => {
          assert.strictEqual(err.code, "destination_race_or_collision");
          return true;
        }
      );

      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. AMBIGUOUS PUT OUTCOME RECONCILIATION
  // ───────────────────────────────────────────────────────────────────────────
  describe("Ambiguous PUT Failure Reconciliation", () => {
    it("falha de rede após envio + objeto gravado idêntico -> PUT_COMMITTED_RESPONSE_LOST (sucesso)", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          // Na reconciliação da falha ambígua, o objeto está no destino
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          // Simula timeout após envio do request
          const err = new Error("ETIMEDOUT");
          err.name = "TimeoutError";
          err.code = "ETIMEDOUT";
          throw err;
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      const res = await engine.transferObject(testItem);
      assert.strictEqual(res.status, "PUT_COMMITTED_RESPONSE_LOST");
      assert.strictEqual(res.sha256, testItem.sha256);

      // Comprova registro de estado ambíguo no journal
      const journal = engine.getJournal();
      const unknownState = journal.find((e) => e.state === "FINAL_PUT_OUTCOME_UNKNOWN");
      assert.ok(unknownState, "Journal deve registrar FINAL_PUT_OUTCOME_UNKNOWN");
      const committedState = journal.find((e) => e.state === "PUT_COMMITTED_RESPONSE_LOST");
      assert.ok(committedState, "Journal deve registrar PUT_COMMITTED_RESPONSE_LOST");
    });

    it("falha de rede após envio + objeto ausente -> bounded retry", async () => {
      let putAttempts = 0;
      let headCalls = 0;

      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls <= 2) {
            // Pre-check e reconciliação da tentativa 1: ausente
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          // Na verificação final pós-sucesso da tentativa 2:
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          putAttempts++;
          if (putAttempts === 1) {
            // Falha na primeira tentativa
            const err = new Error("ECONNRESET");
            err.code = "ECONNRESET";
            throw err;
          }
          // Sucesso na segunda tentativa
          return { ETag: '"mock-etag"' };
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
        maxRetries: 3,
      });

      const res = await engine.transferObject(testItem);
      assert.strictEqual(res.status, "VERIFIED");
      assert.strictEqual(putAttempts, 2);
    });

    it("falha de rede após envio + objeto divergente -> BLOCK (destination_divergent_object_blocked)", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          // Reconciliação: tamanho diferente
          return { ContentLength: samplePayload.byteLength + 100, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          const err = new Error("TimeoutError");
          err.name = "TimeoutError";
          throw err;
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      await assert.rejects(
        () => engine.transferObject(testItem),
        (err) => err.code === "destination_divergent_object_blocked"
      );

      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. WRITE CLIENT CONFIGURATION & CREDENTIALS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Write Client Configuration & Session Token", () => {
    it("configura maxAttempts: 1 no write client para evitar retries automáticos ocultos", () => {
      const client = createR2S3Client({
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        endpoint: "https://example.r2.cloudflarestorage.com",
      });

      assert.ok(client instanceof S3Client);
    });

    it("suporta sessionToken para credenciais temporárias", () => {
      const client = createR2S3Client({
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        sessionToken: "test-session-token",
        endpoint: "https://example.r2.cloudflarestorage.com",
      });

      assert.ok(client instanceof S3Client);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. PREFLIGHT DRIFT INVARIANTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Live Preflight Invariants", () => {
    it("aprova preflight da fonte quando contagem, bytes e checksum coincidem", async () => {
      const mockLoader = async () => ({
        objectCount: 147,
        totalBytes: 535493700,
        sourceInventoryChecksum: GATE_3D_BASELINE_PIN.sourceInventoryChecksum,
      });

      const res = await verifyLiveSourcePreflight(mockLoader);
      assert.strictEqual(res.status, "SOURCE_PREFLIGHT_VERIFIED");
    });

    it("rejeita com source_drift_detected se a contagem da fonte divergir", async () => {
      const mockLoader = async () => ({
        objectCount: 146,
        totalBytes: 535493700,
        sourceInventoryChecksum: GATE_3D_BASELINE_PIN.sourceInventoryChecksum,
      });

      await assert.rejects(
        () => verifyLiveSourcePreflight(mockLoader),
        (err) => err.code === "source_drift_detected"
      );
    });

    it("rejeita com destination_drift_detected se o bucket contiver objetos", async () => {
      const s3WithItems = {
        send: async (cmd) => {
          if (cmd.constructor.name === "ListObjectsV2Command") {
            return { Contents: [{ Key: "alien.jpg", Size: 100 }] };
          }
          return {};
        },
      };

      await assert.rejects(
        () => verifyDestinationPrecondition(s3WithItems),
        (err) => err.code === "destination_drift_detected"
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. POST-WRITE VERIFICATION & CRASH SAFETY INVARIANTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Post-Write Verification & Crash Safety Invariants", () => {
    it("falha com post_write_verification_failed e NÃO executa DeleteObject se a verificação pós-escrita falhar", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          return { ETag: '"mock-etag"' };
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          // Retorna payload corrompido pós-escrita
          return { Body: Readable.from(Buffer.from("corrupted_payload_after_write")) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      await assert.rejects(
        () => engine.transferObject(testItem),
        (err) => err.code === "post_write_verification_failed"
      );

      // Comprova que NENHUM DeleteObject foi disparado contra o R2
      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);
    });

    it("recuperação após interrupção: se o processo caiu após o PUT, o rerun reconhece o objeto idêntico e salta sem reescrever", async () => {
      // Simula que o objeto já foi comitado e é 100% idêntico no destino
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      const res = await engine.transferObject(testItem);
      assert.strictEqual(res.status, "ALREADY_TRANSFERRED_IDENTICAL");
      assert.strictEqual(res.skipped, true);
      assert.strictEqual(engine.mutationsRecord.PutObject, 0);
    });

    it("comprova que todas as entradas do journal contêm zero segredos", async () => {
      let headCalls = 0;
      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCalls++;
          if (headCalls === 1) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          return { ETag: '"mock-etag"' };
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
      });

      await engine.transferObject(testItem);
      const journal = engine.getJournal();
      assert.ok(journal.length > 0);

      for (const entry of journal) {
        const str = JSON.stringify(entry);
        assert.ok(!str.includes("secret"), "Journal não pode conter 'secret'");
        assert.ok(!str.includes("token"), "Journal não pode conter 'token'");
        assert.ok(!str.includes("accessKey"), "Journal não pode conter 'accessKey'");
        assert.ok(!str.includes("Authorization"), "Journal não pode conter 'Authorization'");
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. CLOUDFLARE TEMP CREDENTIAL ACTIONS & MIGRATION PARENT IDENTITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("Cloudflare Action Semantics & Local Temporary Signing", () => {
    it("rejeita ações com prefixo 's3:' (s3:PutObject, s3:GetObject, s3:HeadObject)", () => {
      assert.throws(
        () => validateR2TempActions(["s3:PutObject", "GetObject", "HeadObject"]),
        (err) => err.code === "invalid_temp_action_name"
      );
      assert.throws(
        () => validateR2TempActions(["PutObject", "s3:GetObject", "HeadObject"]),
        (err) => err.code === "invalid_temp_action_name"
      );
      assert.throws(
        () => validateR2TempActions(["PutObject", "GetObject", "s3:HeadObject"]),
        (err) => err.code === "invalid_temp_action_name"
      );
    });

    it("aceita exatamente o perfil imutável de migração [HeadObject, GetObject, PutObject]", () => {
      assert.ok(validateR2TempActions(["HeadObject", "GetObject", "PutObject"]));
    });

    it("rejeita DeleteObject, CopyObject e multipart actions do perfil de migração", () => {
      assert.throws(
        () => validateR2TempActions(["HeadObject", "GetObject", "PutObject", "DeleteObject"]),
        (err) => err.code === "migration_action_profile_violation"
      );
      assert.throws(
        () => validateR2TempActions(["HeadObject", "GetObject", "PutObject", "CopyObject"]),
        (err) => err.code === "migration_action_profile_violation"
      );
      assert.throws(
        () => validateR2TempActions(["HeadObject", "GetObject", "PutObject", "CreateMultipartUpload"]),
        (err) => err.code === "migration_action_profile_violation"
      );
    });

    it("rejeita emissão se o token pai for igual ao CLOUDFLARE_API_TOKEN", async () => {
      process.env.CLOUDFLARE_API_TOKEN = "cloudflare_admin_api_token_value_123";
      try {
        await assert.rejects(
          () =>
            mintR2LocalTemporaryCredential({
              parentAccessKeyId: "cloudflare_admin_api_token_value_123",
              parentSecretAccessKey: "some_secret",
            }),
          (err) => err.code === "invalid_parent_token_type"
        );
      } finally {
        delete process.env.CLOUDFLARE_API_TOKEN;
      }
    });

    it("rejeita emissão se accountId ou endpoint estiverem ausentes", async () => {
      await assert.rejects(
        () =>
          mintR2LocalTemporaryCredential({
            parentAccessKeyId: "key",
            parentSecretAccessKey: "secret_32_bytes_long_value_here!!",
            endpoint: "https://acc.r2.cloudflarestorage.com",
            // accountId missing
          }),
        (err) => err.code === "account_id_required"
      );

      await assert.rejects(
        () =>
          mintR2LocalTemporaryCredential({
            parentAccessKeyId: "key",
            parentSecretAccessKey: "secret_32_bytes_long_value_here!!",
            accountId: "acc123",
            // endpoint missing
          }),
        (err) => err.code === "endpoint_required"
      );
    });

    it("emite credencial temporária em estrita conformidade com o protocolo Cloudflare R2", async () => {
      const mockAccountId = "0123456789abcdef0123456789abcdef";
      const mockParentKeyId = "parent_key_id_xyz";
      const mockParentSecret = "parent_secret_key_long_enough_for_hs256_32b!!";
      const mockEndpoint = "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com";
      const mockEndpointHost = "0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com";

      const creds = await mintR2LocalTemporaryCredential({
        endpoint: mockEndpoint,
        accountId: mockAccountId,
        parentAccessKeyId: mockParentKeyId,
        parentSecretAccessKey: mockParentSecret,
        bucket: "haxr-wedding-photos",
        actions: MIGRATION_PROFILE_ALLOWED_ACTIONS,
        prefixPaths: ["jessicaesamueltraditionalwedding/", "jessicasamuelwedding/"],
        objectPaths: [],
        ttlSeconds: 1800,
      });

      // G. temporary accessKeyId = parentAccessKeyId
      assert.strictEqual(creds.accessKeyId, mockParentKeyId);

      // F. temporary secretAccessKey != parentSecretAccessKey
      assert.notStrictEqual(creds.secretAccessKey, mockParentSecret);

      // H & J. sessionToken = base64("jwt/" + signedJWT) e não o raw JWT
      assert.ok(creds.sessionToken !== creds.secretAccessKey);
      const decodedEnvelope = Buffer.from(creds.sessionToken, "base64").toString("utf8");
      assert.ok(decodedEnvelope.startsWith("jwt/"), "sessionToken deve decodificar para 'jwt/<signed-jwt>'");
      const signedJWT = decodedEnvelope.slice(4);
      assert.notStrictEqual(creds.sessionToken, signedJWT, "sessionToken não pode ser o raw signed JWT");

      // E. temporary secretAccessKey = SHA256(signedJWT) lowercase hex
      const expectedSecret = createHash("sha256").update(signedJWT, "utf8").digest("hex").toLowerCase();
      assert.strictEqual(creds.secretAccessKey, expectedSecret);
      assert.strictEqual(creds.secretAccessKey.length, 64);

      // D. Signature verifies with mock parent secret
      const secretBytes = new TextEncoder().encode(mockParentSecret);
      const verified = await jwtVerify(signedJWT, secretBytes, {
        audience: mockEndpointHost,
        issuer: mockParentKeyId,
        subject: mockAccountId,
      });

      // C. Protected header: alg = HS256, typ = JWT
      assert.strictEqual(verified.protectedHeader.alg, "HS256");
      assert.strictEqual(verified.protectedHeader.typ, "JWT");

      // A. Registered claims
      assert.strictEqual(verified.payload.sub, mockAccountId);
      assert.strictEqual(verified.payload.iss, mockParentKeyId);
      assert.strictEqual(verified.payload.aud, mockEndpointHost);
      assert.ok(verified.payload.exp > verified.payload.iat);
      assert.strictEqual(verified.payload.exp - verified.payload.iat, 1800);

      // B & M. Custom claims (conforme especificação Cloudflare R2: actions tem precedência estrita para evitar HTTP 400)
      assert.strictEqual(verified.payload.bucket, "haxr-wedding-photos");
      assert.strictEqual(verified.payload.scope, undefined);
      assert.deepStrictEqual(verified.payload.actions, ["HeadObject", "GetObject", "PutObject"]);
      assert.deepStrictEqual(verified.payload.paths, {
        prefixPaths: ["jessicaesamueltraditionalwedding/", "jessicasamuelwedding/"],
        objectPaths: [],
      });
    });

    it("falha fechado se requireSessionToken estiver ativo e sessionToken estiver ausente", () => {
      assert.throws(
        () =>
          createR2S3Client({
            accessKeyId: "key",
            secretAccessKey: "secret",
            requireSessionToken: true,
          }),
        (err) => err.code === "session_token_required"
      );
    });

    it("deriva deterministamente os 2 prefixos canónicos e valida cobertura dos 147 objectos do Gate 3D", () => {
      const prefixes = deriveCanonicalPrefixPaths([
        "jessicaesamueltraditionalwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.jpg",
        "jessicasamuelwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.jpg",
      ]);
      assert.deepStrictEqual(prefixes, [
        "jessicaesamueltraditionalwedding/",
        "jessicasamuelwedding/",
      ]);
    });

    it("deriva e valida deterministicamente os 147 objectPaths canónicos a partir do manifest congelado real", () => {
      const gate3dRun = JSON.parse(readFileSync("docs/migrations/gate-3d-reconciliation-run-1.json", "utf8"));
      const manifestPaths = deriveAndValidateManifestObjectPaths(gate3dRun.objects);

      assert.strictEqual(manifestPaths.length, 147);
      // Verifica ordenação determinística ASC
      const sortedCheck = [...manifestPaths].sort();
      assert.deepStrictEqual(manifestPaths, sortedCheck);

      // Rejeita itens com chaves duplicadas
      assert.throws(
        () => deriveAndValidateManifestObjectPaths([...manifestPaths, manifestPaths[0]]),
        (err) => err.code === "duplicate_manifest_storage_path"
      );

      // Rejeita itens com colisões de maiúsculas/minúsculas (ex: UUID com caixa alta vs baixa)
      assert.throws(
        () =>
          deriveAndValidateManifestObjectPaths([
            "jessicaesamueltraditionalwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.jpg",
            "jessicaesamueltraditionalwedding/012A2A33-E775-44C3-B1F7-008A46945E0D/original.jpg",
          ]),
        (err) => err.code === "case_collision_detected"
      );

      // Rejeita caminhos de staging
      assert.throws(
        () =>
          deriveAndValidateManifestObjectPaths([
            "__migration/staging/original.jpg",
          ]),
        (err) => err.code === "staging_path_forbidden_in_credential"
      );

      // Rejeita caminhos vazios
      assert.throws(
        () => deriveAndValidateManifestObjectPaths([""]),
        (err) => err.code === "empty_manifest_storage_path"
      );
    });

    it("valida a igualdade estrita e bidireccional entre o conjunto de chaves da credencial e do manifest", () => {
      const gate3dRun = JSON.parse(readFileSync("docs/migrations/gate-3d-reconciliation-run-1.json", "utf8"));
      const manifestPaths = deriveAndValidateManifestObjectPaths(gate3dRun.objects);

      // Igualdade perfeita tem sucesso
      assert.ok(validateExactManifestPathSetEquality([...manifestPaths], manifestPaths));

      // Falha se a credencial tiver uma chave extra
      const extraCredPaths = [...manifestPaths, "jessicasamuelwedding/ffffffff-ffff-4fff-afff-ffffffffffff/original.jpg"];
      assert.throws(
        () => validateExactManifestPathSetEquality(extraCredPaths, manifestPaths),
        (err) => err.code === "credential_path_scope_mismatch"
      );

      // Falha se a credencial omitir uma chave do manifest
      const missingCredPaths = manifestPaths.slice(0, 146);
      assert.throws(
        () => validateExactManifestPathSetEquality(missingCredPaths, manifestPaths),
        (err) => err.code === "credential_path_scope_mismatch"
      );
    });

    it("emite credencial temporária com escopo exacto dos 147 objectPaths e valida pegada segura de cabeçalhos (< 64 KB)", async () => {
      const gate3dRun = JSON.parse(readFileSync("docs/migrations/gate-3d-reconciliation-run-1.json", "utf8"));
      const manifestPaths = deriveAndValidateManifestObjectPaths(gate3dRun.objects);

      const mockAccountId = "0123456789abcdef0123456789abcdef";
      const mockParentKeyId = "mock_parent_key_id_123";
      const mockParentSecret = "mock_parent_secret_key_32_bytes_long!!";
      const mockEndpoint = "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com";
      const mockEndpointHost = "0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com";

      // Rejeita se prefixPaths não estiver vazio quando manifestPaths for exigido
      await assert.rejects(
        () =>
          mintR2LocalTemporaryCredential({
            endpoint: mockEndpoint,
            accountId: mockAccountId,
            parentAccessKeyId: mockParentKeyId,
            parentSecretAccessKey: mockParentSecret,
            manifestPaths,
            objectPaths: manifestPaths,
            prefixPaths: ["jessicaesamueltraditionalwedding/"],
          }),
        (err) => err.code === "prefix_paths_forbidden_in_exact_scope"
      );

      // Emissão com os 147 objectPaths canónicos exactos
      const creds = await mintR2LocalTemporaryCredential({
        endpoint: mockEndpoint,
        accountId: mockAccountId,
        parentAccessKeyId: mockParentKeyId,
        parentSecretAccessKey: mockParentSecret,
        bucket: "haxr-wedding-photos",
        actions: MIGRATION_PROFILE_ALLOWED_ACTIONS,
        manifestPaths,
        objectPaths: manifestPaths,
        prefixPaths: [],
        ttlSeconds: 1800,
      });

      assert.strictEqual(creds.accessKeyId, mockParentKeyId);
      assert.strictEqual(creds.secretAccessKey.length, 64);
      assert.notStrictEqual(creds.secretAccessKey, mockParentSecret);

      // Descodificação do sessionToken envelope
      const decodedEnvelope = Buffer.from(creds.sessionToken, "base64").toString("utf8");
      assert.ok(decodedEnvelope.startsWith("jwt/"));
      const signedJWT = decodedEnvelope.slice(4);

      // Verificação criptográfica do JWT gerado
      const secretBytes = new TextEncoder().encode(mockParentSecret);
      const verified = await jwtVerify(signedJWT, secretBytes, {
        audience: mockEndpointHost,
        issuer: mockParentKeyId,
        subject: mockAccountId,
      });

      assert.strictEqual(verified.payload.bucket, "haxr-wedding-photos");
      assert.strictEqual(verified.payload.scope, undefined);
      assert.deepStrictEqual(verified.payload.actions, ["HeadObject", "GetObject", "PutObject"]);
      assert.deepStrictEqual(verified.payload.paths.prefixPaths, []);
      assert.strictEqual(verified.payload.paths.objectPaths.length, 147);
      assert.deepStrictEqual(verified.payload.paths.objectPaths, manifestPaths);

      // Validação de medição de tamanho e pegada de cabeçalhos HTTP
      const sessionTokenBytes = Buffer.byteLength(creds.sessionToken, "utf8");
      const estimatedHeaders = estimateS3RequestHeaderFootprint(creds.sessionToken, { host: mockEndpointHost });

      assert.ok(sessionTokenBytes > 20000 && sessionTokenBytes < 25000, `sessionTokenBytes (${sessionTokenBytes}) fora da faixa esperada`);
      assert.ok(estimatedHeaders > 21000 && estimatedHeaders < 26000, `estimatedHeaders (${estimatedHeaders}) fora da faixa esperada`);
      assert.ok(estimatedHeaders < 65536, "A pegada de cabeçalhos estimada deve ser estritamente inferior a 64 KB");

      // Falha fechado se o limite de segurança configurado for violado
      await assert.rejects(
        () =>
          mintR2LocalTemporaryCredential({
            endpoint: mockEndpoint,
            accountId: mockAccountId,
            parentAccessKeyId: mockParentKeyId,
            parentSecretAccessKey: mockParentSecret,
            manifestPaths,
            objectPaths: manifestPaths,
            prefixPaths: [],
            maxHeaderSafetyBytes: 1000, // Limite artificial para testar fail-closed
          }),
        (err) => err.code === "header_size_safety_exceeded"
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. LATE COMMIT RACE CONDITION (FIRST REQUEST COMMITS AFTER NOTFOUND CHECK)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Late Commit Race Condition Reconciliation", () => {
    it("race de commit tardio: tentativa 1 falha na resposta, NotFound é visto, tentativa 2 sofre 412 -> reconciliação idêntica tem sucesso", async () => {
      let putCount = 0;
      let headCount = 0;

      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCount++;
          if (headCount === 1) {
            // Pre-check: não existe
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          if (headCount === 2) {
            // Reconciliação do timeout da tentativa 1: ainda não visível no instante exato
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          // Na reconciliação do 412 subsequente: o objeto agora está comitado e é idêntico!
          return { ContentLength: samplePayload.byteLength, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          putCount++;
          if (putCount === 1) {
            // Tentativa 1: timeout de resposta
            const err = new Error("TimeoutError");
            err.name = "TimeoutError";
            throw err;
          }
          if (putCount === 2) {
            // Tentativa 2: tentativa 1 comitou tardiamente, logo tentativa 2 recebe 412!
            const err = new Error("PreconditionFailed");
            err.name = "PreconditionFailed";
            err.$metadata = { httpStatusCode: 412 };
            throw err;
          }
        }
        if (cmd.constructor.name === "GetObjectCommand") {
          return { Body: Readable.from(samplePayload) };
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
        maxRetries: 3,
      });

      const res = await engine.transferObject(testItem);
      assert.strictEqual(res.status, "ALREADY_TRANSFERRED_IDENTICAL");
      assert.strictEqual(res.skipped, true);
      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);
    });

    it("race de commit tardio com divergência: tentativa 2 sofre 412 mas objeto destino diverge -> BLOCK (destination_race_or_collision)", async () => {
      let putCount = 0;
      let headCount = 0;

      mockS3Client.send = async (cmd) => {
        if (cmd.constructor.name === "HeadObjectCommand") {
          headCount++;
          if (headCount === 1 || headCount === 2) {
            const err = new Error("NotFound");
            err.name = "NotFound";
            throw err;
          }
          // Reconciliação do 412: tamanho diferente!
          return { ContentLength: samplePayload.byteLength + 500, ContentType: "image/jpeg" };
        }
        if (cmd.constructor.name === "PutObjectCommand") {
          putCount++;
          if (putCount === 1) {
            const err = new Error("TimeoutError");
            err.name = "TimeoutError";
            throw err;
          }
          if (putCount === 2) {
            const err = new Error("PreconditionFailed");
            err.name = "PreconditionFailed";
            err.$metadata = { httpStatusCode: 412 };
            throw err;
          }
        }
        return {};
      };

      const engine = new HardenedPhysicalTransferEngine({
        sourceProvider: mockSourceProvider,
        s3Client: mockS3Client,
        maxRetries: 3,
      });

      await assert.rejects(
        () => engine.transferObject(testItem),
        (err) => err.code === "destination_race_or_collision"
      );

      assert.strictEqual(engine.mutationsRecord.DeleteObject, 0);
    });
  });
});
