"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteDocumentAction } from "@/lib/admin/actions/documents.actions";
import { formatCurrency } from "@/lib/calculations";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/admin/constants";
import type { InvoiceDocument } from "@/lib/admin/types";

type DocumentDeletePanelProps = {
  document: InvoiceDocument;
  onDeleted: () => void;
  onCancel?: () => void;
  compact?: boolean;
};

export default function DocumentDeletePanel({
  document,
  onDeleted,
  onCancel,
  compact = false,
}: DocumentDeletePanelProps) {
  const [confirming, setConfirming] = useState(compact);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const affectsCash =
    document.status === "paid" || document.documentType === "receipt";

  function handleCancel() {
    setConfirming(false);
    setError("");
    onCancel?.();
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      const result = await deleteDocumentAction(document.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  }

  if (!confirming) {
    return (
      <section
        className={`admin-card p-6 md:p-8 border-red-500/10 ${compact ? "" : "mt-10"}`}
      >
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-3">
          Correcção de registo
        </p>
        <p className="text-sm text-grey/60 leading-relaxed max-w-2xl">
          Se os valores ou dados deste documento foram inseridos por engano, pode
          removê-lo permanentemente do sistema. Para anulação formal sem apagar o
          historial, altere o estado para «Cancelado».
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 border border-red-500/25 text-red-300/90 font-mono text-[9px] tracking-[0.2em] uppercase hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover documento
        </button>
      </section>
    );
  }

  return (
    <section
      className={`admin-card p-6 md:p-8 border-red-500/25 bg-red-500/5 space-y-5 ${compact ? "" : "mt-10"}`}
    >
      <div className="flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-red-400/90 shrink-0 mt-0.5" />
        <div className="space-y-3 min-w-0">
          <p className="font-serif text-xl font-light text-white/90">
            Confirmar remoção
          </p>
          <p className="text-sm text-grey/70 leading-relaxed">
            O documento{" "}
            <span className="text-white/85 font-mono text-xs">
              {document.documentNumber}
            </span>{" "}
            ({DOCUMENT_TYPE_LABELS[document.documentType]}) será eliminado de forma
            permanente, incluindo linhas e totais associados.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="border border-grey-dark/60 px-3 py-2.5">
              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/45 mb-1">
                Cliente
              </p>
              <p className="text-sm text-white/80 truncate">
                {document.clientName || "—"}
              </p>
            </div>
            <div className="border border-grey-dark/60 px-3 py-2.5">
              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/45 mb-1">
                Total
              </p>
              <p className="text-sm text-white/80 font-serif">
                {formatCurrency(
                  document.totals.grandTotal,
                  document.totals.currency
                )}
              </p>
            </div>
            <div className="border border-grey-dark/60 px-3 py-2.5">
              <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/45 mb-1">
                Estado
              </p>
              <p className="text-sm text-white/80">
                {DOCUMENT_STATUS_LABELS[document.status]}
              </p>
            </div>
          </div>

          {affectsCash ? (
            <p className="text-xs text-amber-200/75 leading-relaxed border-l border-amber-500/40 pl-3 italic">
              Este documento afecta a caixa — a remoção actualiza automaticamente
              os totais recebidos e pendências no dashboard.
            </p>
          ) : null}

          <p className="text-xs text-grey/45 italic">
            Esta acção não pode ser desfeita.
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-300/90 border border-red-500/20 px-4 py-3">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600/90 hover:bg-red-600 text-white font-mono text-[9px] tracking-[0.2em] uppercase transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isPending ? "A remover…" : "Remover permanentemente"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="admin-btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
