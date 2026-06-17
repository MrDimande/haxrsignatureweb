import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { brandEssence } from "@/lib/marketing/editorial";
import type { BenefitStory } from "@/lib/marketing/editorial";

type HomeTechnologyProps = {
  items: readonly BenefitStory[];
};

export default function HomeTechnology({ items }: HomeTechnologyProps) {
  return (
    <section className="relative py-20 md:py-28">
      <div className="site-container site-prose-wide mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">Por detrás da experiência</h2>
          <p className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-6 max-w-2xl">
            Tecnologia invisível. Excelência perceptível.
          </p>
          <p className="font-sans text-sm text-grey leading-relaxed max-w-xl mb-14">
            {brandEssence.homeIntro}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 md:gap-14 mb-12">
          {items.map((item, i) => (
            <RevealOnScroll key={item.title} delay={i * 0.05}>
              <article className="border-t border-grey-dark/70 pt-8 h-full">
                <h3 className="font-serif text-lg font-light text-white mb-3">
                  {item.title}
                </h3>
                <p className="font-sans text-sm text-grey leading-relaxed mb-4">
                  {item.body}
                </p>
                {item.feeling ? (
                  <p className="font-serif text-sm italic text-gold/50">
                    {item.feeling}
                  </p>
                ) : null}
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <Link
            href="/plataforma-eventos"
            className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
          >
            O ecossistema HAXR
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
