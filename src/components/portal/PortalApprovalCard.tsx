"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { InvoiceDocument } from "@/lib/admin/types";
import PortalDocumentDownload from "@/components/portal/PortalDocumentDownload";
import { portalApprovalLabel } from "@/lib/portal/services/portal-approval-rules";

type PortalApprovalCardProps = {
  token: string;
  document: InvoiceDocument;
};

export default function PortalApprovalCard({
  token,
  document,
}: PortalApprovalCardProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch(
        `/api/portal/${encodeURIComponent(token)}/documents/${encodeURIComponent(document.id)}/approve`,
        { method: "POST" }
      );
      const payload = (await response.json()) as {
        error?: string;
        invoice?: { documentNumber: string } | null;
      };
      if (!response.ok) {
        setError(payload.error ?? "Não foi possível aprovar.");
        return;
      }
      setMessage(
        payload.invoice?.documentNumber
          ? `Proposta aprovada. Factura ${payload.invoice.documentNumber} emitida automaticamente.`
          : "Proposta aprovada. A equipa HAXR foi notificada."
      );
      router.refresh();
    });
  }

  function handleRequestChanges() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch(
        `/api/portal/${encodeURIComponent(token)}/documents/${encodeURIComponent(document.id)}/request-changes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        }
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Não foi possível enviar o pedido.");
        return;
      }
      setMessage("Pedido de alterações enviado à equipa HAXR.");
      setNote("");
      router.refresh();
    });
  }

  return (
    <article className="border border-admin-gold/25 rounded-sm p-5 bg-admin-gold/5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-admin-gold">
            Aprovação pendente
          </p>
          <p className="font-serif text-xl mt-2">
            {DOCUMENT_TYPE_LABELS[document.documentType]} {document.documentNumber}
          </p>
          <p className="text-sm text-grey/55 mt-2">
            {portalApprovalLabel(document.clientApprovalStatus)}
          </p>
        </div>
        <p className="font-serif text-2xl">
          {formatCurrency(document.totals.grandTotal, document.totals.currency)}
        </p>
      </div>

      <PortalDocumentDownload
        token={token}
        documentId={document.id}
        documentNumber={document.documentNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 border border-emerald-500/30 text-emerald-300 text-[10px] tracking-[0.25em] uppercase px-4 py-3 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Aprovar proposta
        </button>
        <button
          type="button"
          onClick={handleRequestChanges}
          disabled={isPending || !note.trim()}
          className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/80 text-[10px] tracking-[0.25em] uppercase px-4 py-3 hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          Pedir alterações
        </button>
      </div>

      <label className="block">
        <span className="block font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45 mb-2">
          Notas para a equipa HAXR
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/85"
          placeholder="Descreva o que gostaria de ajustar na proposta."
        />
      </label>

      {message ? <p className="text-sm text-emerald-300/85">{message}</p> : null}
      {error ? <p className="text-sm text-red-400/85">{error}</p> : null}
    </article>
  );
}
