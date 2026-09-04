/**
 * HAXR Edition Engine — Fake Storage Provider (In-Memory)
 *
 * Implementação puramente em memória, determinística e sem dependências externas.
 * Utilizada para testes unitários, ambientes de desenvolvimento e validação de regressão.
 */

import {
  StorageProvider,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
  SignedDownloadUrlOptions,
  StorageDownloadResult,
  StorageObjectMetadata,
  StorageSecurityError,
  StoragePreconditionFailedError,
} from "./storage-provider.types";
import {
  validateAndParseStoragePath,
  validateTtlSeconds,
} from "./canonical-path";

interface StoredObject {
  data: Uint8Array;
  contentType: string;
  sizeBytes: number;
  lastModified: Date;
  eTag: string;
}

export class FakeStorageProvider implements StorageProvider {
  public readonly providerName = "fake";

  /** Bucket -> storagePath -> StoredObject */
  private store: Map<string, Map<string, StoredObject>> = new Map();

  /** Registo de URLs geradas para verificação em testes */
  public generatedUploadUrls: Array<{
    bucket: string;
    storagePath: string;
    url: string;
    expiresAt: number;
  }> = [];

  public generatedDownloadUrls: Array<{
    bucket: string;
    storagePath: string;
    url: string;
    expiresAt: number;
  }> = [];

  private getBucketMap(bucket: string): Map<string, StoredObject> {
    let bucketMap = this.store.get(bucket);
    if (!bucketMap) {
      bucketMap = new Map();
      this.store.set(bucket, bucketMap);
    }
    return bucketMap;
  }

  async createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions
  ): Promise<SignedUploadUrlResult> {
    if (!bucket || typeof bucket !== "string") {
      throw new StorageSecurityError("bucket_name_required");
    }

    // Validação canónica estrita de path e segurança
    validateAndParseStoragePath(storagePath, undefined, options.contentType);

    const ttl = validateTtlSeconds(options.expiresInSeconds, "upload");
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;

    // URL assinada simulada determinística (sem segredos reais)
    const uploadUrl = `https://mock-storage.haxrsignature.internal/${bucket}/${storagePath}?action=upload&exp=${expiresAt}&sig=mock_upload_sig_${Date.now()}`;

    this.generatedUploadUrls.push({
      bucket,
      storagePath,
      url: uploadUrl,
      expiresAt,
    });

    return {
      uploadUrl,
      storagePath,
      expiresInSeconds: ttl,
    };
  }

  async createSignedUrl(
    bucket: string,
    storagePath: string,
    options?: SignedDownloadUrlOptions
  ): Promise<string> {
    if (!bucket || typeof bucket !== "string") {
      throw new StorageSecurityError("bucket_name_required");
    }

    validateAndParseStoragePath(storagePath);

    const ttl = validateTtlSeconds(options?.expiresInSeconds, "download");
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;

    // URL assinada simulada para visualização temporária na galeria
    const downloadUrl = `https://mock-storage.haxrsignature.internal/${bucket}/${storagePath}?action=read&exp=${expiresAt}&sig=mock_download_sig_${Date.now()}`;

    this.generatedDownloadUrls.push({
      bucket,
      storagePath,
      url: downloadUrl,
      expiresAt,
    });

    return downloadUrl;
  }

  async download(
    bucket: string,
    storagePath: string
  ): Promise<StorageDownloadResult | null> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");
    validateAndParseStoragePath(storagePath, undefined, undefined, { allowStaging: true });

    const bucketMap = this.getBucketMap(bucket);
    const obj = bucketMap.get(storagePath);

    if (!obj) {
      return null;
    }

    return {
      data: new Uint8Array(obj.data),
      contentType: obj.contentType,
      sizeBytes: obj.sizeBytes,
    };
  }

  async remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");
    if (!Array.isArray(storagePaths)) {
      throw new StorageSecurityError("storage_paths_must_be_array");
    }

    const bucketMap = this.getBucketMap(bucket);

    for (const path of storagePaths) {
      validateAndParseStoragePath(path, undefined, undefined, { allowStaging: true });
      bucketMap.delete(path);
    }
  }

  async getObjectInfo(
    bucket: string,
    storagePath: string
  ): Promise<StorageObjectMetadata | null> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");
    validateAndParseStoragePath(storagePath, undefined, undefined, { allowStaging: true });

    const bucketMap = this.getBucketMap(bucket);
    const obj = bucketMap.get(storagePath);

    if (!obj) {
      return null;
    }

    return {
      storagePath,
      sizeBytes: obj.sizeBytes,
      contentType: obj.contentType,
      eTag: obj.eTag,
      lastModified: obj.lastModified,
    };
  }

  /**
   * Operação atómica condicional de escrita (create-only via If-None-Match: *)
   */
  public putObjectConditional(
    bucket: string,
    storagePath: string,
    data: Uint8Array | Buffer,
    contentType: string,
    options: { ifNoneMatch?: string } = {}
  ): void {
    validateAndParseStoragePath(storagePath, undefined, contentType, { allowStaging: true });
    const bucketMap = this.getBucketMap(bucket);

    if (options.ifNoneMatch === "*" && bucketMap.has(storagePath)) {
      throw new StoragePreconditionFailedError("412 PreconditionFailed: destination object already exists");
    }

    const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    bucketMap.set(storagePath, {
      data: uint8,
      contentType,
      sizeBytes: uint8.length,
      lastModified: new Date(),
      eTag: `"mock-etag-${storagePath.length}-${uint8.length}"`,
    });
  }

  /**
   * Promoção atómica condicional de staging para chave final (create-only via If-None-Match: *)
   */
  public promoteObjectConditional(
    bucket: string,
    sourcePath: string,
    targetPath: string,
    options: { ifNoneMatch?: string } = {}
  ): void {
    validateAndParseStoragePath(sourcePath, undefined, undefined, { allowStaging: true });
    validateAndParseStoragePath(targetPath);

    const bucketMap = this.getBucketMap(bucket);
    const sourceObj = bucketMap.get(sourcePath);
    if (!sourceObj) {
      throw new Error(`staging_source_not_found:${sourcePath}`);
    }

    if (options.ifNoneMatch === "*" && bucketMap.has(targetPath)) {
      throw new StoragePreconditionFailedError("412 PreconditionFailed: target object already exists");
    }

    bucketMap.set(targetPath, {
      ...sourceObj,
      lastModified: new Date(),
    });
  }

  /**
   * Helper exclusivo para testes: injeta um objeto diretamente no store em memória.
   */
  public seedObject(
    bucket: string,
    storagePath: string,
    data: Uint8Array | Buffer,
    contentType: string
  ): void {
    validateAndParseStoragePath(storagePath, undefined, contentType, { allowStaging: true });
    const bucketMap = this.getBucketMap(bucket);
    const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);

    bucketMap.set(storagePath, {
      data: uint8,
      contentType,
      sizeBytes: uint8.length,
      lastModified: new Date(),
      eTag: `"mock-etag-${storagePath.length}-${uint8.length}"`,
    });
  }

  /**
   * Helper exclusivo para testes: limpa o storage completamente.
   */
  public clear(): void {
    this.store.clear();
    this.generatedUploadUrls = [];
    this.generatedDownloadUrls = [];
  }
}
