/**
 * HAXR Edition Engine — Supabase Storage Provider Adapter
 *
 * Encapsula o cliente Supabase Storage existente atrás da interface agnóstica StorageProvider.
 * Preserva 100% o comportamento funcional atual do Edition Engine sem alterações em produção.
 */

import {
  StorageProvider,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
  SignedDownloadUrlOptions,
  StorageDownloadResult,
  StorageSecurityError,
} from "./storage-provider.types";
import {
  validateAndParseStoragePath,
  validateTtlSeconds,
} from "./canonical-path";

/**
 * Interface mínima estrutural do cliente Supabase Storage.
 * Permite injeção de dependência e desacoplamento de SDK estático.
 */
export interface SupabaseStorageBucketClient {
  createSignedUploadUrl(
    path: string,
    options?: { upsert?: boolean }
  ): Promise<{ data: { signedUrl: string; token: string; path: string } | null; error: Error | null }>;

  createSignedUrl(
    path: string,
    expiresIn: number,
    options?: { download?: boolean | string; transform?: unknown }
  ): Promise<{ data: { signedUrl: string } | null; error: Error | null }>;

  download(
    path: string
  ): Promise<{ data: Blob | null; error: Error | null }>;

  remove(
    paths: string[]
  ): Promise<{ data: unknown; error: Error | null }>;

  info?(
    path: string
  ): Promise<{ data: unknown; error: Error | null }>;
}

export interface SupabaseStorageClientLike {
  storage: {
    from(bucket: string): SupabaseStorageBucketClient;
  };
}

export class SupabaseStorageProvider implements StorageProvider {
  public readonly providerName = "supabase";

  constructor(private readonly client: SupabaseStorageClientLike) {
    if (!client || !client.storage || typeof client.storage.from !== "function") {
      throw new StorageSecurityError("invalid_supabase_storage_client_instance");
    }
  }

  async createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions
  ): Promise<SignedUploadUrlResult> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");

    // Validação estrita de segurança e formato canónico
    validateAndParseStoragePath(storagePath, undefined, options.contentType);

    const ttl = validateTtlSeconds(options.expiresInSeconds, "upload");

    const { data, error } = await this.client
      .storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      throw new Error(`supabase_storage_signed_upload_error: ${error?.message || "unknown_error"}`);
    }

    return {
      uploadUrl: data.signedUrl,
      storagePath,
      expiresInSeconds: ttl,
    };
  }

  async createSignedUrl(
    bucket: string,
    storagePath: string,
    options?: SignedDownloadUrlOptions
  ): Promise<string> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");

    validateAndParseStoragePath(storagePath);

    const ttl = validateTtlSeconds(options?.expiresInSeconds, "download");

    const { data, error } = await this.client
      .storage
      .from(bucket)
      .createSignedUrl(storagePath, ttl);

    if (error || !data?.signedUrl) {
      throw new Error(`supabase_storage_signed_url_error: ${error?.message || "unknown_error"}`);
    }

    return data.signedUrl;
  }

  async download(
    bucket: string,
    storagePath: string
  ): Promise<StorageDownloadResult | null> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");

    validateAndParseStoragePath(storagePath);

    const { data, error } = await this.client
      .storage
      .from(bucket)
      .download(storagePath);

    if (error || !data) {
      // Se não existir, retorna null de forma segura
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    return {
      data: bytes,
      contentType: data.type || "application/octet-stream",
      sizeBytes: bytes.length,
    };
  }

  async remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void> {
    if (!bucket) throw new StorageSecurityError("bucket_name_required");
    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return;
    }

    for (const path of storagePaths) {
      validateAndParseStoragePath(path);
    }

    const { error } = await this.client
      .storage
      .from(bucket)
      .remove(storagePaths);

    if (error) {
      throw new Error(`supabase_storage_remove_error: ${error.message}`);
    }
  }
}
