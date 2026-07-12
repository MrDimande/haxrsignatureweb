"use client";

import Link from "next/link";
import { ArrowRight, Mail, Upload, Zap } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import HomeConciergeAisle from "@/components/home/HomeConciergeAisle";
import { homeConciergeSection } from "@/lib/marketing/home-content";

const highlightIcons = {
  upload: Upload,
  email: Mail,
  sync: Zap,
} as const;

interface HomeConciergeSectionProps {
  full?: boolean;
}

export default function HomeConciergeSection({ full = true }: HomeConciergeSectionProps) {
  return (
    <section
      id="haxr-concierge"
      className="relative bg-[#221917] border-y border-brand-champagne/10 overflow-hidden text-white"
    >
      {/* Premium background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 30%, rgba(184,138,42,0.08), transparent 70%)",
        }}
        aria-hidden
      />

      {/* 1. Main Showcase (MacBook & iPhone Mockups) */}
      <div className="relative z-10 py-12 md:py-20 lg:py-24">
        <div className="site-container-wide">
          <HomeConciergeAisle />
        </div>
      </div>

      {/* Full Mode Subsections: Only rendered on the dedicated page, hidden on the homepage */}
      {full && (
        <>
          {/* 2. Editorial Blocks (AI Organizes / Save It. Sort It.) */}
          {homeConciergeSection.editorialBlocks.map((block, index) => (
            <div
              key={block.id}
              className="relative z-10 border-t border-brand-champagne/10 bg-brand-black/20"
            >
              <div className="site-container-wide py-16 md:py-24">
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                    index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  {/* Graphic Card Visual (Right Side) */}
                  <RevealOnScroll>
                    <div
                      className="aspect-[4/3] border border-brand-champagne/15 bg-[#1a1312] rounded-[2rem] flex items-center justify-center p-8 shadow-xl relative overflow-hidden group hover:border-brand-gold/30 transition-colors duration-500"
                      aria-hidden
                    >
                      {/* Subtle inner golden glow */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(184,138,42,0.2),transparent)]" />

                      <div className="text-center max-w-xs relative z-10 space-y-3">
                        <p className="font-serif text-2xl md:text-3xl font-light tracking-wide text-brand-ivory">
                          {index === 0 ? "PDF · Excel · Email" : "IA + Validação HAXR"}
                        </p>
                        <p className="font-sans text-xs text-brand-ivory/55 leading-relaxed font-light">
                          {index === 0
                            ? "Documentos soltos entram pela caixa de entrada"
                            : "Nada é gravado sem revisão humana"}
                        </p>
                      </div>
                    </div>
                  </RevealOnScroll>

                  {/* Text Copy (Left Side) */}
                  <RevealOnScroll delay={0.06} className="space-y-6 text-left">
                    <div className="inline-flex items-center gap-2.5 text-brand-gold">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                      </svg>
                      <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Fluxo Inteligente</span>
                    </div>

                    <h3 className="font-serif text-3xl md:text-4xl font-light text-white leading-tight">
                      {block.headline}
                    </h3>

                    <p className="font-sans text-sm md:text-base text-brand-ivory/70 leading-relaxed font-light">
                      {block.description}
                    </p>

                    <div className="pt-2">
                      <Link
                        href={
                          index === 0
                            ? homeConciergeSection.setupCtaHref
                            : `${homeConciergeSection.setupCtaHref}#como-funciona`
                        }
                        className="btn-editorial btn-editorial--outline !text-brand-ivory !border-brand-ivory/30 hover:!border-brand-gold inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span>{block.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </Link>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>
            </div>
          ))}

          {/* 3. Three Feature highlights cards */}
          <div className="relative z-10 border-t border-brand-champagne/10 bg-brand-black/35 py-16 md:py-24 text-brand-ivory">
            <div className="site-container-wide">
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {homeConciergeSection.featureHighlights.map((feature, index) => {
                  const Icon =
                    highlightIcons[feature.id as keyof typeof highlightIcons] ??
                    Upload;
                  return (
                    <RevealOnScroll
                      key={feature.id}
                      delay={index * 0.05}
                      className="w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-1.5rem)] max-w-md text-center p-8 bg-[#1a1312]/60 border border-brand-champagne/10 rounded-[2rem] hover:border-brand-gold/30 transition-all duration-500 hover:-translate-y-0.5 shadow-md"
                    >
                      <span className="inline-flex items-center justify-center w-14 h-14 border border-brand-gold/35 text-brand-gold-light mx-auto mb-7 rounded-sm">
                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                      </span>
                      <h4 className="font-serif text-lg font-light mb-4 text-white">
                        {feature.title}
                      </h4>
                      <p className="font-sans text-xs md:text-sm text-brand-ivory/65 leading-relaxed mb-7 font-light">
                        {feature.description}
                      </p>
                      <Link
                        href={homeConciergeSection.setupCtaHref}
                        className="inline-flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase font-bold text-brand-gold hover:text-white transition-colors"
                      >
                        <span>{feature.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </Link>
                    </RevealOnScroll>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Como funciona - vertical flow steps list */}
          <div
            id="haxr-concierge-fluxo"
            className="relative z-10 border-t border-brand-champagne/10 bg-brand-black/20 py-16 md:py-24 text-brand-ivory"
          >
            <div className="site-container-wide">
              <RevealOnScroll>
                <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
                  <h3 className="font-serif text-3xl md:text-4xl text-white font-light">
                    {homeConciergeSection.flowHeadline}
                  </h3>
                  <p className="font-sans text-sm md:text-base text-brand-ivory/65 font-light">
                    {homeConciergeSection.flowDescription}
                  </p>
                </div>
              </RevealOnScroll>

              <ul className="max-w-3xl mx-auto space-y-12 md:space-y-14">
                {homeConciergeSection.steps.map((step, index) => (
                  <RevealOnScroll key={step.num} delay={index * 0.05}>
                    <li className="flex flex-nowrap gap-4 md:gap-6 items-start">
                      <span className="font-serif text-[clamp(2rem,6vw,3.5rem)] leading-none text-brand-gold/35 shrink-0 md:w-[1.5em] font-light">
                        {step.num}.
                      </span>
                      <div className="flex-1 text-left pt-1">
                        <p className="font-mono text-[9px] tracking-widest uppercase text-brand-gold font-bold mb-2">
                          {step.title}
                        </p>
                        <p className="font-sans text-sm md:text-base text-brand-ivory/70 leading-relaxed font-light">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  </RevealOnScroll>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. Final CTA Block (Plan Smarter) */}
          <div className="relative z-10 border-t border-brand-champagne/10 bg-[#1a1312]">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div
                className="lg:col-span-2 min-h-[240px] bg-gradient-to-br from-brand-black via-[#1c1412] to-brand-gold/10 flex items-center justify-center p-10 border-r border-brand-champagne/10"
                aria-hidden
              >
                <div className="text-center space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-brand-gold font-bold">
                    HAXR Concierge
                  </p>
                  <p className="font-serif text-xl sm:text-2xl text-white font-light">
                    Inbox · Fornecedores · Orçamento
                  </p>
                </div>
              </div>
              <div className="lg:col-span-3 px-6 py-14 md:px-16 md:py-20 flex flex-col justify-center text-left">
                <RevealOnScroll className="space-y-6">
                  <h3 className="font-serif text-3xl md:text-4xl text-white font-light">
                    {homeConciergeSection.finalCta.headline}
                  </h3>
                  <p className="font-sans text-sm md:text-base text-brand-ivory/70 leading-relaxed font-light max-w-xl">
                    {homeConciergeSection.finalCta.description}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <Link
                      href={homeConciergeSection.setupCtaHref}
                      className="bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[10px] tracking-widest uppercase font-bold py-4 px-8 rounded-sm shadow-md transition-colors cursor-pointer inline-block"
                    >
                      {homeConciergeSection.setupCtaLabel}
                    </Link>
                    <Link
                      href={homeConciergeSection.projectCtaHref}
                      className="font-mono text-[10px] tracking-widest uppercase font-bold text-brand-ivory/80 hover:text-brand-gold transition-colors border-b border-brand-ivory/30 hover:border-brand-gold pb-1 inline-block"
                    >
                      {homeConciergeSection.finalCta.ctaLabel}
                    </Link>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
