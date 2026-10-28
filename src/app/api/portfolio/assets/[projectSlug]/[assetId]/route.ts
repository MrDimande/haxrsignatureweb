import { NextResponse } from "next/server";
import { getPortfolioProject } from "@/lib/portfolio/service";
import { getPortfolioR2StorageConfig } from "@/lib/portfolio/portfolio-storage";
import { resolvePublicPortfolioAsset } from "@/lib/portfolio/portfolio-public-assets";

export const runtime = "nodejs";

const MAX_PUBLIC_ASSET_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type RouteContext = {
  params: Promise<{ projectSlug: string; assetId: string }>;
};

function notFoundResponse() {
  return new NextResponse(null, {
    status: 404,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { projectSlug, assetId } = await context.params;
  const project = await getPortfolioProject(projectSlug);
  const asset = resolvePublicPortfolioAsset(project, projectSlug, assetId);
  if (!asset) return notFoundResponse();

  const r2Config = getPortfolioR2StorageConfig("public");
  if (!r2Config) {
    return NextResponse.json(
      { error: "Armazenamento público indisponível." },
      { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });
    const object = await client.send(
      new GetObjectCommand({ Bucket: r2Config.bucket, Key: asset.objectKey })
    );

    if (!object.Body || !object.ContentType || !ALLOWED_IMAGE_TYPES.has(object.ContentType)) {
      return notFoundResponse();
    }
    if (object.ContentLength !== undefined && object.ContentLength > MAX_PUBLIC_ASSET_BYTES) {
      return new NextResponse(null, { status: 413, headers: { "Cache-Control": "private, no-store, max-age=0" } });
    }

    const body = await object.Body.transformToByteArray();
    if (body.byteLength > MAX_PUBLIC_ASSET_BYTES) {
      return new NextResponse(null, { status: 413, headers: { "Cache-Control": "private, no-store, max-age=0" } });
    }
    const responseBody = new Uint8Array(body.byteLength);
    responseBody.set(body);

    return new NextResponse(responseBody.buffer, {
      headers: {
        "Content-Type": object.ContentType,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return notFoundResponse();
  }
}
