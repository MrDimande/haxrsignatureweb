"use client";

import { useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { downloadPdf } from "@/lib/pdf";

type PortalDocumentDownloadProps = {
  token: string;
  documentId: string;
  documentNumber: string;
};

export default function PortalDocumentDownload({
  token,
  documentId,
  documentNumber,
}: PortalDocumentDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pdfUrl = `/api/portal/${encodeURIComponent(token)}/documents/${encodeURIComponent(documentId)}/pdf`;

  async function handleDownload() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error("Não foi possível obter o PDF deste documento.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] ?? `${documentNumber}.pdf`;

      downloadPdf(blob, filename);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível descarregar o PDF."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 border border-admin-gold/30 text-admin-gold text-[10px] tracking-[0.25em] uppercase px-4 py-2.5 hover:bg-admin-gold/10 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Descarregar PDF
      </button>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-grey/55 hover:text-admin-gold transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Abrir PDF
      </a>
      {error ? (
        <p className="w-full text-xs text-red-400/80" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
