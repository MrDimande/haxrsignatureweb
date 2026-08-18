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
    <section className="mt-12 rounded-2xl border border-brand-champagne/40 bg-brand-champagne/10 p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-brand-gold">
            Incluído nos pacotes HAXR
          </p>
          <h2 className="font-serif text-2xl font-light text-brand-text-dark">{headline}</h2>
          <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70">
            Fale connosco para integrar a plataforma na vossa celebração — ou entre no painel se já
            é cliente.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={packageHref}
            className="btn-editorial btn-editorial--solid inline-flex items-center justify-center gap-2 px-6 py-3.5"
          >
            Pedir proposta
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center border border-brand-champagne/60 px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.25em] text-brand-text-dark hover:border-brand-gold"
          >
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
