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
  label = "Universo HAXR",
  headline = "Um universo cuidadosamente curado.",
  intro,
}: PillarCardsProps) {
  return (
    <section id="pilares" className="relative py-20 md:py-28 bg-black-soft">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">{label}</h2>
          <p className="type-headline text-white/90 mb-6 md:mb-8 max-w-2xl">
            {headline}
          </p>
          {intro ? (
            <p className="font-sans text-sm text-grey leading-relaxed max-w-xl mb-14">
              {intro}
            </p>
          ) : (
            <div className="mb-14" />
          )}
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-grey-dark">
          {pillars.map((pillar, i) => (
            <RevealOnScroll key={pillar.href} delay={i * 0.06}>
              <Link
                href={pillar.href}
                className="group block bg-black-soft p-8 md:p-10 h-full hover:bg-white/[0.02] transition-colors duration-700"
              >
                <p className="font-mono text-gold text-[10px] tracking-[0.4em] mb-4">
                  {pillar.num}
                </p>
                <h3 className="font-serif text-xl md:text-2xl font-light text-white mb-4 group-hover:text-gold/80 transition-colors duration-500">
                  {pillar.title}
                </h3>
                <p className="font-sans text-sm text-grey leading-relaxed mb-6">
                  {pillar.desc}
                </p>
                <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/60 group-hover:text-gold transition-colors duration-500">
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
