import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  StorageProvider,
  StorageSecurityError,
  validateAndParseStoragePath,
  buildCanonicalStoragePath,
  validateTtlSeconds,
  FakeStorageProvider,
  SupabaseStorageProvider,
  SupabaseStorageClientLike,
  S3CompatibleStorageProvider,
  S3ClientLike,
  S3PresignerLike,
  S3CommandStructural,
} from "./index";

describe("Gate 3B — StorageProvider Abstraction & Security Suite", () => {
  const VALID_SLUG = "jessicaesamueltraditionalwedding";
  const VALID_UUID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
  const VALID_PATH = `${VALID_SLUG}/${VALID_UUID}/original.jpg`;
  const TEST_BUCKET = "wedding-photos";

  let fakeProvider: FakeStorageProvider;

  beforeEach(() => {
    fakeProvider = new FakeStorageProvider();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. UPLOAD TESTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Upload Operations", () => {
    it("deve gerar signed upload URL com path canónico e parâmetros válidos", async () => {
      const result = await fakeProvider.createSignedUploadUrl(TEST_BUCKET, VALID_PATH, {
        contentType: "image/jpeg",
        expiresInSeconds: 600,
      });

      assert.ok(result.uploadUrl.includes("mock-storage.haxrsignature.internal"));
      assert.ok(result.uploadUrl.includes("action=upload"));
      assert.strictEqual(result.storagePath, VALID_PATH);
      assert.strictEqual(result.expiresInSeconds, 600);
      assert.strictEqual(fakeProvider.generatedUploadUrls.length, 1);
    });

    it("deve usar o TTL padrão de 600 segundos quando omitido", async () => {
      const result = await fakeProvider.createSignedUploadUrl(TEST_BUCKET, VALID_PATH, {
        contentType: "image/jpeg",
      });
      assert.strictEqual(result.expiresInSeconds, 600);
    });

    it("deve suportar vídeos permitidos (mp4, mov, webm)", async () => {
      const videoPath = `${VALID_SLUG}/${VALID_UUID}/original.mp4`;
      const result = await fakeProvider.createSignedUploadUrl(TEST_BUCKET, videoPath, {
        contentType: "video/mp4",
      });
      assert.strictEqual(result.storagePath, videoPath);
    });

    it("deve rejeitar upload com bucket ausente ou vazio", async () => {
      await assert.rejects(
        async () => {
          await fakeProvider.createSignedUploadUrl("", VALID_PATH, {
            contentType: "image/jpeg",
          });
        },
        (err: Error) => {
          assert.ok(err instanceof StorageSecurityError);
          assert.strictEqual(err.message, "bucket_name_required");
          return true;
        }
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. DOWNLOAD TESTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Download Operations (Signed URLs)", () => {
    it("deve gerar signed download URL com TTL e path correto", async () => {
      const url = await fakeProvider.createSignedUrl(TEST_BUCKET, VALID_PATH, {
        expiresInSeconds: 3600,
      });

      assert.ok(url.includes("mock-storage.haxrsignature.internal"));
      assert.ok(url.includes("action=read"));
      assert.ok(url.includes(VALID_PATH));
      assert.strictEqual(fakeProvider.generatedDownloadUrls.length, 1);
    });

    it("deve usar TTL padrão de 3600s para download quando omitido", async () => {
      const url = await fakeProvider.createSignedUrl(TEST_BUCKET, VALID_PATH);
      assert.ok(url.includes("action=read"));
      assert.strictEqual(fakeProvider.generatedDownloadUrls[0].expiresAt > Math.floor(Date.now() / 1000), true);
    });

    it("deve rejeitar bucket inválido no download", async () => {
      await assert.rejects(
        async () => {
          await fakeProvider.createSignedUrl("", VALID_PATH);
        },
        (err: Error) => {
          assert.ok(err instanceof StorageSecurityError);
          assert.strictEqual(err.message, "bucket_name_required");
          return true;
        }
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SERVER-SIDE DOWNLOAD (INSPECTION)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Server-Side Download (Buffer Inspection)", () => {
    it("deve obter bytes, tamanho e Content-Type de objeto existente", async () => {
      const fakeBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG magic header
      fakeProvider.seedObject(TEST_BUCKET, VALID_PATH, fakeBytes, "image/jpeg");

      const downloaded = await fakeProvider.download(TEST_BUCKET, VALID_PATH);
      assert.ok(downloaded !== null);
      assert.strictEqual(downloaded.sizeBytes, fakeBytes.length);
      assert.strictEqual(downloaded.contentType, "image/jpeg");
      assert.deepStrictEqual(downloaded.data, fakeBytes);
    });

    it("deve retornar null de forma segura quando o objeto não existe", async () => {
      const missingPath = `${VALID_SLUG}/00000000-0000-4000-8000-000000000000/original.jpg`;
      const result = await fakeProvider.download(TEST_BUCKET, missingPath);
      assert.strictEqual(result, null);
    });

    it("getObjectInfo deve devolver metadados sem descarregar o corpo", async () => {
      const fakeBytes = new Uint8Array([1, 2, 3, 4]);
      fakeProvider.seedObject(TEST_BUCKET, VALID_PATH, fakeBytes, "image/jpeg");

      const info = await fakeProvider.getObjectInfo(TEST_BUCKET, VALID_PATH);
      assert.ok(info !== null);
      assert.strictEqual(info.storagePath, VALID_PATH);
      assert.strictEqual(info.sizeBytes, 4);
      assert.strictEqual(info.contentType, "image/jpeg");
      assert.ok(info.eTag);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. REMOVE (PURGE) TESTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("Remove Operations", () => {
    it("deve remover objeto do bucket e ser idempotente", async () => {
      const fakeBytes = new Uint8Array([1, 2, 3]);
      fakeProvider.seedObject(TEST_BUCKET, VALID_PATH, fakeBytes, "image/jpeg");

      assert.ok((await fakeProvider.download(TEST_BUCKET, VALID_PATH)) !== null);

      await fakeProvider.remove(TEST_BUCKET, [VALID_PATH]);
      assert.strictEqual(await fakeProvider.download(TEST_BUCKET, VALID_PATH), null);

      // Idempotência: remover novamente não deve disparar erro
      await fakeProvider.remove(TEST_BUCKET, [VALID_PATH]);
    });

    it("não deve remover objetos de outros paths ao purgar um objeto", async () => {
      const path1 = `${VALID_SLUG}/${VALID_UUID}/original.jpg`;
      const path2 = `${VALID_SLUG}/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e/original.png`;

      fakeProvider.seedObject(TEST_BUCKET, path1, new Uint8Array([1]), "image/jpeg");
      fakeProvider.seedObject(TEST_BUCKET, path2, new Uint8Array([2]), "image/png");

      await fakeProvider.remove(TEST_BUCKET, [path1]);

      assert.strictEqual(await fakeProvider.download(TEST_BUCKET, path1), null);
      assert.ok((await fakeProvider.download(TEST_BUCKET, path2)) !== null);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. SECURITY & CANONICAL PATH BOUNDARIES
  // ───────────────────────────────────────────────────────────────────────────
  describe("Security & Path Boundaries", () => {
    it("rejeita explicitamente Path Traversal (..)", () => {
      assert.throws(
        () => validateAndParseStoragePath(`../${VALID_PATH}`),
        /path_traversal_or_illegal_characters_detected/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/../../etc/passwd`),
        /path_traversal_or_illegal_characters_detected/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/../original.jpg`),
        /path_traversal_or_illegal_characters_detected/
      );
    });

    it("rejeita barras invertidas (\\) e caracteres de controlo", () => {
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}\\${VALID_UUID}\\original.jpg`),
        /path_traversal_or_illegal_characters_detected/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/original.jpg\x00`),
        /path_traversal_or_illegal_characters_detected/
      );
    });

    it("rejeita caminhos absolutos ou com barras no início/fim", () => {
      assert.throws(
        () => validateAndParseStoragePath(`/${VALID_PATH}`),
        /path_traversal_or_illegal_characters_detected/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_PATH}/`),
        /path_traversal_or_illegal_characters_detected/
      );
    });

    it("rejeita caminhos que não tenham exatamente 3 segmentos", () => {
      assert.throws(
        () => validateAndParseStoragePath("single_segment"),
        /storage_path_must_have_exactly_three_segments/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}`),
        /storage_path_must_have_exactly_three_segments/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/extra/original.jpg`),
        /storage_path_must_have_exactly_three_segments/
      );
    });

    it("rejeita invitation slug com caracteres inválidos", () => {
      assert.throws(
        () => validateAndParseStoragePath(`Invalid_Slug_Uppercase/${VALID_UUID}/original.jpg`),
        /invalid_invitation_slug_format/
      );
      assert.throws(
        () => validateAndParseStoragePath(`slug with spaces/${VALID_UUID}/original.jpg`),
        /invalid_invitation_slug_format/
      );
    });

    it("bloqueia acesso cruzado entre convites (cross-invitation access)", () => {
      assert.throws(
        () =>
          validateAndParseStoragePath(
            `jessicasamuelwedding/${VALID_UUID}/original.jpg`,
            "jessicaesamueltraditionalwedding"
          ),
        /cross_invitation_access_blocked:expected_jessicaesamueltraditionalwedding_got_jessicasamuelwedding/
      );
    });

    it("rejeita photoId que não seja UUID v4", () => {
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/not-a-uuid/original.jpg`),
        /invalid_photo_uuid_format/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/12345/original.jpg`),
        /invalid_photo_uuid_format/
      );
    });

    it("rejeita ficheiros que não comecem por 'original.'", () => {
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/malicious.exe`),
        /file_name_must_be_original_dot_ext/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/thumbnail.jpg`),
        /file_name_must_be_original_dot_ext/
      );
    });

    it("rejeita extensões não autorizadas", () => {
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/original.exe`),
        /unsupported_file_extension:exe/
      );
      assert.throws(
        () => validateAndParseStoragePath(`${VALID_SLUG}/${VALID_UUID}/original.sh`),
        /unsupported_file_extension:sh/
      );
    });

    it("rejeita mismatch entre extensão e Content-Type declarado", () => {
      assert.throws(
        () =>
          validateAndParseStoragePath(
            `${VALID_SLUG}/${VALID_UUID}/original.jpg`,
            VALID_SLUG,
            "application/pdf"
          ),
        /mime_type_extension_mismatch:ext_jpg_decl_application\/pdf/
      );
      assert.throws(
        () =>
          validateAndParseStoragePath(
            `${VALID_SLUG}/${VALID_UUID}/original.png`,
            VALID_SLUG,
            "video/mp4"
          ),
        /mime_type_extension_mismatch/
      );
    });

    it("valida rigorosamente limites de TTL", () => {
      // Upload: min 60s, max 3600s
      assert.strictEqual(validateTtlSeconds(undefined, "upload"), 600);
      assert.strictEqual(validateTtlSeconds(300, "upload"), 300);
      assert.throws(() => validateTtlSeconds(10, "upload"), /ttl_out_of_bounds/);
      assert.throws(() => validateTtlSeconds(7200, "upload"), /ttl_out_of_bounds/);

      // Download: min 60s, max 86400s
      assert.strictEqual(validateTtlSeconds(undefined, "download"), 3600);
      assert.strictEqual(validateTtlSeconds(7200, "download"), 7200);
      assert.throws(() => validateTtlSeconds(10, "download"), /ttl_out_of_bounds/);
      assert.throws(() => validateTtlSeconds(100000, "download"), /ttl_out_of_bounds/);
    });

    it("buildCanonicalStoragePath constrói caminho determinístico normalizado", () => {
      const canonical = buildCanonicalStoragePath(VALID_SLUG, VALID_UUID, ".JPG");
      assert.strictEqual(canonical, `${VALID_SLUG}/${VALID_UUID}/original.jpg`);
    });

    it("garante allowStaging = false por default e bloqueia caminhos de migração na aplicação", () => {
      const stagingPath = `__migration/run-123/${VALID_SLUG}/${VALID_UUID}/original.jpg`;
      // Sem options (default allowStaging = false) -> rejeita
      assert.throws(
        () => validateAndParseStoragePath(stagingPath),
        /storage_path_must_have_exactly_three_segments/
      );
      // Com allowStaging: false explícito -> rejeita
      assert.throws(
        () => validateAndParseStoragePath(stagingPath, undefined, undefined, { allowStaging: false }),
        /storage_path_must_have_exactly_three_segments/
      );
      // Com allowStaging: true -> aceita se a estrutura for estritamente válida
      const parsed = validateAndParseStoragePath(stagingPath, undefined, undefined, { allowStaging: true });
      assert.strictEqual(parsed.slug, VALID_SLUG);
      assert.strictEqual(parsed.photoId, VALID_UUID);
      assert.strictEqual(parsed.fileName, "original.jpg");
      assert.strictEqual(parsed.canonicalPath, `${VALID_SLUG}/${VALID_UUID}/original.jpg`);

      // Com allowStaging: true mas estrutura de staging inválida -> rejeita
      assert.throws(
        () => validateAndParseStoragePath("__migration/invalid", undefined, undefined, { allowStaging: true }),
        /invalid_staging_path_structure/
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. ADAPTERS (SUPABASE & S3/R2)
  // ───────────────────────────────────────────────────────────────────────────
  describe("Adapters Compatibility", () => {
    it("SupabaseStorageProvider adapta chamadas com cliente simulado", async () => {
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

      const provider = new SupabaseStorageProvider(mockSupabaseClient);
      assert.strictEqual(provider.providerName, "supabase");

      // Teste upload
      const uploadRes = await provider.createSignedUploadUrl(TEST_BUCKET, VALID_PATH, {
        contentType: "image/jpeg",
      });
      assert.ok(uploadRes.uploadUrl.includes("supabase.co/upload"));

      // Teste download URL
      const signedUrl = await provider.createSignedUrl(TEST_BUCKET, VALID_PATH);
      assert.ok(signedUrl.includes("supabase.co/read"));

      // Teste download de binário
      mockStorageMap.set(VALID_PATH, new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }));
      const downloaded = await provider.download(TEST_BUCKET, VALID_PATH);
      assert.ok(downloaded !== null);
      assert.strictEqual(downloaded.sizeBytes, 3);
      assert.strictEqual(downloaded.contentType, "image/jpeg");

      // Teste remove
      await provider.remove(TEST_BUCKET, [VALID_PATH]);
      assert.strictEqual(await provider.download(TEST_BUCKET, VALID_PATH), null);
    });

    it("S3CompatibleStorageProvider adapta comandos estruturais sem SDK concreto", async () => {
      const commandsExecuted: S3CommandStructural[] = [];

      const mockS3Client: S3ClientLike = {
        send: async <T>(command: S3CommandStructural): Promise<T> => {
          commandsExecuted.push(command);
          if (command._type === "GetObjectCommand") {
            return {
              Body: new Uint8Array([0xff, 0xd8, 0xff]),
              ContentType: "image/jpeg",
            } as T;
          }
          if (command._type === "DeleteObjectsCommand") {
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
          commandsExecuted.push({ ...command, _presignOptions: options } as S3CommandStructural);
          return `https://r2.cloudflare.com/${command.Bucket}/${command.Key}?sig=presigned&exp=${options?.expiresIn}`;
        },
      };

      const s3Provider = new S3CompatibleStorageProvider(mockS3Client, mockPresigner, {
        bucketName: TEST_BUCKET,
      });
      assert.strictEqual(s3Provider.providerName, "r2-s3");

      // Upload presigned
      const upRes = await s3Provider.createSignedUploadUrl(TEST_BUCKET, VALID_PATH, {
        contentType: "image/jpeg",
        expiresInSeconds: 900,
      });
      assert.ok(upRes.uploadUrl.includes("r2.cloudflare.com"));
      assert.ok(upRes.uploadUrl.includes("exp=900"));

      // Download presigned
      const dlUrl = await s3Provider.createSignedUrl(TEST_BUCKET, VALID_PATH, {
        expiresInSeconds: 1800,
      });
      assert.ok(dlUrl.includes("r2.cloudflare.com"));
      assert.ok(dlUrl.includes("exp=1800"));

      // Server download
      const downloaded = await s3Provider.download(TEST_BUCKET, VALID_PATH);
      assert.ok(downloaded !== null);
      assert.strictEqual(downloaded.sizeBytes, 3);
      assert.strictEqual(downloaded.contentType, "image/jpeg");

      // Remove
      await s3Provider.remove(TEST_BUCKET, [VALID_PATH]);
      const lastCmd = commandsExecuted[commandsExecuted.length - 1];
      assert.strictEqual(lastCmd._type, "DeleteObjectsCommand");
      assert.deepStrictEqual(lastCmd.Delete?.Objects, [{ Key: VALID_PATH }]);
    });

    it("S3CompatibleStorageProvider.getObjectInfo() obedece ao contrato StorageProvider e usa HeadObjectCommand", async () => {
      const commandsExecuted: S3CommandStructural[] = [];
      const testDate = new Date("2026-09-04T12:00:00Z");

      const mockS3Client: S3ClientLike = {
        send: async <T>(command: S3CommandStructural): Promise<T> => {
          commandsExecuted.push(command);
          if (command._type === "HeadObjectCommand") {
            if (command.Key === VALID_PATH) {
              return {
                ContentLength: 1024,
                ContentType: "image/jpeg",
                ETag: '"etag-12345"',
                LastModified: testDate,
              } as T;
            }
            if (command.Key?.includes("00000000-0000-4000-8000-000000000002")) {
              const err = new Error("Object not found");
              err.name = "NotFound";
              (err as unknown as Record<string, unknown>).$metadata = { httpStatusCode: 404 };
              throw err;
            }
            if (command.Key?.includes("00000000-0000-4000-8000-000000000003")) {
              throw new Error("InternalServerError: 500");
            }
          }
          throw new Error(`Unexpected command: ${command._type}`);
        },
      };

      const mockPresigner: S3PresignerLike = {
        getSignedUrl: async () => "https://dummy",
      };

      const s3Provider = new S3CompatibleStorageProvider(mockS3Client, mockPresigner, {
        bucketName: TEST_BUCKET,
      });

      // 1. Sucesso: valida metadados retornados
      const info = await s3Provider.getObjectInfo(TEST_BUCKET, VALID_PATH);
      assert.ok(info !== null);
      assert.strictEqual(info.storagePath, VALID_PATH);
      assert.strictEqual(info.sizeBytes, 1024);
      assert.strictEqual(info.contentType, "image/jpeg");
      assert.strictEqual(info.eTag, "etag-12345");
      assert.strictEqual(info.lastModified, testDate);

      const headCmd = commandsExecuted.find((c) => c._type === "HeadObjectCommand");
      assert.ok(headCmd !== undefined);
      assert.strictEqual(headCmd.Bucket, TEST_BUCKET);
      assert.strictEqual(headCmd.Key, VALID_PATH);

      // 2. Validação canónica de caminho
      await assert.rejects(
        async () => s3Provider.getObjectInfo(TEST_BUCKET, "../traversal/photo.jpg"),
        StorageSecurityError
      );

      // 3. 404 / NotFound retorna null de forma segura
      const notFoundPath = "jessicasamuelwedding/00000000-0000-4000-8000-000000000002/original.jpg";
      const notFoundInfo = await s3Provider.getObjectInfo(TEST_BUCKET, notFoundPath);
      assert.strictEqual(notFoundInfo, null);

      // 4. Erros inesperados propagam-se
      const serverErrPath = "jessicasamuelwedding/00000000-0000-4000-8000-000000000003/original.jpg";
      await assert.rejects(
        async () => s3Provider.getObjectInfo(TEST_BUCKET, serverErrPath),
        /InternalServerError: 500/
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. BUSINESS LOGIC AGNOSTICISM
  // ───────────────────────────────────────────────────────────────────────────
  describe("Business Logic Agnosticism (Workflow Simulation)", () => {
    it("simula o fluxo de intenção -> upload -> inspeção de magic bytes -> galeria", async () => {
      // Função simulada de negócio que opera unicamente sobre StorageProvider
      async function executePhotoWorkflow(provider: StorageProvider) {
        // 1. Intenção de Upload
        const intent = await provider.createSignedUploadUrl(TEST_BUCKET, VALID_PATH, {
          contentType: "image/jpeg",
        });
        assert.ok(intent.uploadUrl.length > 0);

        // 2. Cliente faz upload do binário (simulado em teste via seed ou PUT)
        const fakeImageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x12, 0x34]);
        if (provider instanceof FakeStorageProvider) {
          provider.seedObject(TEST_BUCKET, intent.storagePath, fakeImageBytes, "image/jpeg");
        }

        // 3. Servidor descarrega para inspecionar magic bytes
        const serverDownload = await provider.download(TEST_BUCKET, intent.storagePath);
        assert.ok(serverDownload !== null);

        // Verificação de magic bytes do JPEG (0xff, 0xd8, 0xff)
        const isJpeg =
          serverDownload.data.length >= 3 &&
          serverDownload.data[0] === 0xff &&
          serverDownload.data[1] === 0xd8 &&
          serverDownload.data[2] === 0xff;
        assert.strictEqual(isJpeg, true);

        // 4. Servidor gera URL de leitura segura para a Galeria
        const galleryUrl = await provider.createSignedUrl(TEST_BUCKET, intent.storagePath, {
          expiresInSeconds: 3600,
        });
        assert.ok(galleryUrl.length > 0);

        return { success: true, galleryUrl };
      }

      const workflowResult = await executePhotoWorkflow(fakeProvider);
      assert.strictEqual(workflowResult.success, true);
    });
  });
});
