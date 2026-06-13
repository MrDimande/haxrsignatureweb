import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import { portfolioCopy } from "@/lib/site-config";

export default function Philosophy() {
  const { quemSomos, assinatura } = portfolioCopy;

  return (
    <section id="filosofia" className="relative pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="site-container site-prose-medium mx-auto relative">
        {/* 1. SEÇÃO QUEM SOMOS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start mb-16 md:mb-20">
          {/* Lado Esquerdo: Label + Essência */}
          <div className="md:col-span-5 space-y-8">
            <RevealOnScroll>
              <h2 className="section-label">{quemSomos.label}</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1} className="border-l border-gold-dim pl-6">
              <p className="font-serif text-lg md:text-xl font-light italic text-white/60 leading-relaxed">
                {quemSomos.essence}
              </p>
            </RevealOnScroll>
          </div>

          {/* Lado Direito: Parágrafos */}
          <div className="md:col-span-7 space-y-6">
            {quemSomos.paragraphs.map((paragraph, i) => (
              <RevealOnScroll key={paragraph} delay={i * 0.05}>
                <p className="font-sans text-sm text-grey leading-loose">
                  {paragraph}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        {/* 2. SEÇÃO A NOSSA ASSINATURA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
          {/* Lado Esquerdo: Label + Pull Quote */}
          <div className="md:col-span-5 space-y-8">
            <RevealOnScroll>
              <h2 className="section-label">{assinatura.label}</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={0.15} className="border-l border-gold-dim pl-6">
              <blockquote className="font-serif text-xl md:text-2xl font-light italic text-white/70 leading-relaxed">
                &ldquo;{assinatura.pullQuote}&rdquo;
              </blockquote>
            </RevealOnScroll>
          </div>

          {/* Lado Direito: Headline + Parágrafos */}
          <div className="md:col-span-7 space-y-8">
            <SplitText
              as="h3"
              className="font-serif text-2xl md:text-3xl font-light leading-relaxed text-white/90"
            >
              {assinatura.headline}
            </SplitText>
            <div className="space-y-6">
              {assinatura.paragraphs.map((paragraph, i) => (
                <RevealOnScroll key={paragraph} delay={0.08 + i * 0.05}>
                  <p className="font-sans text-sm text-grey leading-loose">
                    {paragraph}
                  </p>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
