"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { getBusiness } from "@/lib/admin/businesses";
import { downloadInvoicePDF } from "@/lib/pdf";
import type { InvoiceDocument } from "@/lib/admin/types";

type DocumentRowActionsProps = {
  document: InvoiceDocument;
};

export default function DocumentRowActions({ document }: DocumentRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownloadPdf(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    setError("");
    try {
      const business = getBusiness(document.businessId);
      await downloadInvoicePDF(document, business);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível gerar o PDF."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={loading}
        className="p-2 text-grey/40 hover:text-admin-gold transition-colors disabled:opacity-50"
        aria-label={`Guardar PDF ${document.documentNumber}`}
        title="Guardar PDF"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
      {document.pdfGeneratedAt ? (
        <span className="p-2 text-emerald-400/80" title="PDF já gerado">
          <FileText className="w-4 h-4" />
        </span>
      ) : null}
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
