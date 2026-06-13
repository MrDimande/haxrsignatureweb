"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DocumentDeletePanel from "@/components/admin/DocumentDeletePanel";
import DocumentQuickPayment from "@/components/admin/finance/DocumentQuickPayment";
import InvoiceForm from "@/components/admin/InvoiceForm";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type {
  Business,
  BusinessSignature,
  Client,
  InvoiceDocument,
  ServiceCatalogItem,
} from "@/lib/admin/types";

type DocumentDetailClientProps = {
  document: InvoiceDocument;
  businesses: Business[];
  catalog: ServiceCatalogItem[];
  clients: Client[];
  signatures: BusinessSignature[];
  paymentsEnabled?: boolean;
};

export default function DocumentDetailClient({
  document,
  businesses,
  catalog,
  clients,
  signatures,
  paymentsEnabled = false,
}: DocumentDetailClientProps) {
  const router = useRouter();
  const canRegisterPayment =
    paymentsEnabled &&
    document.status === "sent" &&
    (document.documentType === "invoice" ||
      document.documentType === "proforma");

  return (
    <AdminShell
      title={document.documentNumber}
      subtitle={`${DOCUMENT_TYPE_LABELS[document.documentType]} · Editar documento`}
      actions={
        <button
          type="button"
          onClick={() => router.push("/admin/documents")}
          className="admin-btn-secondary"
        >
          ← Lista
        </button>
      }
    >
      <InvoiceForm
        documentType={document.documentType}
        businesses={businesses}
        catalog={catalog}
        clients={clients}
        signatures={signatures}
        initialDocument={document}
        onSaved={() => router.refresh()}
      />

      {canRegisterPayment ? (
        <DocumentQuickPayment document={document} />
      ) : null}

      <DocumentDeletePanel
        document={document}
        onDeleted={() => router.push("/admin/documents")}
      />
    </AdminShell>
  );
}
