"use client";

import StructuredData from "@/components/seo/StructuredData";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import InvitationMockup from "@/components/ui/InvitationMockup";
import InvitationPackages from "@/components/sections/InvitationPackages";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import DetailGallery from "@/components/ui/DetailGallery";
import StickyReservationCard from "@/components/ui/StickyReservationCard";
import { convitesNarrative } from "@/lib/marketing/editorial";
import { convitesCreativeProcess, convitesOfferings } from "@/lib/marketing/pages";
import { portfolioCopy } from "@/lib/site-config";

export default function ConvitesIdentidadePage() {
  const { identidadeVisual } = portfolioCopy;

  const narrativeBlocks = [
    { key: "problem", title: "O desafio", text: convitesNarrative.problem },
    { key: "impact", title: "O que sente", text: convitesNarrative.emotionalImpact },
    { key: "solution", title: "Como a HAXR conduz", text: convitesNarrative.solution },
    { key: "after", title: "Depois", text: convitesNarrative.feelingAfter },
  ] as const;

  return (
    <>
      <StructuredData page="convites" />

      {/* Cabeçalho */}
      <PageHero
        label="Convites & Identidade Visual"
        headline="A primeira impressão do evento — antes de ele existir fisicamente."
        description="Não vendemos convites. Curamos o momento em que o convidado sente, pela primeira vez, que algo especial o espera."
      />

      {/* Loverly Editorial Metadata */}
      <div className="site-container mx-auto pb-8">
        <div className="flex items-center gap-4 text-[10px] font-mono text-brand-text-dark/40 border-b border-brand-champagne/45 pb-6">
          <span>POR HAXR EDITORIAL</span>
          <span>•</span>
          <span>4 MINUTOS DE LEITURA</span>
          <span>•</span>
          <span>ATUALIZADO EM 2026</span>
        </div>
      </div>

      {/* Galeria de Fotos Airbnb */}
      <DetailGallery />

      {/* Layout Duas Colunas Airbnb */}
      <section className="relative py-12 md:py-20 bg-brand-ivory pointer-events-auto">
        <div className="site-container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Esquerda: Informações detalhadas */}
            <div className="lg:col-span-8 space-y-16">

              {/* Narrativa Criativa */}
              <div className="border-b border-brand-champagne/45 pb-12">
                <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold mb-10">Concepção Visual</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
                  {narrativeBlocks.map((block) => (
                    <article key={block.key} className="space-y-3">
                      <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-brand-text-dark/45">
                        {block.title}
                      </p>
                      <p className="font-serif text-base text-brand-text-dark/85 leading-relaxed font-light">
                        {block.text}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              {/* O que curamos */}
              <div className="border-b border-brand-champagne/45 pb-12 space-y-10">
                <div>
                  <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold mb-4">O que curamos</h2>
                  <p className="font-serif text-xl font-light text-brand-text-dark/95 leading-relaxed">
                    Da primeira data ao último detalhe impresso — cada peça comunica exclusividade e intenção.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {convitesOfferings.map((item, i) => (
                    <RevealOnScroll key={item.title} delay={i * 0.04}>
                      <article className="border-t border-brand-champagne/40 pt-6">
                        <h3 className="font-serif text-lg font-light text-brand-text-dark mb-2">
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

              {/* Processo criativo */}
              <div className="bg-brand-champagne/15 border border-brand-champagne/30 rounded-2xl p-8 space-y-10">
                <div>
                  <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold mb-4">Processo criativo</h2>
                  <p className="font-serif text-lg font-light text-brand-text-dark/95 leading-relaxed">
                    Cada decisão visual nasce de escuta — não de modelos. A experiência começa na concepção, não na entrega.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {convitesCreativeProcess.map((step, i) => (
                    <RevealOnScroll key={step.num} delay={i * 0.05}>
                      <article>
                        <p className="font-mono text-brand-gold text-[10px] tracking-[0.4em] font-semibold mb-2">
                          {step.num}
                        </p>
                        <h3 className="font-serif text-base font-light text-brand-text-dark mb-2">
                          {step.title}
                        </h3>
                        <p className="font-sans text-xs text-brand-text-dark/75 leading-relaxed font-light">
                          {step.body}
                        </p>
                      </article>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>

              {/* Experiências ao vivo */}
              <div className="bg-brand-black border border-brand-champagne/30 rounded-[2rem] p-6 md:p-10 space-y-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_bottom,rgba(184,138,42,0.15),transparent)]" />
                <div className="relative z-10">
                  <InvitationMockup />
                </div>
              </div>

              {/* Identidade visual */}
              <div className="bg-brand-champagne/15 border border-brand-champagne/30 rounded-[2rem] p-8 space-y-6">
                <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">Identidade Visual</h2>
                <p className="font-serif text-lg font-light text-brand-text-dark/95 leading-relaxed">
                  {identidadeVisual.headline}
                </p>
                {identidadeVisual.paragraphs.map((p) => (
                  <p
                    key={p}
                    className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light"
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* Níveis de curadoria */}
              <div className="bg-brand-black border border-brand-champagne/30 rounded-[2rem] p-6 md:p-10 space-y-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_bottom,rgba(184,138,42,0.15),transparent)]" />
                <div className="relative z-10 space-y-8">
                  <div>
                    <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold mb-4">Níveis de curadoria</h2>
                    <p className="font-sans text-sm text-brand-ivory/70 font-light leading-relaxed">
                      Cada celebração exige um nível diferente de profundidade estética e funcional. Estas experiências reflectem a amplitude da nossa assinatura.
                    </p>
                  </div>
                  <InvitationPackages />
                </div>
              </div>

            </div>

            {/* Direita: Cartão de Agendamento */}
            <div className="lg:col-span-4">
              <StickyReservationCard
                serviceTitle="Convites & Identidade Visual"
                basePrice="450 €"
                priceNumeric={450}
              />
            </div>

          </div>
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
