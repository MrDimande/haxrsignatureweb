import Link from "next/link";
import { ArrowUpRight, PiggyBank, Receipt, Wallet } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { FinanceOverview } from "@/lib/finance/types";
import type { InvoiceDocument } from "@/lib/admin/types";

type CashSummaryPanelProps = {
  finance: FinanceOverview;
};

export default function CashSummaryPanel({
  finance,
}: CashSummaryPanelProps) {
  const statCards = [
    {
      label: "Total recebido",
      value: formatCurrency(finance.totalReceived),
      hint: "Recibos e facturas pagos",
      icon: Wallet,
    },
    {
      label: "Este mês",
      value: formatCurrency(finance.thisMonthReceived),
      hint: `${finance.thisMonthReceiptsCount} recibo${finance.thisMonthReceiptsCount === 1 ? "" : "s"}`,
      icon: PiggyBank,
    },
    {
      label: "Por receber",
      value: formatCurrency(
        finance.pendingInvoicesAmount + finance.pendingProformasAmount
      ),
      hint: `${finance.pendingInvoicesCount} factura${finance.pendingInvoicesCount === 1 ? "" : "s"} · ${finance.sentProformasCount} proforma${finance.sentProformasCount === 1 ? "" : "s"}`,
      icon: Receipt,
    },
  ];

  const receiptColumns = [
    {
      key: "number",
      header: "Recibo",
      render: (row: InvoiceDocument) => (
        <p className="text-white font-mono text-xs">{row.documentNumber}</p>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (row: InvoiceDocument) => row.clientName || "—",
    },
    {
      key: "total",
      header: "Valor",
      className: "text-right",
      render: (row: InvoiceDocument) =>
        formatCurrency(row.totals.grandTotal, row.totals.currency),
    },
    {
      key: "status",
      header: "Estado",
      render: (row: InvoiceDocument) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
            Caixa
          </h2>
          <p className="mt-2 text-sm text-grey/55 max-w-xl">
            Contabilidade automática a partir dos recibos e facturas emitidos —
            cada documento pago entra no registo financeiro.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/cash" className="admin-btn-secondary">
            Abrir caixa
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/documents/new?type=receipt"
            className="admin-btn-primary"
          >
            Novo recibo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="admin-stat-card group relative overflow-hidden">
            {/* Elegant micro background light */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-admin-gold/5 blur-xl group-hover:bg-admin-gold/10 transition-colors duration-300" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey-medium">
                {label}
              </p>
              <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center group-hover:bg-admin-gold-dim group-hover:border-admin-gold/30 transition-all duration-300">
                <Icon className="w-4 h-4 text-admin-gold/70 group-hover:text-admin-gold transition-colors duration-300" strokeWidth={1.5} />
              </div>
            </div>

            <p className="font-serif text-2xl md:text-3xl font-light text-white tracking-wide relative z-10">
              {value}
            </p>
            <p className="text-[11px] text-grey/60 mt-3 relative z-10 font-mono tracking-wide">{hint}</p>
          </div>
        ))}
      </div>

      {finance.recentReceipts.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey-medium">
              Últimos recibos
            </h3>
            <Link
              href="/admin/cash"
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80"
            >
              Ver caixa →
            </Link>
          </div>
          <DataTable
            columns={receiptColumns}
            data={finance.recentReceipts}
            keyExtractor={(row) => row.id}
            rowHref={(row) => `/admin/documents/${row.id}`}
            emptyMessage="Sem recibos registados."
          />
        </div>
      ) : (
        <div className="admin-card p-10 text-center border border-admin-gold/15 bg-gradient-to-b from-[#12100e] to-[#080706] rounded-xl">
          <Wallet className="w-8 h-8 mx-auto text-admin-gold/60 mb-3" strokeWidth={1.25} />
          <p className="font-serif text-lg font-light text-white/80">
            Ainda sem movimentos na caixa
          </p>
          <p className="text-xs text-grey/50 mt-2 max-w-sm mx-auto">
            Emita o primeiro recibo com estado «Pago» — o valor entra
            automaticamente na contabilidade.
          </p>
          <Link
            href="/admin/documents/new?type=receipt"
            className="admin-btn-primary inline-flex mt-6"
          >
            Criar recibo
          </Link>
        </div>
      )}

      {finance.pendingCollection.length > 0 ? (
        <div className="admin-card p-6 border-amber-500/15 bg-gradient-to-b from-amber-500/[0.03] to-[#080706] rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.03)]">
          <p className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-amber-400/80 mb-4 flex items-center gap-2">
            <span>⚠️</span> Pendente de recebimento
          </p>
          <ul className="divide-y divide-white/[0.02]">
            {finance.pendingCollection.slice(0, 4).map((doc) => (
              <li key={doc.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="flex items-center justify-between gap-4 text-[13px] hover:text-admin-gold transition-colors duration-300"
                >
                  <span className="text-white/80 font-serif font-light">
                    {doc.documentNumber} · {doc.clientName || "—"}
                  </span>
                  <span className="font-mono text-[11px] text-grey-medium shrink-0 flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[9px] uppercase tracking-wide">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </span>
                    {formatCurrency(doc.totals.grandTotal, doc.totals.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
