import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SplitText from "@/components/ui/SplitText";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import Testimonials from "@/components/sections/Testimonials";
import { sobreBeliefs } from "@/lib/marketing/pages";
import { sobreNarrative } from "@/lib/marketing/editorial";
import { marketingMetadata } from "@/lib/marketing/seo";
import { portfolioCopy } from "@/lib/site-config";

export const metadata: Metadata = marketingMetadata("sobre");

export default function SobrePage() {
  const { assinatura } = portfolioCopy;

  return (
    <>
      <StructuredData page="sobre" />
      <PageHero
        label="Sobre a HAXR"
        headline="Porque acreditamos que eventos marcam histórias — e cada detalhe importa."
        description="A HAXR Signature não nasceu para vender serviços. Nasceu da convicção de que organização e emoção devem coexistir — com elegância, discrição e precisão."
      />
      <EditorialNarrative narrative={sobreNarrative} />

      <section className="relative py-24 md:py-32 bg-brand-champagne/15 border-y border-brand-champagne/30">
        <div className="site-container mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-8">{assinatura.label}</h2>
          </RevealOnScroll>
          <SplitText
            as="h3"
            className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-brand-text-dark mb-8 max-w-2xl"
          >
            {assinatura.headline}
          </SplitText>
          <div className="space-y-6 max-w-2xl">
            {assinatura.paragraphs.map((p, i) => (
              <RevealOnScroll key={p} delay={i * 0.05}>
                <p className="font-sans text-sm text-brand-text-dark/80 leading-relaxed font-light">{p}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-32">
        <div className="site-container mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-12">O que nos move</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {sobreBeliefs.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 0.05}>
                <article className="border-t border-brand-champagne/45 pt-8">
                  <h3 className="font-serif text-lg md:text-xl font-light text-brand-text-dark mb-3">
                    {item.title}
                  </h3>
                  <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">
                    {item.body}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <CTABand />
    </>
  );
}
