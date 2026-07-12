"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as repo from "@/lib/concierge/repositories/concierge.repository";
import { uploadAndProcessConciergeFile, reprocessConciergeUpload } from "@/lib/concierge/services/process-upload.service";
import { applyApprovedReview } from "@/lib/concierge/services/apply-review.service";
import { getConciergeSignedFileUrl } from "@/lib/concierge/services/concierge-file-url.service";
import { reviewDecisionSchema } from "@/lib/concierge/schemas";
import { isConciergeAiConfigured } from "@/lib/concierge/provider";
import {
  parseAndValidateConciergeJson,
  validateConciergeExtraction,
} from "@/lib/concierge/validate-extraction";
import type { ConciergeDocType, ConciergeReviewItem } from "@/lib/concierge/types";

export type ConciergeApplyResult = {
  message: string;
  documentType: ConciergeDocType;
};

async function approveAndApplyReview(
  review: ConciergeReviewItem,
  finalData: Record<string, unknown>
): Promise<ConciergeApplyResult> {
  const validation = validateConciergeExtraction(finalData);
  if (!validation.ok) {
    throw new Error(
      validation.errors.map((e) => `${e.path}: ${e.message}`).join(" · ")
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@haxrsignature.com";

  try {
    const applyMessage = await applyApprovedReview(review, finalData);
    await repo.updateReviewItem(review.id, {
      status: "approved",
      final_data: finalData,
      reviewed_by: adminEmail,
      reviewed_at: new Date().toISOString(),
      applied_at: new Date().toISOString(),
      apply_error: "",
    });

    await repo.logAiAudit({
      eventId: review.eventId,
      reviewId: review.id,
      action: "approve_apply",
      model: review.aiModel,
      metadata: {
        message: applyMessage,
        documentType: validation.data.documentType,
      },
    });

    return {
      message: applyMessage,
      documentType: validation.data.documentType,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao aplicar.";
    await repo.updateReviewItem(review.id, {
      status: "pending_review",
      final_data: finalData,
      apply_error: message,
    });
    throw new Error(`Falha ao aplicar: ${message}`);
  }
}

export async function getConciergeStatusAction() {
  return runAction(async () => ({
    aiConfigured: isConciergeAiConfigured(),
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  }));
}

export async function listConciergeReviewsAction(eventId: string) {
  return runAction(() => repo.listReviewItemsByEvent(eventId));
}

export async function listEventVendorsAction(eventId: string) {
  return runAction(() => repo.listEventVendors(eventId));
}

export async function uploadConciergeDocumentAction(formData: FormData) {
  const result = await runAction(async () => {
    const eventId = String(formData.get("eventId") ?? "");
    const file = formData.get("file");

    if (!eventId) throw new Error("Evento em falta.");
    if (!(file instanceof File)) throw new Error("Seleccione um ficheiro.");

    const processed = await uploadAndProcessConciergeFile({ eventId, file });
    revalidatePath(`/admin/events/${eventId}`);
    return processed;
  });

  return result;
}

export async function decideConciergeReviewAction(input: {
  reviewId: string;
  action: "approve" | "reject";
  finalDataJson?: string;
}) {
  let finalDataFromJson: Record<string, unknown> | undefined;
  if (input.finalDataJson) {
    try {
      finalDataFromJson = JSON.parse(input.finalDataJson) as Record<string, unknown>;
    } catch {
      return { success: false as const, error: "JSON inválido." };
    }
  }

  const parsed = reviewDecisionSchema.safeParse({
    reviewId: input.reviewId,
    action: input.action,
    finalData: finalDataFromJson,
  });

  if (!parsed.success) {
    return { success: false as const, error: "Dados de revisão inválidos." };
  }

  const result = await runAction(async () => {
    const review = await repo.getReviewItemById(parsed.data.reviewId);
    if (!review) throw new Error("Item de revisão não encontrado.");
    if (review.status !== "pending_review") {
      throw new Error("Este item já foi revisto.");
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@haxrsignature.com";

    if (parsed.data.action === "reject") {
      await repo.updateReviewItem(review.id, {
        status: "rejected",
        reviewed_by: adminEmail,
        reviewed_at: new Date().toISOString(),
        apply_error: "",
      });
      revalidatePath(`/admin/events/${review.eventId}`);
      return { message: "Item rejeitado." };
    }

    const finalData =
      parsed.data.finalData ??
      (review.finalData as Record<string, unknown> | null) ??
      (review.extractedData as Record<string, unknown>);

    const applyResult = await approveAndApplyReview(review, finalData);
    revalidatePath(`/admin/events/${review.eventId}`);
    return applyResult;
  });

  return result;
}

export async function retryApplyConciergeReviewAction(input: {
  reviewId: string;
  finalDataJson: string;
}) {
  const validation = parseAndValidateConciergeJson(input.finalDataJson);
  if (!validation.ok) {
    return {
      success: false as const,
      error: validation.errors.map((e) => `${e.path}: ${e.message}`).join(" · "),
    };
  }

  const result = await runAction(async () => {
    const review = await repo.getReviewItemById(input.reviewId);
    if (!review) throw new Error("Item de revisão não encontrado.");
    if (review.status !== "pending_review") {
      throw new Error("Só é possível tentar aplicar itens por rever.");
    }

    const applyResult = await approveAndApplyReview(
      review,
      validation.data as unknown as Record<string, unknown>
    );
    revalidatePath(`/admin/events/${review.eventId}`);
    return applyResult;
  });

  return result;
}

export async function reprocessConciergeUploadAction(uploadId: string) {
  const result = await runAction(async () => {
    const { reviewId, eventId } = await reprocessConciergeUpload(uploadId);
    revalidatePath(`/admin/events/${eventId}`);
    return { reviewId, message: "Documento reprocessado. Revise a nova extracção." };
  });

  return result;
}

export async function getConciergeFileUrlAction(input: {
  eventId: string;
  storagePath: string;
}) {
  return runAction(async () => {
    const url = await getConciergeSignedFileUrl(input.eventId, input.storagePath);
    return { url };
  });
}

export type ConciergeReviewList = ConciergeReviewItem[];
