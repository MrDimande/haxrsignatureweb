"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { PortfolioArchiveItem } from "@/lib/site-config";

type HomePortfolioTeaserProps = {
  items: PortfolioArchiveItem[];
};

export default function HomePortfolioTeaser({ items }: HomePortfolioTeaserProps) {
  const featured = items.slice(0, 2);

  return (
    <section className="relative py-20 md:py-28 bg-brand-ivory">
      <div className="site-container-wide mx-auto">
        <RevealOnScroll>
          <p className="section-label mb-5">Casos Reais</p>
          <h2 className="type-section-title mb-14 max-w-2xl">
            Histórias reais — vividas, curadas e assinadas HAXR.
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {featured.map((project, i) => (
            <RevealOnScroll key={project.id} delay={i * 0.06}>
              <Link
                href={project.href ?? "/portfolio"}
                target={project.external ? "_blank" : undefined}
                rel={project.external ? "noopener noreferrer" : undefined}
                className="group relative block aspect-[4/3] overflow-hidden border border-brand-champagne/40 rounded-sm"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover opacity-80 grayscale group-hover:opacity-95 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-1000"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold mb-2 font-semibold">
                    {project.category}
                  </p>
                  <h3 className="font-serif text-xl font-light text-brand-ivory">
                    {project.title}
                  </h3>
                </div>
              </Link>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold/60 hover:text-brand-gold transition-colors duration-500"
          >
            Ver histórias completas
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
