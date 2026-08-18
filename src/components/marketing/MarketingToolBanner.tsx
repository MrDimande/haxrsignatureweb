import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

type MarketingToolBannerProps = {
  title: string;
};

export default function MarketingToolBanner({ title }: MarketingToolBannerProps) {
  return (
    <div className="mb-10 rounded-sm border border-brand-champagne/45 bg-white/80 backdrop-blur-md p-4 md:p-5 shadow-xs transition-all">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand-champagne/20 text-brand-gold border border-brand-champagne/40">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.32em] text-brand-gold">
                Modo Interativo · {title}
              </span>
              <span className="inline-block h-1 w-1 rounded-full bg-brand-gold/60" />
              <span className="font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 hidden sm:inline">
                Simulação Aberta
              </span>
            </div>
            <p className="mt-0.5 font-sans text-xs font-light leading-relaxed text-brand-text-dark/70">
              Ambiente de exploração livre. A persistência completa e relatórios oficiais ativam-se no vosso painel privado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <Link
            href="/ferramentas"
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand-text-dark/55 hover:text-brand-text-dark transition-colors"
          >
            Todas as ferramentas
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-sm bg-brand-text-dark hover:bg-brand-gold text-white px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] transition-colors shadow-2xs"
          >
            <span>Entrar no painel</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
