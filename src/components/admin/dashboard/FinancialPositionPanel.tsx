import Link from "next/link";
import {
  ArrowUpRight,
  AlertTriangle,
  FileText,
  FileCheck,
  Receipt,
  Wallet,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/constants";
import type {
  AdminFinancialPosition,
  AdminMoneyBucket,
} from "@/lib/admin/services/admin-financial-position.service";

type FinancialPositionPanelProps = {
  financialPosition: AdminFinancialPosition;
};

function renderMoneyBuckets(
  buckets: AdminMoneyBucket[],
  fallback = "0 MT"
): string {
  if (!buckets || buckets.length === 0) return fallback;
  return buckets
    .map((b) => formatCurrency(b.amount, b.currency))
    .join(" · ");
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("pt-MZ", {
      day: "2-digit",
      month: "short",
      timeZone: "Africa/Maputo",
    }).format(d);
  } catch {
    return iso;
  }
}

export default function FinancialPositionPanel({
  financialPosition,
}: FinancialPositionPanelProps) {
  const { coverage, received, receivables, proposals, recentMovements } =
    financialPosition;

  const hasOverdueInvoices = receivables.overdueInvoiceCount > 0;
  const hasExpiredProformas = proposals.expiredProformaCount > 0;

  return (
    <section className="space-y-6">
      {/* Header & High-Level Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase text-admin-gold">
            Financial Position · Commercial Control
          </span>
          <h2 className="font-serif text-2xl font-light text-white mt-1">
            Posição Financeira
          </h2>
          <p className="text-xs text-grey-medium mt-1 max-w-2xl leading-relaxed">
            Recebimentos confirmados, facturas em aberto e exposição comercial da
            operação HAXR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/cash"
            className="admin-btn-secondary text-[9px] tracking-widest px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5 text-admin-gold" />
            <span>Gerir Caixa</span>
            <ArrowUpRight className="w-3 h-3 text-grey/50" />
          </Link>
          <Link
            href="/admin/documents/new?type=invoice"
            className="admin-btn-secondary text-[9px] tracking-widest px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-grey-medium" />
            <span>Nova factura</span>
          </Link>
          <Link
            href="/admin/documents/new?type=receipt"
            className="admin-btn-primary text-[9px] tracking-widest px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Novo recibo</span>
          </Link>
        </div>
      </div>

      {/* Partial Coverage Alert (Guard H & I) */}
      {(!coverage.receivedComplete || !coverage.receivablesComplete) && (
        <div className="admin-card p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.08] to-transparent rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-amber-300">
              Cobertura financeira parcial
            </p>
            <p className="text-xs text-grey-light leading-relaxed">
              {!coverage.payments
                ? "A fonte de registos de pagamento está temporariamente indisponível. Os valores de tesouraria e saldos residuais exactos foram suspensos para prevenir dados imprecisos."
                : "Foram detectados pagamentos vinculados em moeda distinta sem taxa de conversão oficial. O saldo residual exacto destas facturas foi protegido."}
            </p>
          </div>
        </div>
      )}

      {/* Unified Executive Surface */}
      <div className="admin-card p-5 sm:p-7 border border-admin-gold/20 bg-gradient-to-br from-[#12100e] to-[#080706] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-7">
        {/* Primary Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.04]">
          {/* Metric 1: Total Recebido */}
          <div className="space-y-2 pt-3 sm:pt-0 sm:first:pl-0 sm:pl-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8.5px] tracking-[0.25em] uppercase text-grey-medium opacity-80">
                Recebido Total
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
            </div>
            <div>
              {coverage.receivedComplete ? (
                <p className="font-serif text-2xl sm:text-[26px] font-light text-admin-gold truncate">
                  {renderMoneyBuckets(received.total, "0 MT")}
                </p>
              ) : (
                <p className="font-serif text-xl sm:text-2xl font-light text-grey-medium italic">
                  Indisponível
                </p>
              )}
            </div>
            <p className="text-[10px] text-grey/50 font-mono tracking-wide">
              {coverage.receivedComplete
                ? `${received.total.reduce((sum, b) => sum + b.count, 0)} movimentos confirmados`
                : "Fonte de caixa suspensa"}
            </p>
          </div>

          {/* Metric 2: Recebido Este Mês */}
          <div className="space-y-2 pt-4 sm:pt-0 sm:pl-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8.5px] tracking-[0.25em] uppercase text-grey-medium opacity-80">
                Recebido Este Mês
              </span>
              <Clock className="w-3 h-3 text-grey/40" />
            </div>
            <div>
              {coverage.receivedComplete ? (
                <p className="font-serif text-2xl sm:text-[26px] font-light text-white truncate">
                  {renderMoneyBuckets(received.thisMonth, "0 MT")}
                </p>
              ) : (
                <p className="font-serif text-xl sm:text-2xl font-light text-grey-medium italic">
                  Indisponível
                </p>
              )}
            </div>
            <p className="text-[10px] text-grey/50 font-mono tracking-wide">
              {coverage.receivedComplete
                ? "Mês corrente (Maputo)"
                : "Dados temporariamente retidos"}
            </p>
          </div>

          {/* Metric 3: Facturas em Aberto */}
          <div className="space-y-2 pt-4 sm:pt-0 sm:pl-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8.5px] tracking-[0.25em] uppercase text-grey-medium opacity-80">
                Facturas em Aberto
              </span>
              <Receipt className="w-3 h-3 text-grey/40" />
            </div>
            <div>
              {coverage.receivablesComplete ? (
                <p className="font-serif text-2xl sm:text-[26px] font-light text-white truncate">
                  {renderMoneyBuckets(receivables.openInvoices, "0 MT")}
                </p>
              ) : (
                <p className="font-serif text-xl sm:text-2xl font-light text-grey-medium italic">
                  {receivables.openInvoiceCount} doc(s)
                </p>
              )}
            </div>
            <p className="text-[10px] text-grey/50 font-mono tracking-wide">
              {coverage.receivablesComplete
                ? `${receivables.openInvoiceCount} factura(s) por liquidar`
                : "Saldo residual indisponível"}
            </p>
          </div>

          {/* Metric 4: Facturas Vencidas */}
          <div className="space-y-2 pt-4 sm:pt-0 sm:pl-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8.5px] tracking-[0.25em] uppercase text-grey-medium opacity-80">
                Facturas Vencidas
              </span>
              {hasOverdueInvoices && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[8px] uppercase tracking-wider">
                  Atraso
                </span>
              )}
            </div>
            <div>
              {coverage.receivablesComplete ? (
                <p
                  className={`font-serif text-2xl sm:text-[26px] font-light truncate ${
                    hasOverdueInvoices ? "text-amber-400" : "text-white"
                  }`}
                >
                  {renderMoneyBuckets(receivables.overdueInvoices, "0 MT")}
                </p>
              ) : (
                <p className="font-serif text-xl sm:text-2xl font-light text-grey-medium italic">
                  {receivables.overdueInvoiceCount} doc(s)
                </p>
              )}
            </div>
            <p className="text-[10px] text-grey/50 font-mono tracking-wide">
              {hasOverdueInvoices
                ? `${receivables.overdueInvoiceCount} factura(s) em atraso`
                : "Nenhum atraso detectado"}
            </p>
          </div>
        </div>

        {/* Subordinate Proposal Exposure Strip */}
        <div className="pt-4 border-t border-white/[0.04]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.015] border border-white/[0.03] p-4 rounded-lg">
            {/* Proformas Enviadas */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/60">
                  Proformas Enviadas (Propostas em Negociação)
                </span>
                <span className="text-[9px] font-mono text-grey/50">
                  {proposals.sentProformaCount} proforma(s)
                </span>
              </div>
              <p className="font-serif text-lg font-light text-white/90">
                {renderMoneyBuckets(proposals.sentProformas, "0 MT")}
              </p>
              <p className="text-[9px] text-grey/40 font-mono">
                Exposição comercial em propostas · Não constitui receita nem dívida
              </p>
            </div>

            {/* Proformas Expiradas */}
            <div className="space-y-1 sm:pl-4 sm:border-l sm:border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey/60">
                  Proformas Expiradas (Prazos Ultrapassados)
                </span>
                <span className="text-[9px] font-mono text-grey/50">
                  {proposals.expiredProformaCount} expirada(s)
                </span>
              </div>
              <p
                className={`font-serif text-lg font-light ${
                  hasExpiredProformas ? "text-grey/80" : "text-white/80"
                }`}
              >
                {renderMoneyBuckets(proposals.expiredProformas, "0 MT")}
              </p>
              <p className="text-[9px] text-grey/40 font-mono">
                Propostas ultrapassadas · Requerem seguimento comercial
              </p>
            </div>
          </div>
        </div>

        {/* Two-Lane Editorial Section: Cobrança & Movimento Recente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Lane 1: Cobrança (Facturas Vencidas) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-grey-medium flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Cobrança · Facturas Vencidas</span>
              </h3>
              {receivables.overdueItems.length > 0 && (
                <span className="font-mono text-[8.5px] text-grey/50">
                  {receivables.overdueItems.length} prioritária(s)
                </span>
              )}
            </div>

            {receivables.overdueItems.length > 0 ? (
              <div className="space-y-2.5">
                {receivables.overdueItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="admin-card p-3.5 border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition-colors rounded-lg flex items-center justify-between gap-3 group block"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-white font-medium group-hover:text-admin-gold transition-colors">
                          {item.documentNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[8px] uppercase tracking-wider shrink-0">
                          {item.daysOverdue}d em atraso
                        </span>
                      </div>
                      <p className="text-xs text-grey-light truncate">
                        {item.clientName || "Cliente"}
                        {item.eventName ? ` · ${item.eventName}` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs text-amber-300 font-medium">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      <span className="text-[9px] font-mono text-grey/50 inline-flex items-center gap-0.5 group-hover:text-admin-gold transition-colors">
                        <span>Ver</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-white/[0.04] bg-black-soft/50 rounded-lg">
                <p className="font-sans text-xs text-grey/50">
                  {!coverage.receivablesComplete
                    ? "Detalhe de cobrança suspenso por indisponibilidade de pagamentos."
                    : "Sem facturas vencidas detectadas."}
                </p>
              </div>
            )}
          </div>

          {/* Lane 2: Movimento Financeiro Recente */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-grey-medium flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-admin-gold" />
                <span>Movimento Financeiro Recente</span>
              </h3>
              <Link
                href="/admin/cash"
                className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-admin-gold hover:opacity-80 inline-flex items-center gap-1"
              >
                <span>Ver caixa</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </Link>
            </div>

            {recentMovements.length > 0 ? (
              <div className="space-y-2.5">
                {recentMovements.map((mov) => {
                  const methodLabel = mov.paymentMethod
                    ? PAYMENT_METHOD_LABELS[mov.paymentMethod]
                    : mov.occurredAtBasis === "document_issue_date"
                    ? "Emissão"
                    : null;

                  return (
                    <Link
                      key={mov.id}
                      href={mov.href}
                      className="admin-card p-3.5 border border-white/[0.04] bg-black-soft/40 hover:bg-white/[0.02] transition-colors rounded-lg flex items-center justify-between gap-3 group block"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-grey/60">
                            {formatDate(mov.occurredAt)}
                          </span>
                          {methodLabel && (
                            <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-grey-medium font-mono text-[8px] uppercase tracking-wider shrink-0">
                              {methodLabel}
                            </span>
                          )}
                          {mov.documentNumber && (
                            <span className="font-mono text-[10px] text-white/80 truncate">
                              {mov.documentNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-grey-light truncate">
                          {mov.clientName || "Cliente"}
                          {mov.eventName ? ` · ${mov.eventName}` : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs text-admin-gold font-medium">
                          +{formatCurrency(mov.amount, mov.currency)}
                        </p>
                        <span className="text-[9px] font-mono text-grey/40 inline-flex items-center gap-0.5 group-hover:text-admin-gold transition-colors">
                          <span>Abrir</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-white/[0.04] bg-black-soft/50 rounded-lg">
                <p className="font-sans text-xs text-grey/50">
                  {!coverage.payments
                    ? "Movimentos de recebimento indisponíveis neste momento."
                    : "Ainda sem movimentos financeiros registados."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
