import Link from "next/link";
import type { ConciergeModuleData } from "@/lib/concierge/portal/types";
import HaxrLogo from "@/components/brand/HaxrLogo";
import { Sparkles, ArrowLeft } from "lucide-react";

type ConciergeHeaderProps = {
  data: ConciergeModuleData;
  onPrimaryAction: (tab: "upload" | "link" | "note") => void;
  onSecondaryAction: () => void;
};

export default function ConciergeHeader({
  data,
  onPrimaryAction,
  onSecondaryAction,
}: ConciergeHeaderProps) {
  const { eventOverview } = data;
  const contextLabel = `${eventOverview.coupleNames} · ${eventOverview.eventDateLabel} · ${eventOverview.location}`;

  return (
    <div className="space-y-4 border-b border-brand-champagne/10 pb-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2.5 text-brand-gold">
            <HaxrLogo variant="mark" tone="gold" size="sm" className="opacity-90" />
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
              HAXR Concierge
            </span>
          </div>
          <h1 className="font-serif text-3xl font-light text-white md:text-4xl">HAXR Concierge</h1>
          <p className="font-sans text-xs text-zinc-400 md:text-sm">
            Envie propostas, contratos, comprovativos, listas, inspirações ou links. O Concierge
            organiza tudo no lugar certo.
          </p>
          <p className="font-mono text-[10px] text-brand-gold/80">{contextLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSecondaryAction}
            className="rounded-full border border-brand-champagne/20 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-300 transition hover:border-brand-gold/40 hover:text-white"
          >
            Ver itens por validar
          </button>
          <button
            type="button"
            onClick={() => onPrimaryAction("upload")}
            className="rounded-full bg-brand-gold px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-black transition hover:bg-white"
          >
            Carregar ficheiro
          </button>
          <button
            type="button"
            onClick={() => onPrimaryAction("link")}
            className="rounded-full border border-brand-gold/40 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold transition hover:bg-brand-gold/10"
          >
            Guardar link
          </button>
          <button
            type="button"
            onClick={() => onPrimaryAction("note")}
            className="rounded-full border border-brand-champagne/20 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-300 transition hover:text-white"
          >
            Registar nota
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-gold/15 bg-brand-gold/5 px-4 py-3">
        <p className="font-sans text-xs text-zinc-300">
          Classificação assistida · Preparado para IA · Validação humana antes de enviar aos módulos
        </p>
        <Link
          href={data.dashboardHref}
          className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 font-mono text-[8px] uppercase tracking-widest text-zinc-500">
        <span className="rounded-full border border-brand-champagne/15 px-2 py-1">
          {data.workspaceMeta.persistenceLabel}
        </span>
        <span className="rounded-full border border-brand-champagne/15 px-2 py-1">
          {data.workspaceMeta.storageLabel}
        </span>
      </div>
    </div>
  );
}
