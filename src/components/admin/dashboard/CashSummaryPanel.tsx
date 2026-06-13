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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/50">
                {label}
              </p>
              <Icon className="w-4 h-4 text-admin-gold/60" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-2xl md:text-3xl font-light text-white">
              {value}
            </p>
            <p className="text-xs text-grey/45 mt-2">{hint}</p>
          </div>
        ))}
      </div>

      {finance.recentReceipts.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/45">
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
        <div className="admin-card p-8 text-center">
          <p className="font-serif text-lg font-light text-white/80">
            Ainda sem movimentos na caixa
          </p>
          <p className="text-sm text-grey/55 mt-2 max-w-md mx-auto">
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
        <div className="admin-card p-5 border-amber-500/15 bg-amber-500/5">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-amber-300/80 mb-3">
            Pendente de recebimento
          </p>
          <ul className="space-y-2">
            {finance.pendingCollection.slice(0, 4).map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="flex items-center justify-between gap-4 text-sm hover:text-admin-gold transition-colors"
                >
                  <span className="text-white/80">
                    {doc.documentNumber} · {doc.clientName || "—"}
                  </span>
                  <span className="font-mono text-xs text-grey/60 shrink-0">
                    {DOCUMENT_TYPE_LABELS[doc.documentType]} ·{" "}
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
