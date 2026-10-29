import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { PortfolioProject, PortfolioGalleryImage } from "./types";
import {
  getPortfolioR2StorageConfig,
  getPortfolioPublicAssetUrl,
  isValidPortfolioProjectSlug,
  isValidPortfolioPublicAssetId,
} from "./portfolio-storage";
import { recordPortfolioAudit } from "./portfolio.repository";

export const MAX_PORTFOLIO_ASSET_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_PORTFOLIO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export type PromotedAssetResult = {
  originalUrl: string;
  promotedUrl: string;
  assetId: string;
  byteLength: number;
  sha256: string;
  alreadyPromoted: boolean;
};

export type PortfolioPromotionSummary = {
  projectSlug: string;
  coverImage: PromotedAssetResult;
  gallery: PromotedAssetResult[];
  promotedCount: number;
  reusedCount: number;
};

/**
 * Extrai a chave de objecto do bucket REVIEW a partir da URL do proxy administrativo.
 * Exemplo: /api/admin/portfolio/asset?key=portfolio%2Freview%2Fslug%2Fimg.webp -> portfolio/review/slug/img.webp
 */
export function extractReviewObjectKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    if (url.startsWith("/api/admin/portfolio/asset?key=")) {
      const rawKey = url.replace("/api/admin/portfolio/asset?key=", "");
      return decodeURIComponent(rawKey);
    }

    if (url.startsWith("portfolio/review/")) {
      return url;
    }

    if (url.startsWith("storage/portfolio/review/")) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Verifica se uma URL já é uma URL pública de activo do portfólio.
 * Exemplo: /api/portfolio/assets/meu-slug/550e8400-e29b-41d4-a716-446655440000.webp
 */
export function isPortfolioPublicAssetUrl(url: string, projectSlug: string): boolean {
  if (!url.startsWith(`/api/portfolio/assets/${projectSlug}/`)) {
    return false;
  }

  const parts = url.split("/");
  const assetId = parts[parts.length - 1];
  return isValidPortfolioPublicAssetId(assetId);
}

/**
 * Lê uma imagem do bucket REVIEW com credenciais REVIEW dedicadas.
 */
async function fetchReviewAssetBuffer(
  objectKey: string,
  projectSlug: string
): Promise<{ buffer: Buffer; contentType: string }> {
  // Guardrail de segurança: o objectKey deve pertencer ao projecto ou ter prefixo review autorizado
  const normalizedKey = objectKey.replace(/\\/g, "/");
  if (
    !normalizedKey.startsWith("portfolio/review/") &&
    !normalizedKey.startsWith("storage/portfolio/review/")
  ) {
    throw new Error(
      `SECURITY_VIOLATION: Tentativa de leitura de chave fora do directório de revisão autorizado: ${objectKey}`
    );
  }

  // Isolamento estrito por tenant/projectSlug
  if (!normalizedKey.includes(`/${projectSlug}/`)) {
    throw new Error(
      `SECURITY_VIOLATION: O activo de revisão não pertence ao projecto "${projectSlug}": ${objectKey}`
    );
  }

  const reviewConfig = getPortfolioR2StorageConfig("review");

  // Caso 1: Cloudflare R2 configurado
  if (reviewConfig) {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: reviewConfig.endpoint,
      credentials: {
        accessKeyId: reviewConfig.accessKeyId,
        secretAccessKey: reviewConfig.secretAccessKey,
      },
    });

    const response = await client.send(
      new GetObjectCommand({
        Bucket: reviewConfig.bucket,
        Key: normalizedKey,
      })
    );

    if (!response.Body) {
      throw new Error(`Activo não encontrado no bucket de revisão: ${objectKey}`);
    }

    const contentType = response.ContentType || "image/webp";
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    return { buffer, contentType };
  }

  // Caso 2: Armazenamento local de desenvolvimento
  const localRelative = normalizedKey.startsWith("storage/")
    ? normalizedKey
    : path.join("storage", normalizedKey);
  const localPath = path.isAbsolute(localRelative)
    ? localRelative
    : path.join(process.cwd(), localRelative);

  if (!existsSync(localPath)) {
    throw new Error(`Ficheiro de revisão local não encontrado: ${localPath}`);
  }

  const buffer = await readFile(localPath);
  const ext = path.extname(localPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".avif": "image/avif",
  };
  const contentType = mimeMap[ext] || "image/webp";

  return { buffer, contentType };
}

/**
 * Escreve uma imagem no bucket PUBLIC com credenciais PUBLIC dedicadas.
 */
async function putPublicAssetBuffer(
  projectSlug: string,
  assetId: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const publicConfig = getPortfolioR2StorageConfig("public");
  const targetObjectKey = `portfolio/public/${projectSlug}/${assetId}`;

  // Caso 1: Cloudflare R2 configurado
  if (publicConfig) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: publicConfig.endpoint,
      credentials: {
        accessKeyId: publicConfig.accessKeyId,
        secretAccessKey: publicConfig.secretAccessKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: publicConfig.bucket,
        Key: targetObjectKey,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          promotedAt: new Date().toISOString(),
          projectSlug,
          assetId,
        },
      })
    );

    return;
  }

  // Caso 2: Armazenamento local de desenvolvimento
  const targetDir = path.join(process.cwd(), "public", "images", "portfolio", projectSlug);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, assetId), buffer);
}

/**
 * Remove um activo do bucket PUBLIC em caso de falha ou compensação distribuída.
 */
export async function deletePublicAsset(projectSlug: string, assetId: string): Promise<void> {
  const publicConfig = getPortfolioR2StorageConfig("public");
  const targetObjectKey = `portfolio/public/${projectSlug}/${assetId}`;

  if (publicConfig) {
    try {
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: "auto",
        endpoint: publicConfig.endpoint,
        credentials: {
          accessKeyId: publicConfig.accessKeyId,
          secretAccessKey: publicConfig.secretAccessKey,
        },
      });
      await client.send(
        new DeleteObjectCommand({
          Bucket: publicConfig.bucket,
          Key: targetObjectKey,
        })
      );
    } catch (e) {
      console.warn(`[PortfolioPromotion] Falha ao compensar activo público ${targetObjectKey}:`, e);
    }
    return;
  }

  // Caso 2: Armazenamento local de desenvolvimento
  const localPath = path.join(process.cwd(), "public", "images", "portfolio", projectSlug, assetId);
  if (existsSync(localPath)) {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(localPath);
    } catch (e) {
      console.warn(`[PortfolioPromotion] Falha ao compensar activo local ${localPath}:`, e);
    }
  }
}

/**
 * Executa compensação distribuída para reverter activos promovidos caso ocorra erro subsequente.
 */
export async function rollbackPromotedAssets(
  projectSlug: string,
  summary: PortfolioPromotionSummary
): Promise<void> {
  const assetsToRollback = [summary.coverImage, ...summary.gallery].filter(
    (a) => !a.alreadyPromoted && a.assetId
  );

  for (const asset of assetsToRollback) {
    await deletePublicAsset(projectSlug, asset.assetId);
  }
}

/**
 * Promove um único activo do bucket REVIEW para o bucket PUBLIC de forma idempotente e validada.
 */
async function promoteSingleAsset(
  rawUrl: string,
  projectSlug: string
): Promise<PromotedAssetResult> {
  // Se já for uma URL pública canónica válida, consideramos reutilizada (idempotência)
  if (isPortfolioPublicAssetUrl(rawUrl, projectSlug)) {
    const parts = rawUrl.split("/");
    const assetId = parts[parts.length - 1];
    return {
      originalUrl: rawUrl,
      promotedUrl: rawUrl,
      assetId,
      byteLength: 0,
      sha256: "already-promoted",
      alreadyPromoted: true,
    };
  }

  // Se for uma imagem estática incluída no bundle (/images/...) mantemos sem erro
  if (rawUrl.startsWith("/images/")) {
    return {
      originalUrl: rawUrl,
      promotedUrl: rawUrl,
      assetId: path.basename(rawUrl),
      byteLength: 0,
      sha256: "static-bundled",
      alreadyPromoted: true,
    };
  }

  // Extrair chave do bucket de revisão
  const reviewObjectKey = extractReviewObjectKeyFromUrl(rawUrl);
  if (!reviewObjectKey) {
    throw new Error(
      `INVALID_ASSET_URL: A URL fornecida não corresponde a um activo de revisão válido: ${rawUrl}`
    );
  }

  // Ler o conteúdo do bucket REVIEW com credenciais REVIEW
  const { buffer, contentType } = await fetchReviewAssetBuffer(reviewObjectKey, projectSlug);

  // Validação 1: Tamanho do ficheiro
  if (buffer.length === 0) {
    throw new Error(`ASSET_EMPTY: O activo de revisão está vazio (0 bytes): ${reviewObjectKey}`);
  }

  if (buffer.length > MAX_PORTFOLIO_ASSET_SIZE_BYTES) {
    throw new Error(
      `ASSET_TOO_LARGE: O activo excede o limite máximo de 10 MB (${buffer.length} bytes): ${reviewObjectKey}`
    );
  }

  // Validação 2: Tipo MIME
  if (!ALLOWED_PORTFOLIO_MIME_TYPES.has(contentType)) {
    throw new Error(
      `UNSUPPORTED_MIME_TYPE: Tipo de imagem não autorizado para publicação (${contentType}): ${reviewObjectKey}`
    );
  }

  // Determinar extensão segura
  const extFromKey = path.extname(reviewObjectKey).toLowerCase();
  const ext = ALLOWED_EXTENSIONS.has(extFromKey)
    ? extFromKey
    : contentType === "image/png"
    ? ".png"
    : contentType === "image/jpeg"
    ? ".jpg"
    : contentType === "image/avif"
    ? ".avif"
    : ".webp";

  // Gerar assetId canónico compatível com a rota pública: UUIDv4 + extensão
  const assetId = `${randomUUID()}${ext}`;
  if (!isValidPortfolioPublicAssetId(assetId)) {
    throw new Error(`INTERNAL_ERROR: assetId gerado inválido: ${assetId}`);
  }

  // Calcular checksum de integridade sha256
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  // Escrever no bucket PUBLIC com credenciais PUBLIC
  await putPublicAssetBuffer(projectSlug, assetId, buffer, contentType);

  const promotedUrl = getPortfolioPublicAssetUrl(projectSlug, assetId);

  return {
    originalUrl: rawUrl,
    promotedUrl,
    assetId,
    byteLength: buffer.length,
    sha256,
    alreadyPromoted: false,
  };
}

/**
 * Promove todos os activos de um projecto (capa e galeria) do bucket REVIEW para o bucket PUBLIC.
 * Exige estritamente o cumprimento dos quatro gates editoriais no servidor.
 * Retorna o projecto com todas as URLs actualizadas para a rota canónica pública.
 */
export async function promoteProjectAssetsToPublic(
  project: PortfolioProject,
  actorEmail: string = "admin@haxrsignature.com"
): Promise<{ updatedProject: PortfolioProject; summary: PortfolioPromotionSummary }> {
  if (!isValidPortfolioProjectSlug(project.slug)) {
    throw new Error(`INVALID_SLUG: O slug do projecto é inválido: ${project.slug}`);
  }

  // Verificação estrita dos Quatro Gates Editoriais no servidor
  if (
    project.editorialReviewStatus !== "approved" ||
    project.publicationAuthorized !== true ||
    project.clientConsentStatus !== "AUTHORIZED"
  ) {
    throw new Error(
      "PUBLICATION_BLOCKED: Promoção de activos rejeitada. Os quatro gates editoriais (aprovação editorial, autorização explícita e consentimento do cliente) são mandatórios."
    );
  }

  let promotedCount = 0;
  let reusedCount = 0;
  const newlyPromotedAssetIds: string[] = [];

  let coverResult: PromotedAssetResult;
  const galleryResults: PromotedAssetResult[] = [];
  const updatedGallery: PortfolioGalleryImage[] = [];

  try {
    // 1. Promover imagem de capa
    coverResult = await promoteSingleAsset(project.coverImage, project.slug);
    if (coverResult.alreadyPromoted) {
      reusedCount++;
    } else {
      newlyPromotedAssetIds.push(coverResult.assetId);
      promotedCount++;
    }

    // 2. Promover imagens da galeria
    for (const item of project.gallery) {
      const res = await promoteSingleAsset(item.src, project.slug);
      galleryResults.push(res);
      if (res.alreadyPromoted) {
        reusedCount++;
      } else {
        newlyPromotedAssetIds.push(res.assetId);
        promotedCount++;
      }

      updatedGallery.push({
        ...item,
        src: res.promotedUrl,
      });
    }
  } catch (promotionError) {
    // Mecanismo de compensação para falhas distribuídas: purgar activos já gravados neste lote
    for (const assetId of newlyPromotedAssetIds) {
      await deletePublicAsset(project.slug, assetId);
    }
    throw promotionError;
  }

  const updatedProject: PortfolioProject = {
    ...project,
    coverImage: coverResult.promotedUrl,
    gallery: updatedGallery,
  };

  const summary: PortfolioPromotionSummary = {
    projectSlug: project.slug,
    coverImage: coverResult,
    gallery: galleryResults,
    promotedCount,
    reusedCount,
  };

  // 3. Registar auditoria da promoção
  try {
    await recordPortfolioAudit({
      projectId: project.id,
      actorEmail,
      action: "publish",
      details: {
        type: "asset_promotion_review_to_public",
        promotedCount,
        reusedCount,
        assets: [coverResult, ...galleryResults].map((a) => ({
          assetId: a.assetId,
          promotedUrl: a.promotedUrl,
          byteLength: a.byteLength,
          sha256: a.sha256,
        })),
      },
    });
  } catch (auditError) {
    console.warn(
      "[PortfolioPromotion] Falha ao registar entrada de auditoria da promoção:",
      auditError instanceof Error ? auditError.message : auditError
    );
  }

  return { updatedProject, summary };
}
