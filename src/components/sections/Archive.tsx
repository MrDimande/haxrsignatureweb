"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { portfolioArchive } from "@/lib/site-config";

export default function Archive() {
  return (
    <section id="arquivo" className="relative pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-8">Arquivo</h2>
          <p className="font-sans text-sm text-grey leading-relaxed mb-20 max-w-2xl">
            Projectos reais e experiências assinadas. Convites digitais com demo
            ao vivo, assessoria e curadoria para eventos exclusivos em Maputo.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolioArchive.map((project, i) => {
            const content = (
              <>
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover opacity-60 grayscale contrast-110 group-hover:opacity-85 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-1000 ease-luxury"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 mb-2">
                    {project.category}
                  </p>
                  <h3 className="font-serif text-xl md:text-2xl font-light tracking-wide text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-grey/60 mb-4">
                    {project.service}
                  </p>
                  {project.ctaLabel ? (
                    <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/70 group-hover:text-gold transition-colors duration-500">
                      {project.ctaLabel}
                      <ArrowUpRight
                        className="w-3.5 h-3.5"
                        strokeWidth={1.25}
                      />
                    </span>
                  ) : null}
                </div>
              </>
            );

            const cardClass = `group relative overflow-hidden bg-grey-dark/30 ${
              project.span
                ? "h-full min-h-[480px]"
                : "aspect-video md:aspect-auto md:min-h-[280px]"
            }`;

            return (
              <RevealOnScroll
                key={project.id}
                delay={i * 0.08}
                className={project.span ? "md:row-span-2" : ""}
              >
                {project.href ? (
                  <Link
                    href={project.href}
                    target={project.external ? "_blank" : undefined}
                    rel={project.external ? "noopener noreferrer" : undefined}
                    className={`block ${cardClass}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={cardClass}>{content}</div>
                )}
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
