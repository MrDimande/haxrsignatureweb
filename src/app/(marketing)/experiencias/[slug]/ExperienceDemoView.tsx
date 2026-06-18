"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import InvitationIframe from "@/components/ui/InvitationIframe";
import IPhone17Frame from "@/components/ui/IPhone17Frame";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { DemoProject } from "@/lib/demos/catalog";
import { getCaseStudyForDemo } from "@/lib/marketing/editorial";

type ExperienceDemoViewProps = {
  demo: DemoProject;
};

type StoryBlock = {
  label: string;
  text: string;
};

export default function ExperienceDemoView({ demo }: ExperienceDemoViewProps) {
  const study = getCaseStudyForDemo(demo.id);

  const storyBlocks: StoryBlock[] = [
    {
      label: "Contexto",
      text: study?.context ?? demo.description,
    },
    {
      label: "Desafio",
      text:
        study?.challenge ??
        "Traduzir a visão do evento numa experiência digital memorável, funcional no telemóvel e coerente com o nível da celebração.",
    },
    {
      label: "Solução HAXR",
      text: study?.solution ?? demo.editorialNote,
    },
    {
      label: "Resultado",
      text:
        study?.result ??
        "Uma experiência que antecipou o tom do evento e reforçou a percepção de cuidado em cada detalhe.",
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      <header className="border-b border-grey-dark/50 bg-black/90 backdrop-blur-md sticky top-0 z-30">
        <div className="site-container flex items-center justify-between gap-4 py-4">
          <Link
            href="/portfolio"
            className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey/60 hover:text-gold transition-colors"
          >
            ← Portfólio
          </Link>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-gold/45 hidden sm:block">
            Experiência editorial
          </p>
          <a
            href={demo.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.2em] uppercase text-grey/50 hover:text-gold transition-colors shrink-0"
          >
            Abrir origem
          </a>
        </div>
      </header>

      <section className="relative min-h-[52vh] md:min-h-[58vh] flex items-end overflow-hidden">
        <Image
          src={demo.mockupImage}
          alt={demo.title}
          fill
          priority
          className="object-cover opacity-55 grayscale contrast-110"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="relative site-container site-prose-wide w-full pb-12 md:pb-16 pt-28">
          <RevealOnScroll>
            <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-gold/55 mb-4">
              {demo.category} · {demo.format}
            </p>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light text-white/95 max-w-4xl leading-tight mb-5">
              {demo.shortTitle}
            </h1>
            <p className="font-sans text-sm md:text-base text-grey/90 max-w-2xl leading-relaxed">
              {demo.caption} — {demo.occasion}
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="relative py-16 md:py-24 border-b border-grey-dark/40">
        <div className="site-container site-prose-wide mx-auto">
          <RevealOnScroll>
            <p className="section-label mb-12">A história por detrás</p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-x-16 md:gap-y-14">
            {storyBlocks.map((block, i) => (
              <RevealOnScroll key={block.label} delay={i * 0.05}>
                <article className="border-t border-grey-dark/60 pt-8">
                  <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-gold/45 mb-3">
                    {block.label}
                  </p>
                  <p className="font-serif text-lg md:text-xl font-light text-white/85 leading-relaxed">
                    {block.text}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 bg-black-soft">
        <div className="site-container site-prose-medium mx-auto">
          <RevealOnScroll>
            <h2 className="section-label mb-4">Experiência ao vivo</h2>
            <p className="font-serif text-xl font-light text-white/80 max-w-2xl mb-12 leading-relaxed">
              {demo.editorialNote}
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.08}>
            <div className="hidden md:flex justify-center">
              <div className="max-w-[360px]">
                <IPhone17Frame showLabel={false} variant="compact">
                  <InvitationIframe
                    src={demo.embedUrl}
                    title={demo.title}
                    viewportWidth={demo.mobileViewportWidth}
                  />
                </IPhone17Frame>
              </div>
            </div>

            <div className="md:hidden relative w-full aspect-[402/874] max-h-[78vh] rounded-[2rem] overflow-hidden border border-grey-dark/80 bg-black">
              <InvitationIframe
                src={demo.embedUrl}
                title={demo.title}
                viewportWidth={demo.mobileViewportWidth}
              />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="relative py-16 md:py-20 border-t border-grey-dark/40">
        <div className="site-container site-prose-medium mx-auto text-center">
          <RevealOnScroll>
            <p className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-6 max-w-xl mx-auto">
              A sua celebração merece o mesmo rigor editorial.
            </p>
            <p className="font-sans text-sm text-grey max-w-md mx-auto mb-10 leading-relaxed">
              Conte-nos a história do seu evento. Desenhamos a experiência digital
              com a mesma atenção ao detalhe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 px-8 py-3 font-mono text-[10px] tracking-[0.3em] uppercase bg-gold text-black hover:bg-gold/90 transition-colors"
              >
                Iniciar conversa
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-8 py-3 font-mono text-[10px] tracking-[0.3em] uppercase text-gold/70 border border-gold-dim hover:text-gold hover:border-gold/40 transition-colors"
              >
                Ver mais histórias
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
