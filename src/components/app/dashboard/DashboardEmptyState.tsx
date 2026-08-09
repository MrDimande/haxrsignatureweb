import Link from "next/link";
import DashboardShell from "@/components/app/dashboard/DashboardShell";

export default function DashboardEmptyState() {
  return (
    <DashboardShell>
      <div className="haxr-dashboard-card flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-brand-champagne/15 bg-white/5 px-6 py-16 text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold">
          Wedding Dashboard
        </p>
        <h2 className="mt-3 font-serif text-2xl font-light text-white md:text-3xl">
          Ainda não existe um evento activo.
        </h2>
        <p className="mt-3 max-w-md font-sans text-sm font-light text-zinc-400">
          Crie o vosso evento para começar a acompanhar convidados, RSVP, orçamento e
          fornecedores num único painel.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-gold px-8 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-brand-gold-light"
        >
          Criar novo evento
        </Link>
      </div>
    </DashboardShell>
  );
}
