"use client";

import { useState, useMemo } from "react";
import type { BudgetModuleData } from "@/lib/event-modules/types";
import { PAYMENT_STATUS_STYLES } from "@/lib/event-modules/presentation";
import { formatCurrencyMZN } from "@/lib/formatters";
import {
  EventContextBar,
  ModuleEmptyState,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
} from "@/components/app/modules/ModuleShell";
import {
  FileSpreadsheet,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Percent,
  Search,
} from "lucide-react";
import { downloadOfficialWeddingLedger } from "@/lib/export/excel-wedding-ledger";
import type { NormalizedEventFinancialLedger } from "@/lib/finance/wedding-financial-engine";
import {
  calculateCategoryBreakdown,
  calculateExecutiveFinancialSummary,
} from "@/lib/finance/wedding-financial-engine";

export default function BudgetModuleView({ data }: { data: BudgetModuleData }) {
  const [activeTab, setActiveTab] = useState<"master" | "schedule" | "payments">("master");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  // Canonical Ledger: use direct ledger if passed by server, or synthesize fallback without demo mocks
  const canonicalLedger: NormalizedEventFinancialLedger = useMemo(() => {
    if (data.ledger) {
      return data.ledger;
    }

    // Fallback if data.ledger was not provided
    const items = data.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      category: item.category,
      vendorOrItem: item.vendorOrItem,
      initialPlanned: item.initialPlanned ?? item.plannedAmount,
      proposedAmount: item.proposedAmount ?? item.plannedAmount,
      contractedAmount: item.contractedAmount ?? (item.status === "pago" || item.status === "parcial" ? item.actualAmount : 0),
      actualAmount: item.actualAmount,
      paidAmount: item.paidAmount,
      balance: item.balance,
      variance: item.variance ?? 0,
      dueDate: item.dueDate,
      dueDateIso: item.dueDateIso,
      status: item.status,
      notes: item.notes,
      isDayOfWedding: item.isDayOfWedding,
    }));

    const summary = calculateExecutiveFinancialSummary({
      estimatedBudget: data.summary.estimated || 0,
      approvedBudget: null,
      guestCount: data.summary.guestCount || 0,
      items,
      installments: [],
      recordedPayments: data.recentPayments.map((p) => ({
        amount: p.amount,
        paidAt: p.paidAt,
        vendorOrItem: p.vendorOrItem,
      })),
    });

    const categories = calculateCategoryBreakdown(items);

    return {
      context: data.context,
      summary,
      categories,
      items,
      installments: [],
      recentPayments: data.recentPayments,
      clientNames: data.context.eventOverview.name,
      eventTitle: data.context.eventOverview.name,
      eventDateFormatted: data.context.eventOverview.date,
      eventDateIso: null,
      eventLocation: data.context.eventOverview.location || "Local por definir",
      guestCount: data.summary.guestCount || 0,
      currency: "MZN",
      currencySymbol: data.context.currency || "MT",
    };
  }, [data]);

  const { context, summary, items, installments, recentPayments, currencySymbol } = canonicalLedger;

  // Filtered Master Items
  const filteredMasterItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        item.vendorOrItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter]);

  // Export handler — directly passes the canonical ledger to ExcelJS exporter
  const handleExportWeddingLedger = async () => {
    try {
      setIsExporting(true);
      await downloadOfficialWeddingLedger(canonicalLedger);
    } catch (err) {
      console.error("Erro ao gerar Wedding Financial Book:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ModuleShell>
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <ModuleHeader
          label="Financeiro do Evento"
          title="Orçamento & Pagamentos"
          description="Gestão integral de capital, contratos formalizados, pagamentos liquidados e auditoria do Wedding Financial Book."
        />

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportWeddingLedger}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? "A Gerar Livro..." : "Descarregar Wedding Financial Book (.xlsx)"}</span>
          </button>
        </div>
      </div>

      <EventContextBar context={context} />

      {/* 4 Primary Financial Vault KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated / Approved Budget */}
        <div className="rounded-sm border border-white/10 bg-white/5 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-mono text-[8.5px] uppercase tracking-widest font-semibold">
            <span>Orçamento Inicial</span>
            <Wallet className="w-4 h-4 text-brand-gold" />
          </div>
          <p className="font-serif text-2xl font-light text-white tracking-tight">
            {summary.budgetCeiling > 0 ? formatCurrencyMZN(summary.budgetCeiling, currencySymbol) : "Por definir"}
          </p>
          <p className="font-sans text-[11px] text-zinc-400 font-light">
            Teto orçamental de referência
          </p>
        </div>

        {/* Card 2: Contracted Commitments */}
        <div className="rounded-sm border border-white/10 bg-white/5 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-mono text-[8.5px] uppercase tracking-widest font-semibold">
            <span>Compromissos Contratados</span>
            <Percent className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="font-serif text-2xl font-light text-white tracking-tight">
            {formatCurrencyMZN(summary.contractedAmount, currencySymbol)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-light">
            <span>Margem livre:</span>
            <span className="font-mono text-zinc-300 font-semibold">
              {formatCurrencyMZN(summary.uncommittedBudget, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Card 3: Paid / Disbursed */}
        <div className="rounded-sm border border-white/10 bg-white/5 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-mono text-[8.5px] uppercase tracking-widest font-semibold">
            <span>Património Liquidado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-serif text-2xl font-light text-emerald-400 tracking-tight">
            {formatCurrencyMZN(summary.paidAmount, currencySymbol)}
          </p>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${summary.paymentProgress}%` }}
            />
          </div>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className="rounded-sm border border-white/10 bg-white/5 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-mono text-[8.5px] uppercase tracking-widest font-semibold">
            <span>Saldo a Liquidar</span>
            <TrendingUp className="w-4 h-4 text-brand-gold" />
          </div>
          <p className="font-serif text-2xl font-light text-brand-gold tracking-tight">
            {formatCurrencyMZN(summary.outstandingAmount, currencySymbol)}
          </p>
          <p className="font-sans text-[11px] text-zinc-400 font-light">
            Compromissos pendentes de fecho
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 pt-2">
        {[
          { key: "master", label: "Master Budget Ledger", count: items.length },
          { key: "schedule", label: "Calendário de Pagamentos", count: installments.length },
          { key: "payments", label: "Pagamentos Registados", count: recentPayments.length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 font-mono text-[9px] uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-brand-gold text-white font-bold shadow-xs"
                : "text-zinc-400 hover:text-white bg-white/5"
            }`}
          >
            <span>{tab.label}</span>
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-black/30 text-[8px]">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Master Budget */}
      {activeTab === "master" && (
        <ModulePanel title="Master Budget & Detalhe de Contratos">
          {items.length === 0 ? (
            <ModuleEmptyState
              title="Sem linhas orçamentais registadas"
              description="Os contratos formalizados com fornecedores e faturas da assessoria aparecerão aqui automaticamente organizados."
            />
          ) : (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar fornecedor ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-sm pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-gold"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-sm text-xs py-1.5 px-3 text-zinc-300 outline-none focus:border-brand-gold cursor-pointer"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="pago">Pago</option>
                  <option value="parcial">Parcial</option>
                  <option value="pendente">Pendente</option>
                  <option value="planeado">Planeado</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                      <th className="pb-3 pr-3 font-semibold">Categoria</th>
                      <th className="pb-3 pr-3 font-semibold">Item / Fornecedor</th>
                      <th className="pb-3 pr-3 text-right font-semibold">Inicial</th>
                      <th className="pb-3 pr-3 text-right font-semibold">Contratado</th>
                      <th className="pb-3 pr-3 text-right font-semibold">Liquidado</th>
                      <th className="pb-3 pr-3 text-right font-semibold">Saldo</th>
                      <th className="pb-3 pr-3 text-center font-semibold">Estado</th>
                      <th className="pb-3 pr-3 font-semibold">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300 font-light">
                    {filteredMasterItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pr-3 text-zinc-400">{item.category}</td>
                        <td className="py-3.5 pr-3 font-medium text-white">{item.vendorOrItem}</td>
                        <td className="py-3.5 pr-3 text-right font-mono">{formatCurrencyMZN(item.initialPlanned, currencySymbol)}</td>
                        <td className="py-3.5 pr-3 text-right font-mono text-zinc-200">
                          {item.contractedAmount > 0 ? formatCurrencyMZN(item.contractedAmount, currencySymbol) : "—"}
                        </td>
                        <td className="py-3.5 pr-3 text-right font-mono text-emerald-400 font-medium">
                          {item.paidAmount > 0 ? formatCurrencyMZN(item.paidAmount, currencySymbol) : "0 MT"}
                        </td>
                        <td className="py-3.5 pr-3 text-right font-mono text-brand-gold">{formatCurrencyMZN(item.balance, currencySymbol)}</td>
                        <td className="py-3.5 pr-3 text-center">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-semibold ${
                              PAYMENT_STATUS_STYLES[item.status] || "bg-zinc-800 text-zinc-300 border-zinc-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-3 font-mono text-[11px] text-zinc-400">{item.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ModulePanel>
      )}

      {/* TAB 2: Payment Schedule */}
      {activeTab === "schedule" && (
        <ModulePanel title="Calendário & Vencimentos de Pagamentos">
          {installments.length === 0 ? (
            <ModuleEmptyState
              title="Sem parcelas calendarizadas"
              description="As parcelas acordadas nos contratos dos fornecedores serão agendadas aqui com prazos de vencimento."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                    <th className="pb-3 pr-3 font-semibold">Fornecedor / Rubrica</th>
                    <th className="pb-3 pr-3 font-semibold">Fase / Parcela</th>
                    <th className="pb-3 pr-3 text-right font-semibold">Montante</th>
                    <th className="pb-3 pr-3 font-semibold">Data Vencimento</th>
                    <th className="pb-3 pr-3 text-center font-semibold">Estado</th>
                    <th className="pb-3 pr-3 font-semibold">Método / Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300 font-light">
                  {installments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 pr-3 font-medium text-white">{inst.vendorOrItem}</td>
                      <td className="py-3.5 pr-3 text-zinc-400">{inst.installmentLabel}</td>
                      <td className="py-3.5 pr-3 text-right font-mono font-medium text-brand-gold">{formatCurrencyMZN(inst.amount, currencySymbol)}</td>
                      <td className="py-3.5 pr-3 font-mono text-zinc-400">{inst.dueDate}</td>
                      <td className="py-3.5 pr-3 text-center">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-semibold ${
                            PAYMENT_STATUS_STYLES[inst.status] || "bg-zinc-800 text-zinc-300 border-zinc-700"
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-zinc-400">{inst.method || "Transferência Bancária"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModulePanel>
      )}

      {/* TAB 3: Recent Payments */}
      {activeTab === "payments" && (
        <ModulePanel title="Histórico de Pagamentos Liquidados">
          {recentPayments.length === 0 ? (
            <ModuleEmptyState
              title="Ainda não há pagamentos registados"
              description="Quando a tesouraria HAXR ou o casal registar comprovativos para este evento, eles aparecerão aqui com valor, data e método."
            />
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-white/5 px-4 py-3.5 text-xs hover:border-brand-gold/40 transition"
                >
                  <div className="space-y-0.5">
                    <span className="font-serif text-sm font-normal text-white">{payment.vendorOrItem}</span>
                    <p className="font-mono text-[10px] text-zinc-400">
                      {payment.paidAtLabel} · {payment.method}
                      {payment.isUnallocated && " · (Não associado a contrato específico)"}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-emerald-400">
                    {formatCurrencyMZN(payment.amount, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ModulePanel>
      )}
    </ModuleShell>
  );
}
