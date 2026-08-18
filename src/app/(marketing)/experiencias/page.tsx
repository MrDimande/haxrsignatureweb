import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";
import PageHero, { CTABand } from "@/components/marketing/PageHero";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { demoCatalog } from "@/lib/demos/catalog";
import { marketingMetadata } from "@/lib/marketing/seo";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = marketingMetadata("experiencias");

export default function ExperienciasHubPage() {
  return (
    <>
      <StructuredData page="experiencias" />
      <PageHero
        label="Experiências Assinadas"
        headline="Convites digitais e celebrações ao vivo — curados pela HAXR."
        description="Explore demonstrações reais: RSVP, música, identidade visual e narrativa editorial pensada para telemóvel."
      />

      <section className="relative pb-20 md:pb-28">
        <div className="site-container-wide mx-auto grid grid-cols-1 gap-10 md:grid-cols-2">
          {demoCatalog.map((demo, index) => (
            <RevealOnScroll key={demo.id} delay={index * 0.05}>
              <article className="group overflow-hidden rounded-2xl border border-brand-champagne/35 bg-white shadow-[0_20px_50px_rgba(8,7,6,0.08)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={demo.mockupImage}
                    alt={demo.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="space-y-4 p-6 md:p-8">
                  <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-brand-gold">
                    {demo.format}
                  </p>
                  <h2 className="font-serif text-2xl font-light text-brand-text-dark">
                    {demo.shortTitle}
                  </h2>
                  <p className="font-sans text-sm leading-relaxed text-brand-text-dark/75">
                    {demo.editorialNote}
                  </p>
                  <Link
                    href={demo.publicPath}
                    className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-brand-text-dark hover:text-brand-gold"
                  >
                    {demo.ctaLabel}
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <CTABand
        headline="Quer a vossa experiência aqui?"
        description="Clientes HAXR podem candidatar-se à publicação editorial."
        primaryHref="/portfolio/submeter"
        primaryLabel="Submeter casamento"
        secondaryHref="/portfolio"
        secondaryLabel="Ver portfólio"
      />
    </>
  );
}
