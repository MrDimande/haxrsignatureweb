import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  assertSafeStoragePath,
  getPrivateStorageProvider,
  resetPrivateStorageProviderForTests,
  StorageSecurityError,
  StorageConfigurationError,
  R2PrivateStorageProvider,
  isPrivateStorageConfigured,
} from "./private-storage";
import { UniversalConciergeStorageProvider } from "@/lib/concierge/portal/universal-concierge-storage-provider";

describe("Private Storage Provider Abstraction", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPrivateStorageProviderForTests();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetPrivateStorageProviderForTests();
  });

  describe("assertSafeStoragePath", () => {
    it("accepts valid safe paths", () => {
      assert.doesNotThrow(() => assertSafeStoragePath("portal-proofs/client1/123-doc.pdf"));
      assert.doesNotThrow(() => assertSafeStoragePath("events/evt-1/concierge/upl-1/proposta.pdf"));
      assert.doesNotThrow(() => assertSafeStoragePath("events/evt-2/portal/item-3/file.png"));
    });

    it("rejects path traversal attempts", () => {
      assert.throws(() => assertSafeStoragePath("../secret.txt"), StorageSecurityError);
      assert.throws(() => assertSafeStoragePath("events/../../secret.txt"), StorageSecurityError);
      assert.throws(() => assertSafeStoragePath("/absolute/path.pdf"), StorageSecurityError);
      assert.throws(() => assertSafeStoragePath("\\windows\\path.pdf"), StorageSecurityError);
      assert.throws(() => assertSafeStoragePath("file\0nullbyte.pdf"), StorageSecurityError);
      assert.throws(() => assertSafeStoragePath(""), StorageSecurityError);
    });
  });

  describe("getPrivateStorageProvider provider selection", () => {
    it("fails closed when HAXR_PRIVATE_STORAGE_PROVIDER is missing or unknown", () => {
      delete process.env.HAXR_PRIVATE_STORAGE_PROVIDER;
      assert.throws(
        () => getPrivateStorageProvider(),
        StorageConfigurationError
      );

      process.env.HAXR_PRIVATE_STORAGE_PROVIDER = "unknown-provider";
      assert.throws(
        () => getPrivateStorageProvider(),
        StorageConfigurationError
      );
    });

    it("returns SupabasePrivateStorageProvider when configured for supabase", () => {
      process.env.HAXR_PRIVATE_STORAGE_PROVIDER = "supabase";
      const provider = getPrivateStorageProvider();
      assert.strictEqual(provider.providerName, "supabase");
    });

    it("returns R2PrivateStorageProvider when configured for r2-s3", () => {
      process.env.HAXR_PRIVATE_STORAGE_PROVIDER = "r2-s3";
      const provider = getPrivateStorageProvider();
      assert.strictEqual(provider.providerName, "r2-s3");
    });
  });

  describe("R2PrivateStorageProvider fail-closed configuration", () => {
    it("throws StorageConfigurationError if R2 credentials are not set", async () => {
      delete process.env.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID;
      delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      delete process.env.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY;
      delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
      delete process.env.CLOUDFLARE_R2_PRIVATE_ENDPOINT;
      delete process.env.CLOUDFLARE_R2_ENDPOINT;

      const provider = new R2PrivateStorageProvider();
      await assert.rejects(
        () => provider.uploadBuffer("concierge-uploads", "test/path.pdf", Buffer.from("test")),
        StorageConfigurationError
      );
    });
  });

  describe("UniversalConciergeStorageProvider validation", () => {
    it("rejects unsupported MIME types", async () => {
      process.env.HAXR_PRIVATE_STORAGE_PROVIDER = "r2-s3";
      process.env.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID = "mock_key";
      process.env.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY = "mock_secret";
      process.env.CLOUDFLARE_R2_PRIVATE_ENDPOINT = "https://mock.r2.cloudflarestorage.com";

      const conciergeStorage = new UniversalConciergeStorageProvider();
      await assert.rejects(
        () =>
          conciergeStorage.uploadFile({
            eventId: "evt-1",
            itemId: "item-1",
            fileName: "malicious.exe",
            mimeType: "application/x-msdownload",
            buffer: Buffer.from("MZ..."),
          }),
        /Tipo de ficheiro não suportado/
      );
    });

    it("rejects files exceeding max bytes", async () => {
      process.env.HAXR_PRIVATE_STORAGE_PROVIDER = "r2-s3";
      process.env.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID = "mock_key";
      process.env.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY = "mock_secret";
      process.env.CLOUDFLARE_R2_PRIVATE_ENDPOINT = "https://mock.r2.cloudflarestorage.com";

      const conciergeStorage = new UniversalConciergeStorageProvider();
      const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21 MB > 20 MB limit
      await assert.rejects(
        () =>
          conciergeStorage.uploadFile({
            eventId: "evt-1",
            itemId: "item-1",
            fileName: "large.pdf",
            mimeType: "application/pdf",
            buffer: largeBuffer,
          }),
        /Ficheiro demasiado grande/
      );
    });
  });
});
