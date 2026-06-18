"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { gsap } from "@/lib/gsap";
import { shouldUseScrollAnimations } from "@/lib/motion/preferences";
import BrandLogo from "@/components/ui/BrandLogo";
import { portfolioCopy } from "@/lib/site-config";

const HeroParticles = dynamic(
  () => import("@/components/effects/HeroParticles"),
  { ssr: false }
);

export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { hero } = portfolioCopy;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const items = el.querySelectorAll("[data-hero-item]");

    if (!shouldUseScrollAnimations()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      items,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 1.35,
        stagger: 0.16,
        delay: 0.2,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black-soft" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,900px)] h-[min(90vw,900px)] bg-gold-glow rounded-full blur-[160px] opacity-[0.22] motion-reduce:opacity-10 motion-reduce:blur-[80px]"
        aria-hidden
      />

      <HeroParticles />

      <div
        ref={contentRef}
        className="site-hero relative z-10 flex flex-col items-center text-center pt-24 pb-28 md:pt-28 md:pb-32"
      >
        <p
          data-hero-item
          className="font-mono text-[10px] md:text-[11px] tracking-[0.55em] uppercase text-grey/75 mb-10 md:mb-14"
        >
          {hero.location}
        </p>

        <div data-hero-item className="mb-10 md:mb-14 w-full flex justify-center">
          <h1 className="sr-only">
            HAXR Signature — assessoria, design e tecnologia para eventos
            exclusivos em {hero.location}
          </h1>
          <BrandLogo variant="hero" priority className="mx-auto" />
        </div>

        <div
          data-hero-item
          className="line-gold w-28 md:w-40 mb-10 md:mb-14 opacity-80"
        />

        <p
          data-hero-item
          className="font-mono text-[10px] md:text-[11px] tracking-[0.42em] uppercase text-gold/70 mb-8 md:mb-10"
        >
          {hero.tagline}
        </p>

        <p
          data-hero-item
          className="type-lead text-grey/85 max-w-xl md:max-w-2xl lg:max-w-3xl leading-relaxed mb-14 md:mb-20 px-2"
        >
          {hero.subtitle}
        </p>

        <div
          data-hero-item
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 md:gap-5 w-full sm:w-auto"
        >
          <a href="/contacto" className="btn-editorial btn-editorial--solid">
            <span>{hero.ctaPrimary}</span>
            <span aria-hidden>→</span>
          </a>
          <a href="#pilares" className="btn-editorial btn-editorial--ghost">
            <span>{hero.ctaSecondary}</span>
          </a>
        </div>
      </div>

      <div
        data-hero-item
        className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
      >
        <div className="w-px h-12 md:h-16 bg-gradient-to-b from-transparent via-gold/25 to-transparent" />
      </div>

      <div className="art-deco-corner art-deco-corner--tl m-8 md:m-14 lg:m-16" />
      <div className="art-deco-corner art-deco-corner--br m-8 md:m-14 lg:m-16" />
    </section>
  );
}
