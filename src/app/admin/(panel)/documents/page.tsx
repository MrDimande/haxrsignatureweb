import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import DocumentsPageClient from "./DocumentsPageClient";

export default async function DocumentsPage() {
  const documents = await documentsRepo.listDocuments();
  return <DocumentsPageClient documents={documents} />;
}
