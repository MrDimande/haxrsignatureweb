"use client";

import { haxrStandardPillars } from "@/lib/marketing/editorial";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { ShieldCheck, Compass, Sparkles } from "lucide-react";

export default function AssessoriaManifesto() {
  const pillarIcons = [ShieldCheck, Compass, Sparkles];

  return (
    <section className="relative py-16 md:py-24 bg-[#0d0c0a] text-brand-ivory overflow-hidden border-y border-brand-champagne/20">
      {/* Background Subtle Luxury Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,rgba(184,138,42,0.18),transparent_70%)]" />

      <div className="site-container mx-auto relative z-10 space-y-16">
        {/* Eyebrow & Headline Manifesto */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                02 · O Padrão HAXR
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-ivory leading-tight">
              O luxo não está em quantas decisões o casal toma.{" "}
              <span className="italic font-normal text-brand-champagne">
                Está em quantas deixam de pesar sobre si.
              </span>
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-ivory/70 font-light leading-relaxed">
              A assessoria HAXR Signature não é gestão convencional de tarefas. É direcção criativa,
              rigor de governação e uma presença serena e invisível nos bastidores — para que viva
              a antecipação e a celebração do seu casamento em plenitude.
            </p>
          </div>
        </RevealOnScroll>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 pt-4">
          {haxrStandardPillars.map((pillar, idx) => {
            const Icon = pillarIcons[idx] || ShieldCheck;
            return (
              <RevealOnScroll key={pillar.num} delay={idx * 0.1}>
                <div className="bg-white/[0.03] border border-brand-champagne/20 rounded-2xl p-6 md:p-8 space-y-6 hover:border-brand-gold/40 transition-colors h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.3em] text-brand-gold font-bold">
                        {pillar.num}
                      </span>
                      <Icon className="w-4 h-4 text-brand-champagne/60" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-serif text-lg md:text-xl font-light text-brand-ivory">
                        {pillar.title}
                      </h3>
                      <p className="font-mono text-[8.5px] tracking-wider uppercase text-brand-gold/70">
                        {pillar.subtitle}
                      </p>
                    </div>

                    <p className="font-sans text-xs md:text-sm text-brand-ivory/75 font-light leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-brand-ivory/40">
                    <span>HAXR SIGNATURE STANDARD</span>
                    <span className="text-brand-gold">TRANSPARÊNCIA & DISCRIÇÃO</span>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Bottom Seal */}
        <RevealOnScroll delay={0.3}>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-mono text-brand-ivory/50">
            <span className="text-brand-gold tracking-[0.2em] uppercase font-bold text-[9px]">
              CAPACIDADE LIMITADA · UM NÚMERO RESTRITO DE CELEBRAÇÕES POR TEMPORADA
            </span>
            <span className="text-[10px]">
              DEDICAÇÃO INTEGRAL A CADA CASAL
            </span>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
