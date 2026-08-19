"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Search, UserCheck } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Link from "next/link";
import { DEMO_GUESTS } from "@/lib/marketing/convidados-demo";

export default function GuestHeroInteractive() {
  const [activeStep, setActiveStep] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pause when out of view
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subtle auto-progression loop in hero preview
  useEffect(() => {
    if (isUserInteracting || !isInView) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4200);
    return () => clearInterval(timer);
  }, [isUserInteracting, isInView]);

  // Cleanup resume timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  const handleManualStepChange = (idx: number) => {
    setActiveStep(idx);
    setIsUserInteracting(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
      resumeTimeoutRef.current = null;
    }, 12000);
  };

  const guestHero1 = DEMO_GUESTS[0]; // Amélia Cossa
  const guestHero2 = DEMO_GUESTS[2]; // Tânia Mucavele

  // Subtle parallax offsets
  const parallaxGlow = scrollY * 0.08;
  const parallaxMockup = scrollY * -0.04;

  return (
    <section
      ref={sectionRef}
      className="relative pt-32 pb-20 md:pt-44 md:pb-28 bg-[#0C0B0A] text-brand-ivory overflow-hidden border-b border-brand-champagne/20 pointer-events-auto"
    >
      {/* Background Subtle Gradient & Mesh Glow with gentle Parallax */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/15 via-[#0C0B0A] to-[#080707] pointer-events-none transition-transform duration-75"
        style={{ transform: `translate3d(0, ${parallaxGlow}px, 0)` }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-champagne/5 rounded-full blur-3xl pointer-events-none" />

      <div className="site-container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Authority & Editorial Promise */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <RevealOnScroll>
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-brand-gold/70" />
                <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">
                  HAXR SIGNATURE · HOSPITALIDADE & PROTOCOLO PRIVADO
                </span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.08}>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-brand-ivory leading-[1.15] tracking-tight">
                Cada convidado deve sentir que{" "}
                <span className="italic text-brand-champagne font-normal">
                  foi esperado.
                </span>
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={0.16}>
              <p className="font-sans text-base md:text-lg text-brand-ivory/75 font-light leading-relaxed max-w-2xl">
                A HAXR organiza confirmações, acompanhantes, lugares, necessidades especiais e
                recepção para que a experiência do convidado comece muito antes de a porta abrir.
              </p>
            </RevealOnScroll>

            {/* Micro-Signature Tags */}
            <RevealOnScroll delay={0.24}>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {["RSVP INTELIGENTE", "GUEST LIST", "SEATING PLAN", "RECEPTION & CHECK-IN"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold/90 bg-brand-gold/10 border border-brand-gold/20 px-3 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.32}>
              <div className="flex flex-wrap items-center gap-5 pt-4">
                <a
                  href="#showcase-interactivo"
                  className="px-6 py-3.5 rounded-full bg-brand-gold text-brand-black font-mono text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-brand-champagne transition-all duration-300 shadow-md shadow-brand-gold/20"
                >
                  Explorar Demonstração Viva
                </a>
                <Link
                  href="#diagnostico-convidados"
                  className="px-6 py-3.5 rounded-full bg-white/[0.05] border border-brand-champagne/30 text-brand-ivory font-mono text-[10px] uppercase tracking-[0.25em] font-semibold hover:bg-white/[0.1] hover:border-brand-gold transition-all duration-300"
                >
                  Diagnóstico de Recepção
                </Link>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right: Floating Luxury Device Simulator with subtle parallax */}
          <div
            className="lg:col-span-5 relative transition-transform duration-75 ease-out"
            style={{ transform: `translate3d(0, ${parallaxMockup}px, 0)` }}
          >
            <RevealOnScroll delay={0.2}>
              <div className="relative mx-auto max-w-sm rounded-3xl bg-[#141210] border border-brand-champagne/30 p-5 shadow-2xl shadow-black/80 backdrop-blur-xl">
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-brand-champagne/20 pb-3 mb-4">
                  <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold font-bold">
                    DEMONSTRAÇÃO EDITORIAL
                  </span>
                  <span className="font-mono text-[7.5px] text-brand-ivory/40 uppercase">
                    DADOS ILUSTRATIVOS
                  </span>
                </div>

                {/* Simulated Screen Content based on activeStep */}
                <div className="space-y-4 min-h-[300px] flex flex-col justify-between">
                  {activeStep === 0 && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="bg-white/[0.03] border border-brand-champagne/20 rounded-2xl p-4 space-y-2">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-brand-gold block">
                          01 · RSVP Personalizado
                        </span>
                        <h4 className="font-serif text-lg font-light text-brand-ivory">
                          {guestHero1.name}
                        </h4>
                        <p className="text-xs text-brand-ivory/60 font-light">
                          Confirmação registada com acompanhante ({guestHero1.companion}) e restrição alimentar.
                        </p>
                      </div>

                      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-emerald-200">Presença Confirmada</p>
                            <p className="text-[9px] text-emerald-400/70 font-mono">
                              {guestHero1.table} · 2 Lugares
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[8px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                          Confirmado
                        </span>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="bg-white/[0.03] border border-brand-champagne/20 rounded-2xl p-4 space-y-2">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-brand-gold block">
                          02 · Localização de Mesa Instantânea
                        </span>
                        <div className="relative bg-black/40 border border-brand-champagne/30 rounded-lg p-2 flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-brand-gold" />
                          <span className="text-xs text-brand-ivory font-mono">{guestHero1.name}</span>
                        </div>
                      </div>

                      <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-4 text-center space-y-1">
                        <p className="font-mono text-[8px] uppercase tracking-widest text-brand-champagne">
                          MESA ATRIBUÍDA
                        </p>
                        <p className="font-serif text-2xl font-light text-brand-gold">
                          {guestHero1.table}
                        </p>
                        <p className="text-[9px] text-brand-ivory/60 font-mono">
                          {guestHero1.seat} · {guestHero1.sector}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="bg-white/[0.03] border border-brand-champagne/20 rounded-2xl p-4 space-y-2">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-brand-gold block">
                          03 · Check-in da Equipa na Porta
                        </span>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-brand-ivory/70">Acolhimento no Salão</span>
                          <span className="font-mono text-brand-gold font-bold">162 / 200 (81%)</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-gold h-full w-[81%]" />
                        </div>
                      </div>

                      <div className="bg-white/[0.02] border border-brand-champagne/15 rounded-xl p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-brand-gold" />
                          <span className="text-brand-ivory/90 text-xs">
                            Entrada recente: {guestHero2.name}
                          </span>
                        </div>
                        <span className="font-mono text-[8px] text-brand-ivory/40">14:18</span>
                      </div>
                    </div>
                  )}

                  {/* Step Switcher Indicators with manual click handler */}
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-brand-champagne/15">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => handleManualStepChange(idx)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          activeStep === idx
                            ? "w-8 bg-brand-gold"
                            : "w-2 bg-brand-champagne/30 hover:bg-brand-champagne/50"
                        }`}
                        aria-label={`Ver demonstração passo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
