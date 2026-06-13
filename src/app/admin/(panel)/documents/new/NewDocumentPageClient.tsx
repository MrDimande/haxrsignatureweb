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

type NewDocumentPageClientProps = {
  documentType: DocumentType;
  businesses: Business[];
  catalog: ServiceCatalogItem[];
  clients: Client[];
  signatures: BusinessSignature[];
  initialDocumentNumber: string;
};

export default function NewDocumentPageClient({
  documentType,
  businesses,
  catalog,
  clients,
  signatures,
  initialDocumentNumber,
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
        signatures={signatures}
        initialDocumentNumber={initialDocumentNumber}
        onDocumentTypeChange={setActiveType}
        onSaved={(doc: InvoiceDocument) => {
          router.push(`/admin/documents/${doc.id}`);
          router.refresh();
        }}
      />
    </AdminShell>
  );
}
