import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export class StorageSecurityError extends Error {
  constructor(message: string) {
    super(`[PrivateStorageSecurity] ${message}`);
    this.name = "StorageSecurityError";
  }
}

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(`[PrivateStorageConfig] ${message}`);
    this.name = "StorageConfigurationError";
  }
}

export interface PrivateStorageProvider {
  readonly providerName: "r2-s3" | "supabase";

  uploadBuffer(
    bucket: string,
    storagePath: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<{ storagePath: string; sizeBytes: number }>;

  downloadBuffer(
    bucket: string,
    storagePath: string
  ): Promise<Buffer>;

  createSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds?: number
  ): Promise<string>;

  deleteFile(
    bucket: string,
    storagePath: string
  ): Promise<void>;
}

export function assertSafeStoragePath(storagePath: string): void {
  if (!storagePath || typeof storagePath !== "string") {
    throw new StorageSecurityError("Storage path must be a non-empty string.");
  }
  const normalized = storagePath.trim();
  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.startsWith("\\") ||
    normalized.includes("\0")
  ) {
    throw new StorageSecurityError(`Path traversal or invalid characters detected in path: ${storagePath}`);
  }
}

export interface R2PrivateStorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
}

export function getR2PrivateStorageConfig(): R2PrivateStorageConfig {
  const accessKeyId =
    process.env.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();

  const secretAccessKey =
    process.env.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();

  const endpoint =
    process.env.CLOUDFLARE_R2_PRIVATE_ENDPOINT?.trim() ||
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim();

  const bucketName =
    process.env.CLOUDFLARE_R2_PRIVATE_BUCKET?.trim() ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() ||
    "haxr-private-uploads";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new StorageConfigurationError(
      "Cloudflare R2 private credentials are not configured. Set CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID, CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY and CLOUDFLARE_R2_PRIVATE_ENDPOINT."
    );
  }

  return { accessKeyId, secretAccessKey, endpoint, bucketName };
}

export class R2PrivateStorageProvider implements PrivateStorageProvider {
  readonly providerName = "r2-s3" as const;
  private s3Client: S3Client | null = null;
  private config: R2PrivateStorageConfig | null = null;

  constructor(customConfig?: R2PrivateStorageConfig, customS3Client?: S3Client) {
    if (customConfig) this.config = customConfig;
    if (customS3Client) this.s3Client = customS3Client;
  }

  private getClientAndConfig(): { client: S3Client; config: R2PrivateStorageConfig } {
    if (!this.config) {
      this.config = getR2PrivateStorageConfig();
    }
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });
    }
    return { client: this.s3Client, config: this.config };
  }

  private resolveR2Key(bucket: string, storagePath: string): { r2Bucket: string; r2Key: string } {
    assertSafeStoragePath(storagePath);
    const { config } = this.getClientAndConfig();
    // Default R2 bucket name
    const r2Bucket = config.bucketName;
    // Retain clean path or namespace with bucket prefix if needed
    // In our architecture, storage paths are already namespaced e.g. "events/...", "portal-proofs/..."
    const r2Key = storagePath;
    return { r2Bucket, r2Key };
  }

  async uploadBuffer(
    bucket: string,
    storagePath: string,
    buffer: Buffer,
    contentType = "application/octet-stream"
  ): Promise<{ storagePath: string; sizeBytes: number }> {
    const { client } = this.getClientAndConfig();
    const { r2Bucket, r2Key } = this.resolveR2Key(bucket, storagePath);

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);
    return { storagePath, sizeBytes: buffer.length };
  }

  async downloadBuffer(bucket: string, storagePath: string): Promise<Buffer> {
    const { client } = this.getClientAndConfig();
    const { r2Bucket, r2Key } = this.resolveR2Key(bucket, storagePath);

    const command = new GetObjectCommand({
      Bucket: r2Bucket,
      Key: r2Key,
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error(`[R2Storage] Empty body returned for ${storagePath}`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  async createSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds = 3600
  ): Promise<string> {
    const { client } = this.getClientAndConfig();
    const { r2Bucket, r2Key } = this.resolveR2Key(bucket, storagePath);

    const command = new GetObjectCommand({
      Bucket: r2Bucket,
      Key: r2Key,
    });

    return s3GetSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async deleteFile(bucket: string, storagePath: string): Promise<void> {
    const { client } = this.getClientAndConfig();
    const { r2Bucket, r2Key } = this.resolveR2Key(bucket, storagePath);

    const command = new DeleteObjectCommand({
      Bucket: r2Bucket,
      Key: r2Key,
    });

    await client.send(command);
  }
}

export class SupabasePrivateStorageProvider implements PrivateStorageProvider {
  readonly providerName = "supabase" as const;

  async uploadBuffer(
    bucket: string,
    storagePath: string,
    buffer: Buffer,
    contentType = "application/octet-stream"
  ): Promise<{ storagePath: string; sizeBytes: number }> {
    assertSafeStoragePath(storagePath);
    if (!isSupabaseConfigured()) {
      throw new StorageConfigurationError("Supabase is not configured.");
    }
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`[SupabaseStorage] ${error.message}`);
    }

    return { storagePath, sizeBytes: buffer.length };
  }

  async downloadBuffer(bucket: string, storagePath: string): Promise<Buffer> {
    assertSafeStoragePath(storagePath);
    if (!isSupabaseConfigured()) {
      throw new StorageConfigurationError("Supabase is not configured.");
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (error || !data) {
      throw new Error(`[SupabaseStorage] ${error?.message ?? "Falha ao descarregar ficheiro."}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async createSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds = 3600
  ): Promise<string> {
    assertSafeStoragePath(storagePath);
    if (!isSupabaseConfigured()) {
      throw new StorageConfigurationError("Supabase is not configured.");
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`[SupabaseStorage] ${error?.message ?? "Não foi possível gerar link do ficheiro."}`);
    }

    return data.signedUrl;
  }

  async deleteFile(bucket: string, storagePath: string): Promise<void> {
    assertSafeStoragePath(storagePath);
    if (!isSupabaseConfigured()) return;
    const supabase = createAdminClient();
    await supabase.storage.from(bucket).remove([storagePath]);
  }
}

let cachedProvider: PrivateStorageProvider | null = null;

export function isPrivateStorageConfigured(): boolean {
  const providerType = (process.env.HAXR_PRIVATE_STORAGE_PROVIDER || "").trim().toLowerCase();
  if (providerType === "r2-s3" || providerType === "r2") {
    try {
      getR2PrivateStorageConfig();
      return true;
    } catch {
      return false;
    }
  }
  if (providerType === "supabase") {
    return isSupabaseConfigured();
  }
  return false;
}

export function getPrivateStorageProvider(): PrivateStorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerType = (process.env.HAXR_PRIVATE_STORAGE_PROVIDER || "").trim().toLowerCase();
  if (providerType === "r2-s3" || providerType === "r2") {
    cachedProvider = new R2PrivateStorageProvider();
  } else if (providerType === "supabase") {
    cachedProvider = new SupabasePrivateStorageProvider();
  } else {
    throw new StorageConfigurationError(
      `HAXR_PRIVATE_STORAGE_PROVIDER is invalid or unset ('${providerType}'). Expected 'r2-s3' or 'supabase'.`
    );
  }

  return cachedProvider;
}

export function resetPrivateStorageProviderForTests(): void {
  cachedProvider = null;
}
