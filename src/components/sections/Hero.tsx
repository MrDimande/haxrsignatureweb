"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { shouldUseScrollAnimations } from "@/lib/motion/preferences";
import { heroAssets } from "@/lib/assets";
import { Calendar, ArrowRight } from "lucide-react";

export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");

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
        duration: 1.2,
        stagger: 0.15,
        delay: 0.1,
        ease: "power4.out",
      }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("tipo", "casamento");
    if (eventDate) params.set("data", eventDate);
    router.push(`/contacto?${params.toString()}`);
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-24 pb-16"
    >
      {/* Background Image */}
      <Image
        src={heroAssets.casamentoEditorial}
        alt="Momento íntimo de casamento — HAXR Signature Editorial Couple"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        quality={95}
      />

      {/* Dark overlay with slight color grading to match HAXR brand */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/85 via-brand-black/75 to-brand-black/90 z-1" />

      {/* Main Content */}
      <div className="site-container relative z-10 w-full text-center">
        <div ref={contentRef} className="max-w-4xl mx-auto space-y-10">

          {/* Subtitle */}
          <p
            data-hero-item
            className="font-mono text-[10px] md:text-xs font-semibold tracking-[0.45em] uppercase text-brand-gold mb-2"
          >
            SIMPLES. ORGANIZADO. SEM ESFORÇO.
          </p>

          {/* Main Headline */}
          <h1
            data-hero-item
            className="font-serif text-4xl sm:text-6xl lg:text-7.5xl font-light text-white leading-[1.1] tracking-wide"
          >
            A forma mais fácil de planear
          </h1>

          {/* Centered Input Form */}
          <div data-hero-item className="max-w-xl mx-auto pt-4">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-stretch gap-3 bg-white/5 backdrop-blur-md p-2 border border-white/10 rounded-sm shadow-2xl"
            >
              <div className="relative flex-1 flex items-center pl-4">
                <Calendar className="w-4.5 h-4.5 text-brand-gold shrink-0 mr-3" strokeWidth={1.5} />
                <input
                  type="date"
                  required
                  placeholder="Qual é a data do vosso casamento?"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-transparent text-white font-sans text-xs md:text-sm outline-none placeholder:text-white/40 h-12 cursor-pointer [color-scheme:dark]"
                />
              </div>
              <button
                type="submit"
                className="bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[10px] tracking-widest uppercase font-bold py-3.5 px-8 transition-all duration-300 rounded-sm shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg active:scale-98"
              >
                <span>Começar a Planear</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Bottom Account & Partner Links */}
          <div
            data-hero-item
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-4 font-sans text-xs text-white/60 font-light"
          >
            <p>
              Já tem uma conta?{" "}
              <Link
                href="/sign-in"
                className="text-brand-gold hover:text-brand-gold-light font-medium underline underline-offset-4 transition-colors"
              >
                Entrar no painel
              </Link>
            </p>
            <span className="hidden sm:inline text-white/20">|</span>
            <p>
              É um fornecedor?{" "}
              <Link
                href="/contacto"
                className="text-brand-gold hover:text-brand-gold-light font-medium underline underline-offset-4 transition-colors"
              >
                Crie a sua conta aqui
              </Link>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
