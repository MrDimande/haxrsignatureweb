"use client";

import { useState, useTransition } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { buildFinanceCsv, downloadCsvFile } from "@/lib/finance/export/csv";
import { downloadFinanceReportPdf } from "@/lib/finance/export/pdf";
import type { CashAnalytics } from "@/lib/finance/types";

type FinanceExportPanelProps = {
  analytics: CashAnalytics;
  selectedYear: number;
};

export default function FinanceExportPanel({
  analytics,
  selectedYear,
}: FinanceExportPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleCsv() {
    const csv = buildFinanceCsv(analytics, selectedYear);
    downloadCsvFile(csv, `haxr-financeiro-${selectedYear}.csv`);
    setMessage("CSV exportado com sucesso.");
  }

  function handlePdf() {
    startTransition(async () => {
      try {
        await downloadFinanceReportPdf(analytics, selectedYear);
        setMessage("PDF gerado com sucesso.");
      } catch {
        setMessage("Não foi possível gerar o PDF.");
      }
    });
  }

  return (
    <section className="admin-card p-6 md:p-8 space-y-5">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
          Exportação contabilística
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Relatório para contabilista
        </h3>
        <p className="text-sm text-grey/55 mt-2 leading-relaxed">
          Exporte o resumo financeiro de {selectedYear} em CSV ou PDF — inclui
          receitas, despesas, alertas e receita por evento.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleCsv} className="admin-btn-secondary">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar CSV
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={isPending}
          className="admin-btn-primary"
        >
          <Download className="w-4 h-4" />
          {isPending ? "A gerar PDF…" : "Exportar PDF"}
        </button>
      </div>

      {message ? (
        <p className="text-xs text-grey/50 italic border-l border-admin-gold/30 pl-3">
          {message}
        </p>
      ) : null}
    </section>
  );
}
