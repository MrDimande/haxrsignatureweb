import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import LeadMagnetForm from "@/components/marketing/LeadMagnetForm";
import { guiasCatalog } from "@/lib/marketing/guias";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("guias");

export default function GuiasPage() {
  return (
    <>
      <StructuredData page="guias" />
      <PageHero
        label="Guias HAXR"
        headline="Recursos gratuitos para planear com método."
        description="Checklists, RSVP e orçamento — pensados para casamentos premium em Maputo e Moçambique."
      />
      <section className="relative pb-20 md:pb-28">
        <div className="site-container mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {guiasCatalog.map((guia, index) => (
            <RevealOnScroll key={guia.id} delay={index * 0.04}>
              <article className="flex h-full flex-col rounded-2xl border border-brand-champagne/35 bg-white p-6 shadow-[0_16px_40px_rgba(8,7,6,0.05)]">
                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-brand-gold">
                  PDF editorial
                </p>
                <h2 className="mt-3 font-serif text-xl font-light text-brand-text-dark">
                  {guia.title}
                </h2>
                <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-brand-text-dark/75">
                  {guia.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {guia.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="font-sans text-xs text-brand-text-dark/65 before:mr-2 before:text-brand-gold before:content-['•']"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
                <LeadMagnetForm guia={guia} />
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>
      <CTABand
        headline="Quer acompanhamento completo?"
        description="Os guias são o primeiro passo. A assessoria HAXR assume o resto."
        primaryHref="/assessoria-eventos"
        primaryLabel="Conhecer assessoria"
      />
    </>
  );
}
