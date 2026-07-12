import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { MarketingPillar } from "@/lib/marketing/pages";

type PillarCardsProps = {
  pillars: readonly MarketingPillar[];
  label?: string;
  headline?: string;
  intro?: string;
};

export default function PillarCards({
  pillars,
  label = "Serviços",
  headline = "Um universo cuidadosamente curado.",
  intro,
}: PillarCardsProps) {
  return (
    <section id="servicos" className="relative py-24 md:py-32">
      <div className="site-container mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">{label}</h2>
          <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-brand-text-dark mb-6 md:mb-8 max-w-2xl">
            {headline}
          </p>
          {intro ? (
            <p className="font-sans text-sm text-brand-text-dark/70 leading-relaxed max-w-xl mb-16">
              {intro}
            </p>
          ) : (
            <div className="mb-16" />
          )}
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((pillar, i) => (
            <RevealOnScroll key={pillar.title} delay={i * 0.05}>
              <Link
                href={pillar.href}
                className="group block bg-brand-champagne/15 border border-brand-champagne/40 rounded-sm p-8 md:p-10 h-full hover:bg-brand-champagne/25 hover:border-brand-gold/50 hover:shadow-[0_8px_30px_rgba(184,138,42,0.04)] transition-all duration-700 flex flex-col justify-between"
              >
                <div>
                  <p className="font-mono text-brand-gold text-[10px] tracking-[0.4em] mb-5">
                    {pillar.num}
                  </p>
                  <h3 className="font-serif text-xl md:text-2xl font-light text-brand-text-dark mb-4 group-hover:text-brand-gold transition-colors duration-500">
                    {pillar.title}
                  </h3>
                  <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed mb-8 font-light">
                    {pillar.desc}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold/60 group-hover:text-brand-gold transition-colors duration-500">
                  Descobrir
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                </span>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
