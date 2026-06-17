import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

type HowWeWorkPhase = {
  phase: string;
  items: readonly string[];
};

type HomeHowWeWorkProps = {
  phases: readonly HowWeWorkPhase[];
};

export default function HomeHowWeWork({ phases }: HomeHowWeWorkProps) {
  return (
    <section className="relative py-20 md:py-28">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">Como Trabalhamos</h2>
          <p className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-14 max-w-2xl">
            Do primeiro alinhamento ao encerramento — com método, discrição e presença.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {phases.map((block, i) => (
            <RevealOnScroll key={block.phase} delay={i * 0.08}>
              <article className="border border-grey-dark/80 p-8 h-full">
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/55 mb-4">
                  {block.phase}
                </p>
                <ul className="space-y-3">
                  {block.items.map((item) => (
                    <li
                      key={item}
                      className="font-sans text-sm text-grey leading-relaxed flex gap-3"
                    >
                      <span className="text-gold/40 shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-12">
          <Link
            href="/assessoria-eventos"
            className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
          >
            Ver como conduzimos cada evento
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
