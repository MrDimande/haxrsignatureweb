import Link from "next/link";
import type { DashboardConciergeSummary } from "@/lib/dashboard/types";
import { Sparkles } from "lucide-react";

type ConciergeSummaryCardProps = {
  summary: DashboardConciergeSummary;
};

export default function ConciergeSummaryCard({ summary }: ConciergeSummaryCardProps) {
  return (
    <div className="haxr-dashboard-card relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-brand-gold/30 bg-gradient-to-r from-brand-black via-[#1c1412] to-brand-black p-6 shadow-xl md:flex-row md:items-center md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,138,42,0.15),transparent)] opacity-15" />

      <div className="relative z-10 max-w-xl space-y-4 text-left">
        <div className="flex items-center gap-2 text-brand-gold">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
            HAXR Concierge™
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-xl font-light leading-tight text-white md:text-2xl">
            Central de Entrada Inteligente
          </h3>
          <p className="font-sans text-xs font-light leading-relaxed text-brand-ivory/60">
            Envie propostas, recibos ou convidados por e-mail ou WhatsApp. O Concierge lê,
            classifica e organiza os seus ficheiros automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-[10px] text-brand-gold sm:grid-cols-4">
          <div>
            <p className="text-[14px] font-bold text-white">{summary.documentsToday}</p>
            <p className="font-sans text-[9px] text-brand-ivory/40">organizados hoje</p>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">{summary.contractsAwaiting}</p>
            <p className="font-sans text-[9px] text-brand-ivory/40">aguardam validação</p>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">{summary.proposalsApproval}</p>
            <p className="font-sans text-[9px] text-brand-ivory/40">precisam de aprovação</p>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">{summary.guestsNoResponse}</p>
            <p className="font-sans text-[9px] text-brand-ivory/40">sem RSVP</p>
          </div>
        </div>
      </div>

      <Link
        href={summary.href}
        className="relative z-10 shrink-0 cursor-pointer rounded-lg bg-brand-gold px-7 py-3.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white shadow-md shadow-brand-gold/10 transition-all hover:bg-brand-gold-light hover:shadow-brand-gold/25 active:scale-95 md:text-[10px]"
      >
        Ver Concierge
      </Link>
    </div>
  );
}
