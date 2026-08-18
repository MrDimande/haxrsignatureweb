import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ToolProductionCtaProps = {
  headline?: string;
  packageHref?: string;
};

export default function ToolProductionCta({
  headline = "Quer esta ferramenta no vosso evento real?",
  packageHref = "/contacto?tipo=casamento",
}: ToolProductionCtaProps) {
  return (
    <section className="mt-14 rounded-sm border border-brand-champagne/45 bg-white/70 backdrop-blur-md p-6 md:p-8 shadow-xs">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-brand-gold font-semibold">
            Ecossistema Editorial HAXR
          </p>
          <h2 className="font-serif text-2xl font-light text-brand-text-dark">{headline}</h2>
          <p className="font-sans text-xs md:text-sm font-light leading-relaxed text-brand-text-dark/70">
            Fale connosco para integrar a plataforma de gestão no vosso casamento — ou inicie sessão se já for cliente com acesso privado ativo.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row shrink-0">
          <Link
            href={packageHref}
            className="btn-editorial btn-editorial--solid inline-flex items-center justify-center gap-2 px-6 py-3.5"
          >
            Pedir proposta
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center border border-brand-champagne/60 bg-white hover:border-brand-gold px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.25em] text-brand-text-dark transition-colors rounded-sm"
          >
            Entrar no Painel
          </Link>
        </div>
      </div>
    </section>
  );
}
