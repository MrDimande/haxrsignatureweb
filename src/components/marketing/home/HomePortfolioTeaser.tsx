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
    <section className="relative py-20 md:py-28 bg-black-soft">
      <div className="site-container site-prose-wide mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-6">Casos Reais</h2>
          <p className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-14 max-w-2xl">
            Histórias reais — vividas, curadas e assinadas HAXR.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {featured.map((project, i) => (
            <RevealOnScroll key={project.id} delay={i * 0.06}>
              <Link
                href={project.href ?? "/portfolio"}
                target={project.external ? "_blank" : undefined}
                rel={project.external ? "noopener noreferrer" : undefined}
                className="group relative block aspect-[4/3] overflow-hidden border border-grey-dark/60"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover opacity-70 grayscale group-hover:opacity-90 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-1000"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-gold/50 mb-2">
                    {project.category}
                  </p>
                  <h3 className="font-serif text-xl font-light text-white">
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
            className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
          >
            Ver histórias completas
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
