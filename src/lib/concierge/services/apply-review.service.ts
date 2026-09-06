import { getPrivateStorageProvider } from "@/lib/storage/private-storage";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import { importGuestsFromCsv } from "@/lib/events/services/import-csv.service";
import { createPayment } from "@/lib/finance/repositories/payments.repository";
import type { Currency } from "@/lib/admin/types";
import type { PaymentMethod } from "@/lib/finance/types";
import { validateConciergeExtraction } from "@/lib/concierge/validate-extraction";
import type { ConciergeExtraction } from "@/lib/concierge/schemas";
import * as repo from "@/lib/concierge/repositories/concierge.repository";
import { guestsToCsv } from "@/lib/concierge/parse-file";
import type { ConciergeReviewItem } from "@/lib/concierge/types";

function mapCurrency(raw: string | undefined): Currency {
  const upper = (raw ?? "MZN").toUpperCase();
  if (upper === "USD" || upper === "ZAR") return upper;
  return "MZN";
}

function mapPaymentMethod(raw: string): PaymentMethod {
  const lower = raw.toLowerCase();
  if (lower.includes("m-pesa") || lower.includes("mpesa")) return "mpesa";
  if (lower.includes("transfer")) return "bank_transfer";
  if (lower.includes("cash") || lower.includes("numer")) return "cash";
  return "other";
}

export async function applyApprovedReview(
  review: ConciergeReviewItem,
  finalData: Record<string, unknown>
): Promise<string> {
  const validation = validateConciergeExtraction(finalData);
  if (!validation.ok) {
    throw new Error(
      validation.errors.map((e) => `${e.path}: ${e.message}`).join(" · ")
    );
  }

  const extraction = validation.data;
  const event = await eventsRepo.getEventById(review.eventId);
  if (!event) throw new Error("Evento não encontrado.");

  switch (extraction.documentType) {
    case "vendor_proposal": {
      const v = extraction.vendorProposal;
      if (!v) throw new Error("Proposta sem dados de fornecedor.");
      await repo.insertEventVendor({
        eventId: review.eventId,
        name: v.vendorName,
        serviceCategory: v.serviceCategory,
        contactEmail: v.contactEmail ?? "",
        contactPhone: v.contactPhone ?? "",
        proposedAmount: v.amount ?? null,
        currency: v.currency ?? "MZN",
        paymentTerms: v.paymentTerms ?? "",
        deadline: v.deadline ?? null,
        notes: v.notes ?? extraction.summary,
        sourceReviewId: review.id,
      });
      return `Fornecedor «${v.vendorName}» registado.`;
    }

    case "payment_receipt": {
      const p = extraction.paymentReceipt;
      if (!p) throw new Error("Recibo sem dados de pagamento.");
      await createPayment({
        businessId: event.businessId,
        clientId: event.clientId,
        eventId: review.eventId,
        amount: p.amount,
        currency: mapCurrency(p.currency),
        paymentMethod: mapPaymentMethod(p.paymentMethod ?? ""),
        reference: p.reference ?? "",
        notes: [p.vendorOrService, p.notes, extraction.summary]
          .filter(Boolean)
          .join(" · "),
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : new Date().toISOString(),
      });
      return `Pagamento de ${p.amount} ${p.currency ?? "MZN"} registado.`;
    }

    case "guest_list": {
      const g = extraction.guestList;
      let csv = g?.csvText?.trim() ?? "";
      if (!csv && g?.guests?.length) {
        csv = guestsToCsv(g.guests);
      }
      const result = await importGuestsFromCsv(review.eventId, csv);
      return `Convidados: ${result.created} criados, ${result.updated} actualizados.`;
    }

    case "checklist": {
      const items = extraction.checklist?.items ?? [];
      await repo.insertChecklistItems(
        review.eventId,
        items.map((item) => ({
          title: item.title,
          dueDate: item.dueDate ?? null,
          priority: item.priority ?? "normal",
        })),
        review.id
      );
      return `${items.length} tarefa(s) adicionada(s) à checklist.`;
    }

    case "visual_reference": {
      const vis = extraction.visualReference;
      const storagePath = review.upload?.storagePath ?? "";
      await repo.insertMoodboardItem({
        eventId: review.eventId,
        title: vis?.title || review.upload?.fileName || "Referência visual",
        category: vis?.categories?.join(" · ") ?? "Geral",
        tags: vis?.tags ?? [],
        storagePath,
        notes: [vis?.colorPalette, vis?.notes, extraction.summary]
          .filter(Boolean)
          .join(" · "),
        sourceReviewId: review.id,
      });
      return "Referência visual adicionada ao moodboard.";
    }

    case "contract": {
      const storagePath = review.upload?.storagePath ?? "";
      const title =
        extraction.summary?.trim() ||
        review.upload?.fileName ||
        "Contrato do evento";
      await repo.insertMoodboardItem({
        eventId: review.eventId,
        title,
        category: "Contrato",
        tags: ["contrato", "arquivo"],
        storagePath,
        notes: extraction.summary || "Arquivo de contrato aprovado pela equipa.",
        sourceReviewId: review.id,
      });
      return `Contrato «${title}» arquivado no evento.`;
    }

    default:
      throw new Error(
        `Tipo «${extraction.documentType}» ainda não tem acção automática. Edite manualmente nos módulos.`
      );
  }
}

export async function downloadUploadBuffer(storagePath: string): Promise<Buffer> {
  const storage = getPrivateStorageProvider();
  return storage.downloadBuffer("concierge-uploads", storagePath);
}

export function extractionToRecord(extraction: ConciergeExtraction): Record<string, unknown> {
  return extraction as unknown as Record<string, unknown>;
}
