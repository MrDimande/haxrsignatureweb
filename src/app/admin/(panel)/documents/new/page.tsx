import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as catalogRepo from "@/lib/admin/repositories/catalog.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as signaturesRepo from "@/lib/admin/repositories/signatures.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import NewDocumentPageClient from "./NewDocumentPageClient";

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function NewDocumentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const documentType =
    params.type === "invoice"
      ? "invoice"
      : params.type === "receipt"
        ? "receipt"
        : "proforma";

  const [businesses, catalog, clients, signatures, initialDocumentNumber] =
    await Promise.all([
    businessesRepo.listBusinesses(),
    catalogRepo.listCatalog(),
    clientsRepo.listClients(),
    signaturesRepo.listSignatures(),
    documentsRepo.peekDocumentNumber("haxr-signature", documentType),
  ]);

  return (
    <NewDocumentPageClient
      documentType={documentType}
      businesses={businesses}
      catalog={catalog}
      clients={clients}
      signatures={signatures}
      initialDocumentNumber={initialDocumentNumber}
    />
  );
}
