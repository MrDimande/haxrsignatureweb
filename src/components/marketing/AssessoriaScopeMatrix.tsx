"use client";

import { assessoriaScopes, type AssessoriaScope } from "@/lib/marketing/editorial";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { Check, ArrowRight } from "lucide-react";

interface AssessoriaScopeMatrixProps {
  onSelectScope?: (scopeId: string) => void;
}

export default function AssessoriaScopeMatrix({
  onSelectScope,
}: AssessoriaScopeMatrixProps) {
  const handleSelect = (scopeId: string) => {
    if (onSelectScope) {
      onSelectScope(scopeId);
    } else {
      const el = document.getElementById("reservation-card-anchor");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="relative py-16 md:py-24 bg-brand-ivory pointer-events-auto">
      <div className="site-container mx-auto space-y-16">
        {/* Section Header */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                03 · Três Formas de Acompanhamento
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
              Scope of Engagement
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
              Cada celebração possui a sua própria complexidade, ambição e escala. Estruturamos a nossa
              intervenção em três âmbitos de assessoria distintos, desenhados para garantir direção executiva
              no formato ideal para o casal.
            </p>
          </div>
        </RevealOnScroll>

        {/* 3 Scopes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {assessoriaScopes.map((scope: AssessoriaScope, idx: number) => {
            const isFeatured = scope.id === "full-service";

            return (
              <RevealOnScroll key={scope.id} delay={idx * 0.1}>
                <div
                  className={`relative rounded-3xl p-8 flex flex-col justify-between h-full transition-all duration-300 ${
                    isFeatured
                      ? "bg-brand-black text-brand-ivory border-2 border-brand-gold/60 shadow-2xl"
                      : "bg-white text-brand-text-dark border border-brand-champagne/60 shadow-md hover:border-brand-gold/50"
                  }`}
                >
                  {/* Top Badge & Numeral */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-mono text-xs font-bold tracking-[0.3em] ${
                          isFeatured ? "text-brand-gold" : "text-brand-gold"
                        }`}
                      >
                        NÍVEL {scope.num}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[8.5px] font-mono tracking-wider uppercase font-semibold ${
                          isFeatured
                            ? "bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30"
                            : "bg-brand-champagne/30 text-brand-text-dark/80 border border-brand-champagne/50"
                        }`}
                      >
                        {scope.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h3
                        className={`font-serif text-xl md:text-2xl font-light leading-snug ${
                          isFeatured ? "text-brand-ivory" : "text-brand-text-dark"
                        }`}
                      >
                        {scope.name}
                      </h3>
                      <p
                        className={`font-mono text-[9px] tracking-wider uppercase ${
                          isFeatured ? "text-brand-ivory/50" : "text-brand-text-dark/45"
                        }`}
                      >
                        {scope.nameEn}
                      </p>
                    </div>

                    {/* Tagline */}
                    <p
                      className={`font-sans text-xs md:text-sm font-light leading-relaxed ${
                        isFeatured ? "text-brand-ivory/75" : "text-brand-text-dark/75"
                      }`}
                    >
                      {scope.tagline}
                    </p>

                    {/* Deliverables List */}
                    <div className="space-y-3 pt-4 border-t border-brand-champagne/30">
                      <p
                        className={`font-mono text-[8px] tracking-[0.3em] uppercase font-bold ${
                          isFeatured ? "text-brand-gold" : "text-brand-gold"
                        }`}
                      >
                        Âmbito de Intervenção
                      </p>
                      <ul className="space-y-2.5">
                        {scope.deliverables.map((item, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2.5 text-xs font-light">
                            <Check
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                isFeatured ? "text-brand-gold" : "text-brand-gold"
                              }`}
                            />
                            <span className={isFeatured ? "text-brand-ivory/85" : "text-brand-text-dark/85"}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Ideal For + Action Button */}
                  <div className="pt-8 space-y-4">
                    <div
                      className={`p-3.5 rounded-xl text-[11px] font-sans font-light leading-relaxed ${
                        isFeatured ? "bg-white/5 text-brand-ivory/70" : "bg-brand-ivory text-brand-text-dark/70"
                      }`}
                    >
                      <span className="font-semibold block mb-0.5 text-[9.5px] uppercase font-mono tracking-wider text-brand-gold">
                        Perfil Recomendado:
                      </span>
                      {scope.idealFor}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelect(scope.id)}
                      className={`w-full py-3.5 px-5 rounded-full font-mono text-[9px] tracking-[0.25em] uppercase font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isFeatured
                          ? "bg-brand-gold text-brand-black hover:bg-brand-gold-light shadow-lg"
                          : "bg-brand-black text-brand-ivory hover:bg-brand-text-dark"
                      }`}
                    >
                      <span>Selecionar para Diagnóstico</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
