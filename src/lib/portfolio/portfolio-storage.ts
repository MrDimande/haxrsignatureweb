import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

export type PortfolioStorageProvider = "local" | "r2";
export type PortfolioAssetVisibility = "public" | "review";

type PortfolioR2StorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
};

const PORTFOLIO_PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PORTFOLIO_PUBLIC_ASSET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:avif|jpe?g|png|webp)$/;

export type UploadedPortfolioAsset = {
  url: string;
  size: number;
  fileName: string;
  provider: PortfolioStorageProvider;
};

/**
 * Detecta se as variáveis de ambiente necessárias para Cloudflare R2 estão presentes.
 */
export function getPortfolioR2StorageConfig(
  visibility: PortfolioAssetVisibility
): PortfolioR2StorageConfig | null {
  const accessKeyId = (visibility === "review"
    ? process.env.CLOUDFLARE_R2_PORTFOLIO_REVIEW_ACCESS_KEY_ID
    : process.env.CLOUDFLARE_R2_PORTFOLIO_PUBLIC_ACCESS_KEY_ID
  )?.trim();
  const secretAccessKey = (visibility === "review"
    ? process.env.CLOUDFLARE_R2_PORTFOLIO_REVIEW_SECRET_ACCESS_KEY
    : process.env.CLOUDFLARE_R2_PORTFOLIO_PUBLIC_SECRET_ACCESS_KEY
  )?.trim();
  const endpoint = process.env.CLOUDFLARE_R2_PORTFOLIO_ENDPOINT?.trim();
  const bucket = (visibility === "review"
    ? process.env.CLOUDFLARE_R2_PORTFOLIO_REVIEW_BUCKET
    : process.env.CLOUDFLARE_R2_PORTFOLIO_PUBLIC_BUCKET
  )?.trim();

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket) return null;

  return { accessKeyId, secretAccessKey, endpoint, bucket };
}

export function isR2PortfolioStorageConfigured(
  visibility: PortfolioAssetVisibility = "review"
): boolean {
  return getPortfolioR2StorageConfig(visibility) !== null;
}

export type UploadOptions = {
  projectSlug?: string;
  visibility?: PortfolioAssetVisibility;
};

export function isValidPortfolioProjectSlug(value: string): boolean {
  return PORTFOLIO_PROJECT_SLUG_PATTERN.test(value);
}

export function isValidPortfolioPublicAssetId(value: string): boolean {
  return PORTFOLIO_PUBLIC_ASSET_ID_PATTERN.test(value);
}

export function getPortfolioPublicAssetUrl(projectSlug: string, assetId: string): string {
  return `/api/portfolio/assets/${encodeURIComponent(projectSlug)}/${encodeURIComponent(assetId)}`;
}

export function getPortfolioPublicObjectKey(projectSlug: string, assetId: string): string | null {
  if (!isValidPortfolioProjectSlug(projectSlug) || !isValidPortfolioPublicAssetId(assetId)) {
    return null;
  }

  return `portfolio/public/${projectSlug}/${assetId}`;
}

/**
 * Guarda uma fotografia do portfólio no armazenamento apropriado (Local ou Cloudflare R2).
 * Em ambiente de produção na Vercel, uploads no filesystem local são estritamente bloqueados.
 */
export async function savePortfolioAsset(
  buffer: Buffer,
  originalName: string,
  _mimeType: string,
  options?: UploadOptions | string
): Promise<UploadedPortfolioAsset> {
  const projectSlug =
    typeof options === "string" ? options : options?.projectSlug || "geral";
  const visibility: PortfolioAssetVisibility =
    typeof options === "object" && options?.visibility ? options.visibility : "review";

  // Em produção na Vercel, o filesystem local é efémero: upload local é terminantemente proibido
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const r2Config = getPortfolioR2StorageConfig(visibility);

  if (isProduction && !r2Config) {
    throw new Error(
      "UPLOAD_BLOCKED_NO_PERSISTENT_STORAGE: Armazenamento persistente Cloudflare R2 não configurado. Em ambiente de produção na Vercel, o sistema de ficheiros local é efémero e não persistente. Configure as credenciais do Cloudflare R2 para activar carregamentos de fotografias."
    );
  }

  const ext = path.extname(originalName).toLowerCase() || ".webp";
  const baseName = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-");
  const safeFileName =
    visibility === "public"
      ? `${randomUUID()}${ext}`
      : `${baseName}-${Date.now()}${ext}`;

  // Se R2 estiver configurado no ambiente, fazer o upload para o bucket
  if (r2Config) {
    try {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = new S3Client({
        region: "auto",
        endpoint: r2Config.endpoint,
        credentials: {
          accessKeyId: r2Config.accessKeyId,
          secretAccessKey: r2Config.secretAccessKey,
        },
      });

      // Estratégia de armazenamento: separação por visibilidade (public vs review)
      const objectKey = `portfolio/${visibility}/${projectSlug}/${safeFileName}`;

      await client.send(
        new PutObjectCommand({
          Bucket: r2Config.bucket,
          Key: objectKey,
          Body: buffer,
          ContentType: _mimeType,
          Metadata: {
            visibility,
            projectSlug,
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      if (visibility === "review") {
        return {
          url: `/api/admin/portfolio/asset?key=${encodeURIComponent(objectKey)}`,
          size: buffer.length,
          fileName: safeFileName,
          provider: "r2",
        };
      }

      return {
        // O bucket mantém-se privado: a aplicação confirma os gates editoriais
        // antes de entregar qualquer objecto por esta rota.
        url: getPortfolioPublicAssetUrl(projectSlug, safeFileName),
        size: buffer.length,
        fileName: safeFileName,
        provider: "r2",
      };
    } catch (r2Error) {
      if (isProduction) {
        throw new Error(
          `Falha no upload para o Cloudflare R2 em produção: ${
            r2Error instanceof Error ? r2Error.message : String(r2Error)
          }`
        );
      }
      console.warn(
        "[PortfolioStorage] Falha no upload para R2 em desenvolvimento; a recorrer ao armazenamento local:",
        r2Error instanceof Error ? r2Error.message : r2Error
      );
    }
  }

  // Armazenamento local de desenvolvimento isolado por projecto e visibilidade
  const projectDirName = projectSlug.replace(/[^a-z0-9_-]/g, "-");

  if (visibility === "review") {
    // Materiais sob revisão são salvos em directório privado fora da directoria public/
    const targetDir = path.join(process.cwd(), "storage", "portfolio", "review", projectDirName);
    await mkdir(targetDir, { recursive: true });
    const filePath = path.join(targetDir, safeFileName);
    await writeFile(filePath, buffer);
    const reviewProxyUrl = `/api/admin/portfolio/asset?key=${encodeURIComponent(`storage/portfolio/review/${projectDirName}/${safeFileName}`)}`;
    return {
      url: reviewProxyUrl,
      size: buffer.length,
      fileName: safeFileName,
      provider: "local",
    };
  }

  // Apenas ficheiros explicitamente públicos são colocados na directoria estática public/
  const targetDir = path.join(
    process.cwd(),
    "public",
    "images",
    "portfolio",
    projectDirName
  );
  await mkdir(targetDir, { recursive: true });

  const filePath = path.join(targetDir, safeFileName);
  await writeFile(filePath, buffer);

  const publicUrl = `/images/portfolio/${projectDirName}/${safeFileName}`;

  return {
    url: publicUrl,
    size: buffer.length,
    fileName: safeFileName,
    provider: "local",
  };
}

/**
 * Elimina uma fotografia do armazenamento caso seja local.
 */
export async function deleteLocalPortfolioAsset(publicUrl: string): Promise<boolean> {
  if (!publicUrl.startsWith("/images/portfolio/")) {
    return false;
  }

  try {
    const relativePath = publicUrl.replace("/images/portfolio/", "");
    const absolutePath = path.join(process.cwd(), "public", "images", "portfolio", relativePath);

    if (existsSync(absolutePath)) {
      await unlink(absolutePath);
      return true;
    }
  } catch (error) {
    console.warn(
      "[PortfolioStorage] Falha ao eliminar ficheiro local:",
      error instanceof Error ? error.message : error
    );
  }
  return false;
}
