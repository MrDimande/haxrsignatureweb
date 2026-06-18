import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import InvitationMockup from "@/components/ui/InvitationMockup";
import InvitationPackages from "@/components/sections/InvitationPackages";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import { convitesNarrative } from "@/lib/marketing/editorial";
import { convitesCreativeProcess, convitesOfferings } from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";
import { portfolioCopy } from "@/lib/site-config";

export const metadata: Metadata = marketingMetadata("convites");

export default function ConvitesIdentidadePage() {
  const { identidadeVisual } = portfolioCopy;

  return (
    <>
      <StructuredData page="convites" />
      <PageHero
        label="Convites & Identidade Visual"
        headline="A primeira impressão do evento — antes de ele existir fisicamente."
        description="Não vendemos convites. Curamos o momento em que o convidado sente, pela primeira vez, que algo especial o espera."
      />
      <EditorialNarrative narrative={convitesNarrative} />

      <section className="relative py-12 md:py-20">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-10">O que curamos</h2>
            <p className="font-serif text-xl font-light text-white/80 max-w-2xl mb-14 leading-relaxed">
              Da primeira data ao último detalhe impresso — cada peça comunica
              exclusividade e intenção.
            </p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {convitesOfferings.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 0.04}>
                <article className="border-t border-grey-dark/60 pt-6">
                  <h3 className="font-serif text-lg font-light text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="font-sans text-sm text-grey leading-relaxed">
                    {item.body}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12 md:py-20 bg-black-soft">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-10">Processo criativo</h2>
            <p className="font-serif text-xl font-light text-white/80 max-w-2xl mb-14 leading-relaxed">
              Cada decisão visual nasce de escuta — não de modelos. A experiência
              começa na concepção, não na entrega.
            </p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {convitesCreativeProcess.map((step, i) => (
              <RevealOnScroll key={step.num} delay={i * 0.05}>
                <article>
                  <p className="font-mono text-gold text-[10px] tracking-[0.4em] mb-3">
                    {step.num}
                  </p>
                  <h3 className="font-serif text-lg font-light text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="font-sans text-sm text-grey leading-relaxed">
                    {step.body}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-8">Experiências ao vivo</h2>
          </RevealOnScroll>
          <InvitationMockup />
        </div>
      </section>

      <section className="relative py-12 md:py-16 bg-black-soft">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-8">Identidade visual</h2>
            <p className="font-serif text-xl font-light text-white/85 mb-6 max-w-2xl">
              {identidadeVisual.headline}
            </p>
            {identidadeVisual.paragraphs.map((p) => (
              <p
                key={p}
                className="font-sans text-sm text-grey leading-loose max-w-2xl mb-4"
              >
                {p}
              </p>
            ))}
          </RevealOnScroll>
        </div>
      </section>

      <section className="relative py-16 md:py-24">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-4">Níveis de curadoria</h2>
            <p className="font-sans text-sm text-grey max-w-xl mb-10 leading-relaxed">
              Cada celebração exige um nível diferente de profundidade estética e
              funcional. Estas experiências reflectem a amplitude da nossa assinatura.
            </p>
          </RevealOnScroll>
          <InvitationPackages />
        </div>
      </section>

      <CTABand
        headline="A primeira impressão merece a mesma excelência do grande dia."
        secondaryHref="/portfolio"
        secondaryLabel="Ver histórias reais"
      />
    </>
  );
}
