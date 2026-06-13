import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import { portfolioCopy } from "@/lib/site-config";

const pillars = [
  "Selecção criteriosa de fornecedores",
  "Negociação e gestão financeira",
  "Coordenação logística",
  "Direcção estética e técnica",
];

export default function Management() {
  const { assessoria, coordenacao } = portfolioCopy;

  return (
    <section id="gestao" className="relative pt-20 pb-12 md:pt-28 md:pb-16 bg-black-soft">
      <div className="site-container site-prose-medium mx-auto relative">
        <div className="art-deco-corner art-deco-corner--tl" />
        <div className="art-deco-corner art-deco-corner--br" />

        <RevealOnScroll>
          <h2 className="section-label mb-16">Assessoria & Coordenação</h2>
        </RevealOnScroll>

        <SplitText
          as="h3"
          className="font-serif text-2xl md:text-4xl font-light leading-relaxed text-white/90 mb-8"
        >
          {assessoria.headline}
        </SplitText>

        <div className="space-y-6 mb-16 max-w-2xl">
          {assessoria.paragraphs.map((paragraph, i) => (
            <RevealOnScroll key={paragraph} delay={i * 0.05}>
              <p className="font-sans text-sm text-grey leading-loose">
                {paragraph}
              </p>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-8">
            Gestão integral
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-grey-dark mb-20">
          {pillars.map((pillar, i) => (
            <RevealOnScroll key={pillar} delay={i * 0.08}>
              <div className="bg-black-soft p-8 md:p-10 h-full">
                <p className="font-mono text-[9px] tracking-[0.4em] text-gold/50 mb-4">
                  0{i + 1}
                </p>
                <p className="font-serif text-lg font-light text-white/80 tracking-wide">
                  {pillar}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <SplitText
          as="h3"
          className="font-serif text-xl md:text-2xl font-light leading-relaxed text-white/80 mb-8"
        >
          {coordenacao.headline}
        </SplitText>

        <div className="space-y-6 mb-10 max-w-2xl">
          {coordenacao.paragraphs.map((paragraph, i) => (
            <RevealOnScroll key={paragraph} delay={i * 0.05}>
              <p className="font-sans text-sm text-grey leading-loose">
                {paragraph}
              </p>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delay={0.1} className="border-l border-gold-dim pl-6">
          <p className="font-serif text-lg font-light italic text-white/60">
            {coordenacao.closing}
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
