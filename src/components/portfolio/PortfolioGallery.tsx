"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Users, Eye } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { PortfolioProject, PortfolioCategory, PortfolioCategoryId } from "@/lib/portfolio/types";

type PortfolioGalleryProps = {
  projects: readonly PortfolioProject[];
  categories: readonly PortfolioCategory[];
};

export default function PortfolioGallery({ projects, categories }: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<PortfolioCategoryId>("todos");

  const filteredProjects =
    activeCategory === "todos"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  const featured = filteredProjects.find((p) => p.isFeatured) || filteredProjects[0];
  const secondaryProjects = filteredProjects.filter((p) => p.id !== featured?.id);

  return (
    <section id="historias-de-assinatura" className="relative py-20 md:py-32 bg-brand-ivory text-brand-text-dark">
      <div className="site-container mx-auto">
        {/* Cabeçalho da Secção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
          <div className="space-y-3 max-w-xl">
            <RevealOnScroll>
              <p className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
                Secção 02 · Galeria Editorial
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.06}>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-[1.2]">
                Histórias de Assinatura
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <p className="font-sans text-sm md:text-base text-brand-text-dark/75 leading-relaxed font-light">
                Celebrações vivenciadas com contexto, desafio superado e coordenação impecável.
              </p>
            </RevealOnScroll>
          </div>

          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-brand-text-dark/60">
            {filteredProjects.length} {filteredProjects.length === 1 ? "projecto documentado" : "projectos documentados"}
          </div>
        </div>

        {/* Abas de Filtros Interactivos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-12 md:mb-16 scrollbar-none border-b border-brand-champagne/40">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full font-mono text-[9px] md:text-[10px] tracking-[0.22em] uppercase transition-all duration-300 ${
                  isActive
                    ? "bg-brand-black text-brand-ivory shadow-sm"
                    : "text-brand-text-dark/60 hover:text-brand-text-dark hover:bg-brand-champagne/25"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Projecto em Destaque (Composição Editorial Expansiva) */}
        {featured ? (
          <div className="mb-14 md:mb-20">
            <RevealOnScroll>
              <article className="group relative rounded-2xl md:rounded-3xl overflow-hidden border border-brand-champagne/40 bg-white shadow-[0_20px_50px_rgba(8,7,6,0.06)] grid grid-cols-1 lg:grid-cols-12 transition-all duration-500 hover:border-brand-gold/60">
                {/* Imagem do Destaque */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:col-span-7 overflow-hidden bg-brand-black">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                  <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-black/75 backdrop-blur-md border border-brand-gold/30 font-mono text-[8.5px] tracking-[0.3em] uppercase text-brand-gold">
                    Destaque da Colecção
                  </div>
                </div>

                {/* Conteúdo Editorial do Destaque */}
                <div className="lg:col-span-5 p-7 sm:p-10 md:p-12 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold">
                      <span>{featured.categoryLabel}</span>
                      <span className="text-brand-champagne">·</span>
                      <span>{featured.year}</span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-brand-text-dark leading-[1.2]">
                      {featured.title}
                    </h3>

                    <p className="font-sans text-sm md:text-base text-brand-text-dark/80 leading-relaxed font-light">
                      {featured.summary}
                    </p>

                    {/* Metadados: Local e Convidados */}
                    <div className="pt-2 flex flex-wrap gap-4 font-mono text-[9.5px] tracking-[0.15em] text-brand-text-dark/70">
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                        <span>{featured.location}</span>
                      </div>
                      {featured.guestCount ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-brand-gold" />
                          <span>{featured.guestCount}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Serviços Efectivamente Realizados */}
                    <div className="pt-3 border-t border-brand-champagne/30">
                      <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-brand-text-dark/50 mb-2.5">
                        Serviços Realizados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {featured.services.map((svc) => (
                          <span
                            key={svc}
                            className="px-2.5 py-1 rounded-md bg-brand-champagne/20 border border-brand-champagne/40 font-mono text-[8.5px] tracking-[0.1em] text-brand-text-dark/85"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ligações de Acção */}
                  <div className="pt-6 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/portfolio/${featured.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-black text-brand-ivory hover:bg-brand-gold hover:text-brand-black transition-all duration-300 font-mono text-[9.5px] tracking-[0.25em] uppercase"
                    >
                      <span>Explorar Experiência</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    {featured.demoUrl ? (
                      <Link
                        href={featured.demoUrl}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-brand-champagne hover:border-brand-gold font-mono text-[9.5px] tracking-[0.25em] uppercase text-brand-text-dark/80 hover:text-brand-gold transition-colors duration-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Demo Digital</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            </RevealOnScroll>
          </div>
        ) : null}

        {/* Grelha Editorial Assimétrica para os Restantes Projectos */}
        {secondaryProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {secondaryProjects.map((project, idx) => (
              <RevealOnScroll key={project.id} delay={idx * 0.08}>
                <article className="group flex flex-col justify-between h-full rounded-2xl overflow-hidden border border-brand-champagne/40 bg-white shadow-[0_12px_36px_rgba(8,7,6,0.04)] hover:shadow-[0_24px_60px_rgba(8,7,6,0.08)] hover:border-brand-gold/60 transition-all duration-500">
                  <div>
                    {/* Imagem do Cartão */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-brand-black-soft">
                      <Image
                        src={project.coverImage}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-brand-black/75 backdrop-blur-md border border-brand-gold/30 font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold">
                        {project.categoryLabel}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-6 sm:p-7 space-y-3.5">
                      <div className="flex items-center justify-between font-mono text-[8.5px] tracking-[0.2em] uppercase text-brand-text-dark/60">
                        <span>{project.location}</span>
                        <span>{project.year}</span>
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl font-light text-brand-text-dark leading-snug group-hover:text-brand-gold transition-colors duration-300">
                        <Link href={`/portfolio/${project.slug}`}>{project.title}</Link>
                      </h3>

                      <p className="font-sans text-xs sm:text-sm text-brand-text-dark/75 leading-relaxed font-light line-clamp-2">
                        {project.subtitle}
                      </p>

                      {/* Serviços */}
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {project.services.slice(0, 3).map((svc) => (
                            <span
                              key={svc}
                              className="px-2 py-0.5 rounded bg-brand-champagne/15 border border-brand-champagne/30 font-mono text-[8px] tracking-[0.05em] text-brand-text-dark/80"
                            >
                              {svc}
                            </span>
                          ))}
                          {project.services.length > 3 ? (
                            <span className="px-1.5 py-0.5 font-mono text-[8px] text-brand-gold">
                              +{project.services.length - 3}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Cartão */}
                  <div className="p-6 pt-0 sm:p-7 sm:pt-0">
                    <Link
                      href={`/portfolio/${project.slug}`}
                      className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-text-dark group-hover:text-brand-gold transition-colors duration-300"
                    >
                      <span>Explorar história</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </Link>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        ) : null}

        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 font-sans text-sm text-brand-text-dark/60">
            Nenhum projecto publicado nesta categoria de momento.
          </div>
        ) : null}
      </div>
    </section>
  );
}
