"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  filterPortfolioByCategory,
  portfolioCategories,
  type PortfolioCategoryId,
} from "@/lib/marketing/pages";
import type { PortfolioArchiveItem } from "@/lib/site-config";

type PortfolioGridProps = {
  items: PortfolioArchiveItem[];
};

export default function PortfolioGrid({ items }: PortfolioGridProps) {
  const [category, setCategory] = useState<PortfolioCategoryId>("todos");
  const filtered = filterPortfolioByCategory(items, category);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-12">
        {portfolioCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 font-mono text-[9px] tracking-[0.25em] uppercase transition-colors duration-500 ${
              category === cat.id
                ? "text-black bg-gold border border-gold"
                : "text-grey/60 border border-grey-dark hover:text-white hover:border-grey/40"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((project, i) => {
          const inner = (
            <>
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover opacity-60 grayscale contrast-110 group-hover:opacity-85 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-1000"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 mb-2">
                  {project.category}
                </p>
                <h3 className="font-serif text-xl md:text-2xl font-light text-white mb-2">
                  {project.title}
                </h3>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-grey/60 mb-4">
                  {project.service}
                </p>
                {project.ctaLabel ? (
                  <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/70 group-hover:text-gold transition-colors duration-500">
                    {project.ctaLabel}
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </span>
                ) : null}
              </div>
            </>
          );

          return (
            <RevealOnScroll
              key={project.id}
              delay={i * 0.04}
              className={project.span ? "md:col-span-2" : ""}
            >
              {project.href ? (
                <Link
                  href={project.href}
                  target={project.external ? "_blank" : undefined}
                  rel={project.external ? "noopener noreferrer" : undefined}
                  className={`group relative block overflow-hidden border border-grey-dark/60 ${
                    project.span ? "aspect-[21/9]" : "aspect-[4/3]"
                  }`}
                >
                  {inner}
                </Link>
              ) : (
                <article
                  className={`group relative block overflow-hidden border border-grey-dark/60 ${
                    project.span ? "aspect-[21/9]" : "aspect-[4/3]"
                  }`}
                >
                  {inner}
                </article>
              )}
            </RevealOnScroll>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="font-sans text-sm text-grey/50 text-center py-16">
          Novos case studies nesta categoria em breve.
        </p>
      ) : null}
    </>
  );
}
