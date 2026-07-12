"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  homeConciergeSection,
  type ConciergeScenarioId,
} from "@/lib/marketing/home-content";
import HomeConciergeMockup from "@/components/home/HomeConciergeMockup";
import HomeConciergeInbox from "@/components/home/HomeConciergeInbox";
import HomeConciergeModuleArt from "@/components/home/HomeConciergeModuleArt";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const ROTATE_MS = 8000;
const PROCESSING_MS = 1400;

export default function HomeConciergeExperience() {
  const scenarios = homeConciergeSection.scenarios;
  const [activeId, setActiveId] = useState<ConciergeScenarioId>(
    scenarios[0].id
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paused, setPaused] = useState(false);

  const activeScenario =
    scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  const selectScenario = useCallback((id: ConciergeScenarioId) => {
    setActiveId(id);
    setIsProcessing(true);
    window.setTimeout(() => setIsProcessing(false), PROCESSING_MS);
  }, []);

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setActiveId((current) => {
        const idx = scenarios.findIndex((s) => s.id === current);
        const next = scenarios[(idx + 1) % scenarios.length];
        setIsProcessing(true);
        window.setTimeout(() => setIsProcessing(false), PROCESSING_MS);
        return next.id;
      });
    }, ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [paused, scenarios]);

  return (
    <>
      {/* Hero — estilo Meet aiSLE */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <RevealOnScroll>
              <div
                className="flex flex-wrap gap-2 mb-8"
                role="tablist"
                aria-label="Tipos de documento do HAXR Concierge"
              >
                {scenarios.map((scenario) => {
                  const isActive = scenario.id === activeId;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => selectScenario(scenario.id)}
                      className={[
                        "px-4 py-2 font-sans text-xs font-semibold tracking-wide uppercase transition-colors border",
                        isActive
                          ? "bg-brand-gold/15 border-brand-gold/50 text-brand-gold-light"
                          : "bg-white/5 border-white/10 text-brand-ivory/65 hover:border-white/20 hover:text-brand-ivory",
                      ].join(" ")}
                    >
                      {scenario.tabLabel}
                    </button>
                  );
                })}
              </div>
              <HomeConciergeMockup
                scenario={activeScenario}
                isProcessing={isProcessing}
              />
            </RevealOnScroll>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 lg:pt-4">
            <RevealOnScroll delay={0.06}>
              <p className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold-light/90 mb-4">
                {homeConciergeSection.label}
              </p>
              <h2 className="type-section-title type-section-title--light mb-4">
                {homeConciergeSection.headline}
              </h2>
              <p className="type-section-lead type-section-lead--light mb-6 max-w-xl">
                {homeConciergeSection.description}
              </p>

              <ul className="space-y-2.5 mb-8">
                {homeConciergeSection.heroBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 font-sans text-sm font-medium text-brand-ivory/90"
                  >
                    <Check
                      className="w-4 h-4 text-brand-gold-light shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    {bullet}
                  </li>
                ))}
              </ul>

              <p className="font-serif text-base italic text-brand-champagne/90 mb-8 border-l-2 border-brand-gold/50 pl-4">
                {homeConciergeSection.trustLine}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={homeConciergeSection.ctaHref}
                  className="btn-editorial btn-editorial--solid text-center"
                >
                  {homeConciergeSection.ctaLabel}
                </Link>
                <Link
                  href={homeConciergeSection.secondaryCtaHref}
                  className="btn-editorial btn-editorial--outline !text-brand-ivory !border-brand-ivory/35 hover:!border-brand-gold text-center"
                >
                  {homeConciergeSection.secondaryCtaLabel}
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>

      {/* Inbox do painel — Review Your aiSLE equivalent */}
      <div className="mt-20 md:mt-28">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="section-label section-label--light mb-4">Dashboard</p>
            <h3 className="font-serif text-2xl md:text-3xl text-brand-ivory mb-3">
              Caixa de entrada do evento
            </h3>
            <p className="font-sans text-base text-brand-ivory/65">
              Como no painel Loverly — cada documento entra na fila de revisão
              antes de actualizar fornecedores, orçamento e convidados.
            </p>
          </div>
          <HomeConciergeInbox activeId={activeId} onSelect={selectScenario} />
        </RevealOnScroll>
      </div>

      {/* Integração — 5 ferramentas com ilustrações */}
      <div className="mt-20 md:mt-28">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="section-label section-label--light mb-4">
              Integração
            </p>
            <h3 className="font-serif text-2xl md:text-3xl text-brand-ivory mb-4">
              {homeConciergeSection.modulesHeadline}
            </h3>
            <p className="font-sans text-base text-brand-ivory/65">
              {homeConciergeSection.modulesDescription}
            </p>
          </div>
        </RevealOnScroll>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {homeConciergeSection.integrationTools.map((tool, index) => {
            const isActive = tool.scenarioId === activeId;
            return (
              <RevealOnScroll
                key={tool.id}
                delay={index * 0.04}
                className="w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-1.5rem)] max-w-sm"
              >
                <button
                  type="button"
                  onClick={() => selectScenario(tool.scenarioId)}
                  className={[
                    "w-full h-full text-center p-8 border transition-colors",
                    isActive
                      ? "border-brand-gold/40 bg-brand-ivory/95 text-brand-text-dark"
                      : "border-white/10 bg-[#f7f1e8] text-brand-text-dark hover:border-brand-gold/25",
                  ].join(" ")}
                >
                  <HomeConciergeModuleArt
                    moduleId={tool.id}
                    className="mb-7"
                  />
                  <p className="font-serif text-lg font-medium mb-4">
                    {tool.title}
                  </p>
                  <p className="font-sans text-sm text-brand-text-dark/70 leading-relaxed">
                    {tool.description}
                  </p>
                </button>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </>
  );
}
