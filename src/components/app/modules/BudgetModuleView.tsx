"use client";

import type { BudgetModuleData } from "@/lib/event-modules/types";
import { PAYMENT_STATUS_STYLES } from "@/lib/event-modules/presentation";
import { formatCurrencyMZN } from "@/lib/formatters";
import {
  EventContextBar,
  ModuleEmptyState,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";

export default function BudgetModuleView({ data }: { data: BudgetModuleData }) {
  const { summary, items, categories, recentPayments, context } = data;
  const currency = context.currency;
  const hasPayments = recentPayments.length > 0;
  const hasBudgetItems = items.length > 0;
  const hasCategories = categories.length > 0;

  return (
    <ModuleShell>
      <ModuleHeader
        label="Financeiro do Evento"
        title="Orçamento & Pagamentos"
        description="Consultar orçamento estimado, pagamentos registados e saldo pendente do evento."
      />

      <EventContextBar context={context} />

      <ModuleStatGrid
        stats={[
          { label: "Orçamento estimado", value: formatCurrencyMZN(summary.estimated, currency) },
          { label: "Valor registado", value: formatCurrencyMZN(summary.registered, currency) },
          { label: "Valor pago", value: formatCurrencyMZN(summary.paid, currency) },
          { label: "Valor pendente", value: formatCurrencyMZN(summary.pending, currency) },
          {
            label: "Último pagamento",
            value: formatCurrencyMZN(summary.nextPayment.amount, currency),
            detail: summary.nextPayment.dueDate,
          },
        ]}
      />

      {hasCategories ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-brand-champagne/10 bg-white/5 p-4"
            >
              <p className="font-serif text-sm text-white">{cat.name}</p>
              <p className="mt-2 font-mono text-[10px] text-zinc-500">
                Alocado: {formatCurrencyMZN(cat.allocated, currency)}
              </p>
              <p className="font-mono text-[10px] text-brand-gold">
                Pago: {formatCurrencyMZN(cat.paid, currency)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <ModulePanel title="Orçamento Detalhado">
        {!hasBudgetItems ? (
          <ModuleEmptyState
            title="Sem linhas de orçamento detalhadas"
            description="Nesta fase consultamos pagamentos reais e o orçamento estimado do evento. O detalhe por categoria e fornecedor será ligado numa fase seguinte."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-3">Categoria</th>
                  <th className="pb-3 pr-3">Item/Fornecedor</th>
                  <th className="pb-3 pr-3">Previsto</th>
                  <th className="pb-3 pr-3">Real</th>
                  <th className="pb-3 pr-3">Pago</th>
                  <th className="pb-3 pr-3">Saldo</th>
                  <th className="pb-3 pr-3">Estado</th>
                  <th className="pb-3 pr-3">Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-3">{item.category}</td>
                    <td className="py-3 pr-3 font-medium text-white">{item.vendorOrItem}</td>
                    <td className="py-3 pr-3">{formatCurrencyMZN(item.plannedAmount, currency)}</td>
                    <td className="py-3 pr-3">{formatCurrencyMZN(item.actualAmount, currency)}</td>
                    <td className="py-3 pr-3">{formatCurrencyMZN(item.paidAmount, currency)}</td>
                    <td className="py-3 pr-3">{formatCurrencyMZN(item.balance, currency)}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase ${PAYMENT_STATUS_STYLES[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{item.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModulePanel>

      <ModulePanel title="Pagamentos Recentes">
        {!hasPayments ? (
          <ModuleEmptyState
            title="Ainda não há pagamentos registados"
            description="Quando a equipa HAXR ou a vossa tesouraria registar pagamentos para este evento, eles aparecerão aqui com valor, data e método."
          />
        ) : (
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-xs"
              >
                <span className="font-medium text-white">{payment.vendorOrItem}</span>
                <span className="font-mono text-brand-gold">
                  {formatCurrencyMZN(payment.amount, currency)}
                </span>
                <span className="text-zinc-500">{payment.paidAtLabel}</span>
                <span className="text-zinc-500">{payment.method}</span>
              </div>
            ))}
          </div>
        )}
      </ModulePanel>
    </ModuleShell>
  );
}
