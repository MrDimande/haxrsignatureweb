/**
 * HAXR Edition Engine — Storage Provider Abstraction
 *
 * REGRA FUNDAMENTAL (Gate 3B):
 * Esta interface é estritamente provider-agnostic.
 * NÃO PODE importar @supabase/supabase-js, @aws-sdk, Cloudflare, ou qualquer SDK concreto.
 */

export class StorageSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageSecurityError";
  }
}

export class StorageNotFoundError extends Error {
  constructor(path: string) {
    super(`Objeto não encontrado no storage: ${path}`);
    this.name = "StorageNotFoundError";
  }
}

export class StoragePreconditionFailedError extends Error {
  public readonly status = 412;
  public readonly code = "PreconditionFailed";
  constructor(message = "412 PreconditionFailed: target object already exists") {
    super(message);
    this.name = "StoragePreconditionFailedError";
  }
}

export interface SignedUploadUrlOptions {
  /** MIME type validado do ficheiro (ex: image/jpeg, video/mp4) */
  contentType: string;
  /** TTL em segundos da URL assinada (default: 600s = 10 minutos) */
  expiresInSeconds?: number;
  /** Limite máximo de bytes permitido para este upload */
  maxSizeBytes?: number;
}

export interface SignedUploadUrlResult {
  /** URL pré-assinada com token/assinatura temporária (PUT) */
  uploadUrl: string;
  /** Path canónico associado ao upload: {slug}/{uuid}/original.{ext} */
  storagePath: string;
  /** Tempo de expiração em segundos */
  expiresInSeconds: number;
}

export interface SignedDownloadUrlOptions {
  /** TTL em segundos da URL assinada para visualização (default: 3600s = 1 hora) */
  expiresInSeconds?: number;
}

export interface StorageDownloadResult {
  /** Conteúdo binário descarregado em memória */
  data: Uint8Array;
  /** Content-Type detetado ou armazenado no objeto */
  contentType: string;
  /** Tamanho exato em bytes */
  sizeBytes: number;
}

export interface StorageObjectMetadata {
  storagePath: string;
  sizeBytes: number;
  contentType: string;
  eTag?: string;
  lastModified?: Date;
}

export interface StorageProvider {
  /** Identificador legível do provider concreto ('supabase' | 'r2' | 's3' | 'fake') */
  readonly providerName: string;

  /**
   * 1. Cria uma URL temporária pré-assinada para upload direto pelo cliente.
   * Obrigatoriamente privada por desenho.
   */
  createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions
  ): Promise<SignedUploadUrlResult>;

  /**
   * 2. Cria uma URL temporária pré-assinada para download/visualização segura na galeria.
   * URLs públicas estáticas são expressamente proibidas.
   */
  createSignedUrl(
    bucket: string,
    storagePath: string,
    options?: SignedDownloadUrlOptions
  ): Promise<string>;

  /**
   * 3. Descarrega o objeto binário para o servidor em memória para inspeção de segurança.
   * Retorna null se o objeto não existir.
   */
  download(
    bucket: string,
    storagePath: string
  ): Promise<StorageDownloadResult | null>;

  /**
   * 4. Remove de forma atómica e idempotente um ou mais objetos do bucket.
   */
  remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void>;

  /**
   * 5. Obtém metadados de um objeto (tamanho, MIME) sem descarregar o binário.
   */
  getObjectInfo?(
    bucket: string,
    storagePath: string
  ): Promise<StorageObjectMetadata | null>;
}
