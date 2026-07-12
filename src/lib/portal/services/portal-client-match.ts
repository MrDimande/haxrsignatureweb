import type { Client, InvoiceDocument } from "@/lib/admin/types";

export function normalizePortalClientName(value: string): string {
  return value.trim().toLowerCase();
}

export function documentBelongsToPortalClient(
  document: InvoiceDocument,
  client: Pick<Client, "id" | "fullName">
): boolean {
  if (document.clientId === client.id) return true;
  if (!document.clientId && document.clientName.trim()) {
    return (
      normalizePortalClientName(document.clientName) ===
      normalizePortalClientName(client.fullName)
    );
  }
  return false;
}

export function canClientAccessPortalDocument(
  client: Pick<Client, "id" | "fullName">,
  document: InvoiceDocument
): boolean {
  if (!documentBelongsToPortalClient(document, client)) return false;
  return document.status === "sent" || document.status === "paid";
}
