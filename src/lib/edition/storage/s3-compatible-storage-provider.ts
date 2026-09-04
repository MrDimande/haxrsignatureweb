/**
 * HAXR Edition Engine — S3 / Cloudflare R2 Compatible Storage Provider (Modeled Adapter)
 *
 * Modele a compatibilidade necessária para S3 / Cloudflare R2:
 * - createSignedUploadUrl -> getSignedUrl(s3, PutObjectCommand)
 * - createSignedUrl       -> getSignedUrl(s3, GetObjectCommand)
 * - download              -> s3.send(GetObjectCommand)
 * - remove                -> s3.send(DeleteObjectsCommand)
 *
 * REGRA FUNDAMENTAL (Gate 3B):
 * NÃO conecta a serviços remotos, NÃO faz chamadas de rede e NÃO embute credenciais reais.
 * Opera via cliente injetado (S3ClientLike) para permitir testes determinísticos e mockáveis.
 */

import {
  StorageProvider,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
  SignedDownloadUrlOptions,
  StorageDownloadResult,
  StorageObjectMetadata,
  StorageSecurityError,
} from "./storage-provider.types";
import {
  validateAndParseStoragePath,
  validateTtlSeconds,
} from "./canonical-path";

export interface S3CommandStructural {
  _type: string;
  Bucket: string;
  Key?: string;
  ContentType?: string;
  Delete?: {
    Objects: Array<{ Key: string }>;
    Quiet?: boolean;
  };
}

export interface S3ClientLike {
  send<T = unknown>(command: S3CommandStructural): Promise<T>;
}

export interface S3PresignerLike {
  getSignedUrl(
    client: S3ClientLike,
    command: S3CommandStructural,
    options?: { expiresIn?: number }
  ): Promise<string>;
}

export interface S3CompatibleConfig {
  endpoint?: string;
  region?: string;
  bucketName: string;
}

export class S3CompatibleStorageProvider implements StorageProvider {
  public readonly providerName = "r2-s3";

  constructor(
    private readonly s3Client: S3ClientLike,
    private readonly presigner: S3PresignerLike,
    private readonly config?: Partial<S3CompatibleConfig>
  ) {
    if (!s3Client || typeof s3Client.send !== "function") {
      throw new StorageSecurityError("invalid_s3_client_instance");
    }
    if (!presigner || typeof presigner.getSignedUrl !== "function") {
      throw new StorageSecurityError("invalid_s3_presigner_instance");
    }
  }

  async createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions
  ): Promise<SignedUploadUrlResult> {
    const targetBucket = bucket || this.config?.bucketName;
    if (!targetBucket) throw new StorageSecurityError("bucket_name_required");

    validateAndParseStoragePath(storagePath, undefined, options.contentType);
    const ttl = validateTtlSeconds(options.expiresInSeconds, "upload");

    const putCommand: S3CommandStructural = {
      _type: "PutObjectCommand",
      Bucket: targetBucket,
      Key: storagePath,
      ContentType: options.contentType,
    };

    const uploadUrl = await this.presigner.getSignedUrl(this.s3Client, putCommand, {
      expiresIn: ttl,
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
    const targetBucket = bucket || this.config?.bucketName;
    if (!targetBucket) throw new StorageSecurityError("bucket_name_required");

    validateAndParseStoragePath(storagePath);
    const ttl = validateTtlSeconds(options?.expiresInSeconds, "download");

    const getCommand: S3CommandStructural = {
      _type: "GetObjectCommand",
      Bucket: targetBucket,
      Key: storagePath,
    };

    return await this.presigner.getSignedUrl(this.s3Client, getCommand, {
      expiresIn: ttl,
    });
  }

  async download(
    bucket: string,
    storagePath: string
  ): Promise<StorageDownloadResult | null> {
    const targetBucket = bucket || this.config?.bucketName;
    if (!targetBucket) throw new StorageSecurityError("bucket_name_required");

    validateAndParseStoragePath(storagePath);

    try {
      const getCommand: S3CommandStructural = {
        _type: "GetObjectCommand",
        Bucket: targetBucket,
        Key: storagePath,
      };

      const response = await this.s3Client.send<{
        Body?: unknown;
        ContentType?: string;
      }>(getCommand);

      if (!response || !response.Body) {
        return null;
      }

      let bytes: Uint8Array;
      const body = response.Body as { transformToByteArray?: () => Promise<Uint8Array> };

      if (typeof body.transformToByteArray === "function") {
        bytes = await body.transformToByteArray();
      } else if (response.Body instanceof Uint8Array) {
        bytes = response.Body;
      } else if (Buffer.isBuffer(response.Body)) {
        bytes = new Uint8Array(response.Body);
      } else {
        throw new Error("unsupported_s3_body_stream_type");
      }

      return {
        data: bytes,
        contentType: response.ContentType || "application/octet-stream",
        sizeBytes: bytes.length,
      };
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const errorObj = err as Record<string, unknown>;
        if (
          errorObj.name === "NoSuchKey" ||
          errorObj.Code === "NoSuchKey" ||
          errorObj.status === 404
        ) {
          return null;
        }
      }
      throw err;
    }
  }

  async remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void> {
    const targetBucket = bucket || this.config?.bucketName;
    if (!targetBucket) throw new StorageSecurityError("bucket_name_required");
    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return;
    }

    for (const path of storagePaths) {
      validateAndParseStoragePath(path);
    }

    const deleteCommand: S3CommandStructural = {
      _type: "DeleteObjectsCommand",
      Bucket: targetBucket,
      Delete: {
        Objects: storagePaths.map((Key) => ({ Key })),
        Quiet: true,
      },
    };

    await this.s3Client.send(deleteCommand);
  }

  async getObjectInfo(
    bucket: string,
    storagePath: string
  ): Promise<StorageObjectMetadata | null> {
    const targetBucket = bucket || this.config?.bucketName;
    if (!targetBucket) throw new StorageSecurityError("bucket_name_required");

    validateAndParseStoragePath(storagePath);

    try {
      const headCommand: S3CommandStructural = {
        _type: "HeadObjectCommand",
        Bucket: targetBucket,
        Key: storagePath,
      };

      const response = await this.s3Client.send<{
        ContentLength?: number;
        ContentType?: string;
        ETag?: string;
        LastModified?: Date;
      }>(headCommand);

      if (!response) {
        return null;
      }

      return {
        storagePath,
        sizeBytes: response.ContentLength ?? 0,
        contentType: response.ContentType || "application/octet-stream",
        eTag: response.ETag?.replace(/"/g, ""),
        lastModified: response.LastModified,
      };
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const errorObj = err as Record<string, unknown>;
        if (
          errorObj.name === "NotFound" ||
          errorObj.name === "NoSuchKey" ||
          errorObj.Code === "NotFound" ||
          errorObj.Code === "NoSuchKey" ||
          (errorObj.$metadata as Record<string, unknown>)?.httpStatusCode === 404 ||
          errorObj.status === 404
        ) {
          return null;
        }
      }
      throw err;
    }
  }
}
