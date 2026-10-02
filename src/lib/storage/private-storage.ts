import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class StorageSecurityError extends Error {
  constructor(message: string) { super(`[PrivateStorageSecurity] ${message}`); this.name = "StorageSecurityError"; }
}

export class StorageConfigurationError extends Error {
  constructor(message: string) { super(`[PrivateStorageConfig] ${message}`); this.name = "StorageConfigurationError"; }
}

export interface PrivateStorageProvider {
  readonly providerName: "r2-s3";
  uploadBuffer(bucket: string, storagePath: string, buffer: Buffer, contentType?: string): Promise<{ storagePath: string; sizeBytes: number }>;
  downloadBuffer(bucket: string, storagePath: string): Promise<Buffer>;
  downloadWithMetadata(bucket: string, storagePath: string): Promise<{ data: Buffer; contentType: string; sizeBytes: number }>;
  createSignedUploadUrl(bucket: string, storagePath: string, contentType: string, expiresInSeconds?: number): Promise<string>;
  createSignedUrl(bucket: string, storagePath: string, expiresInSeconds?: number): Promise<string>;
  getObjectInfo(bucket: string, storagePath: string): Promise<{ sizeBytes: number; contentType: string; eTag?: string; lastModified?: Date } | null>;
  deleteFile(bucket: string, storagePath: string): Promise<void>;
}

export interface R2PrivateStorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
}

export function assertSafeStoragePath(storagePath: string): void {
  if (!storagePath || typeof storagePath !== "string") throw new StorageSecurityError("Storage path must be a non-empty string.");
  const normalized = storagePath.trim();
  if (normalized.includes("..") || normalized.startsWith("/") || normalized.startsWith("\\") || normalized.includes("\0")) {
    throw new StorageSecurityError(`Path traversal or invalid characters detected in path: ${storagePath}`);
  }
}

export function getR2PrivateStorageConfig(): R2PrivateStorageConfig {
  const accessKeyId = process.env.CLOUDFLARE_R2_PRIVATE_ACCESS_KEY_ID?.trim() || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_PRIVATE_SECRET_ACCESS_KEY?.trim() || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const endpoint = process.env.CLOUDFLARE_R2_PRIVATE_ENDPOINT?.trim() || process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
  const bucketName = process.env.CLOUDFLARE_R2_PRIVATE_BUCKET?.trim() || process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "haxr-private-uploads";
  if (!accessKeyId || !secretAccessKey || !endpoint) throw new StorageConfigurationError("Cloudflare R2 private credentials are not configured.");
  return { accessKeyId, secretAccessKey, endpoint, bucketName };
}

export class R2PrivateStorageProvider implements PrivateStorageProvider {
  readonly providerName = "r2-s3" as const;
  private client: S3Client | null = null;
  private config: R2PrivateStorageConfig | null = null;

  constructor(config?: R2PrivateStorageConfig, client?: S3Client) { this.config = config ?? null; this.client = client ?? null; }

  private resolved(): { client: S3Client; config: R2PrivateStorageConfig } {
    this.config ??= getR2PrivateStorageConfig();
    this.client ??= new S3Client({ region: "auto", endpoint: this.config.endpoint, credentials: { accessKeyId: this.config.accessKeyId, secretAccessKey: this.config.secretAccessKey } });
    return { client: this.client, config: this.config };
  }

  private key(storagePath: string): { client: S3Client; bucket: string; key: string } {
    assertSafeStoragePath(storagePath);
    const { client, config } = this.resolved();
    return { client, bucket: config.bucketName, key: storagePath };
  }

  async uploadBuffer(_bucket: string, storagePath: string, buffer: Buffer, contentType = "application/octet-stream") {
    const { client, bucket, key } = this.key(storagePath);
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));
    return { storagePath, sizeBytes: buffer.length };
  }

  async downloadBuffer(_bucket: string, storagePath: string): Promise<Buffer> {
    return (await this.downloadWithMetadata(_bucket, storagePath)).data;
  }

  async downloadWithMetadata(_bucket: string, storagePath: string): Promise<{ data: Buffer; contentType: string; sizeBytes: number }> {
    const { client, bucket, key } = this.key(storagePath);
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) throw new Error("[R2Storage] Empty object response.");
    const data = Buffer.from(await response.Body.transformToByteArray());
    return {
      data,
      contentType: response.ContentType || "application/octet-stream",
      sizeBytes: data.byteLength,
    };
  }

  async createSignedUploadUrl(_bucket: string, storagePath: string, contentType: string, expiresInSeconds = 600): Promise<string> {
    const { client, bucket, key } = this.key(storagePath);
    return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: expiresInSeconds });
  }

  async createSignedUrl(_bucket: string, storagePath: string, expiresInSeconds = 600): Promise<string> {
    const { client, bucket, key } = this.key(storagePath);
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async getObjectInfo(_bucket: string, storagePath: string): Promise<{ sizeBytes: number; contentType: string; eTag?: string; lastModified?: Date } | null> {
    const { client, bucket, key } = this.key(storagePath);
    try {
      const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return {
        sizeBytes: response.ContentLength ?? 0,
        contentType: response.ContentType || "application/octet-stream",
        eTag: response.ETag,
        lastModified: response.LastModified,
      };
    } catch (error) {
      const code = error instanceof Error ? (error as { name?: string }).name : "";
      if (code === "NotFound" || code === "NoSuchKey") return null;
      throw error;
    }
  }

  async deleteFile(_bucket: string, storagePath: string): Promise<void> {
    const { client, bucket, key } = this.key(storagePath);
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}

let cachedProvider: PrivateStorageProvider | null = null;

export function isPrivateStorageConfigured(): boolean {
  if (!["r2", "r2-s3"].includes((process.env.HAXR_PRIVATE_STORAGE_PROVIDER ?? "").trim().toLowerCase())) return false;
  try { getR2PrivateStorageConfig(); return true; } catch { return false; }
}

export function getPrivateStorageProvider(): PrivateStorageProvider {
  if (cachedProvider) return cachedProvider;
  const provider = (process.env.HAXR_PRIVATE_STORAGE_PROVIDER ?? "").trim().toLowerCase();
  if (provider !== "r2" && provider !== "r2-s3") throw new StorageConfigurationError("HAXR_PRIVATE_STORAGE_PROVIDER must be r2-s3.");
  cachedProvider = new R2PrivateStorageProvider();
  return cachedProvider;
}

export function resetPrivateStorageProviderForTests(): void { cachedProvider = null; }
