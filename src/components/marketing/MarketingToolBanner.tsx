import Link from "next/link";
import { Sparkles } from "lucide-react";

type MarketingToolBannerProps = {
  title: string;
};

export default function MarketingToolBanner({ title }: MarketingToolBannerProps) {
  return (
    <div className="mb-8 rounded-sm border border-brand-gold/25 bg-brand-gold/8 px-4 py-3 md:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" strokeWidth={1.5} />
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.32em] text-brand-gold">
              Pré-visualização · {title}
            </p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-brand-text-dark/75">
              Explore a interface. A operação completa activa-se com pacote HAXR ou assessoria —
              dados persistentes no painel do evento.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ferramentas"
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand-text-dark/60 hover:text-brand-text-dark"
          >
            Todas as ferramentas
          </Link>
          <Link
            href="/dashboard"
            className="rounded-sm border border-brand-gold/40 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-gold hover:bg-brand-gold/10"
          >
            Entrar no painel
          </Link>
        </div>
      </div>
    </div>
  );
}
