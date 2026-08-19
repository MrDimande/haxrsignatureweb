"use client";

import { useEffect, useState, useRef } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { Camera, Heart, Share2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function GuestExperienceExtensions() {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.02;

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 bg-white text-brand-text-dark border-b border-brand-champagne/30 pointer-events-auto"
    >
      <div className="site-container mx-auto space-y-16">
        {/* Section Header */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                06 · Experience Extensions
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
              Além da Recepção
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
              A experiência do convidado não termina quando se senta à mesa. Criamos dinâmicas
              interactivas de envolvimento e partilha de memórias para transformar cada presença
              num momento de celebração partilhada.
            </p>
          </div>
        </RevealOnScroll>

        {/* Feature Grid: Placa 'Eu espio...' + Creative Dimensions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left: 3 Interactive Dimensions */}
          <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
            <RevealOnScroll delay={0.1}>
              <div className="space-y-6">
                <div className="border-t border-brand-champagne/40 pt-5 space-y-2">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <Camera className="w-4 h-4 text-brand-gold" />
                    <h3 className="font-serif text-lg text-brand-text-dark font-light">
                      Álbum Colaborativo & Placas «Eu Espio...»
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                    Cartões de mesa interactivos com desafios fotográficos lúdicos e QR Code directo
                    para carregamento de fotos e vídeos dos convidados para a galeria privada do casal.
                  </p>
                </div>

                <div className="border-t border-brand-champagne/40 pt-5 space-y-2">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <Heart className="w-4 h-4 text-brand-gold" />
                    <h3 className="font-serif text-lg text-brand-text-dark font-light">
                      Livro de Mensagens & Votos Digitais
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                    Espaço dedicado onde familiares e amigos distantes ou presentes podem deixar notas
                    afectivas e dedicatórias que ficam eternizadas no arquivo do evento.
                  </p>
                </div>

                <div className="border-t border-brand-champagne/40 pt-5 space-y-2">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <Share2 className="w-4 h-4 text-brand-gold" />
                    <h3 className="font-serif text-lg text-brand-text-dark font-light">
                      Plus Memories — O Arquivo Pós-Evento
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                    Partilha elegante de fotografias oficiais, agradecimentos personalizados e vídeos
                    com os convidados nas semanas que se seguem ao grande dia.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/plus-memories"
                    className="inline-flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-wider text-brand-gold font-bold hover:underline"
                  >
                    <span>Conhecer a Experiência Plus Memories</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right: Real Editorial Photo of 'Eu espio...' Card (Full & Uncropped with subtle parallax) */}
          <div
            className="lg:col-span-6 order-1 lg:order-2 transition-transform duration-75 ease-out"
            style={{ transform: `translate3d(0, ${parallaxOffset}px, 0)` }}
          >
            <RevealOnScroll delay={0.15}>
              <div className="rounded-3xl bg-[#FAF8F5] border border-brand-champagne/40 shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-brand-champagne/30 shadow-2xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/portfolio/mosaic-eu-espio-qr.webp"
                    alt="Desafio interactivo Eu espio com QR Code para participação dos convidados HAXR"
                    className="w-full h-auto object-contain block"
                  />
                </div>
                <div className="w-full max-w-sm mt-4 px-4 py-2.5 rounded-xl bg-brand-black/90 border border-brand-champagne/30 text-[8.5px] font-mono text-brand-ivory flex justify-between items-center">
                  <span>PLACA INTERACTIVA · DESAFIO FOTOGRÁFICO</span>
                  <span className="text-brand-gold font-bold">QR CODE DINÂMICO</span>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
