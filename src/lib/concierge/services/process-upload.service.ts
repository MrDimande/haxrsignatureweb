import { getPrivateStorageProvider } from "@/lib/storage/private-storage";
import { parseFileContent } from "@/lib/concierge/parse-file";
import { extractWithGemini, isConciergeAiConfigured } from "@/lib/concierge/provider";
import * as repo from "@/lib/concierge/repositories/concierge.repository";
import {
  downloadUploadBuffer,
  extractionToRecord,
} from "@/lib/concierge/services/apply-review.service";
import {
  CONCIERGE_BUCKET,
  CONCIERGE_MAX_FILE_BYTES,
  CONCIERGE_ALLOWED_MIME,
} from "@/lib/concierge/types";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function uploadAndProcessConciergeFile(input: {
  eventId: string;
  file: File;
}): Promise<{ uploadId: string; reviewId: string }> {
  if (!isConciergeAiConfigured()) {
    throw new Error(
      "IA não configurada. Adicione GEMINI_API_KEY ao .env.local (grátis em aistudio.google.com/apikey)."
    );
  }

  const { file, eventId } = input;
  if (!file.size) throw new Error("Ficheiro vazio.");
  if (file.size > CONCIERGE_MAX_FILE_BYTES) {
    throw new Error("Ficheiro demasiado grande (máx. 20 MB).");
  }

  const mimeType = file.type || "application/octet-stream";
  if (!CONCIERGE_ALLOWED_MIME.has(mimeType)) {
    throw new Error(`Tipo de ficheiro não suportado: ${mimeType}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = sanitizeFileName(file.name || "documento");
  const upload = await repo.createUploadRecord({
    eventId,
    fileName,
    storagePath: "",
    mimeType,
    fileSize: file.size,
  });

  const storagePath = `events/${eventId}/concierge/${upload.id}/${fileName}`;
  try {
    const storage = getPrivateStorageProvider();
    await storage.uploadBuffer(CONCIERGE_BUCKET, storagePath, buffer, mimeType);
  } catch (storageErr: unknown) {
    const message =
      storageErr instanceof Error ? storageErr.message : "Erro ao carregar ficheiro.";
    await repo.updateUpload(upload.id, {
      status: "failed",
      error_message: message,
    });
    throw new Error(`Storage: ${message}`);
  }

  await repo.updateUploadStoragePath(upload.id, storagePath);

  await repo.updateUpload(upload.id, {
    status: "processing",
    extracted_text: "",
    error_message: "",
  });

  try {
    const parsed = await parseFileContent(buffer, mimeType, fileName);
    const { extraction, raw, model } = await extractWithGemini({
      textContent: parsed.text,
      mimeType,
      fileName,
      imageBase64: parsed.imageBase64,
    });

    await repo.updateUpload(upload.id, {
      status: "pending_review",
      extracted_text: parsed.text.slice(0, 100_000),
    });

    const review = await repo.createReviewItem({
      uploadId: upload.id,
      eventId,
      documentType: extraction.documentType,
      extractedData: extractionToRecord(extraction),
      aiModel: model,
      aiRawResponse: raw,
    });

    await repo.logAiAudit({
      eventId,
      uploadId: upload.id,
      reviewId: review.id,
      action: "extract",
      model,
      metadata: {
        documentType: extraction.documentType,
        confidence: extraction.confidence,
      },
    });

    return { uploadId: upload.id, reviewId: review.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar.";
    await repo.updateUpload(upload.id, {
      status: "failed",
      error_message: message,
    });
    throw err;
  }
}

export async function reprocessConciergeUpload(
  uploadId: string
): Promise<{ reviewId: string; eventId: string }> {
  if (!isConciergeAiConfigured()) {
    throw new Error("IA não configurada. Configure GEMINI_API_KEY.");
  }

  const upload = await repo.getUploadById(uploadId);
  if (!upload) throw new Error("Upload não encontrado.");
  if (!upload.storagePath) {
    throw new Error("Caminho de storage em falta.");
  }

  await repo.updateUpload(upload.id, {
    status: "processing",
    error_message: "",
  });

  try {
    const buffer = await downloadUploadBuffer(upload.storagePath);
    const parsed = await parseFileContent(buffer, upload.mimeType, upload.fileName);
    const { extraction, raw, model } = await extractWithGemini({
      textContent: parsed.text,
      mimeType: upload.mimeType,
      fileName: upload.fileName,
      imageBase64: parsed.imageBase64,
    });

    await repo.updateUpload(upload.id, {
      status: "pending_review",
      extracted_text: parsed.text.slice(0, 100_000),
      error_message: "",
    });

    const review = await repo.createReviewItem({
      uploadId: upload.id,
      eventId: upload.eventId,
      documentType: extraction.documentType,
      extractedData: extractionToRecord(extraction),
      aiModel: model,
      aiRawResponse: raw,
    });

    await repo.logAiAudit({
      eventId: upload.eventId,
      uploadId: upload.id,
      reviewId: review.id,
      action: "reprocess_extract",
      model,
      metadata: {
        documentType: extraction.documentType,
        confidence: extraction.confidence,
      },
    });

    return { reviewId: review.id, eventId: upload.eventId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao reprocessar.";
    await repo.updateUpload(upload.id, {
      status: "failed",
      error_message: message,
    });
    throw err;
  }
}
