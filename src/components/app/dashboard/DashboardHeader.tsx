import type { DashboardMeta } from "@/lib/dashboard/types";
import { Sparkles } from "lucide-react";

type DashboardHeaderProps = {
  meta: DashboardMeta;
};

export default function DashboardHeader({ meta }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-brand-champagne/15 bg-[#120e0d] px-6 py-8 shadow-[0_28px_80px_rgba(0,0,0,0.28)] md:px-9 md:py-10">
      <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-brand-gold/10" />
      <div className="pointer-events-none absolute -right-6 -top-14 h-48 w-48 rounded-full border border-brand-gold/10" />

      <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-3 text-brand-gold">
            <span className="h-px w-8 bg-brand-gold/70" />
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
              Private Planning Command Suite
            </span>
          </div>

          <h1 className="max-w-3xl font-serif text-4xl font-light leading-[0.98] tracking-[-0.03em] text-white md:text-6xl">
            O vosso casamento, conduzido com intenção.
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-xs font-light leading-relaxed text-zinc-400 md:text-sm">
            Uma visão privada de cada decisão, cada detalhe e cada próximo gesto — com a
            precisão discreta da HAXR.
          </p>
        </div>

        <div className="flex items-center gap-4 border-l border-brand-gold/35 pl-4 text-xs md:mb-1">
          <div className="text-left">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
              Última sincronização
            </p>
            <p className="mt-1 font-serif text-sm text-brand-ivory">{meta.lastSyncedLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
