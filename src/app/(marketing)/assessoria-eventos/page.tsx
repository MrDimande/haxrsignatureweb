"use client";

import { useState } from "react";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import DetailGallery from "@/components/ui/DetailGallery";
import StickyReservationCard from "@/components/ui/StickyReservationCard";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import AssessoriaManifesto from "@/components/marketing/AssessoriaManifesto";
import AssessoriaScopeMatrix from "@/components/marketing/AssessoriaScopeMatrix";
import AssessoriaTechEcosystem from "@/components/marketing/AssessoriaTechEcosystem";
import {
  assessoriaNarrative,
  signatureJourneyPhases,
  caseStudies,
} from "@/lib/marketing/editorial";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AssessoriaEventosPage() {
  const [selectedScope, setSelectedScope] = useState<string>("full-service");

  const narrativeBlocks = [
    { key: "problem", title: "O Desafio", text: assessoriaNarrative.problem },
    { key: "impact", title: "O Que Sente", text: assessoriaNarrative.emotionalImpact },
    { key: "solution", title: "Como a HAXR Conduz", text: assessoriaNarrative.solution },
    { key: "after", title: "A Experiência Final", text: assessoriaNarrative.feelingAfter },
  ] as const;

  const weddingCase = caseStudies.find((c) => c.id === "casamento-vania-fabiao") || caseStudies[0];

  const handleScopeSelect = (scopeId: string) => {
    setSelectedScope(scopeId);
    const el = document.getElementById("reservation-card-anchor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <StructuredData page="assessoria" />

      {/* ═══════════════════════════════════════════════════════════════════
          01 · HERO — A PRESENÇA INVISÍVEL
          ═══════════════════════════════════════════════════════════════════ */}
      <PageHero
        label="Assessoria de Eventos Signature"
        headline="Direcção criativa, rigor de governação e presença invisível — para que viva a celebração, não a logística."
        description="A assessoria HAXR Signature une curadoria autoral, controlo financeiro transparente e discrição nos bastidores. Assumimos a complexidade técnica para que o dia do seu casamento pertença inteiramente à sua memória."
      />

      {/* Editorial Metadata Bar */}
      <div className="site-container mx-auto pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[9.5px] font-mono text-brand-text-dark/45 border-b border-brand-champagne/45 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-brand-gold font-bold">HAXR PRIVATE CLIENT ADVISORY</span>
            <span>•</span>
            <span>MOÇAMBIQUE</span>
            <span>•</span>
            <span>EDIÇÃO 2026</span>
          </div>
          <div className="text-brand-text-dark/60 font-semibold">
            CAPACIDADE LIMITADA · ATENDIMENTO RESTRITO POR TEMPORADA
          </div>
        </div>
      </div>

      {/* Immersive Photo Gallery */}
      <DetailGallery />

      {/* ═══════════════════════════════════════════════════════════════════
          02 · O PADRÃO HAXR — INDEPENDÊNCIA, DIRECÇÃO & CONTROLO
          ═══════════════════════════════════════════════════════════════════ */}
      <AssessoriaManifesto />

      {/* ═══════════════════════════════════════════════════════════════════
          03 · TRÊS FORMAS DE ACOMPANHAMENTO — SCOPE OF ENGAGEMENT
          ═══════════════════════════════════════════════════════════════════ */}
      <AssessoriaScopeMatrix onSelectScope={handleScopeSelect} />

      {/* ═══════════════════════════════════════════════════════════════════
          04 · THE SIGNATURE JOURNEY — CINCO FASES DE GOVERNANÇÃO
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 bg-white border-b border-brand-champagne/30">
        <div className="site-container mx-auto space-y-16">
          <RevealOnScroll>
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-brand-gold" />
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                  04 · The Signature Journey
                </span>
              </div>

              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
                Cinco Fases de Governação
              </h2>

              <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
                Do primeiro diálogo de visão ao encerramento do grande dia, cada etapa é orquestrada
                com clareza, prazos rigorosos e serenidade contínua.
              </p>
            </div>
          </RevealOnScroll>

          {/* 5 Phases Timeline Grid */}
          <div className="space-y-10">
            {signatureJourneyPhases.map((phase, idx) => (
              <RevealOnScroll key={phase.phase} delay={idx * 0.08}>
                <div className="border-t border-brand-champagne/45 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
                  <div className="lg:col-span-4 space-y-1">
                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold font-bold block">
                      {phase.phase}
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl font-light text-brand-text-dark">
                      {phase.title}
                    </h3>
                    <p className="font-mono text-[9px] text-brand-text-dark/45 uppercase tracking-wider">
                      {phase.titleEn}
                    </p>
                  </div>

                  <div className="lg:col-span-8 space-y-4">
                    <p className="font-sans text-sm text-brand-text-dark/80 font-light leading-relaxed">
                      {phase.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {phase.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          className="bg-brand-ivory/60 border border-brand-champagne/30 rounded-xl p-3 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                          <span className="text-xs font-sans text-brand-text-dark/80 font-light leading-snug">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          05 · HAXR PRIVATE CLIENT ECOSYSTEM — TECNOLOGIA NOS BASTIDORES
          ═══════════════════════════════════════════════════════════════════ */}
      <AssessoriaTechEcosystem />

      {/* ═══════════════════════════════════════════════════════════════════
          06 · PROJECTOS EM DESTAQUE — THE WORK SPEAKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 bg-brand-ivory">
        <div className="site-container mx-auto space-y-16">
          <RevealOnScroll>
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-brand-gold" />
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                  06 · Projectos em Destaque
                </span>
              </div>

              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
                The Work Speaks
              </h2>

              <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
                Cada celebração conduzida pela HAXR Signature é um testemunho de método, discrição e excelência estética.
              </p>
            </div>
          </RevealOnScroll>

          {/* Luxury Editorial Feature Article: Casamento Vânia Luky & Fabião Dimande */}
          <RevealOnScroll delay={0.1}>
            <article className="bg-white border border-brand-champagne/60 rounded-3xl p-8 md:p-12 shadow-sm space-y-10">
              {/* Feature Header */}
              <div className="border-b border-brand-champagne/35 pb-6 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold font-bold">
                    CASAMENTO · MAPUTO, MOÇAMBIQUE
                  </span>
                  <span className="text-[10px] font-mono text-brand-text-dark/50">
                    Evelyn Eventos · C. de Maputo · Assessoria Completa · Identidade Visual · Convites
                  </span>
                </div>
                <h3 className="font-serif text-2xl md:text-4xl font-light text-brand-text-dark">
                  Vânia Luky & Fabião Dimande
                </h3>
              </div>

              {/* Grid: 2 Columns with Editorial Composition */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Editorial Narrative */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg md:text-xl font-light text-brand-text-dark leading-snug">
                      A experiência digital definiu o tom de toda a celebração, prolongando-se com harmonia até ao grande dia.
                    </h4>
                    <p className="font-sans text-xs md:text-sm text-brand-text-dark/75 font-light leading-relaxed">
                      {weddingCase.context}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-brand-champagne/30 text-xs font-sans">
                    <div>
                      <span className="font-mono text-[8.5px] uppercase font-bold text-brand-gold block">
                        Desafio & Concepção:
                      </span>
                      <p className="text-brand-text-dark/70 font-light mt-0.5 leading-relaxed">
                        {weddingCase.challenge}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[8.5px] uppercase font-bold text-brand-gold block">
                        Direcção & Execução HAXR:
                      </span>
                      <p className="text-brand-text-dark/70 font-light mt-0.5 leading-relaxed">
                        {weddingCase.solution}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[8.5px] uppercase font-bold text-brand-gold block">
                        Memória & Recepção:
                      </span>
                      <p className="text-brand-text-dark/90 font-medium mt-0.5 leading-relaxed">
                        {weddingCase.result}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-6">
                    <Link
                      href="/experiencias/casamento-vania-fabiao"
                      className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase text-brand-gold font-bold hover:underline"
                    >
                      <span>Ver Convite Digital Signature</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/portfolio"
                      className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase text-brand-text-dark/50 hover:text-brand-text-dark"
                    >
                      <span>Arquivo de Portfólio</span>
                    </Link>
                  </div>
                </div>

                {/* Right: Dual Editorial Photo Composition */}
                <div className="lg:col-span-6 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8 rounded-2xl overflow-hidden aspect-[4/3] bg-brand-champagne/10 relative border border-brand-champagne/30 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/casamento-vania-fabiao-evelyn-eventos.webp"
                      alt="Casamento Vânia Luky & Fabião Dimande no Evelyn Eventos, C. de Maputo"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-brand-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[7px] font-mono text-brand-ivory/80">
                      EVELYN EVENTOS · C. DE MAPUTO
                    </div>
                  </div>

                  <div className="col-span-4 rounded-2xl overflow-hidden aspect-[4/3] bg-[#141210] p-2 relative border border-brand-champagne/20 flex flex-col justify-between shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/convite-mockup-vania-fabiao.png"
                      alt="Convite Digital Vânia & Fabião"
                      className="w-full h-auto max-h-[90%] object-contain mx-auto my-auto rounded-lg"
                    />
                    <span className="text-[6.5px] font-mono text-brand-gold text-center block pt-1">
                      CONVITE & RSVP
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </RevealOnScroll>

          {/* Editorial Philosophy Blocks */}
          <div className="border-t border-brand-champagne/45 pt-12 space-y-8">
            <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">
              A Nossa Filosofia de Condução
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {narrativeBlocks.map((block) => (
                <article key={block.key} className="space-y-2.5">
                  <p className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-brand-text-dark/45">
                    {block.title}
                  </p>
                  <p className="font-serif text-sm md:text-base text-brand-text-dark/85 leading-relaxed font-light">
                    {block.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          07 · DIAGNÓSTICO PRIVADO — BEGIN YOUR CELEBRATION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 bg-white border-t border-brand-champagne/30 pointer-events-auto">
        <div className="site-container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Side: Consultation Narrative */}
            <div className="lg:col-span-8 space-y-10">
              <RevealOnScroll>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-brand-gold" />
                    <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                      07 · Diagnóstico Privado
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
                    Begin Your Celebration
                  </h2>

                  <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
                    A primeira conversa é confidencial, estruturada e sem qualquer obrigação comercial.
                    Dedicamos esse momento para compreender a dimensão da vossa visão, mapear os principais
                    desafios e apresentar a arquitectura de acompanhamento ideal para o vosso casamento.
                  </p>
                </div>
              </RevealOnScroll>

              {/* Steps of Diagnosis */}
              <div className="space-y-6 pt-4">
                <div className="border-t border-brand-champagne/35 pt-6 flex gap-4 items-start">
                  <span className="font-mono text-sm text-brand-gold font-bold">01</span>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base text-brand-text-dark font-light">
                      Alinhamento de Visão & Escala
                    </h4>
                    <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                      Conversa estratégica sobre data, local, perfil de convidados e expectativas estéticas.
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-champagne/35 pt-6 flex gap-4 items-start">
                  <span className="font-mono text-sm text-brand-gold font-bold">02</span>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base text-brand-text-dark font-light">
                      Mapeamento de Complexidade Técnica
                    </h4>
                    <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                      Diagnóstico de fornecedores necessários, requisitos de infraestrutura e viabilidade orçamental.
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-champagne/35 pt-6 flex gap-4 items-start">
                  <span className="font-mono text-sm text-brand-gold font-bold">03</span>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base text-brand-text-dark font-light">
                      Apresentação de Proposta Fechada
                    </h4>
                    <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                      Estruturação do âmbito de assessoria com cronograma, entregáveis e transparência total de honorários.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Sticky Reservation Card */}
            <div className="lg:col-span-4">
              <StickyReservationCard
                serviceTitle="Assessoria de Eventos Signature"
                selectedScopeId={selectedScope}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Global CTA Band */}
      <CTABand
        headline="Pronto para conduzir o seu evento com tranquilidade?"
        description="Agende uma sessão privada de diagnóstico. Avaliamos juntos a complexidade e o nível de assessoria ideal para o seu dia."
        secondaryHref="/portfolio"
        secondaryLabel="Explorar arquivo de celebrações"
      />
    </>
  );
}
