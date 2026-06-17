"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import HeroParticles from "@/components/effects/HeroParticles";
import { portfolioCopy } from "@/lib/site-config";

export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { hero } = portfolioCopy;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const items = el.querySelectorAll("[data-hero-item]");
    gsap.fromTo(
      items,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 1.4,
        stagger: 0.18,
        delay: 0.4,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black-soft" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold-glow rounded-full blur-[140px] opacity-30" />

      <HeroParticles />

      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <p
          data-hero-item
          className="font-mono text-[9px] tracking-[0.6em] uppercase text-grey mb-8"
        >
          {hero.location}
        </p>

        <h1
          data-hero-item
          className="font-serif font-light tracking-[0.3em] text-white leading-none mb-6"
          style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
        >
          <span className="sr-only">
            HAXR Signature — assessoria, design e tecnologia para eventos
            exclusivos em {hero.location}
          </span>
          HAXR
        </h1>

        <p
          data-hero-item
          className="font-serif font-light text-lg md:text-xl tracking-[0.25em] text-white/50 mb-8"
        >
          Signature
        </p>

        <div data-hero-item className="line-gold w-20 mb-10" />

        <p
          data-hero-item
          className="font-mono text-[9px] md:text-[10px] tracking-[0.45em] uppercase text-gold/60 mb-6"
        >
          {hero.tagline}
        </p>

        <p
          data-hero-item
          className="font-sans text-sm md:text-base text-grey/80 max-w-md leading-relaxed mb-16"
        >
          {hero.subtitle}
        </p>

        <div
          data-hero-item
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="/contacto"
            className="group inline-flex items-center gap-3 border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-8 py-3.5 hover:border-gold hover:bg-gold/5 transition-all duration-700"
          >
            <span>{hero.ctaPrimary}</span>
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </a>
          <a
            href="#pilares"
            className="group inline-flex items-center gap-3 border border-grey-dark text-grey text-[11px] tracking-[0.3em] uppercase px-8 py-3.5 hover:border-gold/40 hover:text-gold transition-all duration-700"
          >
            <span>{hero.ctaSecondary}</span>
          </a>
        </div>
      </div>

      <div
        data-hero-item
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-gold/20" />
      </div>

      <div className="art-deco-corner art-deco-corner--tl m-8 md:m-12" />
      <div className="art-deco-corner art-deco-corner--br m-8 md:m-12" />
    </section>
  );
}
