"use client";

import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import DetailGallery from "@/components/ui/DetailGallery";
import StickyReservationCard from "@/components/ui/StickyReservationCard";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { assessoriaNarrative } from "@/lib/marketing/editorial";
import { assessoriaPhases } from "@/lib/marketing/pages";

export default function AssessoriaEventosPage() {
  const blocks = [
    { key: "problem", title: "O desafio", text: assessoriaNarrative.problem },
    { key: "impact", title: "O que sente", text: assessoriaNarrative.emotionalImpact },
    { key: "solution", title: "Como a HAXR conduz", text: assessoriaNarrative.solution },
    { key: "after", title: "Depois", text: assessoriaNarrative.feelingAfter },
  ] as const;

  return (
    <>
      <StructuredData page="assessoria" />

      {/* Cabeçalho */}
      <PageHero
        label="Assessoria de Eventos"
        headline="Direcção estratégica e operacional — para que alguém cuide de tudo por si."
        description="A assessoria HAXR não é organização genérica. É presença, método e discrição — para que entre na experiência do seu evento, não na logística que a sustenta."
      />

      {/* Loverly Editorial Metadata */}
      <div className="site-container mx-auto pb-8">
        <div className="flex items-center gap-4 text-[10px] font-mono text-brand-text-dark/40 border-b border-brand-champagne/45 pb-6">
          <span>POR HAXR EDITORIAL</span>
          <span>•</span>
          <span>5 MINUTOS DE LEITURA</span>
          <span>•</span>
          <span>ATUALIZADO EM 2026</span>
        </div>
      </div>

      {/* Galeria de Fotos Estilo Airbnb */}
      <DetailGallery />

      {/* Layout Duas Colunas Estilo Airbnb */}
      <section className="relative py-12 md:py-20 bg-brand-ivory pointer-events-auto">
        <div className="site-container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Coluna Esquerda: Detalhes do Serviço & Fases */}
            <div className="lg:col-span-8 space-y-16">

              {/* Narrativa Editorial */}
              <div className="border-b border-brand-champagne/45 pb-12 space-y-10">
                <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">A Nossa Abordagem</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
                  {blocks.map((block) => (
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

              {/* Painel de Controlo HAXR (iPad Mockup Visual - Replicating Invitation page structure) */}
              <div className="bg-brand-black border border-brand-champagne/30 rounded-[2rem] p-6 md:p-10 space-y-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_bottom,rgba(184,138,42,0.15),transparent)]" />

                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">Painel de Planeamento</h2>
                    <p className="font-sans text-xs md:text-sm text-brand-ivory/70 font-light leading-relaxed">
                      O controlo estratégico das fases do vosso casamento é gerido no ecossistema digital da HAXR Signature. Acompanhe fornecedores, custos e cronogramas em tempo real com transparência total.
                    </p>
                  </div>

                  {/* Beautiful iPad Mockup rendering the Planner Hub */}
                  <div className="w-full aspect-[16/10] bg-[#1a1312] border border-brand-champagne/20 rounded-2xl overflow-hidden p-4 relative font-sans flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 text-[5px] md:text-[8px] text-brand-ivory/40 font-mono">
                      <span>PLANNER HUB · HAXR SIGNATURE</span>
                      <span className="text-brand-gold">SOFIA & ALBERTO</span>
                    </div>

                    {/* Body Columns */}
                    <div className="flex-1 grid grid-cols-12 gap-3 py-3 overflow-hidden">
                      {/* Left side: Budget Summary */}
                      <div className="col-span-5 bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-between text-left">
                        <p className="font-mono text-[4.5px] md:text-[6px] text-brand-gold uppercase font-bold">Controlo Financeiro</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[4px] md:text-[5px] text-brand-ivory/50">Orçamento Adjudicado</p>
                            <p className="text-[7.5px] md:text-[9.5px] font-serif font-light text-brand-ivory">750.056 MT</p>
                          </div>
                          <div>
                            <p className="text-[4px] md:text-[5px] text-brand-ivory/50">Total Pago</p>
                            <p className="text-[7.5px] md:text-[9.5px] font-serif font-light text-emerald-400">446.600 MT</p>
                          </div>
                          <div>
                            <p className="text-[4px] md:text-[5px] text-brand-ivory/50">Pendente</p>
                            <p className="text-[7.5px] md:text-[9.5px] font-serif font-light text-brand-gold">303.456 MT</p>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Checklist and Suppliers */}
                      <div className="col-span-7 flex flex-col gap-3">
                        {/* Checklist */}
                        <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-3 text-left space-y-1.5 overflow-y-auto">
                          <p className="font-mono text-[4.5px] md:text-[6px] text-brand-gold uppercase font-bold">Checklist Operacional</p>
                          <div className="space-y-1 text-[4.5px] md:text-[7px] font-sans text-brand-ivory/80 leading-snug">
                            <p className="flex items-center gap-1.5">
                              <span className="text-brand-gold">✓</span>
                              <span className="line-through text-brand-ivory/40">Definir conceito criativo</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="text-brand-gold">✓</span>
                              <span className="line-through text-brand-ivory/40">Adjudicar decorador e catering</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="text-brand-gold">⚡</span>
                              <span>Enviar save the date digital</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="text-brand-ivory/30">○</span>
                              <span>Reunião técnica de layout</span>
                            </p>
                          </div>
                        </div>

                        {/* Supplier status */}
                        <div className="bg-white/5 rounded-xl border border-white/5 px-3 py-2 text-left flex justify-between items-center text-[4.5px] md:text-[6.5px] font-mono">
                          <span className="text-brand-ivory/60">FORNECEDORES ATIVOS:</span>
                          <span className="text-brand-gold font-bold">12 CONTRATADOS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fases de Trabalho (Timeline) */}
              <div className="space-y-10">
                <h2 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">Fases de Condução</h2>
                <div className="space-y-12">
                  {assessoriaPhases.map((block, idx) => (
                    <RevealOnScroll key={block.phase} delay={idx * 0.05}>
                      <div className="border-t border-brand-champagne/40 pt-8">
                        <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-brand-gold font-semibold mb-2">
                          {block.phase}
                        </p>
                        <h3 className="font-serif text-lg md:text-xl font-light text-brand-text-dark mb-6">
                          {block.headline}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {block.items.map((item) => (
                            <article key={item.title} className="space-y-2 text-left">
                              <h4 className="font-serif text-sm font-light text-brand-text-dark">
                                {item.title}
                              </h4>
                              <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                                {item.body}
                              </p>
                            </article>
                          ))}
                        </div>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>

            </div>

            {/* Coluna Direita: Cartão de Reserva Flutuante */}
            <div className="lg:col-span-4">
              <StickyReservationCard
                serviceTitle="Assessoria de Eventos Signature"
                basePrice="1.800 €"
                priceNumeric={1800}
              />
            </div>

          </div>
        </div>
      </section>

      <CTABand
        headline="Existe alguém a cuidar de tudo por si?"
        description="Conte-nos a história do seu evento. Avaliamos juntos o nível de acompanhamento que procura."
        secondaryHref="/portfolio"
        secondaryLabel="Ver histórias reais"
      />
    </>
  );
}
