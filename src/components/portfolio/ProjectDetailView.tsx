"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { PortfolioProject } from "@/lib/portfolio/types";

type ProjectDetailViewProps = {
  project: PortfolioProject;
  nextProject?: PortfolioProject | null;
};

export default function ProjectDetailView({ project, nextProject }: ProjectDetailViewProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Teclado para navegar ou fechar lightbox
  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev > 0 ? prev - 1 : project.gallery.length - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev < project.gallery.length - 1 ? prev + 1 : 0) : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, project.gallery.length]);

  return (
    <article className="min-h-screen bg-brand-ivory text-brand-text-dark">
      {/* Barra de Navegação Superior da Colecção */}
      <nav aria-label="Navegação da Colecção" className="bg-brand-black text-brand-ivory border-b border-brand-gold/20 pt-28 pb-4 md:pt-36">
        <div className="site-container mx-auto flex items-center justify-between font-mono text-[9.5px] tracking-[0.25em] uppercase">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-brand-ivory/70 hover:text-brand-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Colecção</span>
          </Link>

          <span className="text-brand-gold hidden sm:inline-block">The Signature Collection</span>

          {nextProject ? (
            <Link
              href={`/portfolio/${nextProject.slug}`}
              className="inline-flex items-center gap-2 text-brand-ivory/70 hover:text-brand-gold transition-colors"
            >
              <span>Próxima história</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </nav>

      {/* Abertura Editorial (Hero do Projecto) */}
      <header className="relative bg-brand-black text-brand-ivory pt-10 pb-16 md:pt-14 md:pb-24 border-b border-brand-gold/25">
        <div className="site-container mx-auto">
          <div className="max-w-4xl space-y-6">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-gold/30 bg-brand-black/80 font-mono text-[8.5px] tracking-[0.3em] uppercase text-brand-gold">
                <span>{project.categoryLabel}</span>
                <span className="text-brand-champagne">·</span>
                <span>{project.year}</span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.06}>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-brand-ivory leading-[1.12]">
                {project.title}
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={0.12}>
              <p className="font-sans text-base sm:text-lg md:text-xl text-brand-ivory/80 leading-relaxed font-light max-w-3xl">
                {project.subtitle}
              </p>
            </RevealOnScroll>

            {/* Metadados Rápidos */}
            <RevealOnScroll delay={0.18}>
              <div className="pt-4 flex flex-wrap gap-6 font-mono text-[10px] tracking-[0.2em] uppercase text-brand-champagne/90">
                <div className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-gold" />
                  <span>{project.location}</span>
                </div>
                {project.guestCount ? (
                  <div className="inline-flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-gold" />
                    <span>{project.guestCount}</span>
                  </div>
                ) : null}
                <div className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-gold" />
                  <span>Ano de Realização: {project.year}</span>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Fotografia Panorâmica de Abertura */}
          <div className="mt-12 md:mt-16 relative aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden border border-brand-gold/30 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </header>

      {/* Ficha Técnica & Narrativa Editorial */}
      <section className="py-16 md:py-24">
        <div className="site-container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Coluna da Ficha Técnica (Sidebar Editorial) */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="rounded-2xl border border-brand-champagne/50 bg-white p-7 sm:p-8 space-y-6 shadow-[0_10px_30px_rgba(8,7,6,0.03)] sticky top-28">
              <h2 className="font-serif text-xl font-light text-brand-text-dark border-b border-brand-champagne/40 pb-3">
                Ficha Técnica
              </h2>

              <div className="space-y-4 font-mono text-[10px] tracking-wider">
                <div>
                  <span className="block text-brand-text-dark/50 uppercase text-[8.5px] mb-1">
                    Categoria
                  </span>
                  <span className="text-brand-text-dark font-medium">{project.categoryLabel}</span>
                </div>

                <div>
                  <span className="block text-brand-text-dark/50 uppercase text-[8.5px] mb-1">
                    Localização
                  </span>
                  <span className="text-brand-text-dark font-medium">{project.location}</span>
                </div>

                {project.details.map((dt) => (
                  <div key={dt.label}>
                    <span className="block text-brand-text-dark/50 uppercase text-[8.5px] mb-1">
                      {dt.label}
                    </span>
                    <span className="text-brand-text-dark font-medium">{dt.value}</span>
                  </div>
                ))}
              </div>

              {/* Serviços Realizados */}
              <div className="pt-4 border-t border-brand-champagne/40">
                <span className="block text-brand-text-dark/50 uppercase font-mono text-[8.5px] tracking-wider mb-2.5">
                  Serviços Prestados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-2.5 py-1 rounded bg-brand-champagne/20 border border-brand-champagne/40 font-mono text-[9px] tracking-tight text-brand-text-dark"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botão para Demonstração Digital */}
              {project.demoUrl ? (
                <div className="pt-4 border-t border-brand-champagne/40">
                  <Link
                    href={project.demoUrl}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-brand-black text-brand-ivory hover:bg-brand-gold hover:text-brand-black transition-all font-mono text-[9px] tracking-[0.2em] uppercase font-medium shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{project.demoLabel || "Ver Demonstração ao Vivo"}</span>
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>

          {/* Coluna da Narrativa (A Visão, O Desafio, A Assinatura HAXR, O Resultado) */}
          <main className="lg:col-span-8 space-y-12">
            {/* 01. A Visão */}
            <div className="space-y-4">
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold">
                01 · Intenção & Atmosfera
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
                A Visão
              </h2>
              <p className="font-sans text-base sm:text-lg text-brand-text-dark/80 leading-relaxed font-light">
                {project.narrative.vision}
              </p>
            </div>

            {/* 02. O Desafio */}
            <div className="space-y-4 pt-6 border-t border-brand-champagne/30">
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold">
                02 · Complexidade & Requisitos
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
                O Desafio
              </h2>
              <p className="font-sans text-base sm:text-lg text-brand-text-dark/80 leading-relaxed font-light">
                {project.narrative.challenge}
              </p>
            </div>

            {/* 03. A Assinatura HAXR */}
            <div className="space-y-4 pt-6 border-t border-brand-champagne/30">
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold">
                03 · Curadoria & Execução
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
                A Assinatura HAXR
              </h2>
              <p className="font-sans text-base sm:text-lg text-brand-text-dark/80 leading-relaxed font-light">
                {project.narrative.signature}
              </p>
            </div>

            {/* 04. O Resultado */}
            <div className="space-y-4 pt-6 border-t border-brand-champagne/30">
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold">
                04 · Impacto & Memória
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
                O Resultado
              </h2>
              <p className="font-sans text-base sm:text-lg text-brand-text-dark/80 leading-relaxed font-light">
                {project.narrative.result}
              </p>
            </div>
          </main>
        </div>
      </section>

      {/* Galeria Editorial do Projecto */}
      {project.gallery.length > 0 ? (
        <section className="py-16 md:py-24 bg-white border-y border-brand-champagne/40">
          <div className="site-container mx-auto">
            <div className="max-w-2xl mb-12 space-y-2">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold">
                Registo Visual
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark">
                Galeria Editorial
              </h2>
              <p className="font-sans text-sm text-brand-text-dark/70 font-light">
                Clique nas fotografias para visualização ampliada com detalhes e legendas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {project.gallery.map((img, index) => (
                <div
                  key={img.src + index}
                  onClick={() => setActiveImageIndex(index)}
                  className="group relative cursor-pointer rounded-xl overflow-hidden border border-brand-champagne/40 bg-brand-black-soft aspect-[4/3] shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/40 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2.5 rounded-full bg-brand-black/75 text-brand-gold border border-brand-gold/40">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                  {img.caption ? (
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-brand-black/90 to-transparent text-brand-ivory text-[11px] font-sans font-light truncate">
                      {img.caption}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Modal / Lightbox Acessível para Imagens */}
      {activeImageIndex !== null && project.gallery[activeImageIndex] ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador ampliado de fotografia"
          className="fixed inset-0 z-50 bg-brand-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          {/* Botão Fechar */}
          <button
            type="button"
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-brand-black-soft/80 text-brand-ivory hover:text-brand-gold border border-brand-gold/30 transition-colors z-50"
            aria-label="Fechar visualizador"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navegação Anterior */}
          <button
            type="button"
            onClick={() =>
              setActiveImageIndex((prev) =>
                prev !== null ? (prev > 0 ? prev - 1 : project.gallery.length - 1) : null
              )
            }
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-brand-black-soft/80 text-brand-ivory hover:text-brand-gold border border-brand-gold/30 transition-colors z-50"
            aria-label="Fotografia anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Navegação Próxima */}
          <button
            type="button"
            onClick={() =>
              setActiveImageIndex((prev) =>
                prev !== null ? (prev < project.gallery.length - 1 ? prev + 1 : 0) : null
              )
            }
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-brand-black-soft/80 text-brand-ivory hover:text-brand-gold border border-brand-gold/30 transition-colors z-50"
            aria-label="Próxima fotografia"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Imagem Ampliada com Legenda */}
          <div className="relative max-w-5xl w-full h-[75vh] flex flex-col items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={project.gallery[activeImageIndex].src}
                alt={project.gallery[activeImageIndex].alt}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {project.gallery[activeImageIndex].caption ? (
              <p className="mt-4 font-sans text-sm text-brand-ivory/80 text-center font-light">
                {project.gallery[activeImageIndex].caption}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Créditos de Parceiros e Fornecedores */}
      {project.credits && project.credits.length > 0 ? (
        <section className="py-12 md:py-16 border-b border-brand-champagne/30">
          <div className="site-container mx-auto">
            <h3 className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold mb-6">
              Créditos & Reconhecimento de Parceiros
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {project.credits.map((cr) => (
                <div key={cr.role} className="font-mono text-[10px]">
                  <span className="block text-brand-text-dark/50 uppercase text-[8.5px]">
                    {cr.role}
                  </span>
                  <span className="text-brand-text-dark font-medium">{cr.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Navegação Inferior para Próximo Projecto */}
      {nextProject ? (
        <section className="py-16 md:py-24 bg-brand-black text-brand-ivory">
          <div className="site-container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold mb-1">
                Próxima História da Colecção
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-light text-brand-ivory">
                {nextProject.title}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-ivory/70 font-light">
                {nextProject.categoryLabel} · {nextProject.location}
              </p>
            </div>

            <Link
              href={`/portfolio/${nextProject.slug}`}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-brand-gold text-brand-black hover:bg-brand-gold-light transition-colors font-mono text-[10px] tracking-[0.25em] uppercase font-medium"
            >
              <span>Explorar História</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      ) : null}
    </article>
  );
}
