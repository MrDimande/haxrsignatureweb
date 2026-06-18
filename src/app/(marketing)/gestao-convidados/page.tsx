import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import EditorialNarrative from "@/components/marketing/EditorialNarrative";
import BenefitStories from "@/components/marketing/BenefitStories";
import FlowSteps from "@/components/marketing/FlowSteps";
import { convidadosNarrative } from "@/lib/marketing/editorial";
import { convidadosBenefits, convidadosCapabilities, convidadosFlow } from "@/lib/marketing/pages";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("convidados");

export default function GestaoConvidadosPage() {
  return (
    <>
      <StructuredData page="convidados" />
      <PageHero
        label="Gestão de Convidados"
        headline="Controlo e clareza — para saber quem vem, quem falta e como cada pessoa será recebida."
        description="Não vendemos listas. Vendemos a tranquilidade de uma operação de convidados conduzida com a mesma precisão da assessoria HAXR."
      />
      <EditorialNarrative narrative={convidadosNarrative} />

      <section className="relative py-12 md:py-20 bg-black-soft">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-10">Plataforma por detrás do serviço</h2>
            <p className="font-serif text-xl font-light text-white/80 max-w-2xl mb-14 leading-relaxed">
              Por trás da assessoria existe tecnologia própria — invisível para o
              convidado, essencial para a equipa.
            </p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {convidadosCapabilities.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 0.03}>
                <article className="border-t border-grey-dark/60 pt-5 h-full">
                  <h3 className="font-mono text-[10px] tracking-[0.25em] uppercase text-gold/60 mb-2">
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

      <FlowSteps steps={convidadosFlow} label="O percurso do convidado" />
      <BenefitStories
        stories={convidadosBenefits}
        label="O que ganha"
        intro="Cada etapa foi pensada para que a equipa e os convidados vivam o evento com fluidez — não com incerteza."
        columns={3}
      />
      <CTABand
        headline="Quer esta clareza no seu evento?"
        description="Integramos a gestão de convidados na assessoria ou como dimensão dedicada — conforme a dimensão da celebração."
        secondaryHref="/portfolio"
        secondaryLabel="Ver casos reais"
      />
    </>
  );
}
