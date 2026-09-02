"use client";

import { ArrowRight, X } from "lucide-react";
import type { PublicSupplierProfile } from "@/lib/vendors/marketplace";

type VendorCompareDrawerProps = {
  selectedSuppliers: PublicSupplierProfile[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  onClear: () => void;
};

export default function VendorCompareDrawer({
  selectedSuppliers,
  onRemove,
  onCompare,
  onClear,
}: VendorCompareDrawerProps) {
  if (selectedSuppliers.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-4xl px-4 pb-6">
        <div className="rounded-2xl border border-brand-gold/40 bg-white/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(28,26,23,0.12)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Lista de fornecedores selecionados */}
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                Comparar
              </span>

              {selectedSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-brand-champagne/40 bg-[#faf8f5] px-3 py-2"
                >
                  <span className="font-sans text-xs font-medium text-brand-text-dark truncate max-w-[140px]">
                    {supplier.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(supplier.id)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-champagne/30 text-brand-text-dark/50 transition hover:bg-red-50 hover:text-red-500 cursor-pointer"
                    aria-label={`Remover ${supplier.name} da comparação`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {selectedSuppliers.length < 3 && (
                <span className="shrink-0 font-mono text-[8px] text-brand-text-dark/40 uppercase">
                  +{3 - selectedSuppliers.length} disponível
                </span>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClear}
                className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark/50 hover:text-brand-text-dark transition cursor-pointer"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={onCompare}
                disabled={selectedSuppliers.length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-black px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white transition hover:bg-brand-gold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Comparar {selectedSuppliers.length}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
