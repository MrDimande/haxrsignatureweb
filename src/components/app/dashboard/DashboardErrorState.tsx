"use client";

import DashboardShell from "@/components/app/dashboard/DashboardShell";

type DashboardErrorStateProps = {
  onRetry?: () => void;
  message?: string;
};

export default function DashboardErrorState({
  onRetry,
  message = "Não foi possível carregar o painel.",
}: DashboardErrorStateProps) {
  return (
    <DashboardShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-400/80">
          Erro de carregamento
        </p>
        <h2 className="mt-3 font-serif text-2xl font-light text-white">{message}</h2>
        <p className="mt-3 max-w-md font-sans text-sm font-light text-zinc-400">
          Verifique a ligação e tente novamente. Se o problema persistir, contacte a equipa
          HAXR.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-8 cursor-pointer rounded-xl border border-brand-champagne/30 bg-white/5 px-8 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            Tentar novamente
          </button>
        ) : null}
      </div>
    </DashboardShell>
  );
}
