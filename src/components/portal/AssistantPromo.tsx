import Link from "next/link";
import { ArrowRight, Check, Upload } from "lucide-react";
import { assistantPromoContent } from "@/lib/portal/dashboard-content";

type AssistantPromoProps = {
  pendingCount?: number;
};

export default function AssistantPromo({ pendingCount = 0 }: AssistantPromoProps) {
  const promo = assistantPromoContent;
  const Icon = promo.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-brand-gold/30 bg-brand-black-soft overflow-hidden">
      <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-brand-gold/15 via-brand-black-soft to-brand-black border-b lg:border-b-0 lg:border-r border-brand-gold/20">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-brand-gold/45 text-brand-gold-light mb-5">
          <Upload className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold-light/90 mb-2">
          {promo.label}
        </p>
        <p className="font-serif text-xl md:text-2xl text-brand-ivory mb-3">
          Carregue propostas, recibos e listas
        </p>
        <p className="font-sans text-sm text-brand-ivory/60 leading-relaxed">
          A IA classifica e extrai. A equipa HAXR valida antes de gravar.
        </p>
        {pendingCount > 0 && (
          <p className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-semibold text-brand-gold-light border border-brand-gold/35 px-3 py-1.5 w-fit">
            {pendingCount} documento(s) por rever
          </p>
        )}
      </div>

      <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center">
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-10 h-10 border border-brand-gold/40 text-brand-gold-light shrink-0">
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="font-serif text-xl text-brand-ivory mb-2">
              {promo.headline}
            </h3>
            <p className="font-sans text-sm text-brand-ivory/65 leading-relaxed max-w-lg">
              {promo.description}
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {promo.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-2 font-sans text-xs text-brand-ivory/80"
            >
              <Check className="w-3.5 h-3.5 text-brand-gold-light shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={promo.ctaHref}
            className="btn-editorial btn-editorial--solid text-center text-sm"
          >
            {promo.ctaLabel}
          </Link>
          <Link
            href={promo.secondaryHref}
            className="inline-flex items-center justify-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-brand-gold-light hover:text-brand-champagne transition-colors"
          >
            {promo.secondaryLabel}
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
