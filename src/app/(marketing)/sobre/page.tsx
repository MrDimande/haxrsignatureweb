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

      <section className="relative py-16 md:py-24 bg-black-soft">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-8">{assinatura.label}</h2>
          </RevealOnScroll>
          <SplitText
            as="h3"
            className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-8 max-w-2xl"
          >
            {assinatura.headline}
          </SplitText>
          <div className="space-y-6 max-w-2xl">
            {assinatura.paragraphs.map((p, i) => (
              <RevealOnScroll key={p} delay={i * 0.05}>
                <p className="font-sans text-sm text-grey leading-loose">{p}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-12">O que nos move</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {sobreBeliefs.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 0.05}>
                <article className="border-t border-grey-dark/60 pt-8">
                  <h3 className="font-serif text-lg font-light text-white mb-3">
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

      <Testimonials />

      <CTABand />
    </>
  );
}
