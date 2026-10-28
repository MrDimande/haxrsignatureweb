import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import { getPortfolioR2StorageConfig } from "@/lib/portfolio/portfolio-storage";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

async function checkAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return false;
    return await isValidSession(token);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores autenticados podem aceder a materiais sob revisão." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Chave de recurso não fornecida." }, { status: 400 });
  }

  // Prevenção contra Directory Traversal
  if (key.includes("..") || path.isAbsolute(key)) {
    return NextResponse.json({ error: "Chave de recurso inválida." }, { status: 400 });
  }

  // 1. Se Cloudflare R2 estiver activo e o objecto for de R2
  if (key.startsWith("portfolio/review/")) {
    const r2Config = getPortfolioR2StorageConfig("review");
    if (!r2Config) {
      return NextResponse.json({ error: "Armazenamento privado não configurado." }, { status: 503 });
    }
    try {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const client = new S3Client({
        region: "auto",
        endpoint: r2Config.endpoint,
        credentials: {
          accessKeyId: r2Config.accessKeyId,
          secretAccessKey: r2Config.secretAccessKey,
        },
      });

      const presignedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: r2Config.bucket,
          Key: key,
        }),
        { expiresIn: 900 } // 15 minutos
      );

      return NextResponse.redirect(presignedUrl, {
        status: 302,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Falha ao aceder ao objecto privado no Cloudflare R2." },
        { status: 500 }
      );
    }
  }

  // 2. Ficheiro local de revisão em desenvolvimento (fora da directoria public/)
  if (key.startsWith("storage/portfolio/review/")) {
    const absolutePath = path.join(process.cwd(), key);
    if (!existsSync(absolutePath)) {
      return NextResponse.json({ error: "Ficheiro sob revisão não encontrado." }, { status: 404 });
    }

    try {
      const fileBuffer = await readFile(absolutePath);
      const ext = path.extname(key).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".avif") contentType = "image/avif";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return NextResponse.json({ error: "Erro ao ler ficheiro local." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Recurso não autorizado ou inexistente." }, { status: 404 });
}
