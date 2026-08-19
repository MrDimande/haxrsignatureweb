"use client";

import { useEffect, useState, useRef } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function GuestPhysicalIdentity() {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Only compute when near viewport
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.025;

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 bg-brand-ivory text-brand-text-dark border-b border-brand-champagne/30 pointer-events-auto"
    >
      <div className="site-container mx-auto space-y-16">
        {/* Section Header */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                05 · Da Informação à Identidade
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
              A Tecnologia Ganha Forma no Salão
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
              O planeamento digital não termina no ecrã. Traduz-se em marcadores de mesa autorais,
              menus de alta-costura, seating charts impressos e uma estética rigorosamente coordenada
              com o conceito do casamento.
            </p>
          </div>
        </RevealOnScroll>

        {/* Feature Composition: Photography + Editorial Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left: Real Event Styling Photo with subtle parallax */}
          <div
            className="lg:col-span-6 transition-transform duration-75 ease-out"
            style={{ transform: `translate3d(0, ${parallaxOffset}px, 0)` }}
          >
            <RevealOnScroll delay={0.1}>
              <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-brand-champagne/10 relative border border-brand-champagne/40 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/portfolio/mosaic-mesa-detalhe-dourado.webp"
                  alt="Mesa de recepção com cadeiras douradas e styling de casamento HAXR"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-3 left-3 right-3 bg-brand-black/65 backdrop-blur-md px-3.5 py-2 rounded-xl text-[8px] font-mono text-brand-ivory/90 flex justify-between items-center">
                  <span>STYLING DE RECEPÇÃO · HAXR SIGNATURE</span>
                  <span className="text-brand-gold">MAPUTO, MOÇAMBIQUE</span>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right: 3 Tangible Touchpoints */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <RevealOnScroll delay={0.15}>
              <div className="space-y-6">
                <div className="border-t border-brand-champagne/40 pt-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <span className="font-mono text-xs font-bold">01</span>
                    <h3 className="font-serif text-lg text-brand-text-dark font-light">
                      Marcadores & Indicadores de Mesa Nominais
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                    Identificadores tipográficos e monogramas exclusivos desenhados para cada mesa,
                    estabelecendo continuidade visual desde o convite digital até ao lugar do convidado.
                  </p>
                </div>

                <div className="border-t border-brand-champagne/40 pt-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <span className="font-mono text-xs font-bold">02</span>
                    <h3 className="font-serif text-lg text-brand-text-dark font-light">
                      Menus & Papelaria Coordenada
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                    Papéis de textura nobre, impressão em relevo e linguagem gastronómica impecável,
                    garantindo que o menu seja também uma peça de colecção e memória.
                  </p>
                </div>

                <div className="border-t border-brand-champagne/40 pt-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <span className="font-mono text-xs font-bold">03</span>
                    <h3 className="font-serif text-lg text-brand-text-dark font-light">
                      Seating Charts & Painéis de Boas-Vindas
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                    Instalações físicas de entrada que dialogam com a arquitectura do espaço e
                    complementam o acesso digital via QR Code para convidados de todas as idades.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/convites-identidade-visual"
                    className="inline-flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-wider text-brand-gold font-bold hover:underline"
                  >
                    <span>Explorar Identidade Visual & Convites</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
