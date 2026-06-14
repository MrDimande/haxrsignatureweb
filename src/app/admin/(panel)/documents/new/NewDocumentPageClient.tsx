"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import InvoiceForm from "@/components/admin/InvoiceForm";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type {
  Business,
  Client,
  BusinessSignature,
  DocumentType,
  InvoiceDocument,
  ServiceCatalogItem,
} from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";

type NewDocumentPageClientProps = {
  documentType: DocumentType;
  businesses: Business[];
  catalog: ServiceCatalogItem[];
  clients: Client[];
  events: ManagedEvent[];
  signatures: BusinessSignature[];
  initialDocumentNumber: string;
  defaultClientId?: string | null;
  defaultEventId?: string | null;
};

export default function NewDocumentPageClient({
  documentType,
  businesses,
  catalog,
  clients,
  events,
  signatures,
  initialDocumentNumber,
  defaultClientId,
  defaultEventId,
}: NewDocumentPageClientProps) {
  const router = useRouter();
  const [activeType, setActiveType] = useState(documentType);

  return (
    <AdminShell
      title="Novo Documento"
      subtitle={DOCUMENT_TYPE_LABELS[activeType]}
    >
      <InvoiceForm
        documentType={documentType}
        businesses={businesses}
        catalog={catalog}
        clients={clients}
        events={events}
        signatures={signatures}
        initialDocumentNumber={initialDocumentNumber}
        defaultClientId={defaultClientId}
        defaultEventId={defaultEventId}
        onDocumentTypeChange={setActiveType}
        onSaved={(doc: InvoiceDocument) => {
          router.push(`/admin/documents/${doc.id}`);
          router.refresh();
        }}
      />
    </AdminShell>
  );
}
