import type { DashboardMeta } from "@/lib/dashboard/types";
import { TrendingUp } from "lucide-react";

type DashboardHeaderProps = {
  meta: DashboardMeta;
};

export default function DashboardHeader({ meta }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-brand-champagne/10 pb-6 md:flex-row">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 text-brand-gold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
            HAXR Operational Panel
          </span>
        </div>
        <h1 className="font-serif text-3xl font-light leading-tight text-white md:text-4xl">
          Painel do Casamento
        </h1>
        <p className="mt-1 max-w-xl font-sans text-xs font-light text-zinc-400 md:text-sm">
          O vosso Painel de Casamento Exclusivo e Inteligente — visão geral do evento,
          convidados, orçamento, fornecedores e próximas acções.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-brand-champagne/10 bg-white/5 px-4 py-2 text-xs">
        <div className="text-left">
          <p className="font-mono text-[9px] uppercase text-zinc-500">Última Sincronização</p>
          <p className="font-mono text-[11px] text-white">{meta.lastSyncedLabel}</p>
        </div>
      </div>
    </div>
  );
}
