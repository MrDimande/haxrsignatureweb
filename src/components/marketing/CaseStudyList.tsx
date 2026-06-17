"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { CaseStudy } from "@/lib/marketing/editorial";
import { portfolioCategories, type PortfolioCategoryId } from "@/lib/marketing/pages";

type CaseStudyListProps = {
  studies: CaseStudy[];
};

const categoryToStudyLabel: Partial<Record<PortfolioCategoryId, string>> = {
  casamentos: "Casamentos",
  corporativos: "Corporativos",
  aniversarios: "Aniversários",
  "save-the-date": "Save the Date",
  websites: "Websites",
};

export default function CaseStudyList({ studies }: CaseStudyListProps) {
  const [category, setCategory] = useState<PortfolioCategoryId>("todos");

  const filtered =
    category === "todos"
      ? studies
      : studies.filter((s) => s.category === categoryToStudyLabel[category]);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-14">
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

      <div className="space-y-20 md:space-y-28">
        {filtered.map((study, i) => (
          <RevealOnScroll key={study.id} delay={i * 0.04}>
            <article className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start border-t border-grey-dark/60 pt-14">
              <div className="lg:col-span-5 relative aspect-[4/3] overflow-hidden border border-grey-dark/50">
                <Image
                  src={study.image}
                  alt={study.title}
                  fill
                  className="object-cover opacity-80 grayscale contrast-105 hover:grayscale-0 hover:opacity-95 transition-all duration-1000"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>

              <div className="lg:col-span-7 space-y-8">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 mb-3">
                    {study.category}
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl font-light text-white mb-2">
                    {study.title}
                  </h2>
                </div>

                {(
                  [
                    ["Contexto", study.context],
                    ["Desafio", study.challenge],
                    ["Solução HAXR", study.solution],
                    ["Resultado", study.result],
                  ] as const
                ).map(([label, text]) => (
                  <div key={label}>
                    <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45 mb-2">
                      {label}
                    </p>
                    <p className="font-sans text-sm text-grey leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}

                {study.href ? (
                  <Link
                    href={study.href}
                    target={study.external ? "_blank" : undefined}
                    rel={study.external ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/70 hover:text-gold transition-colors duration-500"
                  >
                    Ver experiência
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </Link>
                ) : (
                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-gold/70 hover:text-gold transition-colors duration-500"
                  >
                    Iniciar conversa
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </Link>
                )}
              </div>
            </article>
          </RevealOnScroll>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-sans text-sm text-grey/50 text-center py-16">
          Novas histórias nesta categoria em breve.
        </p>
      ) : null}
    </>
  );
}
