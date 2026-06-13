"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import { formatCurrency } from "@/lib/calculations";
import type { CashAnalytics } from "@/lib/finance/types";

type OverdueAlertsPanelProps = {
  analytics: CashAnalytics;
};

export default function OverdueAlertsPanel({
  analytics,
}: OverdueAlertsPanelProps) {
  if (analytics.overdueAlerts.length === 0) {
    return (
      <section className="admin-card p-6 border-emerald-500/15 bg-emerald-500/5">
        <p className="font-serif text-lg font-light text-white/85">
          Sem facturas vencidas
        </p>
        <p className="text-sm text-grey/55 mt-2">
          Nenhum documento enviado ultrapassou o prazo de cobrança.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-card p-6 md:p-8 space-y-5 border-amber-500/20 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-300/90 shrink-0 mt-0.5" />
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-amber-300/80 mb-2">
            Alertas de cobrança
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Documentos vencidos
          </h3>
          <p className="text-sm text-grey/55 mt-2">
            Facturas e proformas enviadas com mais de 30 dias ou data de validade
            ultrapassada.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {analytics.overdueAlerts.slice(0, 8).map((alert) => (
          <li key={alert.documentId}>
            <Link
              href={`/admin/documents/${alert.documentId}`}
              className="flex flex-wrap items-center justify-between gap-3 p-3 border border-amber-500/15 hover:border-amber-500/30 transition-colors"
            >
              <div>
                <p className="text-sm text-white/85 font-mono">
                  {alert.documentNumber}
                </p>
                <p className="text-xs text-grey/50 mt-1">
                  {alert.clientName} ·{" "}
                  {DOCUMENT_TYPE_LABELS[alert.documentType]}
                </p>
              </div>
              <div className="text-right">
                <p className="font-serif text-base text-white/90">
                  {formatCurrency(alert.amount, alert.currency)}
                </p>
                <p className="text-[10px] text-amber-300/80 font-mono uppercase tracking-[0.15em] mt-1">
                  +{alert.daysOverdue} dias
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
