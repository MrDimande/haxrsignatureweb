const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_IMAGE_BYTES = 500 * 1024;

export type ParsedSignatureImage = {
  mimeType: string;
  base64: string;
  dataUrl: string;
};

export function toSignatureDataUrl(imageData: string, mimeType: string): string {
  if (imageData.startsWith("data:")) return imageData;
  return `data:${mimeType};base64,${imageData}`;
}

export function parseSignatureDataUrl(dataUrl: string): ParsedSignatureImage {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Formato de imagem inválido. Use PNG, JPG ou WebP.");
  }

  const mimeType = match[1];
  const base64 = match[2];

  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error("Tipo de ficheiro não suportado. Use PNG, JPG ou WebP.");
  }

  const byteLength = Math.ceil((base64.length * 3) / 4);
  if (byteLength > MAX_IMAGE_BYTES) {
    throw new Error("A imagem deve ter no máximo 500 KB.");
  }

  return { mimeType, base64, dataUrl };
}

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error("Tipo de ficheiro não suportado. Use PNG, JPG ou WebP.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem deve ter no máximo 500 KB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Falha ao ler a imagem."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}
