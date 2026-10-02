import {
  R2PrivateStorageProvider,
  StorageSecurityError as PrivateStorageSecurityError,
} from "@/lib/storage/private-storage";
import type {
  SignedDownloadUrlOptions,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
  StorageDownloadResult,
  StorageObjectMetadata,
  StorageProvider,
} from "./storage-provider.types";
import { StorageNotFoundError, StorageSecurityError } from "./storage-provider.types";
import { validateAndParseStoragePath, validateTtlSeconds } from "./canonical-path";

/**
 * Production Edition adapter. It deliberately reuses the sole R2 credential
 * resolver instead of accepting provider-specific credentials in this layer.
 */
export class R2EditionStorageProvider implements StorageProvider {
  readonly providerName = "r2-s3";

  constructor(private readonly storage = new R2PrivateStorageProvider()) {}

  async createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions,
  ): Promise<SignedUploadUrlResult> {
    validateAndParseStoragePath(storagePath, undefined, options.contentType);
    const expiresInSeconds = validateTtlSeconds(options.expiresInSeconds, "upload");
    return {
      uploadUrl: await this.storage.createSignedUploadUrl(
        bucket,
        storagePath,
        options.contentType,
        expiresInSeconds,
      ),
      storagePath,
      expiresInSeconds,
    };
  }

  async createSignedUrl(
    bucket: string,
    storagePath: string,
    options?: SignedDownloadUrlOptions,
  ): Promise<string> {
    validateAndParseStoragePath(storagePath);
    return this.storage.createSignedUrl(
      bucket,
      storagePath,
      validateTtlSeconds(options?.expiresInSeconds, "download"),
    );
  }

  async download(bucket: string, storagePath: string): Promise<StorageDownloadResult | null> {
    validateAndParseStoragePath(storagePath);
    try {
      return await this.storage.downloadWithMetadata(bucket, storagePath);
    } catch (error) {
      const code = error instanceof Error ? error.name : "";
      if (code === "NotFound" || code === "NoSuchKey") return null;
      throw this.normalizeError(error);
    }
  }

  async remove(bucket: string, storagePaths: string[]): Promise<void> {
    for (const storagePath of storagePaths) {
      validateAndParseStoragePath(storagePath);
      await this.storage.deleteFile(bucket, storagePath);
    }
  }

  async getObjectInfo(bucket: string, storagePath: string): Promise<StorageObjectMetadata | null> {
    validateAndParseStoragePath(storagePath);
    const object = await this.storage.getObjectInfo(bucket, storagePath);
    return object ? { storagePath, ...object } : null;
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof PrivateStorageSecurityError) {
      return new StorageSecurityError(error.message);
    }
    if (error instanceof StorageNotFoundError) return error;
    return error instanceof Error ? error : new StorageSecurityError("r2_storage_operation_failed");
  }
}
