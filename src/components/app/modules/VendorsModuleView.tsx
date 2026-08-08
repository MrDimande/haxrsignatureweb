"use client";

import type { VendorModuleData } from "@/lib/event-modules/types";
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_STYLES } from "@/lib/event-modules/presentation";
import { formatCurrencyMZN } from "@/lib/formatters";
import {
  EventContextBar,
  ModuleEmptyState,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";
import VendorSuggestionsPanel from "@/components/app/modules/VendorSuggestionsPanel";

export default function VendorsModuleView({ data }: { data: VendorModuleData }) {
  const { summary, vendors, context } = data;
  const hasVendors = vendors.length > 0;

  return (
    <ModuleShell>
      <ModuleHeader
        label="Fornecedores"
        title="Gestão de Fornecedores"
        description="Consulte fornecedores registados, categorias, estados de validação e contactos do evento."
      />

      <EventContextBar context={context} />

      <ModuleStatGrid
        stats={[
          { label: "Fornecedores activos", value: summary.active },
          { label: "Em validação", value: summary.inReview },
          { label: "Contratos assinados", value: summary.signedContracts },
          { label: "Pagamentos pendentes", value: summary.pendingPayments },
        ]}
      />

      {!hasVendors ? (
        <ModuleEmptyState
          title="Ainda não há fornecedores registados"
          description="Quando a equipa HAXR ou o Concierge validar propostas de fornecedores para este evento, eles aparecerão aqui com categoria, contacto e estado."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-2xl border border-brand-champagne/10 bg-[#120e0d] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-light text-white">{vendor.name}</h3>
                    <p className="mt-1 font-mono text-[9px] uppercase text-zinc-500">
                      {vendor.category}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase ${VENDOR_STATUS_STYLES[vendor.status]}`}
                  >
                    {VENDOR_STATUS_LABELS[vendor.status]}
                  </span>
                </div>
                <div className="mt-4 space-y-1 text-xs text-zinc-400">
                  <p>{vendor.contact}</p>
                  <p>{vendor.location}</p>
                  <p className="text-brand-gold">
                    Valor: {formatCurrencyMZN(vendor.contractedAmount, context.currency)}
                  </p>
                  {vendor.proposal ? (
                    <p>
                      Proposta: {formatCurrencyMZN(vendor.proposal.amount, context.currency)}
                    </p>
                  ) : null}
                  {vendor.contract?.signed ? (
                    <p className="text-emerald-400">Contrato assinado</p>
                  ) : null}
                </div>
                <p className="mt-4 border-t border-white/5 pt-3 text-[10px] text-zinc-500">
                  Próxima acção: <span className="text-white">{vendor.nextAction}</span>
                </p>
              </div>
            ))}
          </div>

          <ModulePanel title="Lista Operacional">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[9px] uppercase text-zinc-500">
                    <th className="pb-3 pr-3">Nome</th>
                    <th className="pb-3 pr-3">Categoria</th>
                    <th className="pb-3 pr-3">Estado</th>
                    <th className="pb-3 pr-3">Valor</th>
                    <th className="pb-3">Próxima acção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vendors.map((v) => (
                    <tr key={v.id} className="text-zinc-300">
                      <td className="py-3 pr-3 text-white">{v.name}</td>
                      <td className="py-3 pr-3">{v.category}</td>
                      <td className="py-3 pr-3">{VENDOR_STATUS_LABELS[v.status]}</td>
                      <td className="py-3 pr-3">
                        {formatCurrencyMZN(v.contractedAmount, context.currency)}
                      </td>
                      <td className="py-3">{v.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModulePanel>
        </>
      )}

      <VendorSuggestionsPanel />
    </ModuleShell>
  );
}
