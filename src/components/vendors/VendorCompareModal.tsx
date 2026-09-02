"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Trophy,
  X,
} from "lucide-react";
import {
  buildSupplierInitials,
  type PublicSupplierProfile,
} from "@/lib/vendors/marketplace";

type VendorCompareModalProps = {
  suppliers: PublicSupplierProfile[];
  open: boolean;
  onClose: () => void;
  onRequestQuote: (supplier: PublicSupplierProfile) => void;
};

function MetricRow({
  icon: Icon,
  label,
  values,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  values: string[];
}) {
  return (
    <tr className="border-b border-brand-champagne/20 last:border-none">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-brand-gold shrink-0" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-brand-text-dark/70">
            {label}
          </span>
        </div>
      </td>
      {values.map((value, idx) => (
        <td
          key={idx}
          className="py-3.5 px-4 text-center font-sans text-xs font-light text-brand-text-dark/80"
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

export default function VendorCompareModal({
  suppliers,
  open,
  onClose,
  onRequestQuote,
}: VendorCompareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!open || suppliers.length < 2) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[90] m-0 h-full w-full max-h-full max-w-full bg-black/60 backdrop-blur-sm p-0 border-none outline-none open:flex items-center justify-center"
    >
      <div className="relative mx-auto w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-champagne/50 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-champagne/30 bg-white/95 backdrop-blur-md px-8 py-5">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-brand-gold">
              Comparação de Fornecedores
            </p>
            <h2 className="mt-1 font-serif text-xl font-medium text-brand-text-dark">
              {suppliers.length} Profissionais Selecionados
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 transition hover:bg-white hover:text-brand-text-dark cursor-pointer"
            aria-label="Fechar comparação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-8 py-8">
          {/* Cabeçalhos dos Fornecedores com Foto */}
          <div className="grid gap-6" style={{ gridTemplateColumns: `180px repeat(${suppliers.length}, 1fr)` }}>
            <div /> {/* Coluna de labels vazia */}
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="text-center space-y-3">
                {/* Cover Thumbnail */}
                <div className="relative mx-auto aspect-[4/3] w-full max-w-[200px] rounded-2xl overflow-hidden border border-brand-champagne/40 bg-brand-black">
                  <Image
                    src={supplier.coverImageUrl}
                    alt={supplier.name}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Avatar */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-gradient-to-br from-[#1c1917] to-[#0c0a09] shadow-md overflow-hidden">
                    {supplier.avatarUrl ? (
                      <Image
                        src={supplier.avatarUrl}
                        alt={supplier.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-serif text-sm font-light text-brand-champagne/90">
                        {buildSupplierInitials(supplier.name)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                    {supplier.name}
                  </h3>
                  <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold">
                    {supplier.categoryLabel}
                  </p>
                </div>

                {supplier.verified && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2.5 py-1 text-brand-gold">
                    <BadgeCheck className="h-3 w-3" />
                    <span className="font-mono text-[7px] font-bold uppercase tracking-wider">
                      Verificado
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tabela Comparativa */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full">
              <tbody>
                <MetricRow
                  icon={MapPin}
                  label="Localização"
                  values={suppliers.map((s) => s.city)}
                />
                <MetricRow
                  icon={Trophy}
                  label="Faixa de Preço"
                  values={suppliers.map((s) => s.priceRange)}
                />
                <MetricRow
                  icon={Calendar}
                  label="Anos de Experiência"
                  values={suppliers.map((s) => `${s.experienceYears} anos`)}
                />
                <MetricRow
                  icon={Star}
                  label="Taxa de Satisfação"
                  values={suppliers.map((s) => `${s.satisfactionRate}%`)}
                />
                <MetricRow
                  icon={Clock}
                  label="Tempo de Resposta"
                  values={suppliers.map((s) => s.responseTime)}
                />
                <MetricRow
                  icon={ShieldCheck}
                  label="Membro Desde"
                  values={suppliers.map((s) => s.memberSince)}
                />
                <MetricRow
                  icon={BadgeCheck}
                  label="Serviços"
                  values={suppliers.map((s) =>
                    s.services.length > 0
                      ? s.services.slice(0, 3).join(", ")
                      : "Contactar para detalhes",
                  )}
                />
              </tbody>
            </table>
          </div>

          {/* Botões de Ação para cada Fornecedor */}
          <div
            className="mt-8 grid gap-6"
            style={{ gridTemplateColumns: `180px repeat(${suppliers.length}, 1fr)` }}
          >
            <div /> {/* Coluna de labels vazia */}
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="text-center">
                <button
                  type="button"
                  onClick={() => onRequestQuote(supplier)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Solicitar Proposta</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
