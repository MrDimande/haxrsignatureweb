import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/admin/auth";
import {
  savePortfolioAsset,
  deleteLocalPortfolioAsset,
} from "@/lib/portfolio/portfolio-storage";

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  return await isValidSession(token);
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF .... WEBP
  const riff = buffer.toString("ascii", 0, 4);
  const webp = buffer.toString("ascii", 8, 12);
  if (riff === "RIFF" && webp === "WEBP") {
    return true;
  }

  // AVIF / HEIF: ....ftyp
  const ftyp = buffer.slice(4, 12).toString("ascii");
  if (ftyp.includes("ftyp")) {
    return true;
  }

  // SVG
  const start = buffer.slice(0, 100).toString("utf8").trim().toLowerCase();
  if (start.startsWith("<?xml") || start.startsWith("<svg") || start.includes("<svg")) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectSlug = (formData.get("projectSlug") as string) || "geral";
    const visibility = (formData.get("visibility") as "public" | "review") || "review";

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro fornecido." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido declarado. Apenas JPG, PNG, WebP e AVIF são permitidos." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ficheiro demasiado grande. Tamanho máximo permitido: 10MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validação profunda por magic bytes
    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: "Assinatura binária do ficheiro inválida. O conteúdo não corresponde a uma imagem autêntica." },
        { status: 400 }
      );
    }

    const asset = await savePortfolioAsset(buffer, file.name, file.type, {
      projectSlug,
      visibility,
    });

    return NextResponse.json({
      success: true,
      url: asset.url,
      fileName: asset.fileName,
      size: asset.size,
      provider: asset.provider,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar fotografia.";
    const status = msg.startsWith("UPLOAD_BLOCKED_NO_PERSISTENT_STORAGE") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
  }

  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "URL não fornecido." }, { status: 400 });
    }

    const removed = await deleteLocalPortfolioAsset(url);
    return NextResponse.json({ success: removed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao eliminar ficheiro." },
      { status: 500 }
    );
  }
}
