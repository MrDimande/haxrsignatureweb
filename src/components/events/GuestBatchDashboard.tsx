"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Filter,
  History,
  Info,
  User,
  XCircle,
} from "lucide-react";
import { formatDateTimePtMZ } from "@/lib/formatters";
import type { GuestImportBatch, GuestImportBatchStatus } from "@/lib/events/types";

type GuestBatchDashboardProps = {
  importBatches: GuestImportBatch[];
  activeBatchId: string;
  onSelectBatch: (batchId: string) => void;
};

function renderStatusBadge(status: GuestImportBatchStatus | string) {
  switch (status) {
    case "completed":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-[0.1em] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
          title="Importação concluída com sucesso"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>Importação concluída</span>
        </span>
      );
    case "removed":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-[0.1em] bg-rose-500/10 text-rose-300 border border-rose-500/30"
          title="Lote removido do sistema"
        >
          <XCircle className="w-3 h-3 text-rose-400 shrink-0" aria-hidden="true" />
          <span>Lote removido</span>
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-[0.1em] bg-grey-medium/10 text-grey-medium/80 border border-grey-medium/30"
          title={`Estado do lote: ${status}`}
        >
          <Info className="w-3 h-3 text-grey-medium/70 shrink-0" aria-hidden="true" />
          <span>{status || "Estado desconhecido"}</span>
        </span>
      );
  }
}

export default function GuestBatchDashboard({
  importBatches,
  activeBatchId,
  onSelectBatch,
}: GuestBatchDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedBatches = useMemo(
    () =>
      [...importBatches].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [importBatches]
  );

  const activeBatch = useMemo(
    () => importBatches.find((b) => b.id === activeBatchId),
    [importBatches, activeBatchId]
  );

  if (importBatches.length === 0) {
    return null;
  }

  return (
    <section
      className="admin-card overflow-hidden border-brand-champagne/15 bg-black-soft/90 transition-all duration-200"
      aria-label="Central de lotes de importação"
    >
      <header className="flex items-center justify-between p-4 md:p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-brand-champagne/20 bg-brand-champagne/10 text-brand-gold-light">
            <History className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-ivory">
                Lotes de Importação
              </h3>
              <span className="inline-flex items-center justify-center rounded-full bg-admin-gold/15 px-2 py-0.5 text-[10px] font-mono text-brand-gold-light">
                {importBatches.length} {importBatches.length === 1 ? "lote" : "lotes"}
              </span>
              {activeBatch ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-admin-gold border border-admin-gold/30 px-2 py-0.5 rounded bg-admin-gold/10">
                  <Filter className="w-3 h-3" />
                  Filtrado: {activeBatch.filename || activeBatch.id.slice(0, 8)}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-grey-medium/70 truncate">
              Histórico de ficheiros importados e registo de métricas no momento do upload.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="guest-batch-panel-content"
          className="inline-flex min-h-10 items-center gap-2 rounded border border-grey-dark/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.17em] text-grey-medium/70 hover:border-grey-medium/30 hover:text-brand-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-gold/80"
        >
          <span>{isOpen ? "Recolher painel" : "Ver lotes"}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </header>

      {isOpen && (
        <div id="guest-batch-panel-content" className="border-t border-brand-champagne/10 p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-[11px] text-grey-medium/60 italic">
            <Info className="w-3.5 h-3.5 shrink-0 text-grey-medium/50" />
            <span>
              As métricas representam o registo do ficheiro no momento da importação e não são alteradas por edições posteriores dos convidados.
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {sortedBatches.map((batch) => {
              const isSelected = batch.id === activeBatchId;
              return (
                <div
                  key={batch.id}
                  className={`rounded-lg border p-4 transition-all ${
                    isSelected
                      ? "border-admin-gold/60 bg-admin-gold/[0.04] shadow-md shadow-admin-gold/5"
                      : "border-brand-champagne/10 bg-black-soft/60 hover:border-brand-champagne/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet className="w-4 h-4 shrink-0 text-brand-champagne/80" />
                        <h4 className="font-medium text-sm text-brand-ivory truncate" title={batch.filename}>
                          {batch.filename || "Ficheiro sem nome"}
                        </h4>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-grey-medium/70 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-grey-medium/50" />
                          <span className="truncate max-w-[140px]" title={batch.operatorEmail}>
                            {batch.operatorEmail || "Administrador"}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{formatDateTimePtMZ(batch.createdAt)}</span>
                      </div>
                    </div>
                    {renderStatusBadge(batch.status)}
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-t border-b border-brand-champagne/10 py-2.5 my-3 text-center">
                    <div>
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-grey-medium/60">
                        Linhas
                      </span>
                      <span className="font-mono text-sm font-semibold text-brand-ivory">
                        {batch.totalRows}
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-emerald-400/70">
                        Válidas
                      </span>
                      <span className="font-mono text-sm font-semibold text-emerald-400">
                        {batch.validRows}
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-amber-400/70">
                        Duplicadas
                      </span>
                      <span className="font-mono text-sm font-semibold text-amber-400">
                        {batch.duplicateRows}
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-rose-400/70">
                        Inválidas
                      </span>
                      <span className="font-mono text-sm font-semibold text-rose-400">
                        {batch.invalidRows}
                      </span>
                    </div>
                  </div>

                  {batch.removedRows > 0 ? (
                    <div className="mb-3 flex items-center justify-between text-xs text-rose-400/90 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                      <span className="font-mono text-[10px] uppercase">Removidas pelo lote:</span>
                      <span className="font-mono font-semibold">{batch.removedRows}</span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectBatch(isSelected ? "all" : batch.id)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-gold/80 ${
                        isSelected
                          ? "bg-admin-gold text-black hover:bg-admin-gold/90 font-semibold"
                          : "border border-brand-champagne/20 bg-brand-champagne/5 text-brand-champagne hover:bg-brand-champagne/15"
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{isSelected ? "Filtro activo (clique p/ remover)" : "Ver convidados deste lote"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
