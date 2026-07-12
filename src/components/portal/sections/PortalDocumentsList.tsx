import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import PortalDocumentDownload from "@/components/portal/PortalDocumentDownload";
import type { InvoiceDocument } from "@/lib/admin/types";
import { portalApprovalLabel } from "@/lib/portal/services/portal-approval-rules";

type PortalDocumentsListProps = {
  token: string;
  documents: InvoiceDocument[];
};

export default function PortalDocumentsList({
  token,
  documents,
}: PortalDocumentsListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-grey/50">Não há documentos disponíveis para consulta.</p>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <article
          key={doc.id}
          className="border border-white/10 rounded-sm p-5 bg-white/[0.02]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-admin-gold">{doc.documentNumber}</p>
              <p className="font-serif text-xl mt-1">
                {DOCUMENT_TYPE_LABELS[doc.documentType]}
              </p>
              <p className="text-sm text-grey/50 mt-2">
                {DOCUMENT_STATUS_LABELS[doc.status]} ·{" "}
                {portalApprovalLabel(doc.clientApprovalStatus)}
              </p>
            </div>
            <p className="font-serif text-2xl">
              {formatCurrency(doc.totals.grandTotal, doc.totals.currency)}
            </p>
          </div>
          <PortalDocumentDownload
            token={token}
            documentId={doc.id}
            documentNumber={doc.documentNumber}
          />
        </article>
      ))}
    </div>
  );
}
