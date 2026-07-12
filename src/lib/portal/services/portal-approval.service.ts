import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { convertProformaToInvoice } from "@/lib/admin/services/convert-proforma.service";
import { notifyAdminPortalApproval } from "@/lib/admin/services/portal-approval-notify.service";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import {
  onPortalProformaApproved,
} from "@/lib/portal/services/portal-timeline-progression.service";
import { canClientAccessPortalDocument } from "@/lib/portal/services/portal-client-match";
import {
  canPortalApproveDocument,
  isPortalApprovalPending,
} from "@/lib/portal/services/portal-approval-rules";

export type ApprovePortalDocumentResult =
  | {
      success: true;
      invoice?: { id: string; documentNumber: string };
    }
  | { success: false; error: string };

export async function approvePortalDocument(
  token: string,
  documentId: string
): Promise<ApprovePortalDocumentResult> {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) {
    return { success: false, error: "Link inválido." };
  }

  const document = await documentsRepo.getDocumentById(documentId);
  if (!document || !canClientAccessPortalDocument(client, document)) {
    return { success: false, error: "Documento não encontrado." };
  }

  if (!canPortalApproveDocument(document)) {
    return { success: false, error: "Este documento não pode ser aprovado." };
  }

  await documentsRepo.recordClientApproval(documentId, "approved");

  if (document.event.eventId) {
    const holdUntil = new Date();
    holdUntil.setDate(holdUntil.getDate() + 7);
    await portalPremiumRepo.setEventDateHold(
      document.event.eventId,
      holdUntil.toISOString()
    );
    await onPortalProformaApproved(document.event.eventId);
  }

  let invoice: { id: string; documentNumber: string } | undefined;
  if (document.documentType === "proforma") {
    const converted = await convertProformaToInvoice(documentId, { status: "sent" });
    invoice = {
      id: converted.id,
      documentNumber: converted.documentNumber,
    };
  }

  const refreshed = (await documentsRepo.getDocumentById(documentId)) ?? document;
  void notifyAdminPortalApproval({
    kind: "approved",
    document: refreshed,
    clientName: client.fullName,
    invoice,
  }).catch((error) => {
    console.error(
      "[portal-approval] notify admin:",
      error instanceof Error ? error.message : error
    );
  });

  return { success: true, invoice };
}

export async function requestPortalDocumentChanges(
  token: string,
  documentId: string,
  note: string
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmed = note.trim();
  if (!trimmed) {
    return { success: false, error: "Descreva as alterações pretendidas." };
  }

  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) {
    return { success: false, error: "Link inválido." };
  }

  const document = await documentsRepo.getDocumentById(documentId);
  if (!document || !canClientAccessPortalDocument(client, document)) {
    return { success: false, error: "Documento não encontrado." };
  }

  if (!isPortalApprovalPending(document)) {
    return { success: false, error: "Este documento já foi decidido." };
  }

  await documentsRepo.recordClientApproval(
    documentId,
    "changes_requested",
    trimmed
  );

  const refreshed = (await documentsRepo.getDocumentById(documentId)) ?? document;
  void notifyAdminPortalApproval({
    kind: "changes_requested",
    document: refreshed,
    clientName: client.fullName,
    note: trimmed,
  }).catch((error) => {
    console.error(
      "[portal-approval] notify admin:",
      error instanceof Error ? error.message : error
    );
  });

  return { success: true };
}
