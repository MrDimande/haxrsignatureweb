import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as catalogRepo from "@/lib/admin/repositories/catalog.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as signaturesRepo from "@/lib/admin/repositories/signatures.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import NewDocumentPageClient from "./NewDocumentPageClient";

type PageProps = {
  searchParams: Promise<{ type?: string; clientId?: string; eventId?: string }>;
};

export default async function NewDocumentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const documentType =
    params.type === "invoice"
      ? "invoice"
      : params.type === "receipt"
        ? "receipt"
        : "proforma";

  const [businesses, catalog, clients, events, signatures, initialDocumentNumber] =
    await Promise.all([
    businessesRepo.listBusinesses(),
    catalogRepo.listCatalog(),
    clientsRepo.listClients(),
    eventsRepo.listAllEvents(),
    signaturesRepo.listSignatures(),
    documentsRepo.peekDocumentNumber("haxr-signature", documentType),
  ]);

  return (
    <NewDocumentPageClient
      documentType={documentType}
      businesses={businesses}
      catalog={catalog}
      clients={clients}
      events={events}
      signatures={signatures}
      initialDocumentNumber={initialDocumentNumber}
      defaultClientId={params.clientId ?? null}
      defaultEventId={params.eventId ?? null}
    />
  );
}
