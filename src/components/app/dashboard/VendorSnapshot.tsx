import type { DashboardVendorSnapshot } from "@/lib/dashboard/types";
import { VENDOR_STATUS_STYLES } from "@/lib/dashboard/presentation";

type VendorSnapshotProps = {
  vendors: DashboardVendorSnapshot[];
};

export default function VendorSnapshot({ vendors }: VendorSnapshotProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brand-champagne/10 bg-white/5 p-6 md:p-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-serif text-lg font-light text-white">Fornecedores Adjudicados</h3>
        <span className="font-mono text-[9px] uppercase text-zinc-500">Estado Contratos</span>
      </div>

      {vendors.length === 0 ? (
        <p className="font-sans text-xs font-light text-zinc-500">
          Ainda não existem fornecedores adjudicados.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex flex-col justify-between space-y-3 rounded-2xl border border-white/5 bg-black/30 p-4 text-left transition-colors hover:border-brand-gold/20"
            >
              <div className="space-y-1">
                <h4 className="truncate font-serif text-sm font-semibold text-white">
                  {vendor.name}
                </h4>
                <p className="truncate font-sans text-[10px] leading-tight text-zinc-500">
                  {vendor.service}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="font-mono text-[8px] text-zinc-500">CONTRATO</span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${
                    VENDOR_STATUS_STYLES[vendor.status]
                  }`}
                >
                  {vendor.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
