import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import type { BusinessId } from "@/lib/admin/types";
import type { PaymentMethod } from "@/lib/finance/types";
import { registerPayment } from "@/lib/finance/services/register-payment.service";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import { onPortalDepositConfirmed } from "@/lib/portal/services/portal-timeline-progression.service";
import { getPrivateStorageProvider } from "@/lib/storage/private-storage";

export const PORTAL_PAYMENT_INSTRUCTIONS = {
  title: "Instruções de pagamento",
  methods: [
    {
      id: "transfer",
      label: "Transferência bancária",
      details: [
        "Titular: HAXR Signature Lda",
        "Banco: BCI",
        "IBAN: MZ59 0001 0000 12345678901 23",
        "Referência: número da proposta/factura",
      ],
    },
    {
      id: "mpesa",
      label: "M-Pesa",
      details: [
        "Número: +258 87 088 3428",
        "Nome: HAXR Signature",
        "Envie o comprovativo pelo portal após pagar.",
      ],
    },
    {
      id: "emola",
      label: "e-Mola",
      details: [
        "Número: +258 87 088 3428",
        "Envie o comprovativo pelo portal após pagar.",
      ],
    },
  ],
};

export async function submitPortalPaymentProof(
  token: string,
  input: {
    documentId?: string;
    eventId?: string;
    amount?: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    fileName?: string;
    mimeType?: string;
    fileBase64?: string;
  }
): Promise<{ success: true; proofId: string } | { success: false; error: string }> {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) return { success: false, error: "Link inválido." };

  if (!input.fileBase64?.trim() && !input.reference?.trim()) {
    return {
      success: false,
      error: "Envie o comprovativo ou indique a referência do pagamento.",
    };
  }

  let storagePath: string | undefined;
  if (input.fileBase64 && input.fileName) {
    try {
      const storage = getPrivateStorageProvider();
      const buffer = Buffer.from(input.fileBase64, "base64");
      const path = `portal-proofs/${client.id}/${Date.now()}-${input.fileName}`;
      await storage.uploadBuffer(
        "concierge-uploads",
        path,
        buffer,
        input.mimeType ?? "application/octet-stream"
      );
      storagePath = path;
    } catch (storageErr) {
      console.error("[PortalPayment] Falha ao armazenar comprovativo:", storageErr);
    }
  }

  const proof = await portalPremiumRepo.createPaymentProof({
    clientId: client.id,
    eventId: input.eventId ?? null,
    documentId: input.documentId ?? null,
    amount: input.amount ?? null,
    paymentMethod: input.paymentMethod ?? "transfer",
    reference: input.reference,
    notes: input.notes,
    fileName: input.fileName,
    mimeType: input.mimeType,
    storagePath,
  });

  return { success: true, proofId: proof.id };
}

export async function validatePortalPaymentProof(
  proofId: string,
  options: { approve: boolean; note?: string; businessId?: BusinessId }
): Promise<void> {
  const proof = await portalPremiumRepo.getPaymentProofById(proofId);
  if (!proof) throw new Error("Comprovativo não encontrado.");
  if (proof.status !== "pending_review") {
    throw new Error("Este comprovativo já foi revisto.");
  }

  if (!options.approve) {
    await portalPremiumRepo.updatePaymentProofStatus(proofId, "rejected", {
      note: options.note,
    });
    return;
  }

  const sourceDocument = proof.documentId
    ? await documentsRepo.getDocumentById(proof.documentId)
    : null;

  const amount =
    proof.amount ??
    sourceDocument?.totals.grandTotal ??
    0;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Indique um valor válido para validar o comprovativo.");
  }

  const businessId: BusinessId =
    options.businessId ?? sourceDocument?.businessId ?? "haxr-signature";

  const paymentMethod: PaymentMethod =
    proof.paymentMethod === "mpesa" ||
    proof.paymentMethod === "emola" ||
    proof.paymentMethod === "cash" ||
    proof.paymentMethod === "card"
      ? proof.paymentMethod
      : "bank_transfer";

  const paymentResult = await registerPayment({
    businessId,
    amount,
    currency: (proof.currency as "MZN" | "USD" | "ZAR") ?? "MZN",
    paymentMethod,
    paidAt: new Date().toISOString(),
    clientId: proof.clientId,
    clientName: sourceDocument?.clientName,
    eventId: proof.eventId ?? sourceDocument?.event.eventId ?? null,
    sourceDocumentId: proof.documentId ?? undefined,
    reference: proof.reference ?? undefined,
    notes: proof.notes ?? undefined,
    generateReceipt: true,
  });

  await portalPremiumRepo.updatePaymentProofStatus(proofId, "approved", {
    paymentId: paymentResult.payment.id,
    receiptDocumentId: paymentResult.receipt?.id,
    note: options.note,
  });

  const eventId = proof.eventId ?? sourceDocument?.event.eventId ?? null;
  if (eventId) {
    await onPortalDepositConfirmed(eventId);
  }
}
