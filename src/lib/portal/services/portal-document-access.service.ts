import { getPdfFilename } from "@/lib/admin/pdf-assets";
import { generateInvoicePDFBuffer } from "@/lib/admin/pdf-server";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { canClientAccessPortalDocument } from "@/lib/portal/services/portal-client-match";

export async function getPortalDocumentPdf(
  token: string,
  documentId: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) return null;

  const document = await documentsRepo.getDocumentById(documentId);
  if (!document || !canClientAccessPortalDocument(client, document)) {
    return null;
  }

  const buffer = await generateInvoicePDFBuffer(document);
  return {
    buffer,
    filename: getPdfFilename(document),
  };
}
