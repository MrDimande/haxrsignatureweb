/**
 * Edition Storage composition root. Production resolves exclusively to the
 * HAXR private R2 adapter; callers can still inject fake/S3 adapters in tests.
 */

import { FakeStorageProvider } from "./fake-storage-provider";
import { R2EditionStorageProvider } from "./r2-private-storage-provider";
import {
  S3CompatibleStorageProvider,
  type S3ClientLike,
  type S3PresignerLike,
} from "./s3-compatible-storage-provider";
import { StorageProvider, StorageSecurityError } from "./storage-provider.types";

export type StorageProviderType = "fake" | "r2-s3";

export interface StorageCompositionConfig {
  providerType?: StorageProviderType;
  s3Client?: S3ClientLike;
  s3Presigner?: S3PresignerLike;
  bucketName?: string;
}

let activeTestProvider: StorageProvider | null = null;
let defaultProviderInstance: StorageProvider | null = null;

export function resolveStorageProvider(
  config?: StorageCompositionConfig,
): StorageProvider {
  if (activeTestProvider) return activeTestProvider;

  const configuredProvider = process.env.HAXR_PRIVATE_STORAGE_PROVIDER?.trim().toLowerCase();
  const providerType = config?.providerType ?? (configuredProvider === "r2" ? "r2-s3" : configuredProvider || "r2-s3");

  if (providerType === "fake") return new FakeStorageProvider();
  if (providerType !== "r2-s3") {
    throw new StorageSecurityError(`unsupported_storage_provider_type:${providerType}`);
  }

  // An explicit injected S3 pair is only a test seam; production reads the
  // private R2 credentials through R2EditionStorageProvider.
  if (config?.s3Client || config?.s3Presigner) {
    if (!config.s3Client || !config.s3Presigner) {
      throw new StorageSecurityError("r2_s3_storage_provider_requires_s3_client_and_presigner");
    }
    return new S3CompatibleStorageProvider(config.s3Client, config.s3Presigner, {
      bucketName: config.bucketName,
    });
  }

  if (!defaultProviderInstance) {
    defaultProviderInstance = new R2EditionStorageProvider();
  }
  return defaultProviderInstance;
}

export function __setStorageProviderForTests(provider: StorageProvider | null): void {
  activeTestProvider = provider;
}

export function __resetStorageComposition(): void {
  activeTestProvider = null;
  defaultProviderInstance = null;
}
