"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { FerramentaItem } from "@/lib/marketing/ferramentas";

type FerramentasHubGridProps = {
  items: readonly FerramentaItem[];
};

export default function FerramentasHubGrid({ items }: FerramentasHubGridProps) {
  const [tier, setTier] = useState<"todos" | FerramentaItem["tier"]>("todos");

  const filtered =
    tier === "todos" ? items : items.filter((item) => item.tier === tier);

  const tiers = [
    { id: "todos" as const, label: "Todas" },
    { id: "core" as const, label: "Essenciais" },
    { id: "planeamento" as const, label: "Planeamento" },
    { id: "operacao" as const, label: "Operação" },
    { id: "comercial" as const, label: "Experiência" },
  ];

  return (
    <>
      <div className="mb-12 flex flex-wrap gap-2">
        {tiers.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTier(entry.id)}
            className={`px-4 py-2 font-mono text-[9px] tracking-[0.25em] uppercase transition-colors duration-500 ${
              tier === entry.id
                ? "border border-brand-gold bg-brand-gold text-brand-black"
                : "border border-brand-champagne/50 text-brand-text-dark/60 hover:border-brand-gold/50"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((tool, index) => (
          <RevealOnScroll key={tool.id} delay={index * 0.03}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-champagne/35 bg-white shadow-[0_18px_48px_rgba(8,7,6,0.06)]">
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-black/5">
                <Image
                  src={tool.image}
                  alt={tool.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-4 font-mono text-[8px] uppercase tracking-[0.3em] text-white/80">
                  {tool.includedIn}
                </p>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-serif text-2xl font-light text-brand-text-dark">
                  {tool.title}
                </h2>
                <p className="mt-3 flex-1 font-sans text-sm font-light leading-relaxed text-brand-text-dark/75">
                  {tool.description}
                </p>
                <Link
                  href={tool.href}
                  className="mt-6 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text-dark transition-colors hover:text-brand-gold"
                >
                  {tool.cta}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </>
  );
}
