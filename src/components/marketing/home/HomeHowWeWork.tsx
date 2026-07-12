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
    <section className="relative py-28 md:py-36 bg-[#FCFBF9] border-b border-brand-champagne/15">
      <div className="site-container-wide mx-auto">

        {/* Cabeçalho com Linha e Diamante de Luxo */}
        <RevealOnScroll className="mb-16 md:mb-20">
          <div className="flex items-center gap-2.5 text-brand-gold mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
            </svg>
            <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">O Processo</span>
          </div>

          <div className="relative pt-2">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-tight max-w-3xl">
              Como funciona: do primeiro alinhamento à execução impecável.
            </h2>
            <p className="font-signature text-3xl md:text-4xl text-brand-gold/55 absolute -top-5 left-72 pointer-events-none select-none">
              O Nosso Método
            </p>
          </div>
        </RevealOnScroll>

        {/* Linha do Tempo/Grelha Editorial de Passos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6 xl:gap-8">
          {phases.map((block, i) => {
            const [num, title] = block.phase.split(" - ");
            return (
              <RevealOnScroll key={block.phase} delay={i * 0.06}>
                <article className="pt-6 border-t border-brand-champagne/60 flex flex-col justify-between h-full group hover:border-brand-gold transition-colors duration-500 text-left">
                  <div>
                    {/* Número e Fase */}
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-serif text-3xl font-light text-brand-gold/80 group-hover:text-brand-gold transition-colors duration-500">
                        {num}
                      </span>
                      <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-zinc-400">
                        Fase
                      </span>
                    </div>

                    {/* Título do Passo */}
                    <h3 className="font-serif text-sm font-medium tracking-wide text-brand-text-dark mb-5 uppercase">
                      {title}
                    </h3>

                    {/* Itens do Processo */}
                    <ul className="space-y-3.5">
                      {block.items.map((item) => (
                        <li
                          key={item}
                          className="font-sans text-xs text-brand-text-dark/70 leading-relaxed flex gap-2 font-light"
                        >
                          <span className="text-brand-gold/60 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* CTA do Método */}
        <RevealOnScroll className="mt-16 text-left">
          <Link
            href="/assessoria-eventos"
            className="inline-flex items-center gap-2.5 font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold hover:text-brand-gold font-semibold transition-colors duration-300 group"
          >
            <span>Ver detalhes do método HAXR</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
